import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planLimits } from "@/lib/user-context";

// This endpoint only tracks a COUNT of documents generated per month.
// It never receives or stores the document content itself — that stays
// entirely client-side in the browser and is discarded after PDF export.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const limits = planLimits(sub?.plan || "starter");

  const periodMonth = new Date();
  periodMonth.setDate(1);
  const periodMonthStr = periodMonth.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_month", periodMonthStr)
    .maybeSingle();

  const currentCount = existing?.documents_generated || 0;

  if (limits.docsPerMonth !== Infinity && currentCount >= limits.docsPerMonth) {
    return NextResponse.json(
      { error: "Monthly document limit reached. Upgrade to Professional for unlimited documents.", limitReached: true },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("usage_counters")
    .upsert(
      { user_id: user.id, period_month: periodMonthStr, documents_generated: currentCount + 1 },
      { onConflict: "user_id,period_month" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    documentsGenerated: currentCount + 1,
    remaining: limits.docsPerMonth === Infinity ? null : limits.docsPerMonth - (currentCount + 1),
    watermark: limits.watermark,
  });
}
