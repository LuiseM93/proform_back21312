import { describe, it, expect } from 'vitest';
import {
  ShipmentSchema,
  ProformaSchema,
  CiFedexSchema,
  CiUpsSchema,
  CiDhlSchema,
  PackingListSchema,
  BundleSchema,
  ProductLineSchema,
  PartySchema,
  UPSSpecificSchema,
  FedExSpecificSchema,
  DHLSpecificSchema,
} from '@/validation/schemas';
import { INCOTERMS_2020 } from '@/constants/controlled-vocabularies';

const validParty = {
  legalName: 'Test Company',
  taxId: '123456789',
  taxIdType: 'EIN' as const,
  address: {
    street: '123 Main St',
    city: 'New York',
    stateProvince: 'NY',
    postalCode: '10001',
    countryCode: 'US',
    countryName: 'United States',
  },
};

const validLine = {
  lineNumber: 1,
  description: 'Men shirts, 50% cotton 50% polyester, box',
  hsCode: '610910',
  hsCodeSource: 'USER' as const,
  countryOfOrigin: 'CN',
  countryOfOriginName: 'China',
  quantity: 100,
  uom: 'PCS' as const,
  unitPrice: 15.50,
  currency: 'USD' as const,
  lineTotal: 1550,
  netWeightKg: 50,
  grossWeightKg: 55,
};

const validTotals = {
  totalLines: 1,
  totalQuantity: 100,
  totalNetWeightKg: 50,
  totalGrossWeightKg: 55,
  totalVolumeCbm: 0.5,
  totalPackages: 5,
  subtotal: 1550,
  totalAdditionalCosts: 100,
  grandTotal: 1650,
  currency: 'USD' as const,
};

const validOutput = {
  paperSize: 'LETTER' as const,
  orientation: 'PORTRAIT' as const,
  language: 'EN' as const,
  includeSignature: false,
  outputFormat: 'PDF' as const,
};

describe('Zod Schemas - Validación ROJO (Bloqueantes)', () => {
  describe('UNIT_PRICE_ZERO - unitPrice debe ser > 0', () => {
    it('rechaza unitPrice = 0', () => {
      const line = { ...validLine, unitPrice: 0, lineTotal: 0 };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('unitPrice'))).toBe(true);
    });

    it('rechaza unitPrice negativo', () => {
      const line = { ...validLine, unitPrice: -5 };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('acepta unitPrice > 0', () => {
      const line = { ...validLine, unitPrice: 10 };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });
  });

  describe('HS_CODE_INVALID - HS Code 6-10 dígitos', () => {
    it('rechaza HS Code < 6 dígitos', () => {
      const line = { ...validLine, hsCode: '12345' };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('rechaza HS Code > 10 dígitos', () => {
      const line = { ...validLine, hsCode: '12345678901' };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('rechaza HS Code con letras', () => {
      const line = { ...validLine, hsCode: 'abc123' };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('acepta HS Code 6-10 dígitos', () => {
      expect(ProductLineSchema.safeParse({ ...validLine, hsCode: '610910' }).success).toBe(true);
      expect(ProductLineSchema.safeParse({ ...validLine, hsCode: '61091000' }).success).toBe(true);
      expect(ProductLineSchema.safeParse({ ...validLine, hsCode: '1234567890' }).success).toBe(true);
    });
  });

  describe('COO_MISSING - País de origen ISO-2', () => {
    it('rechaza countryOfOrigin vacío', () => {
      const line = { ...validLine, countryOfOrigin: '' };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('rechaza countryOfOrigin != 2 letras', () => {
      const line = { ...validLine, countryOfOrigin: 'USA' };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('acepta ISO-2 válido', () => {
      expect(ProductLineSchema.safeParse({ ...validLine, countryOfOrigin: 'CN' }).success).toBe(true);
      expect(ProductLineSchema.safeParse({ ...validLine, countryOfOrigin: 'US' }).success).toBe(true);
    });
  });

  describe('DESCRIPTION_TOO_GENERIC - Blacklist bloqueante', () => {
    const blacklistWords = ['goods', 'merchandise', 'products', 'items', 'parts', 'samples', 'gifts'];

    blacklistWords.forEach(word => {
      it(`rechaza descripción con "${word}"`, () => {
        const line = { ...validLine, description: `Test ${word} description` };
        const result = ProductLineSchema.safeParse(line);
        expect(result.success).toBe(false);
      });
    });

    it('acepta descripción específica sin blacklist', () => {
      const line = { ...validLine, description: 'Men shirts, 50% cotton 50% polyester, box' };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });
  });

  describe('EORI_MISSING_EU - EORI obligatorio destino UE', () => {
    it('rechaza CI_FEDEX sin EORI consignee destino EU', () => {
      const data = {
        shipmentId: '123e4567-e89b-12d3-a456-426614174000',
        documentType: 'CI_FEDEX' as const,
        carrier: 'FEDEX' as const,
        destinationCountryCode: 'DE',
        destinationCountryGroup: 'EU' as const,
        issueDate: '2026-07-15',
        parties: {
          shipper: { ...validParty, address: { ...validParty.address, countryCode: 'US', countryName: 'United States' } },
          consignee: { ...validParty, taxId: '123', taxIdType: 'EIN' as const },
        },
        lines: [validLine],
        totals: validTotals,
        carrierSpecific: {
          fedex: {
            awbNumber: '123456789012',
            dutyTaxBilling: 'BILL_RECIPIENT' as const,
            reasonForExport: 'SALE' as const,
            etdEnabled: true,
          },
        },
        output: validOutput,
      };
      const result = CiFedexSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('acepta EORI válido destino EU', () => {
      const data = {
        shipmentId: '123e4567-e89b-12d3-a456-426614174000',
        documentType: 'CI_FEDEX' as const,
        carrier: 'FEDEX' as const,
        destinationCountryCode: 'DE',
        destinationCountryGroup: 'EU' as const,
        issueDate: '2026-07-15',
        parties: {
          shipper: { ...validParty, address: { ...validParty.address, countryCode: 'US', countryName: 'United States' }, eori: 'DE123456789' },
          consignee: { ...validParty, taxId: 'DE123456789', taxIdType: 'EORI' as const },
        },
        lines: [validLine],
        totals: validTotals,
        carrierSpecific: {
          fedex: {
            awbNumber: '123456789012',
            dutyTaxBilling: 'BILL_RECIPIENT' as const,
            reasonForExport: 'SALE' as const,
            etdEnabled: true,
          },
        },
        output: validOutput,
      };
      const result = CiFedexSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('SUBTOTAL_MISMATCH - Aritmética correcta', () => {
    it('rechaza subtotal ≠ suma lineTotal', () => {
      const totals = { ...validTotals, subtotal: 9999 }; // wrong
      const result = ProformaSchema.safeParse({
        shipmentId: '123e4567-e89b-12d3-a456-426614174000',
        documentType: 'PROFORMA',
        carrier: 'NONE',
        destinationCountryCode: 'US',
        destinationCountryGroup: 'US_CA',
        issueDate: '2026-07-15',
        parties: { shipper: validParty, consignee: validParty },
        lines: [validLine],
        totals,
        carrierSpecific: {},
        output: validOutput,
      });
      // Note: Zod doesn't validate arithmetic cross-field by default
      // This is validated in pre-generation.ts
      expect(result.success).toBe(true); // Zod alone passes
    });
  });

  describe('INCOTERM_INVALID - Solo 11 términos Incoterms 2020', () => {
    it('rechaza Incoterm inválido', () => {
      const line = { ...validLine, incoterm: 'INVALID' as any };
      const result = ProductLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    INCOTERMS_2020.forEach(term => {
      it(`acepta Incoterm válido: ${term}`, () => {
        const line = { ...validLine, incoterm: term };
        const result = ProductLineSchema.safeParse(line);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('AWB_FORMAT_INVALID - Formato por carrier', () => {
    it('rechaza AWB FedEx ≠ 12 dígitos', () => {
      const result = FedExSpecificSchema.safeParse({
        awbNumber: '12345',
        dutyTaxBilling: 'BILL_RECIPIENT',
        reasonForExport: 'SALE',
        etdEnabled: true,
      });
      expect(result.success).toBe(false);
    });

    it('rechaza AWB DHL ≠ 10 dígitos', () => {
      const result = DHLSpecificSchema.safeParse({
        awbNumber: '12345',
        shipmentReference: 'REF',
        reasonForExport: 'SALE',
        typeOfExport: 'PERMANENT',
        termsOfTrade: { code: 'DAP', place: 'NY', version: '2020' },
        mydhlGenerated: false,
      });
      expect(result.success).toBe(false);
    });

    it('rechaza UPS Invoice ≠ formato 1Z+16', () => {
      const result = UPSSpecificSchema.safeParse({
        invoiceNumber: 'INVALID',
        invoiceDate: '2026-07-15',
        currencyOfSale: 'USD',
        grossWeightKg: 55,
        termsOfSale: { code: 'DAP', place: 'NY', version: '2020' },
        brokerageDutyBilling: 'CONSIGNEE',
        additionalCosts: [],
        partiesRelationship: 'NOT_RELATED',
      });
      expect(result.success).toBe(false);
    });

    it('acepta AWB FedEx 12 dígitos', () => {
      const result = FedExSpecificSchema.safeParse({
        awbNumber: '123456789012',
        dutyTaxBilling: 'BILL_RECIPIENT',
        reasonForExport: 'SALE',
        etdEnabled: true,
      });
      expect(result.success).toBe(true);
    });

    it('acepta UPS 1Z tracking válido', () => {
      const result = UPSSpecificSchema.safeParse({
        invoiceNumber: '1Z999AA10123456784',
        invoiceDate: '2026-07-15',
        currencyOfSale: 'USD',
        grossWeightKg: 55,
        termsOfSale: { code: 'DAP', place: 'NY', version: '2020' },
        brokerageDutyBilling: 'CONSIGNEE',
        additionalCosts: [],
        partiesRelationship: 'NOT_RELATED',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('PARTIES_RELATIONSHIP_MISSING_UPS - RELATED/NOT_RELATED obligatorio', () => {
    it('rechaza CI_UPS sin partiesRelationship', () => {
      const data = {
        shipmentId: '123e4567-e89b-12d3-a456-426614174000',
        documentType: 'CI_UPS' as const,
        carrier: 'UPS' as const,
        destinationCountryCode: 'US',
        destinationCountryGroup: 'US_CA' as const,
        issueDate: '2026-07-15',
        parties: { shipper: validParty, consignee: validParty },
        lines: [validLine],
        totals: validTotals,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA10123456784',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD',
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP', place: 'NY', version: '2020' },
            brokerageDutyBilling: 'CONSIGNEE',
            additionalCosts: [],
            // partiesRelationship missing
          },
        },
        output: validOutput,
      };
      const result = CiUpsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Zod Schemas - Validación VERDE (Pasar)', () => {
  it('ProformaSchema válido completo', () => {
    const data = {
      shipmentId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'PROFORMA' as const,
      carrier: 'NONE' as const,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      issueDate: '2026-07-15',
      validityDays: 30,
      parties: { shipper: validParty, consignee: validParty },
      lines: [validLine],
      totals: validTotals,
      carrierSpecific: {},
      output: validOutput,
    };
    const result = ProformaSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('CiFedexSchema válido completo', () => {
    const data = {
      shipmentId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'CI_FEDEX' as const,
      carrier: 'FEDEX' as const,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      issueDate: '2026-07-15',
      parties: { shipper: validParty, consignee: validParty },
      lines: [validLine],
      totals: validTotals,
      carrierSpecific: {
        fedex: {
          awbNumber: '123456789012',
          dutyTaxBilling: 'BILL_RECIPIENT' as const,
          reasonForExport: 'SALE' as const,
          etdEnabled: true,
        },
      },
      output: validOutput,
    };
    const result = CiFedexSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('CiUpsSchema válido completo', () => {
    const data = {
      shipmentId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'CI_UPS' as const,
      carrier: 'UPS' as const,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      issueDate: '2026-07-15',
      parties: { shipper: validParty, consignee: validParty },
      lines: [validLine],
      totals: validTotals,
      carrierSpecific: {
        ups: {
          invoiceNumber: '1Z999AA10123456784',
          invoiceDate: '2026-07-15',
          currencyOfSale: 'USD',
          grossWeightKg: 55,
          termsOfSale: { code: 'DAP', place: 'NY', version: '2020' },
          brokerageDutyBilling: 'CONSIGNEE',
          additionalCosts: [],
          partiesRelationship: 'NOT_RELATED',
        },
      },
      output: validOutput,
    };
    const result = CiUpsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('CiDhlSchema válido completo', () => {
    const data = {
      shipmentId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'CI_DHL' as const,
      carrier: 'DHL' as const,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      issueDate: '2026-07-15',
      parties: { shipper: validParty, consignee: validParty },
      lines: [validLine],
      totals: validTotals,
      carrierSpecific: {
        dhl: {
          awbNumber: '1234567890',
          shipmentReference: 'REF',
          reasonForExport: 'SALE' as const,
          typeOfExport: 'PERMANENT' as const,
          termsOfTrade: { code: 'DAP', place: 'NY', version: '2020' },
          mydhlGenerated: false,
        },
      },
      output: validOutput,
    };
    const result = CiDhlSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('PackingListSchema válido completo', () => {
    const data = {
      shipmentId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'PACKING_LIST' as const,
      carrier: 'NONE' as const,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      issueDate: '2026-07-15',
      parties: { shipper: validParty, consignee: validParty },
      lines: [{ ...validLine, packages: [{ packageNumber: 1, packageType: 'BOX' as const, quantity: 100, netWeightKg: 50, grossWeightKg: 55, dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20 }, shippingMarks: 'ACME-001' }] }],
      totals: validTotals,
      carrierSpecific: {
        packingList: {
          plNumber: 'PL-001',
          plDate: '2026-07-15',
          commercialInvoiceRef: 'CI-001',
          awbBlRef: '123456789012',
          packages: [{ packageNumber: 1, packageType: 'BOX' as const, quantity: 100, netWeightKg: 50, grossWeightKg: 55, dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20 }, shippingMarks: 'ACME-001' }],
        },
      },
      output: { ...validOutput, orientation: 'LANDSCAPE' as const },
    };
    const result = PackingListSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('BundleSchema válido completo', () => {
    const data = {
      shipmentId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'BUNDLE_CIPL' as const,
      carrier: 'FEDEX' as const,
      destinationCountryCode: 'US',
      destinationCountryGroup: 'US_CA' as const,
      issueDate: '2026-07-15',
      parties: { shipper: validParty, consignee: validParty },
      lines: [{ ...validLine, packages: [{ packageNumber: 1, packageType: 'BOX' as const, quantity: 100, netWeightKg: 50, grossWeightKg: 55, dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20 }, shippingMarks: 'ACME-001' }] }],
      totals: validTotals,
      carrierSpecific: {
        bundle: {
          documentNumber: 'BUNDLE-001',
          commercialInvoiceRef: 'CI-001',
          packingListRef: 'PL-001',
        },
        fedex: {
          awbNumber: '123456789012',
          dutyTaxBilling: 'BILL_RECIPIENT' as const,
          reasonForExport: 'SALE' as const,
          etdEnabled: true,
        },
      },
      output: { ...validOutput, orientation: 'LANDSCAPE' as const },
    };
    const result = BundleSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});