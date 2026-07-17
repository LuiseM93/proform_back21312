import { getUserContext, planLimits } from "@/lib/user-context";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const ctx = await getUserContext();
  const plan = ctx?.subscription?.plan || "starter";
  const limits = planLimits(plan);
  const used = ctx?.usage?.documents_generated || 0;

  return (
    <BillingClient
      plan={plan}
      status={ctx?.subscription?.status || "active"}
      currentPeriodEnd={ctx?.subscription?.current_period_end || null}
      billingInterval={ctx?.subscription?.billing_interval || null}
      hasStripeCustomer={!!ctx?.subscription?.stripe_customer_id}
      documentsUsed={used}
      docsPerMonth={limits.docsPerMonth}
    />
  );
}
