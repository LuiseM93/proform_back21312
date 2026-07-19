import { createClient } from "@/lib/supabase/server";
import { getUserContext, planLimits } from "@/lib/user-context";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const ctx = await getUserContext();
  const plan = ctx?.subscription?.plan || "starter";
  const limits = planLimits(plan);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return <TemplatesClient templates={templates || []} plan={plan} limits={limits} />;
}
