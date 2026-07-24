"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "@/app/auth/actions";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    const result = await sendMagicLink(email, redirectPath, marketing);
    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="w-full max-w-[400px] mx-auto min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">
          ProformaFlow
        </h1>
        <div className="h-[2px] w-12 bg-primary mx-auto mt-2" />
      </div>
      <div className="bg-surface border-2 border-outline-variant p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] duration-300 w-full">
        <div className="mb-6">
          <h2 className="font-headline-sm text-primary mb-2">Sign in to ProformaFlow</h2>
          <p className="font-body-md text-on-surface-variant">
            We&apos;ll send a magic link to your email. No password needed.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-primary uppercase tracking-wider" htmlFor="email">
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
                  status === "error" ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
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
            <span className="font-body-md text-on-surface-variant">Send me tips about export documentation and ProformaFlow updates.</span>
          </label>
          <button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="w-full bg-primary text-on-primary py-4 mt-2 font-label-md uppercase tracking-wider border-2 border-primary hover:bg-surface-bright hover:text-primary transition-colors flex justify-center items-center gap-2 group disabled:opacity-70"
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
        <div className="mt-6 mb-6 border-t-2 border-outline-variant border-dashed" />
        <div className="text-center">
          <Link
            href="/register"
            className="font-body-md text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 border-b border-transparent hover:border-primary pb-0.5"
          >
            No account? Register
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}