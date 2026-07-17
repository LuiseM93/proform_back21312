import { AppSideNav } from "@/components/app-side-nav";
import { getUserContext } from "@/lib/user-context";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter Free",
  professional: "Professional",
  business: "Business",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext();
  const planLabel = PLAN_LABELS[ctx?.subscription?.plan || "starter"];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSideNav planLabel={planLabel} />
      <main className="flex-1 w-full md:ml-64 pb-20 md:pb-0 pt-16 md:pt-0">{children}</main>
    </div>
  );
}
