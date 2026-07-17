"use client";

import { useState } from "react";
import Link from "next/link";
import { createTemplate, deleteTemplate } from "./actions";

interface Template {
  id: string;
  name: string;
  transport_mode: string | null;
  incoterm: string | null;
  origin_country: string | null;
  destination_country: string | null;
  document_types: string[] | null;
  last_used_at: string | null;
}

export function TemplatesClient({ templates }: { templates: Template[] }) {
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    await createTemplate(formData);
    setPending(false);
    setShowForm(false);
  }

  return (
    <div className="p-4 md:p-margin-md lg:p-margin-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 pb-4 border-b-2 border-primary gap-4">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
            Document Templates
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">
            Standardize your global trade documents. Create reusable presets for your most common
            shipping routes and incoterms.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary text-on-primary font-label-md py-3 px-6 rounded flex items-center hover:opacity-90 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined mr-2">add_box</span>
          {showForm ? "Cancel" : "Create Template"}
        </button>
      </div>

      {showForm && (
        <form action={handleCreate} className="border border-primary rounded p-6 mb-8 bg-surface grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" required placeholder="Template name" className="form-input md:col-span-2" />
          <select name="transport_mode" className="form-input">
            <option value="ocean">Ocean</option>
            <option value="air">Air</option>
            <option value="land">Land</option>
          </select>
          <select name="incoterm" className="form-input">
            <option>FOB</option><option>EXW</option><option>CIF</option><option>DDP</option>
          </select>
          <input name="origin_country" placeholder="Origin country" className="form-input" />
          <input name="destination_country" placeholder="Destination country" className="form-input" />
          <input name="origin_port" placeholder="Origin port" className="form-input" />
          <input name="destination_port" placeholder="Destination port" className="form-input" />
          <input name="document_types" placeholder="proforma,commercial" className="form-input md:col-span-2" />
          <button disabled={pending} type="submit" className="md:col-span-2 bg-primary text-on-primary py-3 rounded font-label-md">
            {pending ? "Saving..." : "Save Template"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="bg-surface border border-primary rounded p-5 flex flex-col relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-on-primary px-2 py-1 rounded text-[10px] uppercase font-bold font-label-md">
                  {t.transport_mode || "N/A"}
                </span>
                <span className="border border-primary text-primary px-2 py-1 rounded text-[10px] uppercase font-bold font-label-md">
                  {t.incoterm || "—"}
                </span>
              </div>
              <button
                onClick={() => deleteTemplate(t.id)}
                className="text-outline hover:text-secondary transition-colors"
                aria-label="Delete template"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
            <h3 className="font-headline-sm text-[20px] font-bold text-primary mb-1">{t.name}</h3>
            <div className="flex items-center text-sm mb-4">
              <span className="material-symbols-outlined text-outline mr-2 text-[18px]">route</span>
              <span className="font-label-md font-bold text-primary">
                {t.origin_country || "?"} <span className="text-outline mx-1">→</span> {t.destination_country || "?"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-primary mt-auto">
              <span className="font-body-md text-[12px] text-outline">
                {t.last_used_at ? `Last used: ${new Date(t.last_used_at).toLocaleDateString()}` : "Never used"}
              </span>
              <Link
                href="/generator"
                className="px-4 py-1.5 bg-primary text-on-primary rounded font-label-md text-[14px] hover:opacity-90 transition-colors"
              >
                Use
              </Link>
            </div>
          </div>
        ))}
        <button
          onClick={() => setShowForm(true)}
          className="bg-surface-container-lowest border-2 border-dashed border-outline hover:border-primary rounded p-5 flex flex-col items-center justify-center group transition-all duration-200 min-h-[240px]"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-on-primary transition-all">
            <span className="material-symbols-outlined text-[32px]">add</span>
          </div>
          <h3 className="font-headline-sm text-[20px] font-bold text-primary mb-2">Blank Template</h3>
          <p className="font-body-md text-[14px] text-on-surface-variant text-center max-w-[200px]">
            Start from scratch and configure a custom document workflow.
          </p>
        </button>
      </div>
    </div>
  );
}
