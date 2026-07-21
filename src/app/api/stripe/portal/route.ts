import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    // Use regular client to get user from session cookies
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use admin client for database query (bypasses RLS)
    const admin = await createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    // Auto-create customer if missing
    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const email = user.email;
      if (!email) {
        return NextResponse.json({ error: "User has no email" }, { status: 400 });
      }
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Update subscription record with new customer_id
      await admin
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}