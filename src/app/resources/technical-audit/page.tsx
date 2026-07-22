import { PublicNav, PublicFooter } from "@/components/public-nav";
import Link from "next/link";

const DISCLAIMER = `DISCLAIMER & LIMITATION OF LIABILITY: ProformaFlow is a software tool designed for structural document formatting and data-mapping automation. It does not provide legal, customs brokerage, or official trade consulting services. Customs regulations change frequently and vary by country, carrier, and shipment specifics. The user remains solely and completely responsible for the accuracy, legality, and regulatory fulfillment of all data entered into the system. ProformaFlow cannot guarantee, ensure, or certify successful customs entry or clearance. By using this software, you agree that ProformaFlow accepts zero liability for delays, fines, inspections, holds, penalties, or rejections arising from the use of generated documents.`;

const REGULATORY_FRAMEWORKS = [
  {
    title: "United States (CBP)",
    standard: "19 CFR 141.86",
    description: "Specificity requirements for commercial invoices, mandatory party identification, and entry documentation standards enforced by U.S. Customs and Border Protection.",
  },
  {
    title: "European Union",
    standard: "EORI / Union Customs Code (UCC)",
    description: "Mandatory Economic Operators Registration and Identification (EORI) numbers for all EU import/export parties. Full alignment with EU Customs Code data requirements.",
  },
  {
    title: "Mexico (SAT / Comercio Exterior)",
    standard: "CFDI 4.0 / Carta Porte",
    description: "Mexican tax authority (SAT) compliance for CFDI 4.0 invoice structure and Complemento Carta Porte transport documentation requirements.",
  },
  {
    title: "Global Standards",
    standard: "Incoterms® 2020 / USMCA / WCO HS",
    description: "ICC Incoterms® 2020 terminology alignment, USMCA preferential origin certification (9 data elements), and WCO Harmonized System 6–10 digit classification structure.",
  },
];

const DOCUMENTS = [
  {
    title: "Proforma Invoice",
    description: "Quotation document with estimated pricing, validity period, and explicit 'NOT A COMMERCIAL INVOICE' disclaimer. Includes Incoterms® 2020, payment terms, and HS codes. Blocks misuse as customs document via validation.",
    validity: "Structural template aligned with international quotation standards. Explicit disclaimer prevents customs misuse.",
  },
  {
    title: "Commercial Invoice — FedEx",
    description: "2-page M-1054 format. 12-digit AWB validation, Mexico RFC & EU EORI mandatory fields, export reason enum (Sale/Sample/Gift/Repair/Return), FTA eligibility, ETD-ready badge, CPC codes.",
    validity: "FedEx M-1054 specification compliant. ETD (Electronic Trade Documents) enabled. Carrier-specific validation rules enforced.",
  },
  {
    title: "Commercial Invoice — UPS",
    description: "1Z tracking format validation, Related/Not Related party declaration (mandatory), USMCA certification as SEPARATE document (not embedded), Paperless/EDI JSON output, NAFTA block prevention.",
    validity: "UPS Paperless Invoice specification. USMCA certification isolated per carrier requirement. NAFTA references blocked as obsolete.",
  },
  {
    title: "Commercial Invoice — DHL",
    description: "10-digit AWB format, 7-value export reason enum, 3-value export type enum, Importer of Record (IOR) distinct party, MyDHL+ badge, Export/Import license fields, payment method, terms of trade.",
    validity: "DHL Express technical specifications. MyDHL+ integration ready. IOR separation for customs liability clarity.",
  },
  {
    title: "Packing List",
    description: "Landscape orientation. Package-level granularity: package numbers, types (box/pallet/crate), dimensions L×W×H, net/gross weight per package, mandatory shipping marks. Cross-validated 1:1 with Commercial Invoice lines.",
    validity: "ISO 3676 / IMO shipping marks compliance. Zero monetary values (except VPL). Cross-document consistency enforced at blocking level.",
  },
  {
    title: "Bundle (CI + PL Combined / CIPL)",
    description: "Single 13-column table merging financial + physical data per package row. Dual declaration blocks (Invoice + Packing). Destination acceptance warning (14 countries + LCL). Also generates separate CI & PL.",
    validity: "CIPL unified format accepted by major customs brokers. Dual signatures. Cross-validation with source CI+PL at blocking level.",
  },
];

const QUALITY_CONTROLS = [
  {
    title: "HS Code Validation",
    description: "Syntactic verification of 6–10 digit tariff codes against WCO Harmonized System structure. Blocks invalid lengths and non-numeric characters before generation.",
  },
  {
    title: "Generic Description Blocking",
    description: "Rejects vague terms ('goods', 'merchandise', 'products', 'items', 'cargo', 'freight', 'shipment'). Enforces material + use + identity specificity per 19 CFR 141.86 and carrier requirements. Blocking-level validation.",
  },
  {
    title: "EORI Mandatory Verification (EU)",
    description: "Regex validation (^[A-Z]{2}[A-Z0-9]{1,15}$) for EU destination shipments. Blocks generation if shipper/consignee/importer EORI missing or malformed. Enforced at schema + pre-generation layers.",
  },
  {
    title: "U.S. De Minimis $800 Suspension Alert",
    description: "Automated warning when U.S. destination shipment value < $800. Reflects global suspension (effective Aug 2025) of Section 321 de minimis exemption for China/Hong Kong origin. Prevents silent non-compliance.",
  },
];

export default function TechnicalAuditPage() {
  return (
    <>
      <PublicNav />
      <main className="flex-grow min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-margin-lg py-margin-lg">
          {/* Legal Disclaimer - TOP */}
          <section className="mb-margin-lg p-6 border-2 border-secondary bg-secondary-fixed text-on-secondary-fixed rounded-sm">
            <p className="font-mono text-xs md:text-sm text-on-secondary-fixed-variant leading-relaxed whitespace-pre-wrap">{DISCLAIMER}</p>
          </section>

          {/* Header */}
          <header className="mb-margin-lg text-center md:text-left max-w-3xl mx-auto">
            <div className="inline-block bg-primary text-on-primary font-label-md text-label-md px-3 py-1 mb-4 rounded-sm tracking-wider uppercase">
              Technical Audit Report
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">
              Technical Compliance Audit
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Structural validation of ProformaFlow against international customs regulations and carrier specifications.
            </p>
          </header>

          {/* Section 1: Regulatory Frameworks */}
          <section className="mb-margin-lg">
            <h2 className="font-headline-md text-headline-md text-primary mb-6 border-b-2 border-primary pb-2">
              Regulatory Frameworks Covered
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {REGULATORY_FRAMEWORKS.map((framework, index) => (
                <article key={index} className="border border-outline bg-surface p-6 rounded-sm hover:border-primary transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[32px] mt-1 shrink-0">gavel</span>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{framework.title}</h3>
                      <p className="font-label-md text-label-md text-secondary mb-2">{framework.standard}</p>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{framework.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Section 2: Documents Generated */}
          <section className="mb-margin-lg">
            <h2 className="font-headline-md text-headline-md text-primary mb-6 border-b-2 border-primary pb-2">
              Documents Generated & Validity Basis
            </h2>
            <div className="space-y-4">
              {DOCUMENTS.map((doc, index) => (
                <article key={index} className="border border-outline bg-surface p-6 rounded-sm hover:border-primary transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{doc.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-3">{doc.description}</p>
                      <p className="font-body-md text-body-md text-secondary font-medium">{doc.validity}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Section 3: Quality Controls */}
          <section className="mb-margin-lg">
            <h2 className="font-headline-md text-headline-md text-primary mb-6 border-b-2 border-primary pb-2">
              Automated Quality Controls (Executed Before Generation)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {QUALITY_CONTROLS.map((control, index) => (
                <article key={index} className="border border-outline bg-surface p-6 rounded-sm hover:border-primary transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[32px] mt-1 shrink-0">verified</span>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{control.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{control.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Legal Disclaimer - BOTTOM */}
          <section className="mb-margin-lg p-6 border-2 border-secondary bg-secondary-fixed text-on-secondary-fixed rounded-sm">
            <p className="font-mono text-xs md:text-sm text-on-secondary-fixed-variant leading-relaxed whitespace-pre-wrap">{DISCLAIMER}</p>
          </section>

          {/* CTA */}
          <section className="text-center md:text-left max-w-3xl mx-auto pt-margin-md border-t-2 border-primary">
            <div className="inline-flex items-center justify-center md:justify-start">
              <Link
                href="/pricing"
                className="bg-primary text-on-primary font-label-md text-label-md px-8 py-4 rounded-sm hover:bg-primary-container transition-colors brutal-border"
              >
                View Pricing Plans
                <span className="material-symbols-outlined ml-2" style={{fontVariationSettings: "'FILL' 0"}}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}