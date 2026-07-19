import { GeneratorFormV2 } from "@/components/generator/GeneratorFormV2";
import { getUserContext, planLimits } from "@/lib/user-context";

export default async function GeneratorPage() {
  const ctx = await getUserContext();
  const plan = ctx?.subscription?.plan || "starter";
  const limits = planLimits(plan);
  const used = ctx?.usage?.documents_generated || 0;
  const remaining = limits.docsPerMonth === Infinity ? null : Math.max(limits.docsPerMonth - used, 0);

  return (
    <GeneratorFormV2
      planWatermark={limits.watermark}
      planAllTypes={limits.allTypes}
      planCarrierReady={limits.carrierReady}
      remainingDocs={remaining}
      plan={plan}
    />
  );
}
