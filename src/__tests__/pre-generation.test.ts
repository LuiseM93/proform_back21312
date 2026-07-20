import { describe, it, expect } from 'vitest';
import { runPreGenerationChecks } from '@/validation/pre-generation';
import type { ShipmentData } from '@/types/shipment';

const baseValidData: ShipmentData = {
  shipmentId: '123e4567-e89b-12d3-a456-426614174000',
  documentType: 'CI_FEDEX',
  carrier: 'FEDEX',
  destinationCountryCode: 'US',
  destinationCountryGroup: 'US_CA',
  issueDate: '2026-07-15',
  parties: {
    shipper: {
      legalName: 'Test Exporter',
      taxId: '123456789',
      taxIdType: 'EIN',
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
      taxIdType: 'EIN',
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
      hsCodeSource: 'USER',
      countryOfOrigin: 'CN',
      countryOfOriginName: 'China',
      quantity: 100,
      uom: 'PCS',
      unitPrice: 15.50,
      currency: 'USD',
      lineTotal: 1550,
      netWeightKg: 50,
      grossWeightKg: 55,
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
    currency: 'USD',
  },
  carrierSpecific: {
    fedex: {
      awbNumber: '123456789012',
      dutyTaxBilling: 'BILL_RECIPIENT',
      reasonForExport: 'SALE',
      etdEnabled: true,
    },
  },
  output: {
    paperSize: 'LETTER',
    orientation: 'PORTRAIT',
    language: 'EN',
    includeSignature: false,
    outputFormat: 'PDF',
  },
};

describe('Pre-Generation Checks - ROJO (Bloqueantes)', () => {
  describe('DESCRIPTION_BLACKLIST_WORD (warning level) > genera warning por palabras genéricas (además de error)', () => {
      it('genera warning para blacklist words en pre-generation', () => {
        const data = {
          ...baseValidData,
          lines: [{ ...baseValidData.lines[0], description: 'Test goods merchandise description' }],
        };
        const result = runPreGenerationChecks(data);
        expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
        // FASE 1: blacklist ahora es ERROR (blocking), no warning
        expect(result.warnings.some(w => w.code === 'DESCRIPTION_BLACKLIST_WORD')).toBe(false);
      });
    });

  describe('HS_CODE_INVALID', () => {
    it('bloquea HS Code < 6 dígitos', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], hsCode: '12345' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'HS_CODE_INVALID')).toBe(true);
    });

    it('bloquea HS Code con letras', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], hsCode: 'abc123' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'HS_CODE_INVALID')).toBe(true);
    });
  });

  describe('COO_MISSING', () => {
    it('bloquea país de origen vacío', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], countryOfOrigin: '' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'COO_MISSING')).toBe(true);
    });
  });

  describe('DESCRIPTION_TOO_GENERIC', () => {
    const blacklistWords = ['goods', 'merchandise', 'products', 'items', 'parts', 'samples', 'gifts'];

    blacklistWords.forEach(word => {
      it(`bloquea descripción con "${word}"`, () => {
        const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], description: `Test ${word} description` }] };
        const result = runPreGenerationChecks(data);
        expect(result.canGenerate).toBe(false);
        expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
      });
    });

    it('bloquea descripción muy corta (< 20 chars)', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], description: 'Short desc' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
    });

    it('bloquea UPS sin tipo de empaque en descripción', () => {
      const data = {
        ...baseValidData,
        carrier: 'UPS',
        documentType: 'CI_UPS',
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
        lines: [{ ...baseValidData.lines[0], description: 'Men shirts, 50% cotton 50% polyester' }], // sin box/carton/pallet
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true);
    });
  });

  describe('EORI_MISSING_EU', () => {
    it('bloquea destino UE sin EORI importador', () => {
      const data = {
        ...baseValidData,
        destinationCountryCode: 'DE',
        destinationCountryGroup: 'EU',
        parties: {
          ...baseValidData.parties,
          consignee: { ...baseValidData.parties.consignee, taxId: '123', taxIdType: 'EIN' },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'EORI_MISSING_EU')).toBe(true);
    });
  });

  describe('INCOTERM_INVALID', () => {
    it('bloquea Incoterm inválido', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], incoterm: 'INVALID' }] };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'INCOTERM_INVALID')).toBe(true);
    });
  });

  describe('AWB_FORMAT_INVALID', () => {
    it('bloquea AWB FedEx ≠ 12 dígitos', () => {
      const data = { ...baseValidData, carrierSpecific: { fedex: { ...baseValidData.carrierSpecific.fedex!, awbNumber: '12345' } } };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'AWB_FORMAT_INVALID')).toBe(true);
    });

    it('bloquea AWB DHL ≠ 10 dígitos', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_DHL',
        carrier: 'DHL',
        carrierSpecific: {
          dhl: {
            awbNumber: '12345',
            shipmentReference: 'REF',
            reasonForExport: 'SALE',
            typeOfExport: 'PERMANENT',
            termsOfTrade: { code: 'DAP', place: 'NY', version: '2020' },
            mydhlGenerated: false,
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'AWB_FORMAT_INVALID')).toBe(true);
    });

    it('bloquea UPS tracking 1Z inválido', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS',
        carrier: 'UPS',
        carrierSpecific: {
          ups: {
            invoiceNumber: 'INVALID',
            invoiceDate: '2026-07-15',
            currencyOfSale: 'USD',
            grossWeightKg: 55,
            termsOfSale: { code: 'DAP', place: 'NY', version: '2020' },
            brokerageDutyBilling: 'CONSIGNEE',
            additionalCosts: [],
            partiesRelationship: 'NOT_RELATED',
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'AWB_FORMAT_INVALID')).toBe(true);
    });
  });

  describe('PARTIES_RELATIONSHIP_MISSING_UPS', () => {
    it('bloquea CI_UPS sin partiesRelationship', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS',
        carrier: 'UPS',
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
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(false);
      expect(result.blockingErrors.some(e => e.code === 'PARTIES_RELATIONSHIP_MISSING_UPS')).toBe(true);
    });
  });

  describe('WEIGHT_MISMATCH_BUNDLE', () => {
    it('bloquea Bundle con peso bruto ≠ suma líneas', () => {
      const data = {
        ...baseValidData,
        documentType: 'BUNDLE_CIPL',
        carrier: 'FEDEX',
        lines: [
          { ...baseValidData.lines[0], grossWeightKg: 55, packages: [{ packageNumber: 1, packageType: 'BOX', quantity: 100, netWeightKg: 50, grossWeightKg: 55, dimensions: { lengthCm: 40, widthCm: 30, heightCm: 20 }, shippingMarks: 'ACME-001' }] },
        ],
        totals: { ...baseValidData.totals, totalGrossWeightKg: 999 }, // wrong
        carrierSpecific: {
          bundle: {
            documentNumber: 'BUNDLE-001',
            commercialInvoiceRef: 'CI-001',
            packingListRef: 'PL-001',
          },
          fedex: {
            awbNumber: '123456789012',
            dutyTaxBilling: 'BILL_RECIPIENT',
            reasonForExport: 'SALE',
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

describe('Pre-Generation Checks - AMARILLO (Advertencias)', () => {
  describe('RFC_RECOMMENDED_MX', () => {
    it('advierte si exportador MX sin RFC válido', () => {
      const data = {
        ...baseValidData,
        parties: {
          ...baseValidData.parties,
          shipper: {
            ...baseValidData.parties.shipper,
            address: { ...baseValidData.parties.shipper.address, countryCode: 'MX', countryName: 'Mexico' },
            taxId: 'INVALID',
            taxIdType: 'RFC',
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true); // WARNING no bloquea
      expect(result.warnings.some(w => w.code === 'RFC_RECOMMENDED_MX')).toBe(true);
    });
  });

  describe('PAPER_INVOICE_SURCHARGE_UPS', () => {
    it('advierte si UPS sin EDI/Paperless', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS',
        carrier: 'UPS',
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
        output: { ...baseValidData.output, outputFormat: 'PDF' }, // no EDI
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'PAPER_INVOICE_SURCHARGE_UPS')).toBe(true);
    });

    it('no advierte si UPS usa EDI_JSON', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS',
        carrier: 'UPS',
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
        output: { ...baseValidData.output, outputFormat: 'EDI_JSON', ediFormat: 'UPS_PAPERLESS' },
      };
      const result = runPreGenerationChecks(data);
      expect(result.warnings.some(w => w.code === 'PAPER_INVOICE_SURCHARGE_UPS')).toBe(false);
    });
  });

  describe('DE_MINIMIS_SUSPENDED_US', () => {
    it('advierte envío US < $800', () => {
      const data = { ...baseValidData, destinationCountryCode: 'US', totals: { ...baseValidData.totals, grandTotal: 500 } };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'DE_MINIMIS_SUSPENDED_US')).toBe(true);
    });
  });

  describe('BUNDLE_NOT_ACCEPTED_DESTINATION', () => {
    it('advierte si destino LATAM requiere CI+PL separados', () => {
      const data = {
        ...baseValidData,
        documentType: 'BUNDLE_CIPL',
        destinationCountryCode: 'BR',
        carrier: 'FEDEX',
        carrierSpecific: {
          bundle: {
            documentNumber: 'BUNDLE-001',
            commercialInvoiceRef: 'CI-001',
            packingListRef: 'PL-001',
          },
          fedex: {
            awbNumber: '123456789012',
            dutyTaxBilling: 'BILL_RECIPIENT',
            reasonForExport: 'SALE',
            etdEnabled: true,
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'BUNDLE_NOT_ACCEPTED_DESTINATION')).toBe(true);
    });
  });

  describe('PROFORMA_NOT_FOR_CLEARANCE', () => {
    it('advierte Proforma no válida para despacho', () => {
      const data = { ...baseValidData, documentType: 'PROFORMA', carrier: 'NONE', carrierSpecific: {} };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'PROFORMA_NOT_FOR_CLEARANCE')).toBe(true);
    });
  });

  describe('NAFTA_OBSOLETE_CHECK', () => {
    it('advierte UPS CI sin USMCA cert', () => {
      const data = {
        ...baseValidData,
        documentType: 'CI_UPS',
        carrier: 'UPS',
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
            // no usmcaCertification
          },
        },
      };
      const result = runPreGenerationChecks(data);
      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.code === 'NAFTA_OBSOLETE_CHECK')).toBe(true);
    });
  });

  describe('DESCRIPTION_BLACKLIST_WORD (warning level)', () => {
    it('genera warning por palabras genéricas (además de error)', () => {
      const data = { ...baseValidData, lines: [{ ...baseValidData.lines[0], description: 'Test goods description with box' }] };
      const result = runPreGenerationChecks(data);
      expect(result.blockingErrors.some(e => e.code === 'DESCRIPTION_TOO_GENERIC')).toBe(true); // error bloqueante
      expect(result.warnings.some(w => w.code === 'DESCRIPTION_BLACKLIST_WORD')).toBe(true); // warning también
    });
  });
});

describe('Pre-Generation Checks - VERDE (Todo pasa)', () => {
  it('permite generar con datos completamente válidos', () => {
    const result = runPreGenerationChecks(baseValidData);
    expect(result.canGenerate).toBe(true);
    expect(result.blockingErrors).toHaveLength(0);
  });

  it('permite CI_UPS válido completo', () => {
    const data = {
      ...baseValidData,
      documentType: 'CI_UPS',
      carrier: 'UPS',
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
    };
    const result = runPreGenerationChecks(data);
    expect(result.canGenerate).toBe(true);
  });

  it('permite CI_DHL válido completo', () => {
    const data = {
      ...baseValidData,
      documentType: 'CI_DHL',
      carrier: 'DHL',
      carrierSpecific: {
        dhl: {
          awbNumber: '1234567890',
          shipmentReference: 'REF',
          reasonForExport: 'SALE',
          typeOfExport: 'PERMANENT',
          termsOfTrade: { code: 'DAP', place: 'NY', version: '2020' },
          mydhlGenerated: false,
        },
      },
    };
    const result = runPreGenerationChecks(data);
    expect(result.canGenerate).toBe(true);
  });
});