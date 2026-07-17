"use client";

import { useState } from "react";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter Free",
  professional: "Professional",
  business: "Business",
};

export function BillingClient({
  plan,
  status,
  currentPeriodEnd,
  billingInterval,
  hasStripeCustomer,
  documentsUsed,
  docsPerMonth,
}: {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  billingInterval: string | null;
  hasStripeCustomer: boolean;
  documentsUsed: number;
  docsPerMonth: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usagePct = docsPerMonth === Infinity ? 0 : Math.min((documentsUsed / docsPerMonth) * 100, 100);

  async function handleUpgrade(targetPlan: "professional" | "business", interval: "month" | "year") {
    setLoading(`${targetPlan}-${interval}`);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Something went wrong. Try again.");
    } catch (e) {
      setError("Connection error. Please try again.");
    }
    setLoading(null);
  }

  async function handleManage() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Could not open billing portal.");
    } catch (e) {
      setError("Connection error. Please try again.");
    }
    setLoading(null);
  }

  return (
    <div className="p-4 md:p-margin-md max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">
            Billing &amp; Usage
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Manage your subscription, monitor document usage, and review billing history.
          </p>
        </div>
        <div className="flex gap-3">
          {hasStripeCustomer && (
            <button
              onClick={handleManage}
              disabled={loading === "portal"}
              className="px-6 py-3 border border-primary rounded font-label-md text-primary hover:bg-surface-container-high transition-colors"
            >
              {loading === "portal" ? "Loading..." : "Manage Subscription"}
            </button>
          )}
          {plan === "starter" && (
            <button
              onClick={() => handleUpgrade("professional", "month")}
              disabled={loading === "professional-month"}
              className="px-6 py-3 bg-primary text-on-primary rounded font-label-md hover:bg-primary-container transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {loading === "professional-month" ? "Redirecting..." : "Upgrade Plan"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-error-container border border-error rounded p-4 font-label-md text-sm text-on-error-container">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 border-2 border-primary rounded-xl bg-surface overflow-hidden flex flex-col">
          <div className="p-4 md:p-6 border-b-2 border-primary bg-surface-container-low flex justify-between items-center">
            <h3 className="font-headline-sm text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">workspace_premium</span>
              Current Plan
            </h3>
            <span className="px-3 py-1 bg-primary text-on-primary font-label-md text-xs uppercase tracking-widest rounded-full">
              {PLAN_LABELS[plan]}
            </span>
          </div>
          <div className="p-6 md:p-8 flex-1 grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === "active" ? "bg-secondary" : "bg-outline"}`} />
                <p className="font-body-lg text-primary font-medium capitalize">{status}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Billing Cycle</p>
              <p className="font-body-lg text-primary">{billingInterval ? `Per ${billingInterval}` : "N/A (Free)"}</p>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Next Invoice</p>
              <p className="font-body-lg text-primary">
                {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Payment Method</p>
              <p className="font-body-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-outline">
                  {hasStripeCustomer ? "credit_card" : "credit_card_off"}
                </span>
                {hasStripeCustomer ? "On file" : "None"}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 border-2 border-primary rounded-xl bg-surface-container-lowest p-6 md:p-8 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-headline-sm text-primary">Usage</h3>
              <span className="material-symbols-outlined text-primary text-3xl">data_usage</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="font-label-md text-on-surface-variant">Documents this month</p>
                <p className="font-headline-md text-primary leading-none">
                  {documentsUsed}{" "}
                  {docsPerMonth !== Infinity && (
                    <span className="text-xl text-outline-variant">/ {docsPerMonth}</span>
                  )}
                </p>
              </div>
              <div className="h-4 w-full border border-primary bg-surface-variant rounded-full overflow-hidden flex">
                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${usagePct}%` }} />
              </div>
            </div>
          </div>
          {plan === "starter" && (
            <div className="mt-8 pt-6 border-t border-outline-variant">
              <div className="flex items-start gap-3 p-4 bg-tertiary-fixed border border-tertiary-container rounded-lg">
                <span className="material-symbols-outlined text-tertiary-container mt-0.5">info</span>
                <p className="font-body-md text-tertiary-container text-sm">
                  Upgrade to Professional for unlimited documents and carrier-ready PDFs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {plan === "starter" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-outline-variant rounded p-6 bg-surface">
            <h4 className="font-headline-sm mb-2">Professional — $24/mo</h4>
            <p className="font-body-md text-on-surface-variant mb-4">Unlimited docs, carrier-ready PDFs.</p>
            <div className="flex gap-2">
              <button onClick={() => handleUpgrade("professional", "month")} className="flex-1 bg-primary text-on-primary py-2 rounded font-label-md">
                Monthly
              </button>
              <button onClick={() => handleUpgrade("professional", "year")} className="flex-1 border border-primary text-primary py-2 rounded font-label-md">
                Yearly (-20%)
              </button>
            </div>
          </div>
          <div className="border border-outline-variant rounded p-6 bg-surface">
            <h4 className="font-headline-sm mb-2">Business — $79/mo</h4>
            <p className="font-body-md text-on-surface-variant mb-4">Everything in Pro + 20+ currencies.</p>
            <div className="flex gap-2">
              <button onClick={() => handleUpgrade("business", "month")} className="flex-1 bg-primary text-on-primary py-2 rounded font-label-md">
                Monthly
              </button>
              <button onClick={() => handleUpgrade("business", "year")} className="flex-1 border border-primary text-primary py-2 rounded font-label-md">
                Yearly (-20%)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
