"use client";
import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { DocumentPdf } from "@/components/pdf/document-pdf";
import { INCOTERMS, calculateTotals } from "@/lib/document-types";
import type { DocumentDraft, DocumentType, Incoterm, LineItem } from "@/lib/document-types";

function makeEmptyItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    hsCode: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    weightKg: 0,
    currency: "USD",
    countryOfOrigin: "",
    weightGrossKg: 0,
  };
}

const STEPS = ["Parties", "Shipment", "Items", "Totals", "Review"] as const;

export function GeneratorForm({
  planWatermark,
  planAllTypes,
  planCarrierReady,
  remainingDocs,
  defaultCompany,
}: {
  planWatermark: boolean;
  planAllTypes: boolean;
  planCarrierReady: boolean;
  remainingDocs: number | null;
  defaultCompany?: {
    company_name?: string;
    address?: string;
    country?: string;
    tax_id?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    bank_name?: string;
    swift_bic?: string;
    iban?: string;
    default_currency?: string;
    default_incoterm?: string;
    legal_declaration?: string;
    logo_url?: string;
  };
}) {
  const [step, setStep] = useState(0);
  const [docType, setDocType] = useState<DocumentType>("proforma");
  const [carrier, setCarrier] = useState<"fedex" | "ups" | "dhl" | "aramex" | "other">("other");

  const [exporter, setExporter] = useState({
    companyName: defaultCompany?.company_name || "",
    address: defaultCompany?.address || "",
    country: defaultCompany?.country || "",
    taxId: defaultCompany?.tax_id || "",
    contactName: defaultCompany?.contact_name || "",
    contactPhone: defaultCompany?.contact_phone || "",
    contactEmail: defaultCompany?.contact_email || "",
  });
  const [importer, setImporter] = useState({
    companyName: "",
    address: "",
    country: "",
    taxId: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [incoterm, setIncoterm] = useState<Incoterm>(
    (defaultCompany?.default_incoterm as Incoterm) || "FOB"
  );
  const [portOfLoading, setPortOfLoading] = useState("");
  const [portOfDischarge, setPortOfDischarge] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState(defaultCompany?.country || "");
  const [countryOfDestination, setCountryOfDestination] = useState("");
  const [transportMode, setTransportMode] = useState<"ocean" | "air" | "land" | "">("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notifyParty, setNotifyParty] = useState({
    companyName: "",
    address: "",
    country: "",
    taxId: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const [items, setItems] = useState<LineItem[]>([makeEmptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);

  const [bankName, setBankName] = useState(defaultCompany?.bank_name || "");
  const [swiftBic, setSwiftBic] = useState(defaultCompany?.swift_bic || "");
  const [iban, setIban] = useState(defaultCompany?.iban || "");
  const [beneficiary, setBeneficiary] = useState(defaultCompany?.company_name || "");
  const [signatureName, setSignatureName] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [docNumber] = useState(() => `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);

  const totals = calculateTotals(items, discount, freight, insurance, otherCharges);

  const buildDraft = useCallback((): DocumentDraft => ({
    documentType: docType,
    documentNumber: docNumber,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    exporter,
    importer,
    shipment: {
      incoterm,
      portOfLoading,
      portOfDischarge,
      countryOfOrigin,
      countryOfDestination,
      carrier,
      transportMode: transportMode || undefined,
      trackingNumber: trackingNumber || undefined,
      notifyParty: notifyParty.companyName ? notifyParty : undefined,
    },
    items,
    totals,
    banking: { beneficiary, bankName, swiftBic, ibanAccount: iban },
    legalDeclaration:
      defaultCompany?.legal_declaration ||
      "We certify that this invoice is true and correct and that the origin of the goods is as stated above.",
    logoDataUrl: defaultCompany?.logo_url || undefined,
    signature: signatureName || undefined,
  }), [docType, docNumber, exporter, importer, incoterm, portOfLoading, portOfDischarge, countryOfOrigin, countryOfDestination, carrier, transportMode, trackingNumber, notifyParty, items, totals, beneficiary, bankName, swiftBic, iban, signatureName, defaultCompany]);

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function addItem() {
    setItems((prev) => [...prev, makeEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  async function handleDownload() {
    setLimitError(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/usage/increment", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setLimitError(data.error || "Could not generate document.");
        setIsGenerating(false);
        return;
      }

      const draft = buildDraft();
      
      let PdfComponent;
      if (carrier === "fedex") {
        PdfComponent = (await import("@/components/pdf/fedex-pdf")).FedexPdf;
      } else if (carrier === "ups") {
        PdfComponent = (await import("@/components/pdf/ups-pdf")).UpsPdf;
      } else if (carrier === "dhl") {
        PdfComponent = (await import("@/components/pdf/ups-pdf")).UpsPdf;
      } else {
        PdfComponent = DocumentPdf;
      }
      
      const blob = await pdf(
        <PdfComponent draft={draft} watermark={data.watermark ?? planWatermark} carrier={carrier} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType}-${docNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCarrierDownload(targetCarrier: "fedex" | "ups" | "dhl") {
    setLimitError(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/usage/increment", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setLimitError(data.error || "Could not generate document.");
        setIsGenerating(false);
        return;
      }

      const draft = buildDraft();
      
      let PdfComponent;
      if (targetCarrier === "fedex") {
        PdfComponent = (await import("@/components/pdf/fedex-pdf")).FedexPdf;
      } else if (targetCarrier === "ups") {
        PdfComponent = (await import("@/components/pdf/ups-pdf")).UpsPdf;
      } else {
        PdfComponent = (await import("@/components/pdf/ups-pdf")).UpsPdf;
      }
      
      const blob = await pdf(
        <PdfComponent draft={draft} watermark={false} carrier={targetCarrier} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType}-${targetCarrier}-${docNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }

  const docTypeOptions: { value: DocumentType; label: string; requiresPro?: boolean }[] = [
    { value: "proforma", label: "Proforma Invoice" },
    { value: "commercial", label: "Commercial Invoice", requiresPro: true },
    { value: "packing", label: "Packing List", requiresPro: true },
    { value: "bundle", label: "Bundle", requiresPro: true },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
      <div className="flex-1 overflow-y-auto p-4 md:p-margin-md bg-surface border-r-0 lg:border-r-2 border-primary">
        <div className="max-w-3xl mx-auto space-y-8 pb-16">
          <div className="flex gap-2 flex-wrap">
            {docTypeOptions.map((opt) => {
              const locked = opt.requiresPro && !planAllTypes;
              return (
                <button
                  key={opt.value}
                  disabled={locked}
                  onClick={() => setDocType(opt.value)}
                  className={`px-4 py-1.5 border rounded font-label-md text-sm transition-colors ${
                    docType === opt.value
                      ? "bg-primary text-on-primary border-primary"
                      : locked
                      ? "border-outline-variant text-outline cursor-not-allowed opacity-50"
                      : "border-outline bg-background text-on-surface hover:border-primary"
                  }`}
                  title={locked ? "Upgrade to Professional to unlock" : undefined}
                >
                  {opt.label}
                  {locked && " 🔒"}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between font-label-md text-sm">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <button
                  onClick={() => setStep(i)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs shrink-0 ${
                    i <= step ? "bg-primary text-on-primary" : "border-2 border-outline-variant text-outline"
                  }`}
                >
                  {i + 1}
                </button>
                <span className={i <= step ? "text-primary font-bold" : "text-on-surface-variant"}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="flex-1 h-[2px] bg-outline-variant mx-2" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                01. Parties
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <PartyForm title="EXPORTER (Shipper)" value={exporter} onChange={setExporter} />
                <PartyForm title="IMPORTER (Consignee)" value={importer} onChange={setImporter} />
              </div>
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {step === 1 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                02. Shipment Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Incoterm">
                  <select
                    className="form-input"
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value as Incoterm)}
                  >
                    {INCOTERMS.map((it) => (
                      <option key={it.value} value={it.value}>{it.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Carrier">
                  <select
                    className="form-input"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value as typeof carrier)}
                    disabled={!planCarrierReady}
                  >
                    <option value="other">Other / Not specified</option>
                    <option value="fedex">FedEx</option>
                    <option value="ups">UPS</option>
                    <option value="dhl">DHL</option>
                    <option value="aramex">Aramex</option>
                  </select>
                  {!planCarrierReady && (
                    <p className="text-xs text-secondary mt-1">Upgrade to Professional for carrier-ready PDFs.</p>
                  )}
                </Field>
                <Field label="Port of Loading">
                  <input className="form-input" value={portOfLoading} onChange={(e) => setPortOfLoading(e.target.value)} />
                </Field>
                <Field label="Port of Discharge">
                  <input className="form-input" value={portOfDischarge} onChange={(e) => setPortOfDischarge(e.target.value)} />
                </Field>
                <Field label="Country of Origin">
                  <input className="form-input" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
                </Field>
                <Field label="Country of Destination">
                  <input className="form-input" value={countryOfDestination} onChange={(e) => setCountryOfDestination(e.target.value)} />
                </Field>
                <Field label="Transport Mode">
                  <select className="form-input" value={transportMode} onChange={(e) => setTransportMode(e.target.value as "ocean" | "air" | "land")}>
                    <option value="">Select...</option>
                    <option value="ocean">Ocean</option>
                    <option value="air">Air</option>
                    <option value="land">Land</option>
                  </select>
                </Field>
                <Field label="Tracking Number">
                  <input className="form-input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              <div className="mt-4">
                <p className="font-label-md text-on-surface mb-2">Notify Party (Delivery Address - Optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Company Name">
                    <input className="form-input" value={notifyParty.companyName} onChange={(e) => setNotifyParty({...notifyParty, companyName: e.target.value})} />
                  </Field>
                  <Field label="Address">
                    <input className="form-input" value={notifyParty.address} onChange={(e) => setNotifyParty({...notifyParty, address: e.target.value})} />
                  </Field>
                  <Field label="Country">
                    <input className="form-input" value={notifyParty.country} onChange={(e) => setNotifyParty({...notifyParty, country: e.target.value})} />
                  </Field>
                </div>
              </div>
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {step === 2 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                03. Line Items
              </div>
              <div className="mt-4 space-y-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="border border-outline-variant p-4 rounded relative">
                    <div className="flex justify-between mb-2">
                      <span className="font-label-md text-sm text-on-surface-variant">Item {idx + 1}</span>
                      <button onClick={() => removeItem(item.id)} className="text-secondary text-sm font-label-md">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <input
                        className="form-input col-span-2"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder="HS Code"
                        value={item.hsCode}
                        onChange={(e) => updateItem(item.id, { hsCode: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder="Origin Country"
                        value={item.countryOfOrigin || ""}
                        onChange={(e) => updateItem(item.id, { countryOfOrigin: e.target.value })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        placeholder="Unit"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Net Weight (kg)"
                        value={item.weightKg}
                        onChange={(e) => updateItem(item.id, { weightKg: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Gross Weight (kg)"
                        value={item.weightGrossKg}
                        onChange={(e) => updateItem(item.id, { weightGrossKg: Number(e.target.value) })}
                      />
                      <select
                        className="form-input"
                        value={item.currency}
                        onChange={(e) => updateItem(item.id, { currency: e.target.value })}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="MXN">MXN</option>
                        <option value="GBP">GBP</option>
                        <option value="CNY">CNY</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="w-full border border-dashed border-outline rounded py-3 font-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                >
                  + Add Line Item
                </button>
              </div>
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {step === 3 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                04. Totals & Banking
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Field label="Discount">
                  <input className="form-input" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </Field>
                <Field label="Freight">
                  <input className="form-input" type="number" value={freight} onChange={(e) => setFreight(Number(e.target.value))} />
                </Field>
                <Field label="Insurance">
                  <input className="form-input" type="number" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} />
                </Field>
                <Field label="Other Charges">
                  <input className="form-input" type="number" value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} />
                </Field>
              </div>
              {docType !== "packing" && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Beneficiary"><input className="form-input" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} /></Field>
                  <Field label="Bank Name"><input className="form-input" value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
                  <Field label="SWIFT/BIC"><input className="form-input" value={swiftBic} onChange={(e) => setSwiftBic(e.target.value)} /></Field>
                  <Field label="IBAN/Account"><input className="form-input" value={iban} onChange={(e) => setIban(e.target.value)} /></Field>
                </div>
              )}
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {step === 4 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                05. Review & Sign
              </div>
              <div className="mt-4 space-y-4">
                <Field label="Signature (type name)">
                  <input className="form-input" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Full name for signature" />
                </Field>
                <div className="space-y-2 font-body-md text-on-surface-variant">
                  <p>Document type: <strong className="text-primary">{docType}</strong></p>
                  <p>Exporter: <strong className="text-primary">{exporter.companyName || "—"}</strong></p>
                  <p>Importer: <strong className="text-primary">{importer.companyName || "—"}</strong></p>
                  <p>Items: <strong className="text-primary">{items.length}</strong></p>
                  <p>Total: <strong className="text-primary">{totals.total.toFixed(2)} {items[0]?.currency || "USD"}</strong></p>
                </div>
                {remainingDocs !== null && (
                  <p className="mt-4 font-label-md text-sm text-secondary">
                    {remainingDocs} document(s) remaining this month on your plan.
                  </p>
                )}
                {limitError && (
                  <p className="mt-4 font-label-md text-sm text-error">{limitError}</p>
                )}
                <div className="mt-6 flex flex-col gap-3">
                  {planCarrierReady && carrier !== "other" && (
                    <div>
                      <p className="font-label-md text-on-surface mb-2">Carrier-ready download:</p>
                      <div className="flex flex-wrap gap-2">
                        {carrier === "fedex" && (
                          <button
                            onClick={() => handleCarrierDownload("fedex")}
                            disabled={isGenerating}
                            className="bg-tertiary text-on-tertiary px-4 py-2 rounded font-label-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined">download</span>
                            Download for FedEx
                          </button>
                        )}
                        {carrier === "ups" && (
                          <button
                            onClick={() => handleCarrierDownload("ups")}
                            disabled={isGenerating}
                            className="bg-tertiary text-on-tertiary px-4 py-2 rounded font-label-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined">download</span>
                            Download for UPS
                          </button>
                        )}
                        {carrier === "dhl" && (
                          <button
                            onClick={() => handleCarrierDownload("dhl")}
                            disabled={isGenerating}
                            className="bg-tertiary text-on-tertiary px-4 py-2 rounded font-label-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined">download</span>
                            Download for DHL
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full md:w-auto bg-primary text-on-primary px-8 py-4 rounded font-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">download</span>
                    {isGenerating ? "Generating..." : "Export PDF"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  Your document is generated in your browser and never stored on our servers.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[45%] xl:w-1/2 bg-surface-container-high hidden lg:flex flex-col relative">
        <div className="p-4 border-b border-outline-variant bg-surface flex justify-between items-center">
          <span className="font-label-md font-bold text-primary flex items-center">
            <span className="material-symbols-outlined mr-2">visibility</span> Live Preview
          </span>
          <span className="font-body-md text-on-surface-variant text-sm">
            {docType}-{docNumber}.pdf
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-margin-md flex justify-center items-start">
          <div className="bg-background w-full max-w-[210mm] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-primary p-8 font-body-md relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
              <span className="font-headline-lg transform -rotate-45 whitespace-nowrap text-primary scale-[3]">
                {planWatermark ? "PROFORMAFLOW DRAFT" : ""}
              </span>
            </div>
            <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-8">
              <div>
                <h2 className="font-headline-md font-bold uppercase tracking-tighter">
                  {docType === "proforma" && "Proforma Invoice"}
                  {docType === "commercial" && "Commercial Invoice"}
                  {docType === "packing" && "Packing List"}
                  {docType === "bundle" && "Commercial Invoice & Packing List"}
                </h2>
                <p className="text-on-surface-variant">No: {docNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{exporter.companyName || "Your Company"}</p>
                <p className="text-sm text-on-surface-variant">{exporter.address || "[Address pending]"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div className="border border-outline p-4">
                <h4 className="font-bold mb-2 border-b border-outline pb-1">Shipper</h4>
                <p>{exporter.companyName || <span className="italic text-outline">Awaiting input...</span>}</p>
              </div>
              <div className="border border-outline p-4">
                <h4 className="font-bold mb-2 border-b border-outline pb-1">Consignee</h4>
                <p>{importer.companyName || <span className="italic text-outline">Awaiting input...</span>}</p>
              </div>
            </div>
            <div className="border-t border-b border-primary py-2 mb-8 flex justify-between font-label-md font-bold text-xs">
              <span>Incoterm: {incoterm}</span>
              <span>POL: {portOfLoading || "--"}</span>
              <span>POD: {portOfDischarge || "--"}</span>
            </div>
            <table className="w-full text-sm mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-primary text-left">
                  <th className="py-2">Description</th>
                  <th className="py-2">HS Code</th>
                  <th className="py-2">Origin</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.some((i) => i.description) ? (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-outline-variant">
                      <td className="py-2">{item.description || "—"}</td>
                      <td className="py-2">{item.hsCode || "—"}</td>
                      <td className="py-2">{item.countryOfOrigin || "—"}</td>
                      <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                      <td className="py-2 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-outline-variant text-on-surface-variant">
                    <td className="py-4 italic" colSpan={5}>No items added yet...</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-56 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t-2 border-primary pt-2 mt-2">
                  <span>Total</span><span>{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-label-md text-on-surface mb-1">{label}</label>
      {children}
    </div>
  );
}

function PartyForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: {
    companyName: string; address: string; country: string; taxId: string;
    contactName: string; contactPhone: string; contactEmail: string;
  };
  onChange: (v: typeof value) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-label-md font-bold border-b border-outline-variant pb-2">{title}</h3>
      <div className="space-y-3">
        <Field label="Company Name *">
          <input className="form-input" value={value.companyName} onChange={(e) => onChange({ ...value, companyName: e.target.value })} />
        </Field>
        <Field label="Address *">
          <textarea className="form-input h-20" value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Country *">
            <input className="form-input" value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
          </Field>
          <Field label="Tax ID / VAT">
            <input className="form-input" value={value.taxId} onChange={(e) => onChange({ ...value, taxId: e.target.value })} />
          </Field>
        </div>
        <Field label="Contact Name">
          <input className="form-input" value={value.contactName} onChange={(e) => onChange({ ...value, contactName: e.target.value })} />
        </Field>
        <Field label="Contact Phone">
          <input className="form-input" value={value.contactPhone} onChange={(e) => onChange({ ...value, contactPhone: e.target.value })} />
        </Field>
        <Field label="Contact Email">
          <input className="form-input" value={value.contactEmail} onChange={(e) => onChange({ ...value, contactEmail: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function StepNav({ step, setStep, max }: { step: number; setStep: (n: number) => void; max: number }) {
  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={() => setStep(Math.max(0, step - 1))}
        disabled={step === 0}
        className="px-6 py-2 border border-outline rounded font-label-md disabled:opacity-40"
      >
        Back
      </button>
      <button
        onClick={() => setStep(Math.min(max, step + 1))}
        disabled={step === max}
        className="px-6 py-2 bg-primary text-on-primary rounded font-label-md disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}