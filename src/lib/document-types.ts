// Shared types for the document generator. These types describe in-memory
// document state only — ProformaFlow never persists generated documents,
// customer data, product line items, or banking details to the database.
// Everything here lives client-side / in a single server request and is
// discarded immediately after the PDF is produced.

export type DocumentType = "proforma" | "commercial" | "packing" | "bundle";

export type Incoterm =
  | "EXW" | "FCA" | "FOB" | "CIF" | "CFR" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP";

export type TransportMode = "ocean" | "air" | "land";

export type PackageType = "CTN" | "PLT" | "DRM" | "BAG" | "CRT" | "BND" | "PCS" | "OTH";

export type ExportReason = "sale" | "gift" | "sample" | "return" | "repair" | "other";

export interface PartyInfo {
  companyName: string;
  address: string;
  country: string;
  taxId?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface ShipmentInfo {
  incoterm: Incoterm;
  portOfLoading?: string;
  portOfDischarge?: string;
  countryOfOrigin: string;
  countryOfDestination: string;
  carrier?: "fedex" | "ups" | "dhl" | "aramex" | "other";
  transportMode?: TransportMode;
  trackingNumber?: string;
  notifyParty?: PartyInfo;
  containerNumber?: string;
  sealNumber?: string;
  exportReason?: ExportReason;
  placeOfDelivery?: string; // For DAP/DPU/DDP (full address instead of port)
}

export interface LineItem {
  id: string;
  description: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  weightKg?: number;
  currency: string; // Must match document-level currency
  countryOfOrigin?: string;
  weightGrossKg?: number;
  marksAndNumbers?: string;
  packageCount?: number;
  packageType?: PackageType;
  packageDimensions?: string; // e.g. "40x30x20 cm"
}

export interface Totals {
  subtotal: number;
  discount: number;
  freight: number;
  insurance: number;
  otherCharges: number;
  total: number;
}

export interface BankingInfo {
  beneficiary?: string;
  bankName?: string;
  swiftBic?: string;
  ibanAccount?: string;
  paymentInstructions?: string;
}

export interface DocumentDraft {
  documentType: DocumentType;
  documentNumber: string;
  date: string;
  exporter: PartyInfo;
  importer: PartyInfo;
  shipment: ShipmentInfo;
  items: LineItem[];
  totals: Totals;
  currency: string; // Single document-level currency
  pageSize?: "A4" | "LETTER";
  banking?: BankingInfo;
  legalDeclaration?: string;
  logoDataUrl?: string;
  signature?: string;
  paymentTerms?: string; // e.g. "Net 30", "Letter of Credit"
}

export const INCOTERMS: { value: Incoterm; label: string }[] = [
  { value: "EXW", label: "EXW — Ex Works" },
  { value: "FCA", label: "FCA — Free Carrier" },
  { value: "FOB", label: "FOB — Free On Board" },
  { value: "CIF", label: "CIF — Cost, Insurance & Freight" },
  { value: "CFR", label: "CFR — Cost and Freight" },
  { value: "CPT", label: "CPT — Carriage Paid To" },
  { value: "CIP", label: "CIP — Carriage and Insurance Paid To" },
  { value: "DAP", label: "DAP — Delivered At Place" },
  { value: "DPU", label: "DPU — Delivered at Place Unloaded" },
  { value: "DDP", label: "DDP — Delivered Duty Paid" },
];

// Pro currencies (5)
export const PRO_CURRENCIES = ["USD", "EUR", "MXN", "GBP", "CNY"];

// Business currencies (20+)
export const BUSINESS_CURRENCIES = [
  "USD", "EUR", "MXN", "GBP", "CNY",
  "JPY", "KRW", "BRL", "ARS", "CLP",
  "COP", "PEN", "CAD", "AUD", "CHF",
  "SEK", "NOK", "DKK", "INR", "RUB",
  "ZAR", "TRY", "AED", "SAR",
];

// Float precision helper — rounds to 2 decimal places
// Prevents JavaScript floating-point errors in customs documents
function toMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateTotals(items: LineItem[], discount = 0, freight = 0, insurance = 0, other = 0): Totals {
  const subtotal = items.reduce((sum, i) => sum + toMoney(i.quantity * i.unitPrice), 0);
  const total = toMoney(subtotal - discount + freight + insurance + other);
  return {
    subtotal: toMoney(subtotal),
    discount: toMoney(discount),
    freight: toMoney(freight),
    insurance: toMoney(insurance),
    otherCharges: toMoney(other),
    total,
  };
}

// Incoterm validation rules
export interface IncotermRule {
  incoterm: Incoterm;
  requiresFreight: boolean;
  requiresInsurance: boolean;
  requiresPorts: boolean; // portOfLoading and portOfDischarge
  requiresPlaceOfDelivery: boolean; // full address for DAP/DPU/DDP
  validTransportModes: TransportMode[];
  description: string;
}

export const INCOTERM_RULES: Record<Incoterm, IncotermRule> = {
  EXW: { incoterm: "EXW", requiresFreight: false, requiresInsurance: false, requiresPorts: false, requiresPlaceOfDelivery: false, validTransportModes: ["ocean", "air", "land"], description: "Buyer pays all transport from factory" },
  FCA: { incoterm: "FCA", requiresFreight: false, requiresInsurance: false, requiresPorts: false, requiresPlaceOfDelivery: false, validTransportModes: ["ocean", "air", "land"], description: "Seller delivers to carrier at named place" },
  FOB: { incoterm: "FOB", requiresFreight: false, requiresInsurance: false, requiresPorts: true, requiresPlaceOfDelivery: false, validTransportModes: ["ocean"], description: "Seller delivers on board vessel — buyer pays freight" },
  CIF: { incoterm: "CIF", requiresFreight: true, requiresInsurance: true, requiresPorts: true, requiresPlaceOfDelivery: false, validTransportModes: ["ocean"], description: "Seller pays cost, insurance & freight to destination port" },
  CFR: { incoterm: "CFR", requiresFreight: true, requiresInsurance: false, requiresPorts: true, requiresPlaceOfDelivery: false, validTransportModes: ["ocean"], description: "Seller pays cost & freight to destination port" },
  CPT: { incoterm: "CPT", requiresFreight: true, requiresInsurance: false, requiresPorts: false, requiresPlaceOfDelivery: false, validTransportModes: ["ocean", "air", "land"], description: "Seller pays carriage to named place of destination" },
  CIP: { incoterm: "CIP", requiresFreight: true, requiresInsurance: true, requiresPorts: false, requiresPlaceOfDelivery: false, validTransportModes: ["ocean", "air", "land"], description: "Seller pays carriage & insurance to named place" },
  DAP: { incoterm: "DAP", requiresFreight: true, requiresInsurance: false, requiresPorts: false, requiresPlaceOfDelivery: true, validTransportModes: ["ocean", "air", "land"], description: "Seller delivers to named place of destination" },
  DPU: { incoterm: "DPU", requiresFreight: true, requiresInsurance: false, requiresPorts: false, requiresPlaceOfDelivery: true, validTransportModes: ["ocean", "air", "land"], description: "Seller delivers and unloads at named place" },
  DDP: { incoterm: "DDP", requiresFreight: true, requiresInsurance: false, requiresPorts: false, requiresPlaceOfDelivery: true, validTransportModes: ["ocean", "air", "land"], description: "Seller pays all costs including duties to delivery address" },
};

export interface IncotermValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export function validateIncotermConsistency(
  incoterm: Incoterm,
  freight: number,
  insurance: number,
  transportMode?: TransportMode
): IncotermValidationError[] {
  const errors: IncotermValidationError[] = [];
  const rule = INCOTERM_RULES[incoterm];

  if (!rule) return errors;

  // Freight validation
  if (rule.requiresFreight && freight <= 0) {
    errors.push({
      field: "freight",
      message: `${incoterm} requires freight to be included. Please add the freight cost.`,
      severity: "error",
    });
  }
  if (!rule.requiresFreight && freight > 0) {
    errors.push({
      field: "freight",
      message: `${incoterm} means the buyer pays freight. Freight should be 0 for this Incoterm.`,
      severity: "error",
    });
  }

  // Insurance validation
  if (rule.requiresInsurance && insurance <= 0) {
    errors.push({
      field: "insurance",
      message: `${incoterm} requires insurance to be included. Please add insurance cost.`,
      severity: "error",
    });
  }
  if (!rule.requiresInsurance && insurance > 0) {
    // Not an error, but could be unusual for some incoterms
    if (incoterm === "EXW" || incoterm === "FOB" || incoterm === "CFR" || incoterm === "CPT") {
      errors.push({
        field: "insurance",
        message: `${incoterm} does not require insurance (buyer's responsibility). Having insurance here is unusual.`,
        severity: "warning",
      });
    }
  }

  // Transport mode validation
  if (transportMode && !rule.validTransportModes.includes(transportMode)) {
    errors.push({
      field: "transportMode",
      message: `${incoterm} is only valid for ${rule.validTransportModes.join("/")} transport, not ${transportMode}.`,
      severity: "error",
    });
  }

  return errors;
}

export function validateCurrencies(items: LineItem[]): string | null {
  const currencies = new Set(items.map((i) => i.currency).filter(Boolean));
  if (currencies.size > 1) {
    return `All items must use the same currency. Found: ${Array.from(currencies).join(", ")}.`;
  }
  return null;
}

// Total weight calculations
export function calculateTotalNetWeight(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + (i.weightKg || 0), 0);
}

export function calculateTotalGrossWeight(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + (i.weightGrossKg || i.weightKg || 0), 0);
}

export function calculateTotalPackages(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + (i.packageCount || 0), 0);
}