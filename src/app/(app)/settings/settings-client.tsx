"use client";

import { useState } from "react";
import { updateCompanySettings, updateNotificationPreferences, deleteAccount } from "./actions";
import { useRouter } from "next/navigation";

const TABS = ["General", "Document Defaults", "Notifications", "Danger Zone"] as const;

interface Company {
  company_name?: string | null;
  address?: string | null;
  country?: string | null;
  tax_id?: string | null;
  default_currency?: string | null;
  default_incoterm?: string | null;
  date_format?: string | null;
  language?: string | null;
  bank_name?: string | null;
  swift_bic?: string | null;
  iban?: string | null;
  legal_declaration?: string | null;
}

interface NotifPrefs {
  document_downloaded?: boolean;
  document_sent?: boolean;
  weekly_summary?: boolean;
  marketing_updates?: boolean;
}

export function SettingsClient({
  company,
  notifPrefs,
  plan,
}: {
  company: Company | null;
  notifPrefs: NotifPrefs | null;
  plan: string;
}) {
  const [tab, setTab] = useState<typeof TABS[number]>("General");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleCompanySave(formData: FormData) {
    setSaving(true);
    await updateCompanySettings(formData);
    setSaving(false);
  }

  async function handleNotifSave(formData: FormData) {
    setSaving(true);
    await updateNotificationPreferences(formData);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("This will permanently delete your account and all data. Continue?")) return;
    const res = await deleteAccount();
    if (res.success) router.push("/");
  }

  return (
    <div className="p-4 md:p-margin-lg max-w-[1200px] mx-auto w-full">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">
            Settings
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2">
            Manage your account preferences and application configuration.
          </p>
        </div>
      </header>

      <div className="flex overflow-x-auto border-b border-outline-variant mb-8 gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 font-label-md whitespace-nowrap ${
              tab === t
                ? t === "Danger Zone"
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-primary border-b-2 border-primary"
                : t === "Danger Zone"
                ? "text-secondary/70"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "General" && (
        <form action={handleCompanySave} className="border border-outline p-6 rounded bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="hidden" name="company_name" value={company?.company_name || ""} />
          <input type="hidden" name="address" value={company?.address || ""} />
          <input type="hidden" name="tax_id" value={company?.tax_id || ""} />
          <input type="hidden" name="bank_name" value={company?.bank_name || ""} />
          <input type="hidden" name="swift_bic" value={company?.swift_bic || ""} />
          <input type="hidden" name="iban" value={company?.iban || ""} />
          <input type="hidden" name="legal_declaration" value={company?.legal_declaration || ""} />
          <div>
            <label className="form-label block mb-1 font-label-md">Language</label>
            <select name="language" defaultValue={company?.language || "en"} className="form-input">
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <div>
            <label className="form-label block mb-1 font-label-md">Default Currency</label>
            <select name="default_currency" defaultValue={company?.default_currency || "USD"} className="form-input">
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="MXN">MXN ($) — Mexican Peso</option>
            </select>
          </div>
          <div>
            <label className="form-label block mb-1 font-label-md">Default Incoterm</label>
            <select name="default_incoterm" defaultValue={company?.default_incoterm || "FOB"} className="form-input">
              <option value="FOB">FOB — Free On Board</option>
              <option value="EXW">EXW — Ex Works</option>
              <option value="CIF">CIF — Cost, Insurance & Freight</option>
              <option value="DDP">DDP — Delivered Duty Paid</option>
            </select>
          </div>
          <div>
            <label className="form-label block mb-1 font-label-md">Country of Origin</label>
            <input name="country" defaultValue={company?.country || ""} className="form-input" />
          </div>
          <div>
            <label className="form-label block mb-1 font-label-md">Date Format</label>
            <select name="date_format" defaultValue={company?.date_format || "MM/DD/YYYY"} className="form-input">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="bg-primary text-on-primary font-label-md py-2 px-6 rounded">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {tab === "Document Defaults" && (
        <form action={handleCompanySave} className="space-y-8">
          <input type="hidden" name="language" value={company?.language || "en"} />
          <input type="hidden" name="default_currency" value={company?.default_currency || "USD"} />
          <input type="hidden" name="default_incoterm" value={company?.default_incoterm || "FOB"} />
          <input type="hidden" name="date_format" value={company?.date_format || "MM/DD/YYYY"} />
          <section className="border border-outline p-6 rounded bg-surface-container-lowest">
            <h3 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">
              Entity Information
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="form-label block mb-1 font-label-md">Company Name</label>
                <input name="company_name" defaultValue={company?.company_name || ""} className="form-input" />
              </div>
              <div>
                <label className="form-label block mb-1 font-label-md">Registered Address</label>
                <textarea name="address" defaultValue={company?.address || ""} className="form-input h-24" />
              </div>
              <div>
                <label className="form-label block mb-1 font-label-md">Tax ID / EIN</label>
                <input name="tax_id" defaultValue={company?.tax_id || ""} className="form-input" />
              </div>
              <input type="hidden" name="country" value={company?.country || ""} />
            </div>
          </section>
          <section className="border border-outline p-6 rounded bg-surface-container-lowest">
            <h3 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">
              Banking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="form-label block mb-1 font-label-md">Bank Name</label>
                <input name="bank_name" defaultValue={company?.bank_name || ""} className="form-input" />
              </div>
              <div>
                <label className="form-label block mb-1 font-label-md">SWIFT / BIC</label>
                <input name="swift_bic" defaultValue={company?.swift_bic || ""} className="form-input" />
              </div>
              <div>
                <label className="form-label block mb-1 font-label-md">IBAN / Account Number</label>
                <input name="iban" defaultValue={company?.iban || ""} className="form-input" />
              </div>
            </div>
          </section>
          <section className="border border-outline p-6 rounded bg-surface-container-lowest">
            <h3 className="font-headline-sm text-primary mb-6 border-b border-outline-variant pb-2">Legal</h3>
            <textarea
              name="legal_declaration"
              defaultValue={
                company?.legal_declaration ||
                "These commodities, technology, or software were exported in accordance with applicable export regulations. Diversion contrary to law is prohibited."
              }
              className="form-input h-32 text-sm"
            />
          </section>
          <button type="submit" disabled={saving} className="bg-primary text-on-primary font-label-md py-2 px-6 rounded">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
      {/* ... */}
            {tab === "Notifications" && (
              <form action={handleNotifSave} className="border border-outline p-6 rounded bg-surface-container-lowest space-y-6">
                <ToggleRow name="document_downloaded" label="Document Downloaded" description="Get notified when a document is downloaded." defaultChecked={notifPrefs?.document_downloaded ?? false} />
                <ToggleRow name="document_sent" label="Document Sent" description="Receive confirmation when a document is generated." defaultChecked={notifPrefs?.document_sent ?? false} />
                <ToggleRow name="weekly_summary" label="Weekly Summary" description="A summary of your document activity." defaultChecked={notifPrefs?.weekly_summary ?? false} />
                <ToggleRow name="marketing_updates" label="Marketing & Updates" description="News about product updates and features." defaultChecked={notifPrefs?.marketing_updates ?? false} />
          <button type="submit" disabled={saving} className="bg-primary text-on-primary font-label-md py-2 px-6 rounded">
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      )}

      {tab === "Danger Zone" && (
        <section className="border-2 border-secondary p-6 rounded bg-[#fffafa]">
          <h3 className="font-headline-sm text-secondary mb-2">Delete Account</h3>
          <p className="font-body-md text-on-surface-variant mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-secondary/30 bg-white rounded">
            <div>
              <h4 className="font-label-md text-on-surface">Permanently delete your account</h4>
              <p className="text-sm text-on-surface-variant font-body-md">
                This will immediately delete your profile, company defaults, and subscription record.
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="bg-secondary text-on-primary font-label-md py-2 px-6 rounded hover:opacity-90 transition-colors whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-surface-variant pb-4">
      <div>
        <h4 className="font-label-md text-on-surface">{label}</h4>
        <p className="font-body-md text-sm text-on-surface-variant">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-11 h-6 bg-surface-variant peer-checked:bg-primary rounded-full transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full border border-outline" />
      </label>
    </div>
  );
}