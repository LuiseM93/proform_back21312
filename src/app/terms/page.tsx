import { PublicNav, PublicFooter } from "@/components/public-nav";

export const metadata = {
  title: "Terms of Service",
  description: "ProformaFlow terms of service.",
};

export default function TermsPage() {
  return (
    <>
      <PublicNav />
      <main className="flex-grow max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-8">
          Terms of Service
        </h1>
        <div className="space-y-6 font-body-md text-on-surface-variant">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Service Description</h2>
            <p>
              ProformaFlow is a document formatting tool that helps you generate proforma
              invoices, commercial invoices, and packing lists for international trade. We format
              the data you provide into a professional PDF layout. We do not provide legal,
              customs, or tax advice, and we are not a party to any transaction you document
              using our service.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">No Legal or Customs Guarantee</h2>
            <p>
              Documents generated with ProformaFlow are provided as-is. You are responsible for
              verifying that the content, Incoterms, HS Codes, and declarations comply with the
              regulations of the origin and destination countries and any carrier requirements.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Subscriptions &amp; Billing</h2>
            <p>
              Paid plans are billed monthly or annually via Stripe. You can cancel or change your
              plan at any time from the Billing page. Cancellations take effect at the end of the
              current billing period.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Fair Use — Document Limits</h2>
            <p>
              The Starter plan is limited to 3 documents per month with a watermark. Professional
              and Business plans include unlimited document generation subject to reasonable use.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Data Handling</h2>
            <p>
              See our <a href="/privacy" className="text-primary underline">Privacy Policy</a> for
              full details on what account data we store and what document data we never store.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Contact</h2>
            <p>Questions about these terms? Contact us at <a href="mailto:soporte@elantimetodo.com" className="text-primary underline">soporte@elantimetodo.com</a>.</p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
