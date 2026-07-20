// ============================================================================
// Shipment fixtures — valid test data aligned to Informe specs (July 2026)
// ============================================================================
import type {
  ShipmentData, DocumentType, Carrier, CountryGroup, Parties, ProductLine,
  CarrierSpecificData, OutputConfig, Incoterm2020, Currency, UOM,
} from '@/types/shipment';

const baseParties = (overrides: Partial<Parties> = {}): Parties => ({
  shipper: {
    legalName: 'Global Trade LLC',
    taxId: '999999999',
    taxIdType: 'EIN',
    address: {
      street: '123 Commerce St',
      street2: 'Suite 100',
      city: 'Miami',
      stateProvince: 'FL',
      postalCode: '33101',
      countryCode: 'US',
      countryName: 'United States',
    },
    phone: '+1-305-555-0100',
    email: 'ship@globaltrade.com',
    ...overrides.shipper,
  },
  consignee: {
    legalName: 'International Buyer SA',
    taxId: 'ABC123456XXX', // Valid RFC: 3 letters + 6 digits + 3 alphanumeric (sin guiones)
    taxIdType: 'RFC',
    address: {
      street: 'Av. Reforma 100',
      city: 'Ciudad de México',
      stateProvince: 'CDMX',
      postalCode: '06600',
      countryCode: 'MX',
      countryName: 'Mexico',
    },
    phone: '+52-55-5555-0100',
    email: 'buyer@ibuyer.mx',
    ...overrides.consignee,
  },
  ...overrides,
});

const baseLines = (count = 1, overrides: Partial<ProductLine>[] = []): ProductLine[] =>
  Array.from({ length: count }, (_, i) => ({
    lineNumber: i + 1,
    sku: `SKU-${i + 1}`,
    description: `Electronics component - ${i + 1}`,
    hsCode: '853400',
    hsCodeSource: 'USER',
    countryOfOrigin: 'MX',
    countryOfOriginName: 'Mexico',
    quantity: 10,
    uom: 'PCS',
    unitPrice: 25.5,
    currency: 'USD',
    lineTotal: 255,
    netWeightKg: 5,
    grossWeightKg: 5.5,
    dimensions: { lengthCm: 30, widthCm: 20, heightCm: 15 },
    packages: [{
      packageNumber: 1,
      packageType: 'BOX',
      quantity: 10,
      netWeightKg: 5,
      grossWeightKg: 5.5,
      dimensions: { lengthCm: 30, widthCm: 20, heightCm: 15 },
      shippingMarks: 'FRAGILE-123',
    }],
    ...(overrides[i] || {}),
  }));

const baseOutput = (overrides: Partial<OutputConfig> = {}): OutputConfig => ({
  paperSize: 'LETTER',
  orientation: 'PORTRAIT',
  language: 'EN',
  includeSignature: true,
  outputFormat: 'PDF',
  ...overrides,
});

const baseCarrierSpecific = {
  fedex: undefined as any,
  ups: undefined as any,
  dhl: undefined as any,
  packingList: undefined as any,
  bundle: undefined as any,
};

// ============================================================================
// Factory per document type (Informe compliant)
// ============================================================================

export function makeFixture(docType: DocumentType, overrides: Partial<ShipmentData> = {}): ShipmentData {
  const carrier: Carrier = docType === 'CI_FEDEX' ? 'FEDEX'
    : docType === 'CI_UPS' ? 'UPS'
    : docType === 'CI_DHL' ? 'DHL' : 'NONE';

  const destGroup: CountryGroup = overrides.destinationCountryCode === 'US' || overrides.destinationCountryCode === 'CA' ? 'US_CA'
    : overrides.destinationCountryCode === 'MX' ? 'MX'
    : ['DE','FR','ES','IT','NL'].some(c => c === overrides.destinationCountryCode) ? 'EU'
    : 'REST_OF_WORLD';

  const common = {
    shipmentId: 'test-uuid-1234',
    documentType: docType as DocumentType,
    carrier,
    destinationCountryCode: 'MX',
    destinationCountryGroup: destGroup,
    issueDate: '2026-07-20',
    parties: baseParties(),
    lines: baseLines(1),
    totals: {
      totalLines: 1,
      totalQuantity: 10,
      totalNetWeightKg: 5,
      totalGrossWeightKg: 5.5,
      totalVolumeCbm: 0.009,
      totalPackages: 1,
      subtotal: 255,
      totalAdditionalCosts: 0,
      grandTotal: 255,
      currency: 'USD' as const,
    },
    carrierSpecific: { ...baseCarrierSpecific },
    output: baseOutput(),
    ...overrides,
  };

  // Type-specific enrichment
  if (docType === 'PROFORMA') {
    return { ...common, validityDays: 30, carrier: 'NONE' };
  }

  if (docType === 'CI_FEDEX') {
    return {
      ...common,
      carrierSpecific: {
        ...baseCarrierSpecific,
        fedex: {
          awbNumber: '123456789012', // 12 digits
          exportReferences: 'PO-12345',
          dutyTaxBilling: 'BILL_RECIPIENT',
          reasonForExport: 'SALE',
          etdEnabled: true,
        },
      },
    };
  }

  if (docType === 'CI_UPS') {
    return {
      ...common,
      carrierSpecific: {
        ...baseCarrierSpecific,
        ups: {
          invoiceNumber: '1Z999AA10123456784', // 1Z + 16 chars
          invoiceDate: '2026-07-20',
          currencyOfSale: 'USD',
          grossWeightKg: 5.5,
          termsOfSale: { code: 'DAP', place: 'Mexico City', version: '2020' },
          brokerageDutyBilling: 'CONSIGNEE',
          additionalCosts: [],
          partiesRelationship: 'NOT_RELATED',
          usmcaCertification: undefined, // optional, tested separately
        },
      },
    };
  }

  if (docType === 'CI_DHL') {
    return {
      ...common,
      carrierSpecific: {
        ...baseCarrierSpecific,
        dhl: {
          awbNumber: '1234567890', // 10 digits
          shipmentReference: 'REF-999',
          reasonForExport: 'SALE',
          typeOfExport: 'PERMANENT',
          termsOfTrade: { code: 'DAP', place: 'Mexico City', version: '2020' },
          mydhlGenerated: true,
        },
      },
    };
  }

  if (docType === 'PACKING_LIST') {
    return {
      ...common,
      carrier: 'NONE',
      carrierSpecific: {
        ...baseCarrierSpecific,
        packingList: {
          plNumber: 'PL-2026-001',
          plDate: '2026-07-20',
          commercialInvoiceRef: 'CI-FX-001',
          awbBlRef: '1234567890',
          notifyParty: undefined, // maritime optional
          incoterm: undefined,
          packages: baseLines(1)[0].packages || [],
        },
      },
      output: { ...baseOutput(), orientation: 'LANDSCAPE' },
    };
  }

  if (docType === 'BUNDLE_CIPL') {
    return {
      ...common,
      carrierSpecific: {
        ...baseCarrierSpecific,
        bundle: {
          documentNumber: 'BUNDLE-2026-001',
          commercialInvoiceRef: 'CI-FX-001',
          packingListRef: 'PL-001',
        },
      },
      output: { ...baseOutput(), orientation: 'LANDSCAPE' },
    };
  }

  return common;
}