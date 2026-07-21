"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { planLimits } from "@/lib/user-context";
import { revalidatePath } from "next/cache";

export async function createTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get user's plan and enforce template limits server-side
  const admin = await createAdminClient();
  if (!admin) return { error: "Service unavailable" };
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = sub?.plan || "starter";
  const status = sub?.status || "active";
  const effectivePlan = (plan !== "starter" && status !== "active") ? "starter" : plan;
  const limits = planLimits(effectivePlan);

  // Check template count
  const { count } = await admin
    .from("templates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const getTemplateLimit = (plan: string): number => {
    if (plan === "business") return Infinity;
    if (plan === "professional") return 10;
    return 3; // starter
  };

  const templateLimit = getTemplateLimit(effectivePlan);
  const currentCount = count || 0;

  if (!limits.unlimitedTemplates && currentCount >= templateLimit) {
    return { error: `Template limit reached. ${effectivePlan === "professional" ? "Professional" : "Starter"} plan allows ${templateLimit} templates. Upgrade to Business for unlimited.` };
  }

  const documentTypesRaw = formData.get("document_types") as string;
  const { error } = await supabase.from("templates").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    transport_mode: formData.get("transport_mode") as string,
    incoterm: formData.get("incoterm") as string,
    origin_country: formData.get("origin_country") as string,
    destination_country: formData.get("destination_country") as string,
    origin_port: formData.get("origin_port") as string,
    destination_port: formData.get("destination_port") as string,
    document_types: documentTypesRaw ? documentTypesRaw.split(",") : [],
  });

  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { success: true };
}

export async function touchTemplate(id: string) {
  const supabase = await createClient();
  await supabase.from("templates").update({ last_used_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/templates");
}
