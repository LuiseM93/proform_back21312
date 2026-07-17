import { createClient } from "@/lib/supabase/server";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return <TemplatesClient templates={templates || []} />;
}
