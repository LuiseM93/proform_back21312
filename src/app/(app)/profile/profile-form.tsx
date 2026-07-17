"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProfile } from "./actions";

export function ProfileForm({
  fullName,
  email,
  phone,
  companyName,
  plan,
  memberSince,
}: {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  plan: string;
  memberSince: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await updateProfile(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline rounded p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-8 border-b border-outline-variant">
        <div className="w-24 h-24 rounded-full border border-outline overflow-hidden bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
        </div>
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="text-xs text-on-surface-variant">Avatar upload coming soon.</p>
        </div>
      </div>
      <form action={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-primary" htmlFor="full_name">Full Name</label>
          <input id="full_name" name="full_name" defaultValue={fullName} className="form-input" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-primary flex items-center justify-between" htmlFor="email">
            Email Address
            <span className="flex items-center gap-1 text-[#0055ff] text-xs font-semibold tracking-wider uppercase">
              <span className="material-symbols-outlined text-[14px]">verified</span> Verified
            </span>
          </label>
          <input id="email" disabled readOnly value={email} className="form-input opacity-70 cursor-not-allowed" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-primary" htmlFor="company_name">Company Name</label>
            <input id="company_name" name="company_name" defaultValue={companyName} className="form-input" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-primary" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={phone} className="form-input" />
          </div>
        </div>
        <div className="mt-4 pt-6 border-t border-outline-variant flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-on-surface-variant">
              {memberSince ? `Member since: ${new Date(memberSince).toLocaleDateString()}` : ""}
            </span>
            <span className="bg-secondary text-on-secondary font-label-md px-3 py-1 rounded tracking-wide uppercase text-xs font-bold">
              {plan}
            </span>
          </div>
          <div className="flex justify-end">
            <Link href="/billing" className="text-sm font-label-md text-primary underline">
              Manage Subscription
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-on-primary font-label-md py-4 rounded hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">save</span>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
