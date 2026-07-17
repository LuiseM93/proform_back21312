import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;

      // Check if this is a new signup (profile created in the last 30 seconds)
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("created_at, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const isNewSignup =
        profile?.created_at &&
        Date.now() - new Date(profile.created_at).getTime() < 60_000;

      // Fire-and-forget welcome email for new signups
      if (isNewSignup && user.email) {
        sendWelcomeEmail(user.email, profile?.full_name || "").catch(() => {});
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}