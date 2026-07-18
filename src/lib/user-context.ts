import { createClient, createAdminClient } from "./supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserContext() {
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Usar ADMIN CLIENT para bypassear RLS en tablas con políticas restrictivas
  const admin = await createAdminClient();

  const [profileRes, companyRes, subRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("companies").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const periodMonth = new Date();
  periodMonth.setDate(1);
  const periodMonthStr = periodMonth.toISOString().slice(0, 10);

  const { data: usage } = await admin
    .from("usage_counters")
    .select("*")
    .eq("user_id", user.id)
    .eq("period_month", periodMonthStr)
    .maybeSingle();

  return {
    user,
    profile: profileRes.data,
    company: companyRes.data,
    subscription: subRes.data,
    usage: usage || { documents_generated: 0 },
  };
}

export interface PlanLimits {
  docsPerMonth: number;
  watermark: boolean;
  allTypes: boolean;
  carrierReady: boolean;
  maxCurrencies: number;
  unlimitedHistory: boolean;
  unlimitedTemplates: boolean;
  prioritySupport: boolean;
}

export function planLimits(plan: string): PlanLimits {
  switch (plan) {
    case "business":
      return {
        docsPerMonth: Infinity,
        watermark: false,
        allTypes: true,
        carrierReady: true,
        maxCurrencies: 24,
        unlimitedHistory: true,
        unlimitedTemplates: true,
        prioritySupport: true,
      };
    case "professional":
      return {
        docsPerMonth: Infinity,
        watermark: false,
        allTypes: true,
        carrierReady: true,
        maxCurrencies: 5,
        unlimitedHistory: false,
        unlimitedTemplates: false,
        prioritySupport: false,
      };
    default:
      return {
        docsPerMonth: 3,
        watermark: true,
        allTypes: false,
        carrierReady: false,
        maxCurrencies: 1,
        unlimitedHistory: false,
        unlimitedTemplates: false,
        prioritySupport: false,
      };
  }
}