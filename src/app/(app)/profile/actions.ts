"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Upsert company name/phone convenience fields shared with company profile
  await supabase.from("companies").upsert(
    {
      user_id: user.id,
      company_name: formData.get("company_name") as string,
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}
