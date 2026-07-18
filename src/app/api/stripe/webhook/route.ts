import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Startup validation - warn if test webhook secret used in production
if (webhookSecret?.startsWith("whsec_test_")) {
  console.error("⚠️  WARNING: Using TEST Stripe webhook secret in production! Set STRIPE_WEBHOOK_SECRET to production signing secret.");
}

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

  // IDEMPOTENCY: Check if we've already processed this event
  const { data: existingEvent, error: eventCheckError } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (eventCheckError) {
    console.error("[Webhook] Error checking idempotency:", eventCheckError);
    return new NextResponse("Webhook Error: idempotency check failed", { status: 500 });
  }

  if (existingEvent) {
    console.log("[Webhook] Event already processed, skipping:", event.id);
    return new NextResponse("Webhook processed (duplicate)", { status: 200 });
  }

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

          console.log("[Webhook] Upserting Supabase for user:", userId, "plan:", plan);
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              plan: plan,
              status: subscription.status,
              billing_interval: subscription.items.data[0]?.price.recurring?.interval,
              current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          if (error) {
            console.error("[Webhook] Supabase upsert error:", error);
            throw error;
          }

          console.log("[Webhook] Supabase upserted successfully for user:", userId, "plan:", plan);
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

        const plan = planFromPriceId(priceId);
        const subscriptionData = {
          stripe_subscription_id: subscription.id,
          plan: plan,
          status: subscription.status,
          billing_interval: subscription.items.data[0]?.price.recurring?.interval,
          current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        };

        if (userId) {
          const { error } = await supabase
            .from("subscriptions")
            .upsert({ user_id: userId, ...subscriptionData }, { onConflict: "user_id" });

          if (error) {
            console.error("[Webhook] Supabase upsert error:", error);
            throw error;
          }
          console.log("[Webhook] Supabase upserted for user:", userId, "plan:", plan);
        } else {
          console.warn("[Webhook] No userId in subscription metadata, trying fallback by customer");
          if (subscription.customer) {
            // Look up user_id from existing subscription row using stripe_customer_id
            let resolvedUserId = userId;
            const { data: existingSub } = await supabase
              .from("subscriptions")
              .select("user_id")
              .eq("stripe_customer_id", subscription.customer as string)
              .maybeSingle();
            if (existingSub?.user_id) {
              resolvedUserId = existingSub.user_id;
            }

            const { error } = await supabase
              .from("subscriptions")
              .upsert({ stripe_customer_id: subscription.customer as string, user_id: resolvedUserId, ...subscriptionData }, { onConflict: "stripe_customer_id" });

            if (error) {
              console.error("[Webhook] Fallback upsert error:", error);
              throw error;
            }
            console.log("[Webhook] Fallback upserted by stripe_customer_id:", subscription.customer, "user_id:", resolvedUserId);
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

              // CHECK FOR IMMEDIATE CANCELLATION (invoice_now=true)
              // If subscription was canceled immediately, canceled_at will be set and < now
              // Or if cancel_at_period_end is false but status is canceled and no period end in future
              const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null;
              const isImmediateCancel = canceledAt && canceledAt <= now;

              // If periodEnd is in the future AND not immediate cancellation, keep plan active until periodEnd expires
              // Only downgrade to starter when periodEnd has already passed OR it was immediate cancellation
              const newPlan = (periodEnd > now && !isImmediateCancel) ? currentPlan : "starter";
              const newStatus = (periodEnd > now && !isImmediateCancel) ? "active" : "canceled";

              if (isImmediateCancel) {
                console.log("[Webhook] IMMEDIATE CANCELLATION detected (invoice_now=true) - downgrading to starter immediately");
              } else if (periodEnd > now) {
                console.log("[Webhook] Period-end cancellation - keeping", currentPlan, "until", periodEnd.toISOString());
              } else {
                console.log("[Webhook] Period already ended - downgrading to starter");
              }

              // Try to find by stripe_subscription_id first (since stripe_customer_id might be null)
              let error: Error | null = null;
              const { data } = await supabase
                .from("subscriptions")
                .update({
                  plan: newPlan,
                  status: newStatus,
                  cancel_at_period_end: false,
                  current_period_end: periodEnd.toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("stripe_subscription_id", subscription.id)
                .select("id");

              // If no rows updated, try fallback 1
              if (!data || data.length === 0) {
                console.log("[Webhook] No rows updated by stripe_subscription_id, trying fallback 1");
                error = new Error("No rows updated");
              }

              // Fallback 1: try by stripe_customer_id
              if (error && subscription.customer) {
                console.log("[Webhook] Fallback to stripe_customer_id:", subscription.customer);
                const { error: fallbackError, data: fallbackData } = await supabase
                  .from("subscriptions")
                  .update({
                    plan: newPlan,
                    status: newStatus,
                    cancel_at_period_end: false,
                    current_period_end: periodEnd.toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("stripe_customer_id", subscription.customer as string)
                  .select("id");

                if (fallbackData && fallbackData.length > 0) {
                  error = null; // Success on fallback
                } else if (fallbackError) {
                  error = fallbackError;
                }
              }

              // Fallback 2: try by user_id from subscription metadata
              if (error && subscription.metadata?.supabase_user_id) {
                console.log("[Webhook] Fallback to metadata.supabase_user_id:", subscription.metadata.supabase_user_id);
                const { error: fallbackError, data: fallbackData } = await supabase
                  .from("subscriptions")
                  .update({
                    plan: newPlan,
                    status: newStatus,
                    cancel_at_period_end: false,
                    current_period_end: periodEnd.toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", subscription.metadata.supabase_user_id)
                  .select("id");

                if (fallbackData && fallbackData.length > 0) {
                  error = null; // Success on fallback
                } else if (fallbackError) {
                  error = fallbackError;
                }
              }

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

    // Record webhook event for idempotency
    const { error: webhookEventError } = await supabase
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: JSON.parse(body),
      });

    if (webhookEventError) {
      console.error("[Webhook] Failed to record webhook event:", webhookEventError);
      // Don't fail the webhook, just log
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
    console.error("[Webhook] Processing error:", message, err);
    return new NextResponse(`Webhook Error: ${message}`, { status: 500 });
  }
}