"use client";

import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/public-nav";

const samples = [
  {
    id: "01-proforma-invoice",
    title: "Proforma Invoice",
    description: "Standard quotation format with estimated pricing and validity terms. (US to International)",
    icon: "description",
    file: "01-proforma-invoice.pdf",
  },
  {
    id: "02-ci-fedex-us-mx",
    title: "Commercial Invoice — FedEx (US to MX)",
    description: "Standard M-1054 2-page format with Mexico RFC compliance.",
    icon: "description",
    file: "02-ci-fedex-us-mx.pdf",
  },
  {
    id: "03-ci-fedex-us-de-eu",
    title: "Commercial Invoice — FedEx (US to EU)",
    description: "EU destination format including recipient EORI number verification.",
    icon: "description",
    file: "03-ci-fedex-us-de-eu.pdf",
  },
  {
    id: "04-ci-ups-us-mx-usmca",
    title: "Commercial Invoice — UPS (US to MX + USMCA)",
    description: "Formatted with Related/Not Related parties and USMCA origin rules.",
    icon: "description",
    file: "04-ci-ups-us-mx-usmca.pdf",
  },
  {
    id: "05-ci-ups-us-us",
    title: "Commercial Invoice — UPS (Domestic/Standard US)",
    description: "Standard UPS Commercial Invoice configuration for domestic or general trade.",
    icon: "description",
    file: "05-ci-ups-us-us.pdf",
  },
  {
    id: "06-ci-dhl-us-de-ior",
    title: "Commercial Invoice — DHL (US to EU + IOR)",
    description: "DHL Express 10-digit AWB format featuring Importer of Record (IOR) details.",
    icon: "description",
    file: "06-ci-dhl-us-de-ior.pdf",
  },
  {
    id: "07-ci-dhl-us-cn",
    title: "Commercial Invoice — DHL (US to China)",
    description: "Formatted for East Asia trade lanes with permanent export configuration.",
    icon: "description",
    file: "07-ci-dhl-us-cn.pdf",
  },
  {
    id: "08-packing-list",
    title: "Packing List (Multi-Package)",
    description: "Detailed physical inventory with package numbers, dimensions, and shipping marks.",
    icon: "description",
    file: "08-packing-list.pdf",
  },
  {
    id: "09-bundle-cipl",
    title: "Bundle (Commercial Invoice + Packing List)",
    description: "Combined CIPL format featuring 13 financial and physical columns.",
    icon: "description",
    file: "09-bundle-cipl.pdf",
  },
];

export default function SamplesPage() {
  return (
    <>
      <PublicNav />
      <main className="flex-grow max-w-7xl mx-auto w-full px-margin-sm md:px-margin-md py-margin-lg">
        {/* Header Section */}
        <header className="mb-margin-lg text-center md:text-left max-w-3xl">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-unit text-primary">
            Sample Output Gallery
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Explore our collection of industry-standard document outputs, engineered for global compliance and seamless logistics integration.
          </p>
        </header>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-margin-lg">
          {samples.map((sample) => (
            <Link
              key={sample.id}
              href={`/assets/pdf_samples/${sample.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-outline bg-surface rounded flex flex-col transition-all hover:border-primary group"
            >
              <div className="p-margin-sm flex-grow">
                <div className="mb-4 text-on-surface-variant group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                    {sample.icon}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-unit">{sample.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{sample.description}</p>
              </div>
              <div className="p-margin-sm border-t border-outline bg-surface-container-lowest">
                <a
                  href={`/assets/pdf_samples/${sample.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2 px-4 border border-primary text-primary font-label-md text-label-md uppercase tracking-wider rounded hover:bg-primary hover:text-on-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download Sample (PDF)
                </a>
              </div>
            </Link>
          ))}
        </div>

        {/* Legal Disclaimer */}
        <div className="border-t border-outline pt-margin-sm mt-margin-md">
          <p className="font-body-md text-[12px] text-outline text-center md:text-left">
            Disclaimer: All sample PDFs are provided for technical demonstration and structural reference only. They do not constitute legal, customs, or brokerage advice.
          </p>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}