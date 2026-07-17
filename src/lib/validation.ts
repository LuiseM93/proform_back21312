import { z } from "zod";

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
  countryOfOrigin: z.string().min(1),
  countryOfDestination: z.string().min(1),
  carrier: z.enum(["fedex", "ups", "dhl", "aramex", "other"]).optional(),
  transportMode: z.enum(["ocean", "air", "land"]).optional(),
});

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  hsCode: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  weightKg: z.number().nonnegative().optional(),
  currency: z.string().min(1),
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
  documentNumber: z.string().min(1),
  date: z.string().min(1),
  exporter: partySchema,
  importer: partySchema,
  shipment: shipmentSchema,
  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
  totals: z.object({
    subtotal: z.number(),
    discount: z.number(),
    freight: z.number(),
    insurance: z.number(),
    otherCharges: z.number(),
    total: z.number(),
  }),
  banking: bankingSchema.optional(),
  legalDeclaration: z.string().optional(),
  logoDataUrl: z.string().optional(),
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
