import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, companyRes, subRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("companies").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
  ]);

  const periodMonth = new Date();
  periodMonth.setDate(1);
  const periodMonthStr = periodMonth.toISOString().slice(0, 10);

  const { data: usage } = await supabase
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

export function planLimits(plan: string) {
  switch (plan) {
    case "professional":
    case "business":
      return { docsPerMonth: Infinity, watermark: false, allTypes: true, carrierReady: true };
    default:
      return { docsPerMonth: 3, watermark: true, allTypes: false, carrierReady: false };
  }
}
