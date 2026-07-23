/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { runPreGenerationChecks } from '@/validation/pre-generation';
import type { ShipmentData, DocumentType, Carrier, CountryGroup, TaxIdType, UOM, Currency, PackageType, Incoterm2020, OutputFormat } from '@/types/shipment';

const baseValidData: ShipmentData = {
  shipmentId: '123e4567-e89b-12d3-a456-426614174000',
  documentType: 'CI_FEDEX' as DocumentType,
  carrier: 'FEDEX' as Carrier,
  destinationCountryCode: 'US',
  destinationCountryGroup: 'US_CA' as CountryGroup,
  issueDate: '2026-07-15',
  parties: {
    shipper: {
      legalName: 'Test Exporter',
      taxId: '123456789',
      taxIdType: 'EIN' as TaxIdType,
      address: {
        street: '123 Main St',
        city: 'New York',
        stateProvince: 'NY',
        postalCode: '10001',
        countryCode: 'US',
        countryName: 'United States',
      },
    },
    consignee: {
      legalName: 'Test Importer',
      taxId: '987654321',
      taxIdType: 'EIN' as TaxIdType,
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        stateProvince: 'CA',
        postalCode: '90001',
        countryCode: 'US',
        countryName: 'United States',
      },
    },
  },
  lines: [
    {
      lineNumber: 1,
      description: 'Men shirts, 50% cotton 50% polyester, box',
      hsCode: '610910',
      hsCodeSource: 'USER' as const,
      countryOfOrigin: 'CN',
      countryOfOriginName: 'China',
      quantity: 100,
      uom: 'PCS' as UOM,
      unitPrice: 15.50,
      currency: 'USD' as Currency,
      lineTotal: 1550,
      netWeightKg: 50,
      grossWeightKg: 55,
      incoterm: 'DAP' as Incoterm2020,
      packages: [{
        packageNumber: 1,
        packageType: 'BOX' as PackageType,
        quantity: 100,
        netWeightKg: 50,
        grossWeightKg: 55,
        dimensions: { lengthCm: 30, widthCm: 20, heightCm: 15 },
        shippingMarks: 'TEST-001',
      }],
    },
  ],
  totals: {
    totalLines: 1,
    totalQuantity: 100,
    totalNetWeightKg: 50,
    totalGrossWeightKg: 55,
    totalVolumeCbm: 0.5,
    totalPackages: 5,
    subtotal: 1550,
    totalAdditionalCosts: 100,
    grandTotal: 1650,
    currency: 'USD' as Currency,
  },
  carrierSpecific: {
    fedex: {
      awbNumber: '123456789012',
      exportReferences: 'PO-12345',
      dutyTaxBilling: 'BILL_RECIPIENT' as const,
      reasonForExport: 'SALE' as const,
      etdEnabled: true,
    },
  },
  output: {
        paperSize: 'LETTER' as const,
        orientation: 'PORTRAIT' as const,
        language: 'EN' as const,
        includeSignature: false,
        outputFormat: 'PDF' as OutputFormat,
      },
  };

describe('Pre-Generation Checks - RED (Blocking)', () => {
  describe('DESCRIPTION_BLACKLIST_WORD - blacklist is an ERROR (not a warning)', () => {
    it('generates a blocking error for blacklist words', () => {
      const data = {
        ...baseValidData,
        lines: [{ ...baseValidData.lines[0], description: 'Test goods merchandise description' }],
      };
      const result = runPreGenerationChecks(data);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
      expect(result.warnings.some(w => w.code === 'DESCRIPTION_BLACKLIST_WORD')).toBe(false);
    });
  });

  describe('HS_CODE_INVALID', () => {
    it('blocks HS Code < 6 digits', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], hsCode: '12345' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'HS_CODE_INVALID')).toBe(true);
    });

    it('blocks HS Code with letters', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], hsCode: 'abc123' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'HS_CODE_INVALID')).toBe(true);
    });
  });

  describe('COO_MISSING', () => {
    it('blocks empty country of origin', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], countryOfOrigin: '' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'COO_MISSING')).toBe(true);
    });
  });

  describe('DESCRIPTION_TOO_GENERIC', () => {
    const blacklistWords = ['goods', 'merchandise', 'products', 'items', 'parts', 'samples', 'gifts'] as const;

    blacklistWords.forEach(word => {
      it(`blocks description containing "${word}"`, () => {
        const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], description: `Test ${word} description` }] };
        const result = runPreGenerationChecks(data);
        expect(result.canGenerate).toBe(false);
        expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
      });
    });

    it('blocks description too short (< 20 chars)', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], description: 'Short desc' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
    });

    it('blocks UPS without package type in description', () => {
      const data = {
        ...baseValidData,
        carrier: 'UPS' as Carrier,
        documentType: 'CI_UPS' as DocumentType,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA10123456784',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD' as Currency,
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            brokerageDutyBilling: 'CONSIGNEE' as const,
            additionalCosts: [],
            partiesRelationship: 'NOT_RELATED' as const,
          },
        },
        lines: [{ ...baseValidData.lines[0], description: 'Men shirts, 50% cotton 50% polyester' }],
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
    });
  });

  describe('EORI_MISSING_EU', () => {
    it('blocks EU destination without importer EORI', () => {
      const data = {
        ...baseValidData,
        destinationCountryCode: 'DE',
        destinationCountryGroup: 'EU' as CountryGroup,
        parties: {
          ...baseValidData.parties,
          consignee: { ...baseValidData.parties.consignee, taxId: '123', taxIdType: 'EIN' as TaxIdType },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'EORI_MISSING_EU')).toBe(true);
    });
  });

  describe('INCOTERM_INVALID', () => {
    it('blocks invalid Incoterm', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], incoterm: 'INVALID' as any }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'INCOTERM_INVALID')).toBe(true);
    });
  });

  describe('AWB_FORMAT_INVALID', () => {
    it('blocks FedEx AWB ≠ 12 digits', () => {
      const data = { ...baseValidData, carrierSpecific: { fedex: { ...baseValidData.carrierSpecific.fedex!, awbNumber: '12345' } } };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'AWB_FORMAT_INVALID')).toBe(true);
    });

    it('blocks DHL AWB ≠ 10 digits', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_DHL' as DocumentType,
        carrier: 'DHL' as Carrier,
        carrierSpecific: {
          dhl: {
            awbNumber: '12345',
            shipmentReference: 'REF',
            reasonForExport: 'SALE' as const,
            typeOfExport: 'PERMANENT' as const,
            termsOfTrade: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            mydhlGenerated: false,
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'AWB_FORMAT_INVALID')).toBe(true);
    });

    it('blocks invalid UPS invoice number (not 1Z + 16 alphanumerics)', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS' as DocumentType,
        carrier: 'UPS' as Carrier,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA1012345678', // 17 chars, should be 18 (1Z + 16)
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD' as Currency,
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            brokerageDutyBilling: 'CONSIGNEE' as const,
            additionalCosts: [],
            partiesRelationship: 'NOT_RELATED' as const,
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'UPS_INVOICE_NUMBER_INVALID')).toBe(true);
    });
  });

  describe('PARTIES_RELATIONSHIP_MISSING_UPS', () => {
    it('blocks CI_UPS without partiesRelationship', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS' as DocumentType,
        carrier: 'UPS' as Carrier,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA10123456784',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD' as Currency,
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            brokerageDutyBilling: 'CONSIGNEE' as const,
            additionalCosts: [],
            // partiesRelationship missing - testing validation error
          },
        },
      } as unknown as ShipmentData;
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'PARTIES_RELATIONSHIP_MISSING_UPS')).toBe(true);
    });
  });

  describe('WEIGHT_MISMATCH_BUNDLE', () => {
    it('blocks Bundle with gross weight ≠ sum of lines', () => {
      const data = {
        ...baseValidData,
        documentType: 'BUNDLE_CIPL' as DocumentType,
        carrier: 'FEDEX' as Carrier,
        lines: [
          { ...baseValidData.lines[0], grossWeightKg: 55, packages: [{ packageNumber: 1, packageType: 'BOX' as PackageType, quantity: 100, netWeightKg: 50, grossWeightKg: 55, dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20 }, shippingMarks: 'ACME-001' }] },
        ],
        totals: { ...baseValidData.totals, totalGrossWeightKg: 999 },
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
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'WEIGHT_MISMATCH_BUNDLE')).toBe(true);
    });
  });
});

describe('Pre-Generation Checks - AMBER (Warnings)', () => {
  describe('RFC_REQUIRED_MX', () => {
    it('blocks Mexican shipper on CI without a valid RFC', () => {
      const data = {
        ...baseValidData,
        parties: {
          ...baseValidData.parties,
          shipper: {
            ...baseValidData.parties.shipper,
            address: { ...baseValidData.parties.shipper.address, countryCode: 'MX', countryName: 'Mexico' },
            taxId: 'INVALID',
            taxIdType: 'RFC' as TaxIdType,
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(w => w.code === 'RFC_REQUIRED_MX')).toBe(true);
    });
  });

  describe('PAPER_INVOICE_SURCHARGE_UPS', () => {
    it('warns when UPS without EDI/Paperless', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS' as DocumentType,
        carrier: 'UPS' as Carrier,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA10123456784',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD' as Currency,
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            brokerageDutyBilling: 'CONSIGNEE' as const,
            additionalCosts: [],
            partiesRelationship: 'NOT_RELATED' as const,
          },
        },
        output: { ...baseValidData.output, outputFormat: 'PDF' as OutputFormat },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'PAPER_INVOICE_SURCHARGE_UPS')).toBe(true);
    });

    it('does not warn when UPS uses EDI_JSON', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS' as DocumentType,
        carrier: 'UPS' as Carrier,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA10123456784',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD' as Currency,
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            brokerageDutyBilling: 'CONSIGNEE' as const,
            additionalCosts: [],
            partiesRelationship: 'NOT_RELATED' as const,
          },
        },
        output: { ...baseValidData.output, outputFormat: 'EDI_JSON' as OutputFormat, ediFormat: 'UPS_PAPERLESS' as const },
      };
      const result = runPreGenerationChecks(data);
      expect(result.warnings.some(w => w.code === 'PAPER_INVOICE_SURCHARGE_UPS')).toBe(false);
    });
  });

  describe('DE_MINIMIS_SUSPENDED_US', () => {
      it('warns for US shipment < $800', () => {
        const data = { 
          ...baseValidData, 
          destinationCountryCode: 'US', 
          lines: [{
            ...baseValidData.lines[0],
            unitPrice: 4,
            lineTotal: 400,
          }],
          totals: { 
            ...baseValidData.totals, 
            subtotal: 400,
            totalAdditionalCosts: 0,
            grandTotal: 400 
          } 
        };
        const result = runPreGenerationChecks(data);
        expect(result.canGenerate).toBe(true);
        expect(result.warnings.some(w => w.code === 'DE_MINIMIS_SUSPENDED_US')).toBe(true);
      });
    });

  describe('BUNDLE_NOT_ACCEPTED_DESTINATION', () => {
    it('warns when LATAM destination requires separate CI+PL', () => {
      const data = {
        ...baseValidData,
        documentType: 'BUNDLE_CIPL' as DocumentType,
        destinationCountryCode: 'BR',
        carrier: 'FEDEX' as Carrier,
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
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'BUNDLE_NOT_ACCEPTED_DESTINATION')).toBe(true);
    });
  });

  describe('PROFORMA_USED_AS_CI', () => {
      it('blocks (RED) Proforma from being used for customs clearance — Proforma NOT generable', () => {
        const data = { ...baseValidData, documentType: 'PROFORMA' as DocumentType, carrier: 'NONE' as Carrier, carrierSpecific: {} };
        const result = runPreGenerationChecks(data);
        expect(result.canGenerate).toBe(false);
        expect(result.blockingErrors.some(e => e.code === 'PROFORMA_USED_AS_CI')).toBe(true);
      });
    });

  describe('NAFTA_OBSOLETE_CHECK', () => {
    it('warns for UPS CI without USMCA cert', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS' as DocumentType,
        carrier: 'UPS' as Carrier,
        carrierSpecific: {
          ups: {
            invoiceNumber: '1Z999AA10123456784',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD' as Currency,
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
            brokerageDutyBilling: 'CONSIGNEE' as const,
            additionalCosts: [],
            partiesRelationship: 'NOT_RELATED' as const,
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'NAFTA_OBSOLETE_CHECK')).toBe(true);
    });
  });

  describe('DESCRIPTION_BLACKLIST_WORD (warning level)', () => {
    it('does not generate a warning (blacklist is a blocking ERROR)', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], description: 'Test goods description with box' }] };
      const result = runPreGenerationChecks(data);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
      expect(result.warnings.some(w => w.code === 'DESCRIPTION_BLACKLIST_WORD')).toBe(false);
    });
  });
});

describe('Pre-Generation Checks - VERDE (Todo pasa)', () => {
  it('allows generation with fully valid data', () => {
    const result = runPreGenerationChecks(baseValidData);
    expect(result.canGenerate).toBe(true);
    expect(result.blockingErrors).toHaveLength(0);
  });

  it('allows fully valid CI_UPS', () => {
    const data: ShipmentData = {
      ...baseValidData,
      documentType: 'CI_UPS' as DocumentType,
      carrier: 'UPS' as Carrier,
      carrierSpecific: {
        ups: {
          invoiceNumber: '1Z999AA10123456784',
          invoiceDate: '2026-07-15',
          currencyOfSale: 'USD' as Currency,
          grossWeightKg: 55,
          termsOfSale: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
          brokerageDutyBilling: 'CONSIGNEE' as const,
          additionalCosts: [],
          partiesRelationship: 'NOT_RELATED' as const,
        },
      },
    };
    const result = runPreGenerationChecks(data);
    expect(result.canGenerate).toBe(true);
  });

  it('allows fully valid CI_DHL', () => {
    const data = {
      ...baseValidData,
      documentType: 'CI_DHL' as DocumentType,
      carrier: 'DHL' as Carrier,
      carrierSpecific: {
        dhl: {
          awbNumber: '1234567890',
          shipmentReference: 'REF',
          reasonForExport: 'SALE' as const,
          typeOfExport: 'PERMANENT' as const,
          termsOfTrade: { code: 'DAP' as Incoterm2020, place: 'NY', version: '2020' as const },
          mydhlGenerated: false,
        },
      },
    };
    const result = runPreGenerationChecks(data);
    expect(result.canGenerate).toBe(true);
  });
});