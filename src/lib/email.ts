import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM = "ProformaFlow <proformaflow@elantimetodo.com>";

export function welcomeEmailHtml(fullName: string) {
  const name = fullName || "there";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fbf8fc;border:1px solid #e4e1e6">
  <h1 style="font-family:'Space Grotesk',Inter,sans-serif;font-size:24px;font-weight:700;line-height:32px;color:#1b1b1e;margin:0 0 16px;letter-spacing:-0.01em">
    Welcome to ProformaFlow, ${name}
  </h1>
  <p style="font-size:16px;line-height:24px;color:#1b1b1e;margin:0 0 24px">
    You're ready to generate <strong>professional proforma invoices, commercial invoices, and packing lists</strong> — from quote to customs, in one flow.
  </p>
  <p style="font-size:16px;line-height:24px;color:#1b1b1e;margin:0 0 24px">
    <strong>We never store your generated documents.</strong> Fill out your form, download the PDF, and the data is gone. Your privacy is built into the product.
  </p>
  <hr style="margin:32px 0;border:none;border-top:1px solid #e4e1e6">
  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://proformaflow.app'}/generator" style="display:inline-flex;align-items:center;gap:6px;padding:16px 32px;background:#1b1b1e;color:#ffffff;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;border:1px solid #1b1b1e;border-radius:0">
    Generate Your First Document
  </a>
  <hr style="margin:32px 0;border:none;border-top:1px solid #e4e1e6">
  <p style="font-family:'JetBrains Mono',monospace;font-size:12px;line-height:16px;color:#7e7576;margin:0;font-weight:500;letter-spacing:0.05em;text-transform:uppercase">
    Questions? Reply to this email or visit proformaflow.app
  </p>
</body>
</html>`;
}

export async function sendWelcomeEmail(email: string, fullName: string) {
  if (!resend) {
    console.log("[Email] RESEND_API_KEY not configured, skipping welcome email");
    return { sent: false, reason: "no_api_key" };
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: "Welcome to ProformaFlow — Let's generate your first document",
      html: welcomeEmailHtml(fullName),
      tags: [{ name: "type", value: "welcome" }],
    });
    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed to send welcome email:", err);
    return { sent: false, error: String(err) };
  }
}