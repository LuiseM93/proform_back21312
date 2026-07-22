// ============================================================================
// EDI generation tests (spec §9) — G3
// ProformaFlow · FASE 3
// ============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { generateEDI, generateEDIFiltered } from '@/components/pdf/edi/generateEDI';
import type { ShipmentData } from '@/types/shipment';

function party(over: any = {}) {
  return {
    legalName: 'Acme Corp', taxId: 'EIN123', taxIdType: 'EIN',
    address: { street: '1 Main', city: 'Austin', stateProvince: 'TX', postalCode: '73301', countryCode: 'US', countryName: 'United States' },
    ...over,
  };
}
function line(over: any = {}) {
  return {
    lineNumber: 1, description: 'Cotton t-shirt', hsCode: '610910', hsCodeSource: 'USER',
    countryOfOrigin: 'MX', countryOfOriginName: 'Mexico', quantity: 100, uom: 'PCS',
    unitPrice: 10, currency: 'USD', lineTotal: 1000, netWeightKg: 5, grossWeightKg: 6,
    ...over,
  };
}
function totals(over: any = {}) {
  return {
    totalLines: 1, totalQuantity: 100, totalNetWeightKg: 5, totalGrossWeightKg: 6,
    totalVolumeCbm: 0.01, totalPackages: 1, subtotal: 1000, totalAdditionalCosts: 0,
    grandTotal: 1000, currency: 'USD', ...over,
  };
}

describe('generateEDI', () => {
  it('FEDEX -> FEDEX_ETD payload with awb + commodities', () => {
    const data = {
      shipmentId: 'x', documentType: 'CI_FEDEX', carrier: 'FEDEX',
      destinationCountryCode: 'US', destinationCountryGroup: 'US_CA', issueDate: '2026-07-19',
      parties: { shipper: party(), consignee: party() },
      lines: [line()], totals: totals(),
      carrierSpecific: { fedex: { awbNumber: '123456789012', dutyTaxBilling: 'BILL_RECIPIENT', reasonForExport: 'SALE', etdEnabled: true } },
      output: { paperSize: 'LETTER', orientation: 'PORTRAIT', language: 'EN', includeSignature: false, outputFormat: 'PDF', includeLogo: false },
    } as ShipmentData;
    const r = generateEDI(data);
    expect(r.format).toBe('FEDEX_ETD');
    expect((r.payload as any).awbNumber).toBe('123456789012');
    expect((r.payload as any).commodities).toHaveLength(1);
  });

  it('UPS -> UPS_PAPERLESS payload with usmca', () => {
    const data = {
      shipmentId: 'x', documentType: 'CI_UPS', carrier: 'UPS',
      destinationCountryCode: 'US', destinationCountryGroup: 'US_CA', issueDate: '2026-07-19',
      parties: { shipper: party(), consignee: party() },
      lines: [line()], totals: totals(),
      carrierSpecific: { ups: {
        invoiceNumber: 'INV1', invoiceDate: '2026-07-19', currencyOfSale: 'USD', grossWeightKg: 6,
        termsOfSale: { code: 'DAP', place: 'Austin', version: '2020' }, brokerageDutyBilling: 'CONSIGNEE',
        additionalCosts: [], partiesRelationship: 'NOT_RELATED',
      } },
      output: { paperSize: 'LETTER', orientation: 'PORTRAIT', language: 'EN', includeSignature: false, outputFormat: 'PDF', includeLogo: false },
    } as ShipmentData;
    const r = generateEDI(data);
    expect(r.format).toBe('UPS_PAPERLESS');
    expect((r.payload as any).invoiceNumber).toBe('INV1');
  });

  it('DHL -> DHL_MYDHL_PLUS payload with IOR', () => {
    const data = {
      shipmentId: 'x', documentType: 'CI_DHL', carrier: 'DHL',
      destinationCountryCode: 'DE', destinationCountryGroup: 'EU', issueDate: '2026-07-19',
      parties: { shipper: party(), consignee: party(), importerOfRecord: party({ legalName: 'IOR GmbH' }) },
      lines: [line()], totals: totals(),
      carrierSpecific: { dhl: {
        awbNumber: '1234567890', shipmentReference: 'REF1', reasonForExport: 'SALE',
        typeOfExport: 'PERMANENT', termsOfTrade: { code: 'DAP', place: 'Berlin', version: '2020' }, mydhlGenerated: true,
      } },
      output: { paperSize: 'LETTER', orientation: 'PORTRAIT', language: 'EN', includeSignature: false, outputFormat: 'PDF', includeLogo: false },
    } as ShipmentData;
    const r = generateEDI(data);
    expect(r.format).toBe('DHL_MYDHL_PLUS');
    expect((r.payload as any).importerOfRecord.legalName).toBe('IOR GmbH');
  });

  it('generateEDIFiltered returns null for Proforma', () => {
    const data = {
      shipmentId: 'x', documentType: 'PROFORMA', carrier: 'NONE',
      destinationCountryCode: 'US', destinationCountryGroup: 'US_CA', issueDate: '2026-07-19', validityDays: 30,
      parties: { shipper: party(), consignee: party() },
      lines: [line()], totals: totals(),
      output: { paperSize: 'LETTER', orientation: 'PORTRAIT', language: 'EN', includeSignature: false, outputFormat: 'PDF', includeLogo: false },
    } as ShipmentData;
    expect(generateEDIFiltered(data, 'PROFORMA')).toBeNull();
  });
});
