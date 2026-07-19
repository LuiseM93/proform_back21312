// ============================================================================
// SSOT — Single Source of Truth — Modelo Canónico de Envío (ShipmentData)
// ProformaFlow · Comercio Internacional · v1.0 (Julio 2026)
// ============================================================================

// ─── Tipos discriminados por DocumentType ───────────────────────────────────
export type DocumentType =
  | 'PROFORMA'
  | 'CI_FEDEX'
  | 'CI_UPS'
  | 'CI_DHL'
  | 'PACKING_LIST'
  | 'BUNDLE_CIPL';

export type Carrier = 'FEDEX' | 'UPS' | 'DHL' | 'NONE';

export type CountryGroup = 'US_CA' | 'EU' | 'MX' | 'REST_OF_WORLD';

// ─── Parties ────────────────────────────────────────────────────────────────
export type TaxIdType = 'EIN' | 'EORI' | 'VAT' | 'RFC' | 'TIN' | 'NIT' | 'OTHER';

export interface Address {
  street: string;
  street2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
}

export interface Party {
  legalName: string;
  taxId: string;
  taxIdType: TaxIdType;
  address: Address;
  contactName?: string;
  phone?: string;
  email?: string;
  relationship?: 'RELATED' | 'NOT_RELATED'; // UPS specific
  eori?: string; // For EU exports — `^[A-Z]{2}[A-Z0-9]{1,15}$`
}

export interface Parties {
  shipper: Party; // Exportador/Vendedor (siempre requerido)
  consignee: Party; // Consignatario/Receptor (siempre requerido)
  buyer?: Party; // UPS: "Sold To Party"
  producer?: Party; // UPS: "Producer Name and Address"
  importerOfRecord?: Party; // DHL: IOR
  notifyParty?: Party; // PL marítimo
}

// ─── Product Lines ──────────────────────────────────────────────────────────
export type UOM =
  | 'PCS' | 'KG' | 'LB' | 'M' | 'M2' | 'M3' | 'L' | 'MT'
  | 'PR' | 'SET' | 'DOZ' | 'GRO' | 'THD' | 'HUND' | 'RL'
  | 'BX' | 'CS' | 'CT' | 'PK' | 'EA';

export type Currency = 'USD' | 'MXN' | 'EUR' | 'CAD' | 'GBP' | 'CNY' | 'JPY';

export interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export type PackageType =
  | 'BOX' | 'PALLET' | 'CRATE' | 'DRUM' | 'BAG' | 'ROLL'
  | 'BUNDLE' | 'CARTON' | 'CASE' | 'CONTAINER' | 'OTHER';

export interface PackageDetail {
  packageNumber: number; // 1-based
  packageType: PackageType;
  quantity: number; // Unidades en ESTE bulto
  netWeightKg: number;
  grossWeightKg: number;
  dimensions: Dimensions;
  shippingMarks: string;
}

export type Incoterm2020 =
  | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'
  | 'FAS' | 'FOB' | 'CFR' | 'CIF';

export interface IncotermData {
  code: Incoterm2020;
  place: string;
  version: '2020';
}

export type USMCACriterion = 'A' | 'B' | 'C' | 'D';

export interface PreferentialOrigin {
  agreement: 'USMCA' | 'USMCA_BLANKET' | 'OTHER_FTA';
  originCriterion: USMCACriterion;
  blanketPeriod?: { start: string; end: string };
  producerId?: string;
}

export interface ProductLine {
  lineNumber: number;
  sku?: string;
  description: string;
  descriptionEs?: string;
  hsCode: string; // 6-10 dígitos
  hsCodeSource: 'USER' | 'AI_SUGGESTION' | 'CARRIER_TOOL';
  countryOfOrigin: string; // ISO 3166-1 alpha-2
  countryOfOriginName: string;
  quantity: number;
  uom: UOM;
  unitPrice: number; // > 0
  currency: Currency;
  lineTotal: number; // quantity * unitPrice
  netWeightKg: number;
  grossWeightKg: number;
  dimensions?: Dimensions;
  packages?: PackageDetail[];
  preferentialOrigin?: PreferentialOrigin;
  incoterm?: Incoterm2020;
}

// ─── Totals ─────────────────────────────────────────────────────────────────
export interface ShipmentTotals {
  totalLines: number;
  totalQuantity: number;
  totalNetWeightKg: number;
  totalGrossWeightKg: number;
  totalVolumeCbm: number; // L*W*H/1,000,000 por bulto
  totalPackages: number;
  subtotal: number;
  totalAdditionalCosts: number;
  grandTotal: number;
  currency: Currency;
}

// ─── Carrier Specific ───────────────────────────────────────────────────────
export type FedExReasonForExport =
  | 'SALE' | 'SAMPLE' | 'GIFT' | 'REPAIR' | 'RETURN' | 'PERSONAL_USE';

export type DHLReasonForExport =
  | 'SALE' | 'SAMPLE' | 'REPAIR' | 'RETURN' | 'PERSONAL_USE'
  | 'GIFT' | 'POST_REPAIR';

export type DHLTypeOfExport = 'PERMANENT' | 'TEMPORARY' | 'REPAIR_AND_RETURN';

export interface AdditionalCost {
  type: 'FREIGHT' | 'INSURANCE' | 'OTHER';
  description: string;
  amount: number;
  currency: Currency;
}

export interface USMCAGood {
  description: string;
  hsCode: string;
  originCriterion: USMCACriterion;
}

export interface USMCACertification {
  certifierRole: 'IMPORTER' | 'EXPORTER' | 'PRODUCER';
  certifier: Party;
  exporter?: Party;
  producer?: Party;
  importer: Party;
  goods: USMCAGood[];
  originCriterion: USMCACriterion;
  blanketPeriod?: { start: string; end: string };
  authorizedSignature: string;
  date: string; // YYYY-MM-DD
}

export interface CarrierSpecificData {
  fedex?: {
    awbNumber: string; // 12 dígitos
    exportReferences?: string;
    customsProcedureCode?: string;
    dutyTaxBilling: 'BILL_RECIPIENT' | 'BILL_SHIPPER';
    reasonForExport: FedExReasonForExport;
    etdEnabled: boolean;
  };
  ups?: {
    invoiceNumber: string;
    invoiceDate: string; // YYYY-MM-DD
    currencyOfSale: Currency;
    grossWeightKg: number;
    termsOfSale: IncotermData;
    brokerageDutyBilling: 'CONSIGNEE' | 'SHIPPER';
    additionalCosts: AdditionalCost[];
    partiesRelationship: 'RELATED' | 'NOT_RELATED';
    usmcaCertification?: USMCACertification;
  };
  dhl?: {
    awbNumber: string; // 10 dígitos
    shipmentReference: string;
    reasonForExport: DHLReasonForExport;
    typeOfExport: DHLTypeOfExport;
    exportLicenseNumber?: string;
    importLicenseNumber?: string;
    paymentMethod?: string;
    termsOfTrade: IncotermData;
    mydhlGenerated: boolean;
  };
  packingList?: {
    plNumber: string;
    plDate: string; // YYYY-MM-DD
    commercialInvoiceRef: string;
    awbBlRef: string;
    notifyParty?: Party;
    incoterm?: IncotermData;
    packages: PackageDetail[]; // Mínimo 1
  };
  bundle?: {
    documentNumber: string;
    commercialInvoiceRef: string;
    packingListRef: string;
  };
}

// ─── Output Config ──────────────────────────────────────────────────────────
export type PaperSize = 'LETTER' | 'A4';
export type Orientation = 'PORTRAIT' | 'LANDSCAPE';
export type OutputLanguage = 'EN' | 'ES' | 'BILINGUAL';
export type OutputFormat = 'PDF' | 'EDI_JSON' | 'BOTH';
export type EdiFormat = 'FEDEX_ETD' | 'UPS_PAPERLESS' | 'DHL_MYDHL';

export interface OutputConfig {
  paperSize: PaperSize;
  orientation: Orientation;
  language: OutputLanguage;
  includeSignature: boolean;
  signatureImageUrl?: string;
  outputFormat: OutputFormat;
  ediFormat?: EdiFormat;
}

// ─── ShipmentData (SSOT discriminado) ───────────────────────────────────────
export interface ShipmentData {
  shipmentId: string; // UUID v4
  documentType: DocumentType;
  carrier: Carrier;
  destinationCountryCode: string; // ISO 3166-1 alpha-2
  destinationCountryGroup: CountryGroup;
  issueDate: string; // YYYY-MM-DD
  validityDays?: number; // Solo PROFORMA
  parties: Parties;
  lines: ProductLine[];
  totals: ShipmentTotals;
  carrierSpecific: CarrierSpecificData;
  output: OutputConfig;
}

// ─── Discriminated subtypes ─────────────────────────────────────────────────
export interface ProformaData extends ShipmentData {
  documentType: 'PROFORMA';
  carrier: 'NONE';
}
export interface CiFedexData extends ShipmentData {
  documentType: 'CI_FEDEX';
  carrier: 'FEDEX';
}
export interface CiUpsData extends ShipmentData {
  documentType: 'CI_UPS';
  carrier: 'UPS';
}
export interface CiDhlData extends ShipmentData {
  documentType: 'CI_DHL';
  carrier: 'DHL';
}
export interface PackingListData extends ShipmentData {
  documentType: 'PACKING_LIST';
  carrier: 'NONE';
}
export interface BundleData extends ShipmentData {
  documentType: 'BUNDLE_CIPL';
  carrier: Carrier;
}
