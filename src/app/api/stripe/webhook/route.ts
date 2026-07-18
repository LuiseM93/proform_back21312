import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function planFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY || priceId === process.env.STRIPE_PRICE_BUSINESS_YEARLY) {
    return "business";
  }
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
    return "professional";
  }
  return "starter";
}

export async function POST(req: Request) {
  console.log("[Webhook] Received event");

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
    console.log("[Webhook] Event verified:", event.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Webhook] Signature verification failed:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[Webhook] checkout.session.completed:", session.id);

        const userId = session.metadata?.supabase_user_id;
        console.log("[Webhook] userId from metadata:", userId);

        if (!userId || !session.subscription) {
          console.warn("[Webhook] Missing userId or subscription:", { userId, subscription: session.subscription });
          break;
        }

        try {
          console.log("[Webhook] Retrieving subscription:", session.subscription);
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          console.log("[Webhook] Retrieved subscription:", subscription.id, "status:", subscription.status);

          const priceId = subscription.items.data[0]?.price.id;
          console.log("[Webhook] priceId:", priceId);

          const plan = planFromPriceId(priceId);
          console.log("[Webhook] Plan determined:", plan);

          // Check if subscription was already cancelled
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("status, stripe_subscription_id")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingSub?.status === "canceled") {
            console.log("[Webhook] Subscription already canceled for user:", userId, "- skipping reactivation");
            break;
          }

          console.log("[Webhook] Updating Supabase for user:", userId, "plan:", plan);
          const { error } = await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id: subscription.id,
              plan: plan,
              status: subscription.status,
              billing_interval: subscription.items.data[0]?.price.recurring?.interval,
              current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("[Webhook] Supabase update error:", error);
            throw error;
          }

          console.log("[Webhook] Supabase updated successfully for user:", userId, "plan:", plan);
        } catch (err) {
          const message = err instanceof Error ? err.message : JSON.stringify(err);
          console.error("[Webhook] checkout.session.completed processing failed:", message);
          throw err;
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Webhook] subscription.updated/created:", subscription.id);

        const userId = subscription.metadata?.supabase_user_id;
        const priceId = subscription.items.data[0]?.price.id;
        console.log("[Webhook] userId:", userId, "priceId:", priceId);

        if (userId) {
          const plan = planFromPriceId(priceId);
          const { error } = await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id: subscription.id,
              plan: plan,
              status: subscription.status,
              billing_interval: subscription.items.data[0]?.price.recurring?.interval,
              current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("[Webhook] Supabase update error:", error);
            throw error;
          }
          console.log("[Webhook] Supabase updated for user:", userId, "plan:", plan);
        } else {
          console.warn("[Webhook] No userId in subscription metadata, trying fallback by customer");
          const { error } = await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id: subscription.id,
              plan: planFromPriceId(subscription.items.data[0]?.price.id),
              status: subscription.status,
              billing_interval: subscription.items.data[0]?.price.recurring?.interval,
              current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", subscription.customer as string);

          if (error) {
            console.error("[Webhook] Fallback update error:", error);
            throw error;
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[Webhook] subscription.deleted:", subscription.id);

        // Use the first subscription item's current_period_end
        const periodEnd = new Date(subscription.items.data[0]?.current_period_end * 1000);
        const now = new Date();

        // Resolve plan from the price_id of the deleted subscription
        const priceId = subscription.items.data[0]?.price.id;
        const currentPlan = priceId ? planFromPriceId(priceId) : "professional";

        const newPlan = periodEnd < now ? "starter" : currentPlan;
        const newStatus = periodEnd < now ? "canceled" : "active";

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: newPlan,
            status: newStatus,
            cancel_at_period_end: false,
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", subscription.customer as string);

        if (error) {
          console.error("[Webhook] Delete update error:", error);
          throw error;
        }
        console.log(
          "[Webhook] Subscription deleted handled. Plan:",
          newPlan,
          "Status:",
          newStatus,
          "Period ends:",
          periodEnd.toISOString()
        );
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
    console.error("[Webhook] Processing error:", message, err);
    return new NextResponse(`Webhook Error: ${message}`, { status: 500 });
  }
}