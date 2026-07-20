// ============================================================================
// Controlled Vocabularies — NO FREE TEXT
// ProformaFlow · International Trade · v1.0
// ============================================================================
import type {
  Incoterm2020, UOM, PackageType, Currency, TaxIdType,
  FedExReasonForExport, DHLReasonForExport, DHLTypeOfExport,
} from '@/types/shipment';

export const INCOTERMS_2020: readonly Incoterm2020[] = [
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
  'FAS', 'FOB', 'CFR', 'CIF',
] as const;

export const INCOTERM_METADATA: Record<Incoterm2020, {
  mode: 'ANY' | 'SEA_INLAND';
  riskTransfer: string;
  costResponsibility: string;
  includesFreight: boolean;
  includesInsurance: boolean;
  customsValueBasis: Incoterm2020;
}> = {
  EXW: { mode: 'ANY', riskTransfer: 'At seller premises', costResponsibility: 'Buyer bears all', includesFreight: false, includesInsurance: false, customsValueBasis: 'EXW' },
  FCA: { mode: 'ANY', riskTransfer: 'At named carrier', costResponsibility: 'Seller to carrier', includesFreight: false, includesInsurance: false, customsValueBasis: 'FCA' },
  CPT: { mode: 'ANY', riskTransfer: 'At first carrier', costResponsibility: 'Seller pays freight to destination', includesFreight: true, includesInsurance: false, customsValueBasis: 'CIF' },
  CIP: { mode: 'ANY', riskTransfer: 'At first carrier', costResponsibility: 'Seller pays freight + insurance (Clauses A)', includesFreight: true, includesInsurance: true, customsValueBasis: 'CIP' },
  DAP: { mode: 'ANY', riskTransfer: 'At named place, ready for unloading', costResponsibility: 'Seller to place', includesFreight: true, includesInsurance: false, customsValueBasis: 'DAP' },
  DPU: { mode: 'ANY', riskTransfer: 'At named place, unloaded', costResponsibility: 'Seller to place + unload', includesFreight: true, includesInsurance: false, customsValueBasis: 'DAP' },
  DDP: { mode: 'ANY', riskTransfer: 'At named place, cleared for import', costResponsibility: 'Seller all costs + duties', includesFreight: true, includesInsurance: false, customsValueBasis: 'DDP' },
  FAS: { mode: 'SEA_INLAND', riskTransfer: 'Alongside vessel', costResponsibility: 'Seller to port', includesFreight: false, includesInsurance: false, customsValueBasis: 'FAS' },
  FOB: { mode: 'SEA_INLAND', riskTransfer: 'On board vessel', costResponsibility: 'Seller to vessel', includesFreight: false, includesInsurance: false, customsValueBasis: 'FOB' },
  CFR: { mode: 'SEA_INLAND', riskTransfer: 'On board vessel', costResponsibility: 'Seller pays freight to port', includesFreight: true, includesInsurance: false, customsValueBasis: 'CIF' },
  CIF: { mode: 'SEA_INLAND', riskTransfer: 'On board vessel', costResponsibility: 'Seller pays freight + insurance (Clauses C)', includesFreight: true, includesInsurance: true, customsValueBasis: 'CIF' },
};

export const UOM_CATALOG: readonly UOM[] = [
  'PCS', 'KG', 'LB', 'M', 'M2', 'M3', 'L', 'MT', 'PR', 'SET',
  'DOZ', 'GRO', 'THD', 'HUND', 'RL', 'BX', 'CS', 'CT', 'PK', 'EA',
] as const;

export const PACKAGE_TYPES: readonly PackageType[] = [
  'BOX', 'PALLET', 'CRATE', 'DRUM', 'BAG', 'ROLL',
  'BUNDLE', 'CARTON', 'CASE', 'CONTAINER', 'OTHER',
] as const;

export const FEDEX_REASONS_FOR_EXPORT: readonly FedExReasonForExport[] = [
  'SALE', 'SAMPLE', 'GIFT', 'REPAIR', 'RETURN', 'PERSONAL_USE',
] as const;

export const DHL_REASONS_FOR_EXPORT: readonly DHLReasonForExport[] = [
  'SALE', 'SAMPLE', 'REPAIR', 'RETURN', 'PERSONAL_USE', 'GIFT', 'POST_REPAIR',
] as const;

export const DHL_TYPES_OF_EXPORT: readonly DHLTypeOfExport[] = [
  'PERMANENT', 'TEMPORARY', 'REPAIR_AND_RETURN',
] as const;

export const CURRENCIES: readonly Currency[] = [
  'USD', 'MXN', 'EUR', 'CAD', 'GBP', 'CNY', 'JPY',
] as const;

export const TAX_ID_TYPES: readonly TaxIdType[] = [
  'EIN', 'EORI', 'VAT', 'RFC', 'TIN', 'NIT', 'OTHER',
] as const;

export const BLACKLISTED_DESCRIPTION_WORDS = [
  'goods', 'merchandise', 'products', 'items', 'stuff', 'things',
  'parts', 'components', 'materials', 'supplies', 'cargo', 'gift', 'gifts',
  'sample', 'samples', 'present', 'donation', 'free',
  'n/a', 'na', 'none', 'varios', 'varios productos', 'mercancia',
  'general', 'miscellaneous', 'assorted', 'various'
] as const;

// ─── PaperSize / Orientation Derivation ───────────────────────────────────
import type { CountryGroup, DocumentType, PaperSize, Orientation } from '@/types/shipment';

export function derivePaperConfig(
  destinationCountryGroup: CountryGroup,
  documentType: DocumentType
): { paperSize: PaperSize; orientation: Orientation } {
  const paperSize: PaperSize =
    destinationCountryGroup === 'US_CA' || destinationCountryGroup === 'MX'
      ? 'LETTER'
      : 'A4';

  let orientation: Orientation = 'PORTRAIT';
  if (documentType === 'PACKING_LIST' || documentType === 'BUNDLE_CIPL') {
    orientation = 'LANDSCAPE';
  }
  return { paperSize, orientation };
}

// ─── Description validation per carrier ──────────────────────────────────
// FASE 3: separates BLOCKING (min length, UPS package type) from WARNING (generic words)
export function validateDescriptionForCarrier(
  carrier: string,
  description: string
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const descLower = description.toLowerCase().trim();

  if (descLower.length < 20) {
    errors.push(`Description too short (minimum 20 characters). Specify: what it is, material, use.`);
  }

  // FASE 1 (FIX P1): generic-word blacklist = BLOCKING (RED), not a warning.
  // #1 cause of customs holds (19 CFR 141.86). Prevents PDF/EDI generation.
  BLACKLISTED_DESCRIPTION_WORDS.forEach((word) => {
    if (descLower.split(/\s+/).includes(word)) {
      errors.push(`BLOCKING generic word: "${word}". Specify: what it is, material, use, brand/model.`);
    }
  });

  if (carrier === 'UPS') {
    const hasPackageType = /\b(box|carton|crate|pallet|drum|bag|bundle)\b/i.test(description);
    if (!hasPackageType) {
      errors.push('UPS requires a package type in the description (box, carton, pallet, etc.)');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
