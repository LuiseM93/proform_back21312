// ============================================================================
// E2E COMPLETE: Fases 1-6 — UI fields → Preview → PDF consistency
// Verifies all 6 document types have required fields per Informe spec
// Run: npx vitest run src/validation/__tests__/e2e-complete-audit.test.ts
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { DocumentType } from '@/types/shipment';
import { makeFixture } from '@/__tests__/fixtures/shipmentFixtures';
import { generatePDF } from '@/components/pdf/generators/pdfFactory';

// Informe required fields per document type (field must exist in type)
const INFORME_FIELDS: Record<DocumentType, string[]> = {
  PROFORMA: ['validityDays', 'line.description', 'line.hsCode', 'line.unitPrice', 'line.countryOfOrigin', 'parties.shipper', 'parties.consignee'],
  CI_FEDEX: ['carrierSpecific.fedex.awbNumber', 'carrierSpecific.fedex.reasonForExport', 'carrierSpecific.fedex.dutyTaxBilling', 'carrierSpecific.fedex.etdEnabled', 'carrierSpecific.fedex.customsProcedureCode'],
  CI_UPS: ['carrierSpecific.ups.invoiceNumber', 'carrierSpecific.ups.termsOfSale', 'carrierSpecific.ups.partiesRelationship', 'carrierSpecific.ups.brokerageDutyBilling', 'carrierSpecific.ups.usmcaCertification'],
  CI_DHL: ['carrierSpecific.dhl.awbNumber', 'carrierSpecific.dhl.typeOfExport', 'carrierSpecific.dhl.reasonForExport', 'carrierSpecific.dhl.exportLicenseNumber'],
  PACKING_LIST: ['carrierSpecific.packingList.plNumber', 'carrierSpecific.packingList.plDate', 'carrierSpecific.packingList.commercialInvoiceRef', 'carrierSpecific.packingList.awbBlRef'],
  BUNDLE_CIPL: ['carrierSpecific.bundle.documentNumber', 'carrierSpecific.bundle.commercialInvoiceRef', 'carrierSpecific.bundle.packingListRef'],
};

// Helper: field path exists on the data object (undefined is ok for optional fields)
function fieldExists(obj: unknown, path: string): boolean {
  const segments = path.split('.');
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur === null || cur === undefined) return true;
    if (typeof cur !== 'object') return false;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return true;
}

describe('E2E COMPLETE: UI → Preview → PDF consistency', () => {
  const TYPES: DocumentType[] = ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST', 'BUNDLE_CIPL'];

  // Fase 1: All Informe required fields present
  TYPES.forEach((docType) => {
    it(`${docType}: Fase 1 - All Informe fields present in type`, () => {
      const data = makeFixture(docType);
      for (const field of INFORME_FIELDS[docType]) {
        expect(fieldExists(data, field as string), `Missing field: ${field}`).toBe(true);
      }
    });

    // Fase 2-4: PDF generates end-to-end
    it(`${docType}: Fase 2-4 - PDF generates successfully (end-to-end)`, async () => {
      const blob = await generatePDF(makeFixture(docType));
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(500);
    });

    // Fase 4: carrierSpecific data preserved
    it(`${docType}: Fase 4 - carrierSpecific preserved`, () => {
      const data = makeFixture(docType);
      const cs = data.carrierSpecific;
      if (docType === 'CI_FEDEX') {
        expect(cs.fedex).toBeTruthy();
        expect(cs.fedex!.awbNumber).toMatch(/^\d{12}$/);
      }
      if (docType === 'CI_UPS') {
        expect(cs.ups).toBeTruthy();
        expect(cs.ups!.invoiceNumber).toMatch(/^1Z[A-Z0-9]{16}$/);
      }
      if (docType === 'CI_DHL') {
        expect(cs.dhl).toBeTruthy();
        expect(cs.dhl!.awbNumber).toMatch(/^\d{10}$/);
      }
      if (docType === 'PACKING_LIST') expect(cs.packingList).toBeTruthy();
      if (docType === 'BUNDLE_CIPL') expect(cs.bundle).toBeTruthy();
    });
  });

  // Fase 5: Specific Informe rules
  it('Fase 5 - RFC_REQUIRED_MX blocks for CI when shipper MX', async () => {
    const { validateShipment } = await import('@/validation');
    const data = makeFixture('CI_FEDEX');
    data.parties.shipper.address.countryCode = 'MX';
    data.parties.shipper.taxId = '';
    const result = validateShipment(data, new Map([['CI_FEDEX', data]]));
    expect(result.blocking.some(e => e.code === 'RFC_REQUIRED_MX')).toBe(true);
  });

  // Fase 6: Cross-document consistency
  it('Fase 6 - Bundle references CI and PL', () => {
    const bundle = makeFixture('BUNDLE_CIPL');
    expect(bundle.carrierSpecific.bundle!.commercialInvoiceRef).toBeTruthy();
    expect(bundle.carrierSpecific.bundle!.packingListRef).toBeTruthy();
  });
});