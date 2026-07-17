import { getUserContext } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const ctx = await getUserContext();
  const supabase = await createClient();
  const { data: notifPrefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", ctx?.user?.id)
    .maybeSingle();

  return (
    <SettingsClient
      company={ctx?.company || null}
      notifPrefs={notifPrefs || null}
      plan={ctx?.subscription?.plan || "starter"}
    />
  );
}
