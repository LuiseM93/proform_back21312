// ============================================================================
// Severity Table Tests — one test per code in spec §8 (RED / AMBER / GREEN)
// ProformaFlow · FASE 0 (CIERRA "siguen saliendo errores")
// These tests are the LAW: if any goes red, the feature does not exist.
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { ShipmentData, ProductLine, Parties, Party, CarrierSpecificData, OutputConfig, ShipmentTotals } from '@/types/shipment';
import { runPreGenerationChecks } from '@/validation/pre-generation';
import { validateCrossDocumentConsistency } from '@/validation/cross-document';
import { ShipmentSchema } from '@/validation/schemas';

// ─── Factories ───────────────────────────────────────────────────────────────
function party(over: Partial<Party> = {}): Party {
  return {
    legalName: 'Acme Corp',
    taxId: 'EIN12345',
    taxIdType: 'EIN',
    address: {
      street: '1 Main St', city: 'Austin', stateProvince: 'TX',
      postalCode: '73301', countryCode: 'US', countryName: 'United States',
    },
    ...over,
  };
}

function parties(over: Partial<Parties> = {}): Parties {
  return {
    shipper: party({ address: { ...party().address, countryCode: 'MX', countryName: 'Mexico' }, taxId: 'ABC123456XXX', taxIdType: 'RFC' }),
    consignee: party({ address: { ...party().address, countryCode: 'US', countryName: 'United States' } }),
    ...over,
  };
}

function line(over: Partial<ProductLine> = {}): ProductLine {
  return {
    lineNumber: 1,
    description: 'Men\'s cotton t-shirt, 50% cotton 50% polyester, model TS-01',
    hsCode: '610910',
    hsCodeSource: 'USER',
    countryOfOrigin: 'MX',
    countryOfOriginName: 'Mexico',
    quantity: 100,
    uom: 'PCS',
    unitPrice: 10,
    currency: 'USD',
    lineTotal: 1000,
    netWeightKg: 5,
    grossWeightKg: 6,
    packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 5, grossWeightKg: 6, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, shippingMarks: 'MK1' }],
    ...over,
  };
}

function totals(over: Partial<ShipmentTotals> = {}): ShipmentTotals {
  return {
    totalLines: 1, totalQuantity: 100, totalNetWeightKg: 5, totalGrossWeightKg: 6,
    totalVolumeCbm: 0.01, totalPackages: 1, subtotal: 1000, totalAdditionalCosts: 0,
    grandTotal: 1000, currency: 'USD',
    ...over,
  };
}

function output(over: Partial<OutputConfig> = {}): OutputConfig {
  return {
    paperSize: 'LETTER', orientation: 'PORTRAIT', language: 'EN',
    includeSignature: false, outputFormat: 'PDF',
    ...over,
  };
}

function baseShipment(over: Partial<ShipmentData> = {}): ShipmentData {
  return {
    shipmentId: '00000000-0000-0000-0000-000000000000',
    documentType: 'CI_FEDEX',
    carrier: 'FEDEX',
    destinationCountryCode: 'US',
    destinationCountryGroup: 'US_CA',
    issueDate: '2026-07-19',
    parties: parties(),
    lines: [line()],
    totals: totals(),
    carrierSpecific: {
      fedex: {
        awbNumber: '123456789012', dutyTaxBilling: 'BILL_RECIPIENT',
        reasonForExport: 'SALE', etdEnabled: false,
      },
    },
    output: output(),
    ...over,
  } as ShipmentData;
}

const codes = (r: { blockingErrors: { code: string }[]; warnings: { code: string }[] }) =>
  [...r.blockingErrors.map((e) => e.code), ...r.warnings.map((w) => w.code)];

// ─── RED (BLOCKING) ──────────────────────────────────────────────────────────
describe('§8 RED — Blocking errors', () => {
  it('UNIT_PRICE_ZERO — blocks when unitPrice = 0', () => {
    const r = runPreGenerationChecks(baseShipment({ lines: [line({ unitPrice: 0, lineTotal: 0 })] }));
    expect(r.blockingErrors.some((e) => e.code === 'UNIT_PRICE_ZERO')).toBe(true);
    expect(r.canGenerate).toBe(false);
  });

  it('HS_CODE_INVALID — blocks when HS < 6 digits', () => {
    const r = runPreGenerationChecks(baseShipment({ lines: [line({ hsCode: '12' })] }));
    expect(r.blockingErrors.some((e) => e.code === 'HS_CODE_INVALID')).toBe(true);
  });

  it('COO_MISSING — blocks when countryOfOrigin empty', () => {
    const r = runPreGenerationChecks(baseShipment({ lines: [line({ countryOfOrigin: '', countryOfOriginName: '' })] }));
    expect(r.blockingErrors.some((e) => e.code === 'COO_MISSING')).toBe(true);
  });

  it('DESCRIPTION_TOO_GENERIC — blocks blacklist word (goods)', () => {
    const r = runPreGenerationChecks(baseShipment({ lines: [line({ description: 'goods for sale' })] }));
    expect(r.blockingErrors.some((e) => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
  });

  it('EORI_MISSING_EU — blocks EU destination without EORI', () => {
    const eu = baseShipment({
      destinationCountryGroup: 'EU', destinationCountryCode: 'DE',
      parties: parties({ consignee: party({ taxId: '12345', taxIdType: 'VAT' }) }),
    });
    const r = runPreGenerationChecks(eu);
    expect(r.blockingErrors.some((e) => e.code === 'EORI_MISSING_EU')).toBe(true);
  });

  it('SUBTOTAL_MISMATCH — blocks when subtotal != sum of lines', () => {
    const r = runPreGenerationChecks(baseShipment({ totals: totals({ subtotal: 999, grandTotal: 999 }) }));
    expect(r.blockingErrors.some((e) => e.code === 'SUBTOTAL_MISMATCH')).toBe(true);
  });

  it('WEIGHT_MISMATCH_BUNDLE — blocks Bundle gross != line sum', () => {
    const r = runPreGenerationChecks(baseShipment({
      documentType: 'BUNDLE_CIPL', carrier: 'NONE',
      carrierSpecific: { bundle: { documentNumber: 'B1', commercialInvoiceRef: 'CI1', packingListRef: 'PL1' } },
      totals: totals({ totalGrossWeightKg: 999 }),
    }));
    expect(r.blockingErrors.some((e) => e.code === 'WEIGHT_MISMATCH_BUNDLE')).toBe(true);
  });

  it('INCOTERM_INVALID — blocks unknown incoterm', () => {
    const r = runPreGenerationChecks(baseShipment({ lines: [line({ incoterm: 'FOO' as any })] }));
    expect(r.blockingErrors.some((e) => e.code === 'INCOTERM_INVALID')).toBe(true);
  });

  it('AWB_FORMAT_INVALID — blocks FedEx AWB != 12 digits', () => {
    const r = runPreGenerationChecks(baseShipment({
      carrierSpecific: { fedex: { awbNumber: '123', dutyTaxBilling: 'BILL_RECIPIENT', reasonForExport: 'SALE', etdEnabled: false } },
    }));
    expect(r.blockingErrors.some((e) => e.code === 'AWB_FORMAT_INVALID')).toBe(true);
  });

  it('PARTIES_RELATIONSHIP_MISSING_UPS — blocks UPS without relationship', () => {
    const r = runPreGenerationChecks(baseShipment({
      documentType: 'CI_UPS', carrier: 'UPS',
      carrierSpecific: {
        ups: {
          invoiceNumber: 'INV1', invoiceDate: '2026-07-19', currencyOfSale: 'USD',
          grossWeightKg: 6, termsOfSale: { code: 'DAP', place: 'Austin', version: '2020' },
          brokerageDutyBilling: 'CONSIGNEE', additionalCosts: [],
          // partiesRelationship omitted
        } as any,
      },
    }));
    expect(r.blockingErrors.some((e) => e.code === 'PARTIES_RELATIONSHIP_MISSING_UPS')).toBe(true);
  });

  it('PROFORMA_USED_AS_CI — warns (AMBER) when Proforma selected, still generable', () => {
    const r = runPreGenerationChecks(baseShipment({ documentType: 'PROFORMA', carrier: 'NONE', validityDays: 30 }));
    expect(r.blockingErrors.some((e) => e.code === 'PROFORMA_USED_AS_CI')).toBe(false);
    expect(r.warnings.some((e) => e.code === 'PROFORMA_USED_AS_CI')).toBe(true);
    expect(r.canGenerate).toBe(true);
  });

  it('NAFTA_OBSOLETE_EMBEDDED — blocks UPS CI with legacy NAFTA block', () => {
    const r = runPreGenerationChecks(baseShipment({
      documentType: 'CI_UPS', carrier: 'UPS',
      carrierSpecific: {
        ups: {
          invoiceNumber: 'INV1', invoiceDate: '2026-07-19', currencyOfSale: 'USD',
          grossWeightKg: 6, termsOfSale: { code: 'DAP', place: 'Austin', version: '2020' },
          brokerageDutyBilling: 'CONSIGNEE', additionalCosts: [], partiesRelationship: 'NOT_RELATED',
          ...({ naftaCertification: { nafta: true } } as any),
        },
      },
    }));
    expect(r.blockingErrors.some((e) => e.code === 'NAFTA_OBSOLETE_EMBEDDED')).toBe(true);
  });
});

// ─── AMBER (WARNING) ──────────────────────────────────────────────────────────
describe('§8 AMBER — Warnings', () => {
  it('RFC_REQUIRED_MX — blocks (RED) when MX shipper without valid RFC', () => {
    const r = runPreGenerationChecks(baseShipment({
      parties: parties({ shipper: party({ address: { ...party().address, countryCode: 'MX', countryName: 'Mexico' }, taxId: '', taxIdType: 'RFC' }) }),
    }));
    expect(r.blockingErrors.some((e) => e.code === 'RFC_REQUIRED_MX')).toBe(true);
    expect(r.canGenerate).toBe(false);
  });

  it('PAPER_INVOICE_SURCHARGE_UPS — warns UPS paper invoice', () => {
    const r = runPreGenerationChecks(baseShipment({
      documentType: 'CI_UPS', carrier: 'UPS',
      output: output({ outputFormat: 'PDF' }),
      carrierSpecific: {
        ups: {
          invoiceNumber: 'INV1', invoiceDate: '2026-07-19', currencyOfSale: 'USD',
          grossWeightKg: 6, termsOfSale: { code: 'DAP', place: 'Austin', version: '2020' },
          brokerageDutyBilling: 'CONSIGNEE', additionalCosts: [], partiesRelationship: 'NOT_RELATED',
        },
      },
    }));
    expect(r.warnings.some((w) => w.code === 'PAPER_INVOICE_SURCHARGE_UPS')).toBe(true);
  });

  it('DE_MINIMIS_SUSPENDED_US — warns US shipment < $800', () => {
    const r = runPreGenerationChecks(baseShipment({
      destinationCountryCode: 'US', destinationCountryGroup: 'US_CA',
      lines: [line({ unitPrice: 5, quantity: 10, lineTotal: 50 })],
      totals: totals({ subtotal: 50, grandTotal: 50, totalQuantity: 10 }),
    }));
    expect(r.warnings.some((w) => w.code === 'DE_MINIMIS_SUSPENDED_US')).toBe(true);
  });

  it('BUNDLE_NOT_ACCEPTED_DESTINATION — warns Bundle to BR', () => {
    const r = runPreGenerationChecks(baseShipment({
      documentType: 'BUNDLE_CIPL', carrier: 'NONE', destinationCountryCode: 'BR', destinationCountryGroup: 'REST_OF_WORLD',
      carrierSpecific: { bundle: { documentNumber: 'B1', commercialInvoiceRef: 'CI1', packingListRef: 'PL1' } },
    }));
    expect(r.warnings.some((w) => w.code === 'BUNDLE_NOT_ACCEPTED_DESTINATION')).toBe(true);
  });
});

// ─── GREEN (valid baseline) ───────────────────────────────────────────────────
describe('§8 GREEN — valid shipment passes all RED', () => {
  it('clean FedEx CI produces no blocking errors', () => {
    const r = runPreGenerationChecks(baseShipment());
    expect(r.blockingErrors).toHaveLength(0);
    expect(r.canGenerate).toBe(true);
  });

  it('clean data passes Zod ShipmentSchema', () => {
    const result = ShipmentSchema.safeParse(baseShipment());
    expect(result.success).toBe(true);
  });
});

// ─── Cross-document consistency (spec §2.2) ───────────────────────────────────
describe('Cross-document consistency', () => {
  it('CI vs PL — mismatched gross weight => ERROR', () => {
    const ci = baseShipment({ documentType: 'CI_FEDEX' });
    const pl = baseShipment({
      documentType: 'PACKING_LIST', carrier: 'NONE',
      totals: totals({ totalGrossWeightKg: 999, totalNetWeightKg: 998, subtotal: 1000, grandTotal: 1000 }),
      carrierSpecific: { packingList: { plNumber: 'PL1', plDate: '2026-07-19', commercialInvoiceRef: 'CI1', awbBlRef: '123456789012', packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 998, grossWeightKg: 999, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, shippingMarks: 'MK1' }] } },
      lines: [line({ packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 998, grossWeightKg: 999, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, shippingMarks: 'MK1' }] })],
    });
    const res = validateCrossDocumentConsistency(new Map([['CI_FEDEX', ci], ['PACKING_LIST', pl]]));
    expect(res.errors.some((e) => e.code === 'WEIGHT_MISMATCH_GROSS')).toBe(true);
  });

  it('CI vs PL — identical => no errors', () => {
    const ci = baseShipment({
      documentType: 'CI_FEDEX',
      lines: [line({ packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 5, grossWeightKg: 6, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, shippingMarks: 'MK1' }] })],
    });
    const pl = baseShipment({
      documentType: 'PACKING_LIST', carrier: 'FEDEX',
      carrierSpecific: { packingList: { plNumber: 'PL1', plDate: '2026-07-19', commercialInvoiceRef: 'CI1', awbBlRef: '123456789012', packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 5, grossWeightKg: 6, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, shippingMarks: 'MK1' }] } },
      lines: [line({ packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 5, grossWeightKg: 6, dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }, shippingMarks: 'MK1' }] })],
    });
    const res = validateCrossDocumentConsistency(new Map([['CI_FEDEX', ci], ['PACKING_LIST', pl]]));
    expect(res.errors).toHaveLength(0);
  });

  it('Proforma→CI — COO change => ERROR', () => {
    const proforma = baseShipment({ documentType: 'PROFORMA', carrier: 'NONE', validityDays: 30 });
    const ci = baseShipment({ lines: [line({ countryOfOrigin: 'CN', countryOfOriginName: 'China' })] });
    const res = validateCrossDocumentConsistency(new Map([['PROFORMA', proforma], ['CI_FEDEX', ci]]));
    expect(res.errors.some((e) => e.code === 'PROFORMA_CI_COO_DIFF')).toBe(true);
  });
});
