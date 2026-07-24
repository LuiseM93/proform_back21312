/**
 * Nurture email sequence — templates and helpers.
 *
 * Templates are stored locally because the Resend API key is restricted
 * to "send only" and cannot fetch template HTML dynamically.
 */

import { readFile } from "fs/promises";
import { join } from "path";

// ---- Sequence definition ----

export interface NurtureEmail {
  day: number;
  templateId: string;
  file: string;
}

export const NURTURE_SEQUENCE: NurtureEmail[] = [
  { day: 0, templateId: "1fbf9c5b-bf50-4b0b-9c61-53a744d964a1", file: "d0-welcome.html" },
  { day: 2, templateId: "4983b8b6-f931-424f-b2a2-d2fa1026b824", file: "d2-mistakes.html" },
  { day: 4, templateId: "db9ae9bc-c99c-4d97-a4ad-14104a3d7768", file: "d4-carriers.html" },
  { day: 7, templateId: "d79b1ab1-151f-46c3-88c2-233c94a04e7f", file: "d7-case-study.html" },
  { day: 10, templateId: "87a4b15f-5d03-48ec-acc4-c9aa89a47d2e", file: "d10-watermark.html" },
  { day: 14, templateId: "2e9ea88d-fa6e-4707-88a8-2b87816b4c1f", file: "d14-faq.html" },
  { day: 21, templateId: "f0766e84-5dbe-4a3f-87b0-5e86b6ba972c", file: "d21-breakup.html" },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app";

// ---- URL builders ----

export function buildUnsubUrl(email: string): string {
  return `${SITE_URL}/api/unsub?email=${encodeURIComponent(email)}`;
}

// ---- Template loading ----

const templateCache = new Map<string, string>();

export async function loadTemplateHtml(file: string): Promise<string | null> {
  if (templateCache.has(file)) return templateCache.get(file)!;

  try {
    const path = join(process.cwd(), "src", "emails", "nurture", file);
    const html = await readFile(path, "utf-8");
    templateCache.set(file, html);
    return html;
  } catch {
    console.error(`[Nurture] Template file not found: ${file}`);
    return null;
  }
}

// ---- Unsubscribe injection ----

/**
 * Injects the real unsubscribe URL into template HTML.
 * Templates use placeholder: href="@UNSUB_URL@"
 */
export function injectUnsubUrl(html: string, email: string): string {
  return html.replace(/@UNSUB_URL@/g, buildUnsubUrl(email));
}