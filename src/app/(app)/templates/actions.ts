"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

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
