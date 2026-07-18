"use client";

import { useState, useEffect } from "react";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { createClient } from "@/lib/supabase/client";

const PLANS = {
  monthly: { pro: 24, biz: 79, proSuffix: "/mo", bizSuffix: "/mo" },
  annual: { pro: 19, biz: 63, proSuffix: "/mo", bizSuffix: "/mo" },
};

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const plan = annual ? PLANS.annual : PLANS.monthly;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleUpgrade(targetPlan: "professional" | "business", interval: "month" | "year") {
    if (!user) {
      window.location.href = `/register?plan=${targetPlan}`;
      return;
    }
    setLoadingBtn(`${targetPlan}-${interval}`);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, interval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Something went wrong.");
    } catch {
      alert("Connection error. Please try again.");
    }
    setLoadingBtn(null);
  }

  return (
    <>
      <PublicNav />
      <main className="flex-grow pt-16 pb-16 px-4 md:px-margin-lg max-w-screen-2xl mx-auto w-full">
        <section className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="font-headline-lg-mobile md:font-headline-lg mb-2">
            Simple, transparent pricing.
          </h1>
          <p className="font-body-lg text-on-surface-variant mb-6">
            Scale your global trade operations with confidence.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="font-label-md">Monthly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={annual}
                onChange={(e) => setAnnual(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
            <span className="font-label-md flex items-center gap-1">
              Annually
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-xs font-bold ml-2">Save 20%</span>
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {/* Starter */}
          <div className="border border-outline-variant p-8 flex flex-col rounded bg-surface h-full">
            <div className="mb-4">
              <h3 className="font-headline-sm mb-1">Starter</h3>
              <div className="font-headline-md mb-2">$0<span className="font-body-md text-on-surface-variant">/mo</span></div>
              <p className="font-body-md text-on-surface-variant h-12">Perfect for individuals starting with global trade.</p>
            </div>
            <ul className="flex-grow space-y-3 mb-8">
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-outline text-sm">check</span><span className="font-body-md">3 docs/month</span></li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-outline text-sm">check</span><span className="font-body-md">Watermarked PDFs</span></li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-outline text-sm">check</span><span className="font-body-md">Proforma invoices only</span></li>
              <li className="flex items-start gap-2 text-outline"><span className="material-symbols-outlined text-sm">close</span><span className="font-body-md">No carrier-ready PDFs</span></li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-outline text-sm">check</span><span className="font-body-md">Community support</span></li>
            </ul>
            <button disabled={loadingBtn !== null} onClick={() => handleUpgrade("professional", "month")} className="w-full text-center border border-primary text-primary font-label-md py-3 rounded hover:bg-surface-container-low transition-colors disabled:opacity-50">
              {user ? "Get Started Free" : "Sign Up Free"}
            </button>
          </div>

          {/* Professional */}
          <div className="border-2 border-primary p-8 flex flex-col rounded bg-surface relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:-translate-y-2">
            <div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 font-label-md text-xs font-bold rounded-bl">Popular</div>
            <div className="mb-4">
              <h3 className="font-headline-sm mb-1">Professional</h3>
              <div className="font-headline-md mb-2">
                ${plan.pro}<span className="font-body-md text-on-surface-variant">{plan.proSuffix}</span>
                {annual && <div className="text-xs text-on-surface-variant mt-1 font-body-md font-normal">Billed $228 yearly</div>}
              </div>
              <p className="font-body-md text-on-surface-variant h-12">For growing businesses needing carrier integration.</p>
            </div>
            <ul className="flex-grow space-y-3 mb-8">
              {["Unlimited docs", "No watermark", "All document types", "Carrier-ready PDFs (FedEx/UPS/DHL)", "50 document history", "5 currencies", "Email support"].map(f => (
                <li key={f} className="flex items-start gap-2"><span className="material-symbols-outlined text-primary text-sm">check</span><span className="font-body-md font-medium">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade("professional", annual ? "year" : "month")} disabled={loadingBtn === `professional-${annual ? "year" : "month"}`} className="w-full text-center bg-primary text-on-primary font-label-md py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
              {loadingBtn === `professional-${annual ? "year" : "month"}` ? "Redirecting..." : (user ? "Get Professional" : "Start Free Trial")}
            </button>
          </div>

          {/* Business */}
          <div className="border border-outline-variant p-8 flex flex-col rounded bg-surface h-full">
            <div className="mb-4">
              <h3 className="font-headline-sm mb-1">Business</h3>
              <div className="font-headline-md mb-2">
                ${plan.biz}<span className="font-body-md text-on-surface-variant">{plan.bizSuffix}</span>
                {annual && <div className="text-xs text-on-surface-variant mt-1 font-body-md font-normal">Billed $758 yearly</div>}
              </div>
              <p className="font-body-md text-on-surface-variant h-12">Advanced features for high-volume operations.</p>
            </div>
            <ul className="flex-grow space-y-3 mb-8">
              {["All Pro features", "Unlimited history", "Unlimited templates", "20+ currencies", "Priority support"].map(f => (
                <li key={f} className="flex items-start gap-2"><span className="material-symbols-outlined text-outline text-sm">check</span><span className="font-body-md font-medium">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade("business", annual ? "year" : "month")} disabled={loadingBtn === `business-${annual ? "year" : "month"}`} className="w-full text-center border border-primary text-primary font-label-md py-3 rounded hover:bg-surface-container-low transition-colors disabled:opacity-50">
              {loadingBtn === `business-${annual ? "year" : "month"}` ? "Redirecting..." : (user ? "Get Business" : "Start Free Trial")}
            </button>
          </div>
        </section>

        <p className="text-center font-label-md text-on-surface-variant mb-16">&nbsp;</p>

        <section className="mb-16 overflow-x-auto">
          <h2 className="font-headline-md mb-8 text-center">Compare Features</h2>
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="py-3 px-4 font-headline-sm w-1/4">Feature</th>
                <th className="py-3 px-4 font-label-md w-1/4 text-center">Starter</th>
                <th className="py-3 px-4 font-label-md w-1/4 text-center bg-surface-container-low">Professional</th>
                <th className="py-3 px-4 font-label-md w-1/4 text-center">Business</th>
              </tr>
            </thead>
            <tbody className="font-body-md">
              <tr className="border-b border-outline-variant">
                <td className="py-3 px-4">Documents/month</td>
                <td className="py-3 px-4 text-center">3</td>
                <td className="py-3 px-4 text-center bg-surface-container-low font-medium">Unlimited</td>
                <td className="py-3 px-4 text-center">Unlimited</td>
              </tr>
              <tr className="border-b border-outline-variant">
                <td className="py-3 px-4">Watermark</td>
                <td className="py-3 px-4 text-center">Yes</td>
                <td className="py-3 px-4 text-center bg-surface-container-low">No</td>
                <td className="py-3 px-4 text-center">No</td>
              </tr>
              <tr className="border-b border-outline-variant">
                <td className="py-3 px-4">Document types</td>
                <td className="py-3 px-4 text-center">Proforma Only</td>
                <td className="py-3 px-4 text-center bg-surface-container-low">All</td>
                <td className="py-3 px-4 text-center">All</td>
              </tr>
              <tr className="border-b border-outline-variant">
                <td className="py-3 px-4">Carrier-ready PDFs</td>
                <td className="py-3 px-4 text-center"><span className="material-symbols-outlined text-outline-variant">close</span></td>
                <td className="py-3 px-4 text-center bg-surface-container-low"><span className="material-symbols-outlined text-primary">check</span></td>
                <td className="py-3 px-4 text-center"><span className="material-symbols-outlined">check</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}