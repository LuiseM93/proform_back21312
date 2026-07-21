"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCompanySettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("companies").upsert(
    {
      user_id: user.id,
      company_name: formData.get("company_name") as string,
      address: formData.get("address") as string,
      country: formData.get("country") as string,
      tax_id: formData.get("tax_id") as string,
      default_currency: formData.get("default_currency") as string,
      default_incoterm: formData.get("default_incoterm") as string,
      date_format: formData.get("date_format") as string,
      language: formData.get("language") as string,
      bank_name: formData.get("bank_name") as string,
      swift_bic: formData.get("swift_bic") as string,
      iban: formData.get("iban") as string,
      legal_declaration: formData.get("legal_declaration") as string,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateNotificationPreferences(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    document_downloaded: formData.get("document_downloaded") === "on",
    document_sent: formData.get("document_sent") === "on",
    weekly_summary: formData.get("weekly_summary") === "on",
    marketing_updates: formData.get("marketing_updates") === "on",
  });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  if (!admin) return { error: "Service temporarily unavailable" };
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  return { success: true };
}
