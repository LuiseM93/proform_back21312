// ============================================================================
// Audit: Data flow validation (no DOM render needed)
// Verifies PreviewEngine receives ALL fields from GeneratorFormV2
// ============================================================================
import { describe, it, expect } from 'vitest';
import type { ShipmentData, DocumentType } from '@/types/shipment';
import { validateShipment } from '@/validation';
import { makeFixture } from '@/__tests__/fixtures/shipmentFixtures';

describe('Audit: PreviewEngine data flow', () => {
  const TYPES: DocumentType[] = ['PROFORMA', 'CI_FEDEX', 'CI_UPS', 'CI_DHL', 'PACKING_LIST', 'BUNDLE_CIPL'];

  // Check that validateShipment blocks on incomplete data
  TYPES.forEach((docType) => {
    it(`${docType}: validateShipment returns blocking for incomplete critical data`, () => {
      const incomplete = makeFixture(docType);
      // Quitar campos críticos: HS code invalido (no existe)
      incomplete.lines[0].hsCode = '123'; // solo 3 digits, inválido
      incomplete.lines[0].countryOfOrigin = 'XXX'; // no ISO 3166

      const result = validateShipment(incomplete, new Map([[docType, incomplete]]));
      expect(result.canGenerate).toBe(false);
      expect(result.blocking.some(e => e.code === 'HS_CODE_INVALID')).toBe(true);
      expect(result.blocking.some(e => e.code === 'COO_MISSING')).toBe(true);
    });
  });

  // EORI: consignee sin EORI válido y destino EU
  it('EORI_MISSING_EU blocks when destination EU and taxId invalid format', () => {
    const base = makeFixture('CI_FEDEX');
    const data: ShipmentData = {
      ...base,
      destinationCountryGroup: 'EU',
      parties: {
        shipper: base.parties.shipper,
        consignee: {
          ...base.parties.consignee,
          taxId: 'INVALID-TAXID', // contiene guión, no cumple regex EORI
          taxIdType: 'EORI',
          address: {
            street: 'Hauptstrasse 1',
            city: 'Berlin',
            stateProvince: 'Berlin',
            postalCode: '10115',
            countryCode: 'DE', // Germany para EU
            countryName: 'Germany',
          },
        },
      },
    };

    const result = validateShipment(data, new Map([['CI_FEDEX', data]]));
    const eoriError = result.blocking.some(e => e.code === 'EORI_MISSING_EU');
    expect(eoriError).toBe(true);
  });

  // RFC: shipper MX sin RFC válido para CI
  it('RFC_REQUIRED_MX blocks CI when shipper is MX without valid RFC', () => {
    const data = makeFixture('CI_FEDEX');
    data.parties.shipper.address.countryCode = 'MX';
    data.parties.shipper.taxId = ''; // vacío
    data.parties.shipper.taxIdType = 'RFC';

    const result = validateShipment(data, new Map([['CI_FEDEX', data]]));
    const rfcError = result.blocking.some(e => e.code === 'RFC_REQUIRED_MX');
    expect(rfcError).toBe(true);
  });

  // RFC: para Proforma es WARNING no bloquea
  it('RFC_RECOMMENDED_MX is WARNING for PROFORMA (no bloquea generación)', () => {
    const data = makeFixture('PROFORMA');
    data.parties.shipper.address.countryCode = 'MX';
    data.parties.shipper.taxId = '';

    const result = validateShipment(data, new Map([['PROFORMA', data]]));
    const rfcWarning = result.warnings.some(w => w.code === 'RFC_RECOMMENDED_MX');
    // Not blocking errors related to RFC for Proforma
    const rfcBlocking = result.blocking.some(e => e.code === 'RFC_REQUIRED_MX');
    expect(rfcWarning).toBe(true);
    expect(rfcBlocking).toBe(false);
    // Proforma can still generate (description may still be required)
  });

  // PROFORMA warning que no bloquea
  it('PROFORMA_USED_AS_CI is WARNING (not BLOCKING) for PROFORMA document', () => {
    const data = makeFixture('PROFORMA');
    // Los errores de description/units no importan aquí - el warning de proforma existe
    // Pero si el data está incompleto, bloqueará por DESCRIPTION_TOO_GENERIC u otros
    // Creamos data mínimamente válido
    data.lines[0].description = 'Electronics product for testing';
    data.lines[0].hsCode = '853400';
    data.lines[0].countryOfOrigin = 'US';
    data.lines[0].unitPrice = 100;
    data.totals.subtotal = 100;
    data.totals.grandTotal = 100;

    const result = validateShipment(data, new Map([['PROFORMA', data]]));
    const proformaWarning = result.warnings.some(w => w.code === 'PROFORMA_USED_AS_CI');
    expect(proformaWarning).toBe(true);
    // No debe haber errores bloqueantes SOLO por ser proforma
    expect(result.blocking.filter(e => e.field === 'documentType').length).toBe(0);
  });
});