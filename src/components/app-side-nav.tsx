"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/generator", label: "Generator", icon: "description" },
  { href: "/templates", label: "Templates", icon: "folder_copy" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/profile", label: "Profile", icon: "account_circle" },
  { href: "/billing", label: "Billing", icon: "receipt_long" },
];

export function AppSideNav({ planLabel = "Starter Free" }: { planLabel?: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <nav className="md:hidden flex justify-between items-center h-16 px-4 bg-surface sticky top-0 z-40 border-b border-outline-variant">
        <span className="font-headline-sm text-primary font-bold">ProformaFlow</span>
        <Link href="/generator" className="material-symbols-outlined text-primary" aria-label="New document">
          add_circle
        </Link>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 border-r-2 border-primary bg-surface flex-col py-6 px-4 z-40">
        <div className="mb-8">
          <h1 className="font-headline-sm text-primary font-bold">ProformaFlow</h1>
          <p className="font-label-md text-on-surface-variant text-xs mt-1">Export Management</p>
        </div>
        <Link
          href="/generator"
          className="bg-primary text-on-primary py-2 px-4 rounded w-full mb-8 font-label-md font-bold hover:bg-surface-container-highest hover:text-primary transition-all border border-primary text-center"
        >
          New Document
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded font-label-md transition-all ${
                  active
                    ? "bg-primary text-on-primary font-bold"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <div className="px-3 py-2 text-xs font-label-md text-on-surface-variant uppercase">
            {planLabel}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded font-label-md text-secondary hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-outline-variant flex justify-around items-center h-16 z-50">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                active ? "text-primary font-bold" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[22px] mb-1">{item.icon}</span>
              <span className="font-label-md text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
