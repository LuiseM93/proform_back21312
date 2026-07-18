import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ plan: "starter", status: "inactive" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, billing_interval, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    plan: sub?.plan || "starter",
    status: sub?.status || "inactive",
    currentPeriodEnd: sub?.current_period_end || null,
    billingInterval: sub?.billing_interval || null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
  });
}