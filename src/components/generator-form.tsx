"use client";
import { useState, useCallback, useMemo } from "react";
import { pdf, PDFViewer, DocumentProps } from "@react-pdf/renderer";
import { DocumentPdf } from "@/components/pdf/document-pdf";
import { FedexPdf } from "@/components/pdf/fedex-pdf";
import { UpsPdf } from "@/components/pdf/ups-pdf";
import { DhlPdf } from "@/components/pdf/dhl-pdf";
import { PackingListPdf } from "@/components/pdf/packing-list-pdf";
import {
  INCOTERMS, calculateTotals, validateIncotermConsistency,
  validateCurrencies, calculateTotalNetWeight, calculateTotalGrossWeight,
  calculateTotalPackages, INCOTERM_RULES,
  PRO_CURRENCIES, BUSINESS_CURRENCIES,
} from "@/lib/document-types";
import type {
  DocumentDraft, DocumentType, Incoterm, LineItem,
  TransportMode, ExportReason, PackageType,
} from "@/lib/document-types";
import type { IncotermValidationError } from "@/lib/document-types";

const MAX_ITEMS = 100;

function makeEmptyItem(currency: string): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    hsCode: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    weightKg: 0,
    currency,
    countryOfOrigin: "",
    weightGrossKg: 0,
    marksAndNumbers: "",
    packageCount: 0,
    packageType: "CTN",
    packageDimensions: "",
  };
}

const STEPS = ["Parties", "Shipment", "Items", "Totals", "Review"] as const;

export function GeneratorForm({
  planWatermark,
  planAllTypes,
  planCarrierReady,
  remainingDocs,
  plan,
  defaultCompany,
}: {
  planWatermark: boolean;
  planAllTypes: boolean;
  planCarrierReady: boolean;
  remainingDocs: number | null;
  plan?: string;
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

  // Determine available currencies based on plan
  const isBusiness = plan === "business";
  const availableCurrencies = isBusiness ? BUSINESS_CURRENCIES : PRO_CURRENCIES;
  const defaultCurrency = defaultCompany?.default_currency || "USD";
  const [documentCurrency, setDocumentCurrency] = useState(
    availableCurrencies.includes(defaultCurrency) ? defaultCurrency : "USD"
  );

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
  const [transportMode, setTransportMode] = useState<TransportMode | "">("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [exportReason, setExportReason] = useState<ExportReason | "">("");
  const [placeOfDelivery, setPlaceOfDelivery] = useState("");
  const [notifyParty, setNotifyParty] = useState({
    companyName: "",
    address: "",
    country: "",
    taxId: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const [items, setItems] = useState<LineItem[]>([makeEmptyItem(documentCurrency)]);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [pageSize, setPageSize] = useState<"A4" | "LETTER">("A4");

  const [bankName, setBankName] = useState(defaultCompany?.bank_name || "");
  const [swiftBic, setSwiftBic] = useState(defaultCompany?.swift_bic || "");
  const [iban, setIban] = useState(defaultCompany?.iban || "");
  const [beneficiary, setBeneficiary] = useState(defaultCompany?.company_name || "");
  const [signatureName, setSignatureName] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [docNumber] = useState(() => `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);

  const totals = calculateTotals(items, discount, freight, insurance, otherCharges);

  // Re-validate on changes
  const incotermErrors = validateIncotermConsistency(incoterm, freight, insurance, transportMode as TransportMode | undefined);
  const curError = validateCurrencies(items);

  const buildDraft = useCallback((): DocumentDraft => {
    const isDapDdp = incoterm === "DAP" || incoterm === "DPU" || incoterm === "DDP";
    return {
      documentType: docType,
      documentNumber: docNumber,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      exporter,
      importer,
      shipment: {
        incoterm,
        portOfLoading: isDapDdp ? undefined : (portOfLoading || undefined),
        portOfDischarge: isDapDdp ? undefined : (portOfDischarge || undefined),
        countryOfOrigin,
        countryOfDestination,
        carrier,
        transportMode: transportMode || undefined,
        trackingNumber: trackingNumber || undefined,
        containerNumber: containerNumber || undefined,
        sealNumber: sealNumber || undefined,
        exportReason: (exportReason as ExportReason) || undefined,
        placeOfDelivery: isDapDdp ? (placeOfDelivery || undefined) : undefined,
        notifyParty: notifyParty.companyName ? notifyParty : undefined,
      },
      items,
      totals,
      currency: documentCurrency,
      pageSize,
      banking: { beneficiary, bankName, swiftBic, ibanAccount: iban },
      paymentTerms: paymentTerms || undefined,
      legalDeclaration:
        defaultCompany?.legal_declaration ||
        "We certify that this invoice is true and correct and that the origin of the goods is as stated above.",
      logoDataUrl: defaultCompany?.logo_url || undefined,
      signature: signatureName || undefined,
    };
  }, [docType, docNumber, exporter, importer, incoterm, portOfLoading, portOfDischarge, countryOfOrigin, countryOfDestination, carrier, transportMode, trackingNumber, containerNumber, sealNumber, exportReason, placeOfDelivery, notifyParty, items, totals, documentCurrency, pageSize, beneficiary, bankName, swiftBic, iban, paymentTerms, signatureName, defaultCompany]);

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function addItem() {
    if (items.length >= MAX_ITEMS) {
      setLimitError(`Maximum ${MAX_ITEMS} line items per document.`);
      return;
    }
    setItems((prev) => [...prev, makeEmptyItem(documentCurrency)]);
    setLimitError(null);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  async function handleDownload() {
    setLimitError(null);

    // Validate required fields
    if (!exporter.companyName || !exporter.address || !exporter.country) {
      setLimitError("Exporter company name, address, and country are required.");
      return;
    }
    if (!importer.companyName || !importer.address || !importer.country) {
      setLimitError("Importer company name, address, and country are required.");
      return;
    }

    // Don't allow download if there are incoterm errors
    const hasErrors = incotermErrors.some((e) => e.severity === "error");
    if (hasErrors || curError) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/usage/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType, carrier, currency: documentCurrency }),
      });
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
        PdfComponent = (await import("@/components/pdf/dhl-pdf")).DhlPdf;
      } else if (docType === "packing") {
        PdfComponent = (await import("@/components/pdf/packing-list-pdf")).PackingListPdf;
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

    // Validate required fields
    if (!exporter.companyName || !exporter.address || !exporter.country) {
      setLimitError("Exporter company name, address, and country are required.");
      return;
    }
    if (!importer.companyName || !importer.address || !importer.country) {
      setLimitError("Importer company name, address, and country are required.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/usage/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType, carrier: targetCarrier, currency: documentCurrency }),
      });
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
        PdfComponent = (await import("@/components/pdf/dhl-pdf")).DhlPdf;
      }

      const blob = await pdf(
        <PdfComponent draft={draft} watermark={data.watermark ?? planWatermark} carrier={targetCarrier} />
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

  const docTypeOptions: { value: DocumentType; label: string; requiresPro?: boolean; tooltip?: string }[] = [
    { value: "proforma", label: "Proforma Invoice" },
    { value: "commercial", label: "Commercial Invoice", requiresPro: true },
    { value: "packing", label: "Packing List", requiresPro: true },
    { value: "bundle", label: "Bundle", requiresPro: true, tooltip: "Bundle = Commercial Invoice + Packing List (Professional+)" },
  ];

  const isDapDdp = incoterm === "DAP" || incoterm === "DPU" || incoterm === "DDP";

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
                  title={opt.tooltip || (locked ? "Upgrade to Professional to unlock" : undefined)}
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

          {/* Step 0: Parties */}
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

          {/* Step 1: Shipment */}
          {step === 1 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                02. Shipment Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Incoterm *">
                  <select
                    className="form-input"
                    value={incoterm}
                    onChange={(e) => {
                      const newIncoterm = e.target.value as Incoterm;
                      setIncoterm(newIncoterm);
                      // Auto-clear freight/insurance for EXW, FOB, FCA
                      if (["EXW", "FOB", "FCA"].includes(newIncoterm)) {
                        setFreight(0);
                        setInsurance(0);
                      }
                    }}
                  >
                    {INCOTERMS.map((it) => (
                      <option key={it.value} value={it.value}>{it.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-on-surface-variant mt-1">{INCOTERM_RULES[incoterm]?.description} — E.g. <strong>FOB</strong> (you pay until loaded on vessel), <strong>CIF</strong> (you pay freight + insurance), <strong>EXW</strong> (buyer picks up at your factory)</p>
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

                {isDapDdp ? (
                  <Field label="Place of Delivery *">
                    <input className="form-input" value={placeOfDelivery} onChange={(e) => setPlaceOfDelivery(e.target.value)} placeholder="Full delivery address" />
                  </Field>
                ) : (
                  <>
                    <Field label="Port of Loading">
                      <input className="form-input" value={portOfLoading} onChange={(e) => setPortOfLoading(e.target.value)} />
                    </Field>
                    <Field label="Port of Discharge">
                      <input className="form-input" value={portOfDischarge} onChange={(e) => setPortOfDischarge(e.target.value)} />
                    </Field>
                  </>
                )}

                <Field label="Country of Origin *">
                  <input className="form-input" value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
                </Field>
                <Field label="Country of Destination *">
                  <input className="form-input" value={countryOfDestination} onChange={(e) => setCountryOfDestination(e.target.value)} />
                </Field>

                <Field label="Transport Mode">
                  <select className="form-input" value={transportMode} onChange={(e) => setTransportMode(e.target.value as TransportMode | "")}>
                    <option value="">Select...</option>
                    <option value="ocean">Ocean</option>
                    <option value="air">Air</option>
                    <option value="land">Land</option>
                  </select>
                </Field>

                <Field label="Export Reason">
                  <select className="form-input" value={exportReason} onChange={(e) => setExportReason(e.target.value as ExportReason | "")}>
                    <option value="">Select...</option>
                    <option value="sale">Sale</option>
                    <option value="gift">Gift</option>
                    <option value="sample">Sample</option>
                    <option value="return">Return</option>
                    <option value="repair">Repair</option>
                    <option value="other">Other</option>
                  </select>
                </Field>

                <Field label="Tracking Number">
                  <input className="form-input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Container Number">
                  <input className="form-input" value={containerNumber} onChange={(e) => setContainerNumber(e.target.value)} placeholder="Optional" />
                </Field>
                {containerNumber && (
                  <Field label="Seal Number">
                    <input className="form-input" value={sealNumber} onChange={(e) => setSealNumber(e.target.value)} placeholder="Optional" />
                  </Field>
                )}
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
                {notifyParty.companyName && (!notifyParty.address || !notifyParty.country) && (
                  <p className="text-xs text-secondary mt-2">Complete address and country required for Notify Party.</p>
                )}
              </div>
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {/* Step 2: Items */}
          {step === 2 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                03. Line Items
              </div>
              {/* Document-level currency selector */}
              <div className="mt-4 mb-4 flex items-center gap-4">
                <Field label="Document Currency">
                  <select
                    className="form-input"
                    value={documentCurrency}
                    onChange={(e) => {
                      const newCur = e.target.value;
                      setDocumentCurrency(newCur);
                      setItems((prev) => prev.map((i) => ({ ...i, currency: newCur })));
                    }}
                  >
                    {availableCurrencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                {isBusiness && (
                  <span className="text-xs text-primary font-label-md mt-6">Business (20+ currencies)</span>
                )}
                {!isBusiness && (
                  <span className="text-xs text-on-surface-variant mt-6">Upgrade to Business for 20+ currencies</span>
                )}
              </div>
              {curError && (
                <div className="mb-4 p-3 bg-error-container border border-error rounded text-sm text-on-error-container">
                  {curError}
                </div>
              )}
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="border border-outline-variant p-4 rounded relative">
                    <div className="flex justify-between mb-2">
                      <span className="font-label-md text-sm text-on-surface-variant">Item {idx + 1}</span>
                      <button onClick={() => removeItem(item.id)} className="text-secondary text-sm font-label-md">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <input
                        className="form-input col-span-2"
                        placeholder="Description *"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder="HS Code (e.g. 2208.90 spirits, 6104.42 dresses, 8483.40 gears)"
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
                        placeholder="Qty *"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        placeholder="Unit *"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        placeholder="Unit Price *"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        placeholder="Net weight (kg) — product only, e.g. 12.5"
                        value={item.weightKg}
                        onChange={(e) => updateItem(item.id, { weightKg: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        placeholder="Gross weight (kg) — product + box + pallet, e.g. 14.2"
                        value={item.weightGrossKg}
                        onChange={(e) => updateItem(item.id, { weightGrossKg: Number(e.target.value) })}
                      />
                      <input
                        className="form-input"
                        placeholder="Marks & Numbers — what's written on the box, e.g. LOT-2024-001 BOXES 1-50"
                        value={item.marksAndNumbers || ""}
                        onChange={(e) => updateItem(item.id, { marksAndNumbers: e.target.value })}
                      />
                      <input
                        className="form-input"
                        type="number"
                        placeholder="Packages"
                        value={item.packageCount || ""}
                        onChange={(e) => updateItem(item.id, { packageCount: Number(e.target.value) })}
                      />
                      <select
                        className="form-input"
                        value={item.packageType || "CTN"}
                        onChange={(e) => updateItem(item.id, { packageType: e.target.value as PackageType })}
                      >
                        <option value="CTN">Carton</option>
                        <option value="PLT">Pallet</option>
                        <option value="DRM">Drum</option>
                        <option value="BAG">Bag</option>
                        <option value="CRT">Crate</option>
                        <option value="BND">Bundle</option>
                        <option value="PCS">Pieces</option>
                        <option value="OTH">Other</option>
                      </select>
                      <input
                        className="form-input"
                        placeholder="Dimensions (LxWxH cm)"
                        value={item.packageDimensions || ""}
                        onChange={(e) => updateItem(item.id, { packageDimensions: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="w-full border border-dashed border-outline rounded py-3 font-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                >
                  + Add Line Item ({items.length}/{MAX_ITEMS})
                </button>
                {items.length >= MAX_ITEMS && (
                  <p className="text-xs text-secondary">Maximum {MAX_ITEMS} items reached.</p>
                )}
              </div>
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {/* Step 3: Totals */}
          {step === 3 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                04. Totals &amp; Banking
              </div>
              {incotermErrors.length > 0 && (
                <div className="mt-4 space-y-1">
                  {incotermErrors.map((err, i) => (
                    <p key={i} className={`text-sm font-label-md ${err.severity === "error" ? "text-error" : "text-secondary"}`}>
                      {err.severity === "error" ? "⚠ " : "⚡ "}{err.message}
                    </p>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Field label="Discount">
                  <input className="form-input" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </Field>
                <Field label="Freight">
                  <input className="form-input" type="number" step="0.01" value={freight} onChange={(e) => setFreight(Number(e.target.value))} />
                </Field>
                <Field label="Insurance">
                  <input className="form-input" type="number" step="0.01" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} />
                </Field>
                <Field label="Other Charges">
                  <input className="form-input" type="number" step="0.01" value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} />
                </Field>
              </div>
              <div className="mt-4 p-3 bg-surface-container-high rounded text-sm">
                <p className="font-bold">Subtotal: {totals.subtotal.toFixed(2)} {documentCurrency}</p>
                <p className="font-bold">Total: {totals.total.toFixed(2)} {documentCurrency}</p>
                {calculateTotalNetWeight(items) > 0 && (
                  <p>Net Weight: {calculateTotalNetWeight(items).toFixed(2)} kg</p>
                )}
                {calculateTotalGrossWeight(items) > 0 && (
                  <p>Gross Weight: {calculateTotalGrossWeight(items).toFixed(2)} kg</p>
                )}
                {calculateTotalPackages(items) > 0 && (
                  <p>Packages: {calculateTotalPackages(items)}</p>
                )}
              </div>
              {docType !== "packing" && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Beneficiary"><input className="form-input" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} /></Field>
                  <Field label="Bank Name"><input className="form-input" value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
                  <Field label="SWIFT/BIC"><input className="form-input" value={swiftBic} onChange={(e) => setSwiftBic(e.target.value)} /></Field>
                  <Field label="IBAN/Account"><input className="form-input" value={iban} onChange={(e) => setIban(e.target.value)} /></Field>
                  <Field label="Payment Terms">
                    <input className="form-input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30, LC at sight" />
                  </Field>
                </div>
              )}
              <StepNav step={step} setStep={setStep} max={STEPS.length - 1} />
            </section>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <section className="bg-background border border-primary p-6 relative">
              <div className="absolute -top-3 left-4 bg-background px-2 font-headline-sm font-bold">
                05. Review &amp; Sign
              </div>
              <div className="mt-4 space-y-4">
                <Field label="Signature (type name)">
                  <input className="form-input" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Full name for signature" />
                </Field>
                <Field label="Page Size">
                  <select className="form-input" value={pageSize} onChange={(e) => setPageSize(e.target.value as "A4" | "LETTER")}>
                    <option value="A4">A4 (International — Europe, Asia, Americas)</option>
                    <option value="LETTER">US Letter (North America)</option>
                  </select>
                </Field>

                {incotermErrors.length > 0 && (
                  <div className="space-y-1">
                    {incotermErrors.map((err, i) => (
                      <p key={i} className={`text-sm font-label-md ${err.severity === "error" ? "text-error" : "text-secondary"}`}>
                        {err.severity === "error" ? "⚠ " : "⚡ "}{err.message}
                      </p>
                    ))}
                  </div>
                )}

                <div className="space-y-2 font-body-md text-on-surface-variant">
                  <p>Document type: <strong className="text-primary">{docType}</strong></p>
                  <p>Currency: <strong className="text-primary">{documentCurrency}</strong></p>
                  <p>Exporter: <strong className="text-primary">{exporter.companyName || "—"}</strong></p>
                  <p>Importer: <strong className="text-primary">{importer.companyName || "—"}</strong></p>
                  <p>Items: <strong className="text-primary">{items.length}</strong></p>
                  <p>Total: <strong className="text-primary">{totals.total.toFixed(2)} {documentCurrency}</strong></p>
                  {calculateTotalGrossWeight(items) > 0 && (
                    <p>Gross Weight: <strong className="text-primary">{calculateTotalGrossWeight(items).toFixed(2)} kg</strong></p>
                  )}
                  {calculateTotalPackages(items) > 0 && (
                    <p>Packages: <strong className="text-primary">{calculateTotalPackages(items)}</strong></p>
                  )}
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
                    disabled={isGenerating || incotermErrors.some(e => e.severity === "error") || !!curError}
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

      {/* Live Preview — renders the REAL PDF component based on docType + carrier */}
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
          <LivePreview
            docType={docType}
            carrier={carrier}
            draft={buildDraft()}
            watermark={planWatermark}
          />
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
          <input className="form-input" value={value.companyName} onChange={(e) => onChange({ ...value, companyName: e.target.value })} required />
        </Field>
        <Field label="Address *">
          <textarea className="form-input h-20" value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Country *">
            <input className="form-input" value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} required />
          </Field>
          <Field label="Tax ID / VAT *">
            <input className="form-input" value={value.taxId} onChange={(e) => onChange({ ...value, taxId: e.target.value })} placeholder="Mexico: RFC (XAXX010101000) | USA: EIN (12-3456789) | EU: VAT (DE123456789)" required />
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

/**
 * Live Preview: renders the SAME react-pdf component used for the real export,
 * chosen by docType + carrier. For bundle it stacks Commercial Invoice + Packing List.
 *
 * The draft object is rebuilt on every parent render, so we memoize `content`
 * by its primitive inputs to avoid regenerating the PDF on unrelated renders.
 * PDFViewer background is forced white so the react-pdf reload flash is white
 * (imperceptible) instead of black.
 */
function LivePreview({
  docType,
  carrier,
  draft,
  watermark,
}: {
  docType: DocumentType;
  carrier: "fedex" | "ups" | "dhl" | "aramex" | "other";
  draft: DocumentDraft;
  watermark: boolean;
}) {
  const viewerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "70vh",
    backgroundColor: "#fff",
  } as const;

  // Memoize so the PDF only regenerates when a real input changes.
  const content = useMemo<React.ReactElement<DocumentProps>>(() => {
    if (docType === "proforma") {
      return <DocumentPdf draft={draft} watermark={watermark} carrier={carrier} />;
    }
    if (docType === "commercial" && carrier === "fedex") {
      return <FedexPdf draft={draft} watermark={watermark} carrier={carrier} />;
    }
    if (docType === "commercial" && carrier === "ups") {
      return <UpsPdf draft={draft} watermark={watermark} carrier={carrier} />;
    }
    if (docType === "commercial" && carrier === "dhl") {
      return <DhlPdf draft={draft} watermark={watermark} carrier={carrier} />;
    }
    if (docType === "commercial") {
      // commercial + other/aramex -> generic commercial invoice
      return <DocumentPdf draft={draft} watermark={watermark} carrier={carrier} />;
    }
    if (docType === "packing") {
      return <PackingListPdf draft={draft} watermark={watermark} carrier={carrier} />;
    }
    // fallback
    return <DocumentPdf draft={draft} watermark={watermark} carrier={carrier} />;
  }, [docType, carrier, draft, watermark]);

  if (docType === "bundle") {
    // Bundle = Commercial Invoice + Packing List.
    // Render both real PDFs stacked (each is its own Document/Page, exactly
    // like the real export). Two viewers keeps each PDF intact.
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <PDFViewer showToolbar={false} style={viewerStyle}>
          <DocumentPdf draft={draft} watermark={watermark} carrier={carrier} />
        </PDFViewer>
        <PDFViewer showToolbar={false} style={viewerStyle}>
          <PackingListPdf draft={draft} watermark={watermark} carrier={carrier} />
        </PDFViewer>
      </div>
    );
  }

  return (
    <PDFViewer showToolbar={false} style={viewerStyle}>
      {content}
    </PDFViewer>
  );
}