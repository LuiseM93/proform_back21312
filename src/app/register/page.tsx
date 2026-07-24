"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "@/app/auth/actions";

const PLAN_LABELS: Record<string, string> = {
  professional: "You're signing up for Professional — $49/mo",
  business: "You're signing up for Business — $149/mo",
  starter: "You're signing up for Starter — Free",
};

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await sendMagicLink(email, "/dashboard", marketing);
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
            <p className="font-body-md text-on-surface-variant">
              {PLAN_LABELS[plan] || PLAN_LABELS.starter}
            </p>
            <p className="font-body-md text-on-surface-variant">
              We&apos;ll send a magic link to your email. No password needed.
            </p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label
                className="font-label-md text-primary uppercase tracking-wider"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-surface-bright border-2 text-primary font-body-md focus:ring-0 transition-colors placeholder:text-outline outline-none ${
                    status === "error"
                      ? "border-error focus:border-error"
                      : "border-outline-variant focus:border-primary"
                  }`}
                />
              </div>
              {status === "error" && (
                <p className="font-label-md text-error mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {errorMsg}
                </p>
              )}
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5"
              />
              <span className="font-body-md text-on-surface-variant">
                Send me tips about export documentation and ProformaFlow updates.
              </span>
            </label>
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="w-full bg-primary text-on-primary py-4 font-label-md uppercase tracking-wider border-2 border-primary hover:bg-surface-bright hover:text-primary transition-colors flex justify-center items-center gap-2 group disabled:opacity-70"
            >
              {status === "sent" ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span> Link
                  Sent!
                </>
              ) : status === "sending" ? (
                "Sending..."
              ) : (
                <>
                  Send Magic Link
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
          <div className="border-t-2 border-outline-variant border-dashed" />
          <div className="text-center">
            <Link
              href="/login"
              className="font-body-md text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 border-b border-transparent hover:border-primary pb-0.5"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
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