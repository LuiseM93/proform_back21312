import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend } from "@/lib/email";
import { NURTURE_SEQUENCE, loadTemplateHtml, injectUnsubUrl } from "@/lib/nurture-templates";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET() {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }

  const { headers } = await import("next/headers");
  const authHeader = (await headers()).get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin || !resend) {
    return NextResponse.json({ error: "Missing service role key or Resend key" }, { status: 500 });
  }

  // Step 1: get user_ids with marketing_updates=true
  const { data: consentingUsers, error: prefError } = await admin
    .from("notification_preferences")
    .select("user_id")
    .eq("marketing_updates", true);

  if (prefError || !consentingUsers?.length) {
    return NextResponse.json({ success: true, checked: 0, sent: 0 });
  }

  const userIds = consentingUsers.map((r) => r.user_id);

  // Step 2: get their profiles where nurture_day < 21
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, email, nurture_day, created_at")
    .in("id", userIds)
    .lt("nurture_day", 21);

  if (profileError || !profiles?.length) {
    return NextResponse.json({ success: true, checked: 0, sent: 0 });
  }

  let checked = 0;
  let sent = 0;

  for (const user of profiles) {
    checked++;
    if (!user.email) continue;

    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / 86400000
    );

    // Find the NEXT email to send (first one where day <= daysSinceCreation and > user.nurture_day)
    const emailDef = NURTURE_SEQUENCE.find(
      (e) => e.day <= daysSinceCreation && e.day > user.nurture_day
    );
    if (!emailDef) continue;

    // Load template HTML from local file (Resend API key is send-only — can't fetch templates)
    const templateHtml = await loadTemplateHtml(emailDef.file);
    if (!templateHtml) {
      console.error(`[Nurture] Template ${emailDef.file} not found`);
      continue;
    }

    const html = injectUnsubUrl(templateHtml, user.email);

    try {
      await resend.emails.send({
        from: "ProformaFlow <proformaflow@elantimetodo.com>",
        to: [user.email],
        subject: `ProformaFlow — Export Tip #${NURTURE_SEQUENCE.indexOf(emailDef) + 1}`,
        html,
        tags: [
          { name: "type", value: "nurture" },
          { name: "day", value: String(emailDef.day) },
        ],
      });

      await admin
        .from("profiles")
        .update({ nurture_day: emailDef.day })
        .eq("id", user.id);

      sent++;
    } catch (err) {
      console.error(`[Nurture] Failed day ${emailDef.day} for ${user.email}:`, err);
    }
  }

  return NextResponse.json({ success: true, checked, sent });
}