import Link from "next/link";
import { getUserContext, planLimits } from "@/lib/user-context";

export default async function DashboardPage() {
  const ctx = await getUserContext();
  const plan = ctx?.subscription?.plan || "starter";
  const limits = planLimits(plan);
  const used = ctx?.usage?.documents_generated || 0;
  const remaining = limits.docsPerMonth === Infinity ? null : Math.max(limits.docsPerMonth - used, 0);
  const usagePct = limits.docsPerMonth === Infinity ? 0 : Math.min((used / limits.docsPerMonth) * 100, 100);

  return (
    <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8 lg:p-margin-lg">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
            Welcome back.
          </h1>
          <p className="font-body-lg text-on-surface-variant">
            Ready to create your next export document?
          </p>
        </div>
        <Link
          href="/generator"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary font-label-md rounded hover:opacity-90 transition-opacity border-2 border-primary"
        >
          <span className="material-symbols-outlined">post_add</span>
          Create New Document
        </Link>
      </div>

      {plan === "starter" && (
        <div className="mb-8 bg-surface-container-high border-2 border-primary rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary-container bg-tertiary-fixed p-2 rounded">
              rocket_launch
            </span>
            <p className="font-body-md text-on-surface">
              Upgrade to <span className="font-semibold">Professional</span> for unlimited
              documents + carrier-ready PDFs.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-center px-4 py-2 bg-secondary text-on-secondary font-label-md rounded hover:opacity-90 transition-opacity"
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-outline-variant p-6 rounded flex flex-col h-full hover:border-primary transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">
              Documents This Month
            </h3>
            <span className="material-symbols-outlined text-outline">description</span>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="font-headline-md text-primary">{used}</span>
              {remaining !== null && (
                <span className="font-body-lg text-on-surface-variant">
                  / {limits.docsPerMonth}
                </span>
              )}
              {remaining === null && (
                <span className="font-body-lg text-on-surface-variant">Unlimited</span>
              )}
            </div>
            {remaining !== null && (
              <>
                <p className="font-body-md text-secondary mt-1 text-sm font-medium">
                  {remaining} remaining on Free tier
                </p>
                <div className="w-full bg-surface-container-highest h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${usagePct}%` }} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-surface border border-outline-variant p-6 rounded flex flex-col h-full hover:border-primary transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">
              Current Plan
            </h3>
            <span className="material-symbols-outlined text-outline">workspace_premium</span>
          </div>
          <div className="mt-auto">
            <span className="inline-flex items-center px-3 py-1 rounded bg-surface-container-highest text-on-surface border border-outline-variant font-label-md text-sm font-bold uppercase">
              {plan === "starter" ? "Starter Free" : plan}
            </span>
            <Link
              href="/pricing"
              className="block font-body-md text-primary underline mt-3 hover:text-tertiary-container transition-colors text-sm"
            >
              View all features
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant p-6 rounded flex flex-col h-full hover:border-primary transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">
              Privacy Mode
            </h3>
            <span className="material-symbols-outlined text-outline">lock</span>
          </div>
          <div className="mt-auto">
            <div className="font-headline-sm text-primary text-xl mb-1">Zero Retention</div>
            <p className="font-body-md text-on-surface-variant">
              We never store your generated documents.
            </p>
          </div>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-sm text-primary">How It Works</h2>
        </div>
        <div className="border border-outline-variant rounded bg-surface p-6">
          <ol className="space-y-4 font-body-md text-on-surface-variant list-decimal list-inside">
            <li>Fill out exporter, importer, and shipment details in the Generator.</li>
            <li>Add line items with HS Codes, weights, and pricing.</li>
            <li>Preview your PDF, download it — we discard the data immediately after.</li>
          </ol>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-on-primary font-label-md rounded hover:opacity-90 transition-opacity"
          >
            Go to Generator
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
