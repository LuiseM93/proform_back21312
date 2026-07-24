"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function sendMagicLink(
  email: string,
  redirectPath?: string,
  marketingOptIn?: boolean,
) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

  const params = new URLSearchParams();
  if (redirectPath) params.set("redirect", redirectPath);
  if (marketingOptIn) params.set("marketing", "1");
  const queryString = params.toString();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback${queryString ? `?${queryString}` : ""}`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}