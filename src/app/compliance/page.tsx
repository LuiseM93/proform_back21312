import { PublicNav, PublicFooter } from "@/components/public-nav";
import Link from "next/link";

export default function CompliancePage() {
  return (
    <>
      <PublicNav />
      <main className="flex-1 w-full relative">
        <div className="max-w-[1400px] mx-auto p-margin-sm md:p-margin-md lg:p-margin-lg pb-16">
          {/* Page Header */}
          <div className="mb-margin-lg border-b-2 border-primary pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-block bg-primary text-on-primary font-label-md text-label-md px-3 py-1 mb-4 rounded-sm tracking-wider uppercase">
                Compliance Architecture
              </div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">
                Technical Compliance Standards
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Structural alignment protocols for international trade documentation.
              </p>
            </div>
          </div>

          {/* Section 1: Global Standard-Based Document Engineering */}
          <section className="mb-margin-lg relative">
            {/* Abstract visual elements - hidden on mobile, shown on lg */}
            <div className="absolute -right-8 -top-8 w-64 h-64 border border-outline-variant rounded-full opacity-20 pointer-events-none hidden lg:block" />
            <div className="absolute -right-16 top-16 w-32 h-32 bg-surface-container-high rounded-full opacity-50 pointer-events-none hidden lg:block" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-margin-md items-center">
              <div className="lg:col-span-7 bg-surface p-margin-sm md:p-margin-md border border-outline relative z-10">
                <div className="flex items-center gap-3 mb-6 border-b border-outline pb-4">
                  <span className="material-symbols-outlined text-secondary text-[32px]">architecture</span>
                  <h2 className="font-headline-md text-headline-md text-primary">
                    Engineering Documentation Based on Global Standards
                  </h2>
                </div>
                <p className="font-body-md text-body-md text-on-background mb-6 leading-relaxed">
                  ProformaFlow operates as a <strong className="text-primary font-semibold">documentation logic automation engine</strong> designed to map against complex international trade requirements. We translate raw data into structured formats aligned with regulatory frameworks like <span className="bg-surface-container-high px-1 border border-outline-variant font-mono text-sm">19 CFR 141.86</span>.
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Our primary objective is to structure user-entered data for border inspection systems, mitigating structural risks and minimizing data friction during transit. We construct the digital manifest using strict architectural principles derived from global customs standards.
                </p>
              </div>
              <div className="lg:col-span-5 h-64 lg:h-full relative border border-outline bg-surface-container-low min-h-[300px]">
                <img
                  alt="Document Engineering Visualization - A minimalist blueprint illustration of a shipping container transforming into a digital document. The document displays realistic fields: HS Code: 8542.31.00, Incoterm: FOB, Weight: 45.2 kg, and EORI: GB123456789000. Neo-Minimalist modern tech aesthetic."
                  className="w-full h-full object-cover p-2 mix-blend-multiply"
                  src="/assets/technical_image.png"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/40 to-transparent" />
              </div>
            </div>
          </section>

          {/* Section 2: Contrast Sources Matrix (Bento Grid) */}
          <section className="mb-margin-lg">
            <div className="mb-8">
              <h2 className="font-headline-md text-headline-md text-primary mb-2">Architecture Based on Global Customs Governance</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Data-source alignment topologies for structural integrity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {/* Grid Item 1: US Federal Regs */}
              <div className="border border-outline bg-surface hover:border-primary transition-colors group h-full flex flex-col">
                <div className="p-4 border-b border-outline bg-surface-container-low flex justify-between items-start">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">gavel</span>
                  <span className="text-xs font-mono text-on-surface-variant bg-background border border-outline px-2 py-0.5">SOURCE: US</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-headline-sm text-[20px] font-semibold text-primary mb-4">U.S. Federal Regs</h3>
                  <ul className="font-body-md text-[14px] text-on-background space-y-3 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      <span>Alignment with <strong>19 CFR 141.86</strong> specificity requirements.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      <span>CBP structural standard mapping.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      <span>Mandatory party identification formatting.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Grid Item 2: Global Integrators */}
              <div className="border border-outline bg-surface hover:border-primary transition-colors group h-full flex flex-col">
                <div className="p-4 border-b border-outline bg-surface-container-low flex justify-between items-start">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">local_shipping</span>
                  <span className="text-xs font-mono text-on-surface-variant bg-background border border-outline px-2 py-0.5">SOURCE: CARRIER</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-headline-sm text-[20px] font-semibold text-primary mb-4">Global Integrators</h3>
                  <ul className="font-body-md text-[14px] text-on-background space-y-3 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">deployed_code</span>
                      <span>FedEx: Export reason topologies.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">deployed_code</span>
                      <span>UPS: Related/Not Related party linking.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">deployed_code</span>
                      <span>DHL: EU format technical specifications.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Grid Item 3: Mexico Foreign Trade */}
              <div className="border border-outline bg-surface hover:border-primary transition-colors group h-full flex flex-col">
                <div className="p-4 border-b border-outline bg-surface-container-low flex justify-between items-start">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">public</span>
                  <span className="text-xs font-mono text-on-surface-variant bg-background border border-outline px-2 py-0.5">SOURCE: MX</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-headline-sm text-[20px] font-semibold text-primary mb-4">Mexico Foreign Trade</h3>
                  <ul className="font-body-md text-[14px] text-on-background space-y-3 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      <span>CFDI 4.0 technical specification mapping.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      <span>SAT compliance data formatting.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      <span>Complemento Carta Porte structuring.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Grid Item 4: Intl. Trade Standards */}
              <div className="border border-outline bg-surface hover:border-primary transition-colors group h-full flex flex-col">
                <div className="p-4 border-b border-outline bg-surface-container-low flex justify-between items-start">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">language</span>
                  <span className="text-xs font-mono text-on-surface-variant bg-background border border-outline px-2 py-0.5">SOURCE: INTL</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-headline-sm text-[20px] font-semibold text-primary mb-4">Intl. Trade Standards</h3>
                  <ul className="font-body-md text-[14px] text-on-background space-y-3 flex-1">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">deployed_code</span>
                      <span>ICC Incoterms 2020 terminology alignment.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">deployed_code</span>
                      <span>WCO harmonized tariff classification structure.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Preventive Alerts Engine (Terminal UI List) */}
          <section className="mb-margin-lg">
            <div className="mb-8">
              <h2 className="font-headline-md text-headline-md text-primary mb-2">Intelligent Validation Prior to Export</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Automated logic checks to assist user-entry formatting.</p>
            </div>
            <div className="mb-4 p-3 border border-outline-variant bg-surface-container-low rounded-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-sm">settings_suggest</span>
              <p className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
                <span className="font-bold text-primary">Background Processing:</span> This entire logic engine runs automatically in the background with zero configuration required.
              </p>
            </div>
            <div className="bg-primary text-on-primary font-mono text-sm border border-outline shadow-[4px_4px_0_0_#1b1c1c] overflow-hidden">
              <div className="bg-surface-container-highest border-b border-outline px-4 py-2 flex items-center gap-2 text-on-background">
                <span className="w-3 h-3 rounded-full border border-primary"></span>
                <span className="w-3 h-3 rounded-full border border-primary bg-secondary"></span>
                <span className="w-3 h-3 rounded-full border border-primary"></span>
                <span className="ml-2 font-label-md">validation_engine.sh</span>
              </div>
              <div className="p-6 space-y-6">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 hover:bg-[#111] p-2 -mx-2 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-tertiary-container text-on-tertiary px-2 py-1 text-xs font-bold tracking-wider rounded-sm w-24 text-center">[FILTER]</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Semantic Description Filter</h4>
                    <p className="text-on-primary-container leading-relaxed">Cross-references against generic terms (e.g. goods, merchandise) to map against 19 CFR 141.86 specificity standards.</p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 hover:bg-[#111] p-2 -mx-2 transition-colors border-t border-[#333] pt-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-secondary-container text-on-secondary px-2 py-1 text-xs font-bold tracking-wider rounded-sm w-24 text-center">[REGEX]</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Syntactic HS Code Validation</h4>
                    <p className="text-on-primary-container leading-relaxed">Automated structural verification for 6-10 digit tariff inputs to assist with format integrity.</p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 hover:bg-[#111] p-2 -mx-2 transition-colors border-t border-[#333] pt-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-surface-tint text-on-primary px-2 py-1 text-xs font-bold tracking-wider rounded-sm w-24 text-center">[LOGIC]</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Global Identifier Consistency</h4>
                    <p className="text-on-primary-container leading-relaxed">Executes EU destination logic and regular expression validation for EORI numbers prior to document generation.</p>
                  </div>
                </div>
                {/* Step 4 */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 hover:bg-[#111] p-2 -mx-2 transition-colors border-t border-[#333] pt-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-background text-primary border border-primary px-2 py-1 text-xs font-bold tracking-wider rounded-sm w-24 text-center">[MATCH]</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Transport Waybill (AWB) Verification</h4>
                    <p className="text-on-primary-container leading-relaxed">Structural pattern matching for carrier identifiers: FedEx (12 digits), DHL (10 digits), and UPS (1Z prefix).</p>
                  </div>
                </div>
                {/* Step 5 */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 hover:bg-[#111] p-2 -mx-2 transition-colors border-t border-[#333] pt-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-on-surface-variant text-on-primary px-2 py-1 text-xs font-bold tracking-wider rounded-sm w-24 text-center">[MATH]</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Internal Arithmetic Audit</h4>
                    <p className="text-on-primary-container leading-relaxed">Line-by-line quantitative summation to mitigate calculation friction across unit values, totals, and weights.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Technical Disclaimer / Transparency Links / CTA */}
          <section className="mb-margin-lg border-t border-outline pt-margin-lg">
            <div className="max-w-[1400px] mx-auto px-margin-sm md:px-margin-md">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-margin-md items-center">
                {/* Left: Transparency Links */}
                <div className="space-y-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary mb-4">Engineering Transparency & Output Validation</h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                      Don&apos;t just take our word for it. Review our live test outputs and complete compliance validation architecture.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/samples"
                      className="flex items-center gap-3 p-4 border border-outline bg-surface hover:border-primary transition-colors group"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">description</span>
                      <span className="font-label-md text-label-md text-primary">Download the 9 Sample PDF Outputs (FedEx, UPS, DHL, Proforma, Bundle)</span>
                    </Link>
                    <Link
                      href="/resources/technical-audit"
                      className="flex items-center gap-3 p-4 border border-outline bg-surface hover:border-primary transition-colors group"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">verified_user</span>
                      <span className="font-label-md text-label-md text-primary">Read the Full Technical Audit Report (133 Tests Passing)</span>
                    </Link>
                  </div>
                </div>

                {/* Right: Final CTA */}
                <div className="bg-surface-container p-margin-sm md:p-margin-md border border-outline flex flex-col items-center text-center">
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Ready to automate your export compliance?</h3>
                  <Link
                    href="/pricing"
                    className="bg-primary text-on-primary font-label-md text-label-md px-8 py-4 rounded-sm hover:bg-primary/90 transition-colors w-full md:w-auto"
                  >
                    Start Free - Generate in 60s
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Technical Liability Disclaimer - prominently at bottom */}
      <section className="mt-margin-lg pt-8 border-t border-outline">
        <div className="bg-surface-container p-6 border border-outline border-l-4 border-l-secondary flex items-start gap-4">
          <span className="material-symbols-outlined text-secondary mt-1">info</span>
          <div className="text-xs md:text-sm text-on-surface-variant leading-relaxed space-y-2 font-mono">
            <p className="font-bold text-on-background">Technical Liability Disclaimer</p>
            <p className="">
              ProformaFlow operates solely as a technological assistance tool designed for document structural formatting and data-mapping automation.
            </p>
            <p className="">
              This software does <span className="underline decoration-secondary">not</span> provide legal advice, customs brokerage services, or regulatory consulting. The user retains sole and complete responsibility for the accuracy, legality, and regulatory fulfillment of all data entered into the system.
            </p>
            <p className="">
              We align with structural standards to mitigate formatting friction; however, final customs acceptance and clearance remain entirely at the discretion of the relevant border authorities. ProformaFlow cannot guarantee, ensure, or certify successful customs entry or compliance.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}