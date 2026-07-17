"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "@/app/auth/actions";

const PLAN_LABELS: Record<string, string> = {
  professional: "You're signing up for Professional — $24/mo",
  business: "You're signing up for Business — $79/mo",
  starter: "You're signing up for Starter — Free",
};

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await sendMagicLink(email, "/dashboard");
    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-surface-container-lowest">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        <div className="flex justify-center w-full">
          <Link href="/" className="font-headline-md text-primary font-bold">
            ProformaFlow
          </Link>
        </div>
        <div className="bg-surface-bright border-2 border-primary w-full p-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="font-headline-sm text-primary">Create your ProformaFlow account</h1>
            <p className="font-body-md text-on-surface-variant">Enter your email to get started.</p>
          </div>
          <div className="bg-tertiary text-on-tertiary border-2 border-primary px-4 py-2 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-label-md">{PLAN_LABELS[plan] || PLAN_LABELS.starter}</span>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline focus:border-tertiary-container focus:ring-1 focus:ring-tertiary-container p-2 font-body-md text-on-surface placeholder:text-outline-variant rounded outline-none transition-colors"
              />
            </div>
            {status === "error" && (
              <p className="font-label-md text-error">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="w-full bg-primary text-on-primary hover:bg-surface-tint active:scale-95 transition-all py-3 font-label-md rounded flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {status === "sent" ? "Link Sent! Check your inbox" : "Send Magic Link"}
              {status !== "sent" && (
                <span className="material-symbols-outlined">auto_awesome</span>
              )}
            </button>
          </form>
          <div className="border-t border-outline-variant pt-4 flex justify-center">
            <Link href="/login" className="font-label-md text-primary hover:underline transition-all">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
      <footer className="fixed bottom-0 w-full p-4 flex justify-center bg-transparent">
        <span className="font-label-md text-outline-variant">
          © {new Date().getFullYear()} ProformaFlow. All rights reserved.
        </span>
      </footer>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
