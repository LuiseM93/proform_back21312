import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { planLimits } from "@/lib/user-context";

// This endpoint only tracks a COUNT of documents generated per month.
// It never receives or stores the document content itself — that stays
// entirely client-side in the browser and is discarded after PDF export.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Parse body for document type and carrier validation
  let body: { documentType?: string; carrier?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body optional
  }

  const documentType = body.documentType || "proforma";
  const carrier = body.carrier || "other";

  // Usar ADMIN CLIENT para bypassear RLS al leer subscriptions
  const admin = await createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = sub?.plan || "starter";
  const status = sub?.status || "active";

  // If plan is paid but subscription is inactive, treat as starter
  const effectivePlan = (plan !== "starter" && status !== "active") ? "starter" : plan;
  const limits = planLimits(effectivePlan);

  // SERVER-SIDE VALIDATION: document type
  if (!limits.allTypes && documentType !== "proforma") {
    return NextResponse.json({
      error: "Starter plan only supports Proforma Invoices. Upgrade to Professional for Commercial Invoices, Packing Lists, and Bundles."
    }, { status: 403 });
  }

  // SERVER-SIDE VALIDATION: carrier
  if (!limits.carrierReady && carrier !== "other") {
    return NextResponse.json({
      error: "Starter plan only supports standard PDFs. Upgrade to Professional for carrier-ready PDFs (FedEx/UPS/DHL)."
    }, { status: 403 });
  }

  const periodMonth = new Date();
  periodMonth.setDate(1);
  const periodMonthStr = periodMonth.toISOString().slice(0, 10);

  // Atomic increment using PostgreSQL function — prevents race conditions
  // For unlimited plans, use 999999 as the limit (effectively unlimited)
  const maxLimit = limits.docsPerMonth === Infinity ? 999999 : limits.docsPerMonth;

  const { data: result, error: rpcError } = await admin.rpc("increment_usage", {
    p_user_id: user.id,
    p_period_month: periodMonthStr,
    p_limit: maxLimit,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  if (result === -1) {
    return NextResponse.json({
      error: "Monthly document limit reached.",
      limitReached: true,
    }, { status: 403 });
  }

  const currentCount = result as number;

  return NextResponse.json({
    success: true,
    documentsGenerated: currentCount,
    remaining: limits.docsPerMonth === Infinity ? null : Math.max(0, limits.docsPerMonth - currentCount),
    watermark: limits.watermark,
  });
}