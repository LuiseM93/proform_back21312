// ============================================================================
// Zod Schemas — 1 por DocumentType + Union discriminada
// ProformaFlow · Comercio Internacional · v1.0
// ============================================================================
import { z } from 'zod';
import {
  INCOTERMS_2020, UOM_CATALOG, PACKAGE_TYPES, FEDEX_REASONS_FOR_EXPORT,
  DHL_REASONS_FOR_EXPORT, DHL_TYPES_OF_EXPORT, CURRENCIES, TAX_ID_TYPES,
} from '@/constants/controlled-vocabularies';

// ─── Utilidades ─────────────────────────────────────────────────────────────
const positiveNumber = z.number().positive('Debe ser mayor a 0');
const nonNegativeNumber = z.number().nonnegative('No puede ser negativo');
const nonEmptyString = z.string().min(1, 'Field is required');
const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');
const isoCountryCode = z.string().length(2, 'ISO code must be 2 letters');
const hsCodeSchema = z.string().regex(/^\d{6,10}$/, 'HS Code: 6-10 numeric digits');
const awbFedexSchema = z.string().regex(/^\d{12}$/, 'FedEx AWB: 12 digits');
const awbDhlSchema = z.string().regex(/^\d{10}$/, 'DHL AWB: 10 digits');
const eoriSchema = z.string().regex(/^[A-Z]{2}[A-Z0-9]{1,15}$/, 'Invalid EORI format');
const rfcSchema = z.string().regex(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/, 'Invalid RFC');

// Exported for use in pre-generation.ts (Mexico RFC validation)
export { rfcSchema };

// ─── Party ──────────────────────────────────────────────────────────────────
export const PartySchema = z.object({
  legalName: nonEmptyString.max(200),
  taxId: nonEmptyString.max(50),
  taxIdType: z.enum(TAX_ID_TYPES),
  address: z.object({
    street: nonEmptyString.max(100),
    street2: z.string().max(100).optional(),
    city: nonEmptyString.max(50),
    stateProvince: nonEmptyString.max(50),
    postalCode: nonEmptyString.max(20),
    countryCode: isoCountryCode,
    countryName: nonEmptyString.max(100),
  }),
  contactName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  relationship: z.enum(['RELATED', 'NOT_RELATED']).optional(),
  eori: z.string().regex(/^[A-Z]{2}[A-Z0-9]{1,15}$/, 'Formato EORI inválido').optional(),
});

export const AddressSchema = PartySchema.shape.address;

// ─── Product Line ───────────────────────────────────────────────────────────
export const DimensionsSchema = z.object({
  lengthCm: positiveNumber,
  widthCm: positiveNumber,
  heightCm: positiveNumber,
});

export const PackageDetailSchema = z.object({
  packageNumber: z.number().int().positive(),
  packageType: z.enum(PACKAGE_TYPES),
  quantity: z.number().int().positive(),
  netWeightKg: positiveNumber,
  grossWeightKg: positiveNumber,
  dimensions: DimensionsSchema,
  shippingMarks: nonEmptyString.max(50).describe('Marks & numbers impresos en la caja (19 CFR 141.86)'),
});

export const PreferentialOriginSchema = z.object({
  agreement: z.enum(['USMCA', 'USMCA_BLANKET', 'OTHER_FTA']),
  originCriterion: z.enum(['A', 'B', 'C', 'D']),
  blanketPeriod: z.object({ start: isoDateString, end: isoDateString }).optional(),
  producerId: z.string().max(50).optional(),
});

export const ProductLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  sku: z.string().max(50).optional(),
  description: nonEmptyString.max(500),
  // FASE 3: generic-word blacklist moved to WARNING (pre-generation.ts); does not block the schema.
  descriptionEs: z.string().max(500).optional(),
  hsCode: hsCodeSchema,
  hsCodeSource: z.enum(['USER', 'AI_SUGGESTION', 'CARRIER_TOOL']),
  countryOfOrigin: isoCountryCode,
  countryOfOriginName: nonEmptyString.max(100),
  quantity: z.number().int().positive(),
  uom: z.enum(UOM_CATALOG),
  unitPrice: positiveNumber,
  currency: z.enum(CURRENCIES),
  lineTotal: positiveNumber,
  netWeightKg: positiveNumber,
  grossWeightKg: positiveNumber,
  dimensions: DimensionsSchema.optional(),
  packages: z.array(PackageDetailSchema).optional(),
  preferentialOrigin: PreferentialOriginSchema.optional(),
  incoterm: z.enum(INCOTERMS_2020).optional(), // FIX P1: enum strict against Incoterms 2020
});

// ─── Parties ────────────────────────────────────────────────────────────────
export const PartiesSchema = z.object({
  shipper: PartySchema,
  consignee: PartySchema,
  buyer: PartySchema.optional(),
  producer: PartySchema.optional(),
  importerOfRecord: PartySchema.optional(),
  notifyParty: PartySchema.optional(),
});

// ─── Incoterm ───────────────────────────────────────────────────────────────
export const IncotermDataSchema = z.object({
  code: z.enum(INCOTERMS_2020),
  place: nonEmptyString.max(100),
  version: z.literal('2020'),
});

// ─── Carrier Specific ───────────────────────────────────────────────────────
export const FedExSpecificSchema = z.object({
  awbNumber: awbFedexSchema,
  exportReferences: z.string().max(100).optional(),
  customsProcedureCode: z.string().max(20).optional(),
  dutyTaxBilling: z.enum(['BILL_RECIPIENT', 'BILL_SHIPPER']),
  reasonForExport: z.enum(FEDEX_REASONS_FOR_EXPORT),
  etdEnabled: z.boolean(),
});

export const AdditionalCostSchema = z.object({
  type: z.enum(['FREIGHT', 'INSURANCE', 'OTHER']),
  description: nonEmptyString.max(100),
  amount: positiveNumber,
  currency: z.enum(CURRENCIES),
});

export const UPSSpecificSchema = z.object({
  invoiceNumber: z.string().regex(/^1Z[A-Z0-9]{16}$/, 'UPS Invoice/Tracking: format 1Z + 16 alphanumerics (e.g. 1Z999AA10123456784)'),
  invoiceDate: isoDateString,
  currencyOfSale: z.enum(CURRENCIES),
  grossWeightKg: positiveNumber,
  termsOfSale: IncotermDataSchema,
  brokerageDutyBilling: z.enum(['CONSIGNEE', 'SHIPPER']),
  additionalCosts: z.array(AdditionalCostSchema),
  partiesRelationship: z.enum(['RELATED', 'NOT_RELATED']),
  usmcaCertification: z.object({
    certifierRole: z.enum(['IMPORTER', 'EXPORTER', 'PRODUCER']),
    certifier: PartySchema,
    exporter: PartySchema.optional(),
    producer: PartySchema.optional(),
    importer: PartySchema,
    goods: z.array(z.object({
      description: nonEmptyString.max(500),
      hsCode: hsCodeSchema,
      originCriterion: z.enum(['A', 'B', 'C', 'D']),
    })),
    originCriterion: z.enum(['A', 'B', 'C', 'D']),
    blanketPeriod: z.object({ start: isoDateString, end: isoDateString }).optional(),
    authorizedSignature: nonEmptyString.max(100),
    date: isoDateString,
  }).optional(),
});

export const DHLSpecificSchema = z.object({
  awbNumber: awbDhlSchema,
  shipmentReference: nonEmptyString.max(50),
  reasonForExport: z.enum(DHL_REASONS_FOR_EXPORT),
  typeOfExport: z.enum(DHL_TYPES_OF_EXPORT),
  exportLicenseNumber: z.string().max(50).optional(),
  importLicenseNumber: z.string().max(50).optional(),
  paymentMethod: z.string().max(50).optional(),
  termsOfTrade: IncotermDataSchema,
  mydhlGenerated: z.boolean(),
});

export const PackingListSpecificSchema = z.object({
  plNumber: nonEmptyString.max(50),
  plDate: isoDateString,
  commercialInvoiceRef: nonEmptyString.max(50),
  awbBlRef: nonEmptyString.max(50),
  notifyParty: PartySchema.optional(),
  incoterm: IncotermDataSchema.optional(),
  packages: z.array(PackageDetailSchema).min(1, 'At least 1 package required'),
});

export const BundleSpecificSchema = z.object({
  documentNumber: nonEmptyString.max(50),
  commercialInvoiceRef: nonEmptyString.max(50),
  packingListRef: nonEmptyString.max(50),
});

export const CarrierSpecificSchema = z.object({
  fedex: FedExSpecificSchema.optional(),
  ups: UPSSpecificSchema.optional(),
  dhl: DHLSpecificSchema.optional(),
  packingList: PackingListSpecificSchema.optional(),
  bundle: BundleSpecificSchema.optional(),
});

// ─── Shipment Totals ────────────────────────────────────────────────────────
export const ShipmentTotalsSchema = z.object({
  totalLines: z.number().int().positive(),
  totalQuantity: z.number().int().positive(),
  totalNetWeightKg: positiveNumber,
  totalGrossWeightKg: positiveNumber,
  totalVolumeCbm: nonNegativeNumber,
  totalPackages: z.number().int().positive(),
  subtotal: positiveNumber,
  totalAdditionalCosts: nonNegativeNumber,
  grandTotal: positiveNumber,
  currency: z.enum(CURRENCIES),
});

// ─── Output Config ──────────────────────────────────────────────────────────
export const OutputConfigSchema = z.object({
  paperSize: z.enum(['LETTER', 'A4']),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
  language: z.enum(['EN', 'ES', 'BILINGUAL']),
  includeSignature: z.boolean(),
  signatureImageUrl: z.string().url().optional().or(z.literal('')),
  outputFormat: z.enum(['PDF', 'EDI_JSON', 'BOTH']),
  ediFormat: z.enum(['FEDEX_ETD', 'UPS_PAPERLESS', 'DHL_MYDHL']).optional(),
});

// ─── Base Schema ────────────────────────────────────────────────────────────
export const ShipmentBaseSchema = z.object({
  shipmentId: z.string().uuid(),
  documentType: z.enum(['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST', 'BUNDLE_CIPL']),
  carrier: z.enum(['FEDEX', 'UPS', 'DHL', 'NONE']),
  destinationCountryCode: isoCountryCode,
  destinationCountryGroup: z.enum(['US_CA', 'EU', 'MX', 'REST_OF_WORLD']),
  issueDate: isoDateString,
  validityDays: z.number().int().positive().optional(),
  parties: PartiesSchema,
  lines: z.array(ProductLineSchema).min(1, 'At least 1 product line required'),
  totals: ShipmentTotalsSchema,
  carrierSpecific: CarrierSpecificSchema,
  output: OutputConfigSchema,
}).refine(
  (data) => {
    const sumLines = data.lines.reduce((s, l) => s + (l.lineTotal || 0), 0);
    return Math.abs(sumLines - data.totals.subtotal) < 0.01;
  },
  { message: 'Totals mismatch: sum of line totals must equal totals.subtotal', path: ['totals', 'subtotal'] }
).refine(
  (data) => {
    const sumNet = data.lines.reduce((s, l) => s + (l.netWeightKg || 0), 0);
    const sumGross = data.lines.reduce((s, l) => s + (l.grossWeightKg || 0), 0);
    return Math.abs(sumNet - data.totals.totalNetWeightKg) < 0.01
      && Math.abs(sumGross - data.totals.totalGrossWeightKg) < 0.01;
  },
  { message: 'Totals mismatch: line weights must equal totals (net/gross)', path: ['totals', 'totalNetWeightKg'] }
).refine(
  (data) => {
    const sumQty = data.lines.reduce((s, l) => s + (l.quantity || 0), 0);
    return sumQty === data.totals.totalQuantity;
  },
  { message: 'Totals mismatch: sum of line quantities must equal totals.totalQuantity', path: ['totals', 'totalQuantity'] }
).refine(
  (data) => {
    const sumPkgs = data.lines.reduce((s, l) => s + (l.packages?.length || 0), 0);
    return sumPkgs === data.totals.totalPackages;
  },
  { message: 'Totals mismatch: sum of package details must equal totals.totalPackages', path: ['totals', 'totalPackages'] }
);

// ─── Refinamientos por tipo ─────────────────────────────────────────────────
export const ProformaSchema = ShipmentBaseSchema.safeExtend({
  documentType: z.literal('PROFORMA'),
  carrier: z.literal('NONE'),
  validityDays: z.number().int().positive().default(30),
}).refine(
  (data) => data.lines.every((l) => l.unitPrice > 0),
  { message: 'Proforma: precio unitario debe ser > 0', path: ['lines'] }
);

export const CiFedexSchema = ShipmentBaseSchema.safeExtend({
  documentType: z.literal('CI_FEDEX'),
  carrier: z.literal('FEDEX'),
}).refine(
  (data) => data.carrierSpecific.fedex !== undefined,
  { message: 'FedEx: carrierSpecific.fedex is required', path: ['carrierSpecific', 'fedex'] }
).refine(
  (data) => data.parties.shipper.address.countryCode !== 'MX' || rfcSchema.safeParse(data.parties.shipper.taxId).success,
  { message: 'Shipper in Mexico: a valid RFC tax ID is mandatory for Commercial Invoices (CFDI 4.0 + Complemento Comercio Exterior)', path: ['parties', 'shipper', 'taxId'] }
).refine(
  (data) => data.parties.shipper.address.countryCode !== data.parties.consignee.address.countryCode,
  { message: 'International shipment: shipper and consignee must be in different countries', path: ['parties'] }
).refine(
  (data) => data.destinationCountryGroup === 'EU'
    ? !!data.parties.consignee.taxId && eoriSchema.safeParse(data.parties.consignee.taxId).success
    : true,
  { message: 'EU destination: importer EORI is required', path: ['parties', 'consignee', 'taxId'] }
).refine(
  (data) => data.destinationCountryGroup === 'EU'
    ? !!data.parties.shipper.eori && eoriSchema.safeParse(data.parties.shipper.eori!).success
    : true,
  { message: 'EU destination: exporter (shipper) EORI is required', path: ['parties', 'shipper', 'eori'] }
);

export const CiUpsSchema = ShipmentBaseSchema.safeExtend({
  documentType: z.literal('CI_UPS'),
  carrier: z.literal('UPS'),
}).refine(
  (data) => data.carrierSpecific.ups !== undefined,
  { message: 'UPS: carrierSpecific.ups is required', path: ['carrierSpecific', 'ups'] }
).refine(
  (data) => data.parties.shipper.address.countryCode !== 'MX' || rfcSchema.safeParse(data.parties.shipper.taxId).success,
  { message: 'Shipper in Mexico: a valid RFC tax ID is mandatory for Commercial Invoices (CFDI 4.0 + Complemento Comercio Exterior)', path: ['parties', 'shipper', 'taxId'] }
).refine(
  (data) => data.carrierSpecific.ups?.partiesRelationship !== undefined,
  { message: 'UPS: partiesRelationship (RELATED/NOT_RELATED) is required', path: ['carrierSpecific', 'ups', 'partiesRelationship'] }
).refine(
  (data) => !data.carrierSpecific.ups?.usmcaCertification || data.carrierSpecific.ups.usmcaCertification.certifierRole !== undefined,
  { message: 'USMCA: certifierRole is required when a certification is included', path: ['carrierSpecific', 'ups', 'usmcaCertification'] }
);

export const CiDhlSchema = ShipmentBaseSchema.safeExtend({
  documentType: z.literal('CI_DHL'),
  carrier: z.literal('DHL'),
}).refine(
  (data) => data.carrierSpecific.dhl !== undefined,
  { message: 'DHL: carrierSpecific.dhl is required', path: ['carrierSpecific', 'dhl'] }
).refine(
  (data) => data.parties.shipper.address.countryCode !== 'MX' || rfcSchema.safeParse(data.parties.shipper.taxId).success,
  { message: 'Shipper in Mexico: a valid RFC tax ID is mandatory for Commercial Invoices (CFDI 4.0 + Complemento Comercio Exterior)', path: ['parties', 'shipper', 'taxId'] }
).refine(
  (data) => data.destinationCountryGroup === 'EU'
    ? !!data.parties.importerOfRecord?.taxId && eoriSchema.safeParse(data.parties.importerOfRecord!.taxId).success
    : true,
  { message: 'EU destination: IOR EORI is required', path: ['parties', 'importerOfRecord', 'taxId'] }
);

export const PackingListSchema = ShipmentBaseSchema.safeExtend({
  documentType: z.literal('PACKING_LIST'),
  carrier: z.literal('NONE'),
}).refine(
  (data) => data.carrierSpecific.packingList !== undefined,
  { message: 'PL: carrierSpecific.packingList is required', path: ['carrierSpecific', 'packingList'] }
).refine(
  (data) => data.lines.some((l) => l.packages && l.packages.length > 0),
  { message: 'PL: at least one line must have package details', path: ['lines'] }
).refine(
  (data) => {
    const totalPackagesFromLines = data.lines.reduce((sum, l) => sum + (l.packages?.length || 0), 0);
    return totalPackagesFromLines === data.carrierSpecific.packingList?.packages.length;
  },
  { message: 'PL: total packages in lines must match carrierSpecific.packingList.packages.length', path: ['carrierSpecific', 'packingList'] }
);

export const BundleSchema = ShipmentBaseSchema.safeExtend({
  documentType: z.literal('BUNDLE_CIPL'),
  carrier: z.enum(['FEDEX', 'UPS', 'DHL', 'NONE']),
}).refine(
  (data) => data.carrierSpecific.bundle !== undefined,
  { message: 'Bundle: carrierSpecific.bundle is required', path: ['carrierSpecific', 'bundle'] }
).refine(
  (data) => data.lines.every((l) => l.packages && l.packages.length > 0),
  { message: 'Bundle: all lines must have packages', path: ['lines'] }
);

// ─── Union discriminada ─────────────────────────────────────────────────────
export const ShipmentSchema = z.discriminatedUnion('documentType', [
  ProformaSchema,
  CiFedexSchema,
  CiUpsSchema,
  CiDhlSchema,
  PackingListSchema,
  BundleSchema,
]);

export type ShipmentData = z.infer<typeof ShipmentSchema>;
export type ProformaData = z.infer<typeof ProformaSchema>;
export type CiFedexData = z.infer<typeof CiFedexSchema>;
export type CiUpsData = z.infer<typeof CiUpsSchema>;
export type CiDhlData = z.infer<typeof CiDhlSchema>;
export type PackingListData = z.infer<typeof PackingListSchema>;
export type BundleData = z.infer<typeof BundleSchema>;
