// Shared types for the document generator. These types describe in-memory
// document state only — ProformaFlow never persists generated documents,
// customer data, product line items, or banking details to the database.
// Everything here lives client-side / in a single server request and is
// discarded immediately after the PDF is produced.

export type DocumentType = "proforma" | "commercial" | "packing" | "bundle";

export type Incoterm =
  | "EXW" | "FCA" | "FOB" | "CIF" | "CFR" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP";

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
  transportMode?: "ocean" | "air" | "land";
}

export interface LineItem {
  id: string;
  description: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  weightKg?: number;
  currency: string;
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
  banking?: BankingInfo;
  legalDeclaration?: string;
  logoDataUrl?: string;
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

export function calculateTotals(items: LineItem[], discount = 0, freight = 0, insurance = 0, other = 0): Totals {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = subtotal - discount + freight + insurance + other;
  return { subtotal, discount, freight, insurance, otherCharges: other, total };
}
