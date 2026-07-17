import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/public-nav";

export default function LandingPage() {
  return (
    <>
      <PublicNav />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-4 md:px-margin-lg overflow-hidden bg-grid-pattern border-b brutal-border-bottom">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="col-span-1 lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-variant border brutal-border text-xs font-label-md uppercase tracking-widest rounded-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Export Documentation System
              </div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">
                From quote to customs <br />
                <span className="relative">
                  in one flow.
                  <svg
                    className="absolute w-full h-4 -bottom-1 left-0 text-primary opacity-20"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 10"
                  >
                    <path d="M0 5 Q 50 15 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </h1>
              <p className="font-body-lg text-on-surface-variant max-w-2xl border-l-4 border-primary pl-6 py-2">
                Proforma + Commercial Invoice + Packing List. <br />
                Carrier-ready for FedEx, UPS, DHL in standardized international format.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/generator"
                  className="inline-flex justify-center items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded font-label-md hover:bg-primary-container transition-colors brutal-border group"
                >
                  Start Free — Generate in 60s
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex justify-center items-center gap-2 bg-surface text-primary px-8 py-4 rounded font-label-md hover:bg-surface-variant transition-colors brutal-border"
                >
                  View Pricing
                </Link>
              </div>
              <div className="pt-8 flex items-center gap-4 text-sm font-label-md text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> No credit
                  card required
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Export to
                  PDF
                </span>
              </div>
            </div>
            <div className="col-span-1 lg:col-span-5 relative hidden lg:block">
              <div className="relative w-full aspect-[4/5] bg-surface brutal-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex justify-between items-start border-b brutal-border-bottom pb-4">
                  <div>
                    <div className="text-xs font-label-md text-on-surface-variant uppercase">
                      Document
                    </div>
                    <div className="font-headline-sm">Commercial Invoice</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-label-md text-on-surface-variant">No.</div>
                    <div className="font-label-md font-bold">INV-2024-089</div>
                  </div>
                </div>
                <div className="flex-grow flex flex-col gap-3 pt-4">
                  <div className="w-full h-8 bg-surface-variant rounded-sm" />
                  <div className="w-3/4 h-8 bg-surface-variant rounded-sm" />
                  <div className="w-full h-8 bg-surface-variant rounded-sm" />
                  <div className="w-5/6 h-8 bg-surface-variant rounded-sm" />
                </div>
                <div className="mt-auto border-t brutal-border-top pt-4 flex justify-between items-center">
                  <div className="w-16 h-16 bg-surface-variant rounded-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline">qr_code_2</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-label-md text-on-surface-variant uppercase">
                      Total Value
                    </div>
                    <div className="font-headline-sm">$14,500.00</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-primary text-on-primary brutal-border p-4 flex flex-col justify-between transform -rotate-6 z-20">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
                <div>
                  <div className="font-label-md text-xs opacity-70">Status</div>
                  <div className="font-headline-sm text-lg leading-tight">Ready for Customs</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Carrier Badge Strip */}
        <section className="border-b brutal-border-bottom bg-surface-container-lowest py-6 px-4 md:px-margin-lg overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="font-label-md text-sm text-on-surface-variant uppercase tracking-widest shrink-0">
              Carrier Compatibility
            </div>
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-8 md:gap-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-500 w-full">
              {["FedEx", "UPS", "DHL", "Aramex"].map((carrier) => (
                <div key={carrier} className="flex items-center gap-2 font-headline-sm text-xl font-bold tracking-tighter">
                  {carrier}{" "}
                  <span className="text-xs px-2 py-1 bg-surface-variant text-on-surface-variant rounded-sm uppercase tracking-widest brutal-border ml-2 font-label-md">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid (Bento Style) */}
        <section className="py-32 px-4 md:px-margin-lg bg-surface-bright">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="font-headline-md text-primary mb-4">Export Architecture</h2>
              <p className="font-body-lg text-on-surface-variant max-w-2xl">
                Designed for precision. Built for speed. Every document generated complies with
                international customs regulations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
              <div className="bg-surface brutal-border p-8 flex flex-col hover:bg-surface-variant transition-colors duration-300 lg:col-span-2">
                <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center rounded-sm brutal-border mb-6">
                  <span className="material-symbols-outlined">gavel</span>
                </div>
                <h3 className="font-headline-sm mb-3">Incoterms &amp; HS Code built-in</h3>
                <p className="font-body-md text-on-surface-variant max-w-md">
                  Ensure compliance with international trade standards. Automated field validation
                  for Harmonized System codes and Incoterms 2020 rules reduces customs holds.
                </p>
                <div className="mt-auto flex gap-2">
                  <span className="px-3 py-1 bg-surface-container-high text-xs font-label-md uppercase brutal-border rounded-sm">
                    FOB
                  </span>
                  <span className="px-3 py-1 bg-surface-container-high text-xs font-label-md uppercase brutal-border rounded-sm">
                    CIF
                  </span>
                  <span className="px-3 py-1 bg-surface-container-high text-xs font-label-md uppercase brutal-border rounded-sm">
                    EXW
                  </span>
                </div>
              </div>
              <div className="bg-surface brutal-border p-8 flex flex-col hover:bg-surface-variant transition-colors duration-300">
                <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center rounded-sm brutal-border mb-6">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <h3 className="font-headline-sm mb-3">Carrier-ready PDFs</h3>
                <p className="font-body-md text-on-surface-variant">
                  Layouts specifically optimized for FedEx, UPS, and DHL automated reading systems.
                  Stop re-typing data into carrier portals.
                </p>
              </div>
              <div className="bg-surface brutal-border p-8 flex flex-col hover:bg-surface-variant transition-colors duration-300">
                <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center rounded-sm brutal-border mb-6">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <h3 className="font-headline-sm mb-3">Packing List auto-generation</h3>
                <p className="font-body-md text-on-surface-variant">
                  Perfectly correlated with your commercial invoice. Automatically splits items into
                  boxes with volumetric weight calculations.
                </p>
              </div>
              <div className="bg-primary text-on-primary brutal-border p-8 flex flex-col lg:col-span-2 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-surface text-primary flex items-center justify-center rounded-sm mb-6 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                  <h3 className="font-headline-sm mb-3">Professional PDF quality</h3>
                  <p className="font-body-md text-on-primary-container max-w-md">
                    Clean, high-fidelity output. Sharp typography and structural clarity designed to
                    present a highly professional image to customs agents and clients alike.
                  </p>
                </div>
                <div className="absolute right-8 bottom-8 w-32 h-40 border-2 border-on-primary/30 rotate-12 group-hover:rotate-6 transition-transform flex flex-col gap-2 p-3">
                  <div className="w-full h-2 bg-on-primary/30" />
                  <div className="w-3/4 h-2 bg-on-primary/30" />
                  <div className="w-full h-2 bg-on-primary/30 mt-4" />
                  <div className="w-full h-2 bg-on-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Summary */}
        <section className="py-32 px-4 md:px-margin-lg bg-background border-t brutal-border-top border-b brutal-border-bottom relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="font-headline-md text-primary mb-4">Clear Economics</h2>
              <p className="font-body-lg text-on-surface-variant">
                Transparent pricing for export operations of any scale.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="bg-surface brutal-border p-8 flex flex-col">
                <div className="font-label-md text-sm text-on-surface-variant uppercase tracking-widest mb-2">
                  Starter
                </div>
                <div className="font-headline-lg mb-4">Free</div>
                <p className="font-body-md text-on-surface-variant mb-8 h-12">
                  Essential for occasional shippers.
                </p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    3 Documents / month
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Basic PDF Export
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-sm mt-0.5">close</span>
                    Custom Branding
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="w-full text-center bg-surface text-primary py-3 rounded font-label-md hover:bg-surface-variant transition-colors brutal-border"
                >
                  Sign Up
                </Link>
              </div>
              <div className="bg-primary text-on-primary brutal-border p-8 flex flex-col relative transform md:-translate-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="absolute top-0 right-0 bg-secondary text-on-primary text-xs font-label-md px-3 py-1 uppercase tracking-widest">
                  Most Popular
                </div>
                <div className="font-label-md text-sm text-on-primary-container uppercase tracking-widest mb-2">
                  Professional
                </div>
                <div className="font-headline-lg mb-4 flex items-end gap-1">
                  $24 <span className="font-body-md text-sm text-on-primary-container mb-2">/mo</span>
                </div>
                <p className="font-body-md text-on-primary-container mb-8 h-12">
                  Advanced features for growing exporters.
                </p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Unlimited Documents
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Carrier-ready PDFs
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Custom Branding
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Packing List Auto-gen
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="w-full text-center bg-surface text-primary py-3 rounded font-label-md hover:bg-surface-variant transition-colors brutal-border"
                >
                  Start Trial
                </Link>
              </div>
              <div className="bg-surface brutal-border p-8 flex flex-col">
                <div className="font-label-md text-sm text-on-surface-variant uppercase tracking-widest mb-2">
                  Business
                </div>
                <div className="font-headline-lg mb-4 flex items-end gap-1">
                  $79 <span className="font-body-md text-sm text-on-surface-variant mb-2">/mo</span>
                </div>
                <p className="font-body-md text-on-surface-variant mb-8 h-12">
                  High-volume enterprise trade operations.
                </p>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Everything in Professional
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    20+ Currencies
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Unlimited Templates
                  </li>
                  <li className="flex items-start gap-2 font-body-md text-sm">
                    <span className="material-symbols-outlined text-sm mt-0.5">check</span>
                    Priority Support
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="w-full text-center bg-surface text-primary py-3 rounded font-label-md hover:bg-surface-variant transition-colors brutal-border"
                >
                  Get Business
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Statement */}
        <section className="py-24 px-4 md:px-margin-lg bg-surface-container-highest">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center justify-center gap-2 mb-8">
              <span className="material-symbols-outlined text-3xl text-primary">lock</span>
            </div>
            <h3 className="font-headline-sm text-primary mb-4">
              We don&apos;t store your generated documents.
            </h3>
            <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
              You generate the document, download the PDF, and we discard every temporary field
              used to build it. Proformas, invoices, packing lists, product data, banking details,
              and customer information never touch our database. Only your account profile,
              company defaults, and subscription are stored.
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
