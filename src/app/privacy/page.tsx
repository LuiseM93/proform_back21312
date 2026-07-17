import { PublicNav, PublicFooter } from "@/components/public-nav";

export const metadata = {
  title: "Privacy Policy",
  description: "ProformaFlow privacy policy — we never store your generated documents.",
};

export default function PrivacyPage() {
  return (
    <>
      <PublicNav />
      <main className="flex-grow max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-8">
          Privacy Policy
        </h1>
        <div className="space-y-6 font-body-md text-on-surface-variant">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Our Core Privacy Principle</h2>
            <p>
              ProformaFlow is built on a simple rule: <strong>we do not store your generated
              documents.</strong> Proforma invoices, commercial invoices, packing lists, product
              line items, banking details, and customer/importer information are processed
              entirely in your browser and on our servers only for the duration of the request
              needed to render your PDF. None of it is written to our database. Once your PDF
              downloads, the data is gone.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">What We Do Store</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Your account profile (name, email, phone)</li>
              <li>Your company defaults (name, address, tax ID, logo, default currency/Incoterm)</li>
              <li>Your notification preferences</li>
              <li>Your subscription and billing status (via Stripe)</li>
              <li>Anonymous monthly document counters (a number, not the documents)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">What We Never Store</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Proforma invoices, commercial invoices, or packing lists</li>
              <li>Product descriptions, HS Codes, quantities, or prices</li>
              <li>Banking details entered into a document</li>
              <li>Customer / importer contact information</li>
              <li>Document history of any kind</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Third-Party Processors</h2>
            <p>
              We use Supabase for authentication and account data storage, Stripe for payment
              processing, and Resend for transactional email. Each provider processes only the
              minimum data required to provide their service and is bound by their own privacy
              and security commitments.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Your Rights</h2>
            <p>
              You can delete your account at any time from Settings → Danger Zone. This
              immediately removes your profile, company defaults, and subscription record from
              our database.
            </p>
          </section>

          <section>
            <h2 className="font-headline-sm text-primary mt-8 mb-3">Contact</h2>
            <p>Questions about this policy? Contact us at privacy@proformaflow.app.</p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
