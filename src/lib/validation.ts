import { z } from "zod";

// HS Code: 6-10 digits, optionally with dots (e.g. 8471.30, 847130.0000)
const hsCodeRegex = /^\d{4}(\.\d{2})?(\.\d{2})?(\.\d{2})?$/;

export const partySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  taxId: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export const shipmentSchema = z.object({
  incoterm: z.enum(["EXW", "FCA", "FOB", "CIF", "CFR", "CPT", "CIP", "DAP", "DPU", "DDP"]),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  countryOfOrigin: z.string().min(1, "Country of origin is required"),
  countryOfDestination: z.string().min(1, "Country of destination is required"),
  carrier: z.enum(["fedex", "ups", "dhl", "aramex", "other"]).optional(),
  transportMode: z.enum(["ocean", "air", "land"]).optional(),
  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  exportReason: z.enum(["sale", "gift", "sample", "return", "repair", "other"]).optional(),
  placeOfDelivery: z.string().optional(),
});

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  hsCode: z.string()
    .regex(hsCodeRegex, "HS Code must be at least 4 digits (e.g. 8471, 8471.30)")
    .optional()
    .or(z.literal("")),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  weightKg: z.number().nonnegative().optional(),
  currency: z.string().min(1, "Currency is required"),
  countryOfOrigin: z.string().optional(),
  weightGrossKg: z.number().nonnegative().optional(),
  marksAndNumbers: z.string().optional(),
  packageCount: z.number().int().nonnegative().optional(),
  packageType: z.enum(["CTN", "PLT", "DRM", "BAG", "CRT", "BND", "PCS", "OTH"]).optional(),
});

export const bankingSchema = z.object({
  beneficiary: z.string().optional(),
  bankName: z.string().optional(),
  swiftBic: z.string().optional(),
  ibanAccount: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

export const documentDraftSchema = z.object({
  documentType: z.enum(["proforma", "commercial", "packing", "bundle"]),
  documentNumber: z.string().min(1, "Document number is required"),
  date: z.string().min(1, "Date is required"),
  exporter: partySchema,
  importer: partySchema,
  shipment: shipmentSchema,
  items: z.array(lineItemSchema).min(1, "Add at least one line item").max(100, "Maximum 100 line items"),
  totals: z.object({
    subtotal: z.number(),
    discount: z.number(),
    freight: z.number(),
    insurance: z.number(),
    otherCharges: z.number(),
    total: z.number(),
  }),
  currency: z.string().min(1, "Currency is required"),
  banking: bankingSchema.optional(),
  legalDeclaration: z.string().optional(),
  logoDataUrl: z.string().optional(),
  paymentTerms: z.string().optional(),
});

export const companySchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  bank_name: z.string().optional(),
  swift_bic: z.string().optional(),
  iban: z.string().optional(),
  default_currency: z.string().optional(),
  default_incoterm: z.string().optional(),
  legal_declaration: z.string().optional(),
  date_format: z.string().optional(),
  language: z.string().optional(),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});