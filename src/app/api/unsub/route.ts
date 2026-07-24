import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const email = new URL(request.url).searchParams.get("email");

  if (!email) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app"}/unsub?error=no_email`);
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app"}/unsub?error=server`);
  }

  // Get user_id from profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (profile?.id) {
    // Mark as unsubscribed in notification_preferences AND stop nurture
    await admin
      .from("notification_preferences")
      .update({ marketing_updates: false })
      .eq("user_id", profile.id);

    await admin
      .from("profiles")
      .update({ nurture_day: 99 })
      .eq("email", email);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app";
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title>
<style>body{font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fbf9f8;color:#1b1c1c}</style></head>
<body><main style="text-align:center;max-width:480px;padding:32px">
  <h1 style="font-family:Space Grotesk,sans-serif;font-size:24px;font-weight:700;margin:0 0 16px">You've been unsubscribed.</h1>
  <p style="font-size:16px;line-height:1.5;color:#444748;margin:0 0 24px"><strong>${email}</strong> will no longer receive promotional emails from ProformaFlow.</p>
  <p style="font-size:14px;color:#747878;margin:0">You can re-enable marketing emails from your account settings.</p>
  <p style="margin-top:32px"><a href="${siteUrl}" style="font-family:Space Grotesk,sans-serif;font-size:14px;font-weight:600;color:#fff;background:#000;padding:12px 24px;text-decoration:none;border:1px solid #000;display:inline-block">Back to ProformaFlow</a></p>
</main></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}