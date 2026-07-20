// ============================================================================
// generateEDI — Carrier EDI/Paperless JSON outputs (spec §9)
// ProformaFlow · FASE 3 (G3)
// Maps ShipmentData -> FedEx ETD / UPS Paperless / DHL MyDHL+ JSON.
// ============================================================================
import type { ShipmentData, Carrier } from '@/types/shipment';

export type EdiFormat = 'FEDEX_ETD' | 'UPS_PAPERLESS' | 'DHL_MYDHL_PLUS';

export interface EdiResult {
  format: EdiFormat;
  payload: unknown;
}

// ─── FedEx ETD (Electronic Trade Documents) ──────────────────────────────────
function toFedexEtd(data: ShipmentData): unknown {
  const f = data.carrierSpecific.fedex;
  if (!f) throw new Error('FEDEX_ETD requires carrierSpecific.fedex');
  return {
    carrier: 'FEDEX',
    awbNumber: f.awbNumber,
    reasonForExport: f.reasonForExport,
    dutyTaxBilling: f.dutyTaxBilling,
    customsProcedureCode: f.customsProcedureCode ?? null,
    exportReferences: f.exportReferences ?? null,
    etdEnabled: f.etdEnabled,
    shipper: {
      name: data.parties.shipper?.legalName ?? '',
      taxId: data.parties.shipper?.taxId ?? '',
      address: data.parties.shipper?.address ?? {},
    },
    consignee: {
      name: data.parties.consignee?.legalName ?? '',
      taxId: data.parties.consignee?.taxId ?? '',
      address: data.parties.consignee?.address ?? {},
    },
    commodities: data.lines.map((l) => ({
      description: l.description,
      descriptionEs: l.descriptionEs ?? null,
      hsCode: l.hsCode,
      countryOfOrigin: l.countryOfOrigin,
      quantity: l.quantity,
      uom: l.uom,
      unitPrice: l.unitPrice,
      currency: l.currency,
      lineTotal: l.lineTotal,
      netWeightKg: l.netWeightKg,
      grossWeightKg: l.grossWeightKg,
      marks: l.packages?.map((p) => p.shippingMarks) ?? [],
    })),
    totals: data.totals,
  };
}

// ─── UPS Paperless Invoice (Paperless Trade) ──────────────────────────────────
function toUpsPaperless(data: ShipmentData): unknown {
  const u = data.carrierSpecific.ups;
  if (!u) throw new Error('UPS_PAPERLESS requires carrierSpecific.ups');
  return {
    carrier: 'UPS',
    invoiceNumber: u.invoiceNumber,
    invoiceDate: u.invoiceDate,
    currencyOfSale: u.currencyOfSale,
    partiesRelationship: u.partiesRelationship,
    termsOfSale: u.termsOfSale,
    brokerageDutyBilling: u.brokerageDutyBilling,
    grossWeightKg: u.grossWeightKg,
    additionalCosts: u.additionalCosts,
    shipper: data.parties.shipper,
    consignee: data.parties.consignee,
    soldTo: data.parties.buyer ?? data.parties.consignee,
    producer: data.parties.producer ?? null,
    commodities: data.lines.map((l) => ({
      lineNumber: l.lineNumber,
      description: l.description,
      hsCode: l.hsCode,
      countryOfOrigin: l.countryOfOrigin,
      quantity: l.quantity,
      uom: l.uom,
      unitPrice: l.unitPrice,
      currency: l.currency,
      lineTotal: l.lineTotal,
      netWeightKg: l.netWeightKg,
      grossWeightKg: l.grossWeightKg,
    })),
    usmcaCertification: u.usmcaCertification ?? null,
    totals: data.totals,
  };
}

// ─── DHL MyDHL+ (Express API shipment request) ───────────────────────────────
function toDhlMyDhlPlus(data: ShipmentData): unknown {
  const d = data.carrierSpecific.dhl;
  if (!d) throw new Error('DHL_MYDHL_PLUS requires carrierSpecific.dhl');
  return {
    carrier: 'DHL',
    awbNumber: d.awbNumber,
    shipmentReference: d.shipmentReference,
    reasonForExport: d.reasonForExport,
    typeOfExport: d.typeOfExport,
    exportLicenseNumber: d.exportLicenseNumber ?? null,
    importLicenseNumber: d.importLicenseNumber ?? null,
    paymentMethod: d.paymentMethod ?? null,
    termsOfTrade: d.termsOfTrade,
    mydhlGenerated: d.mydhlGenerated,
    importerOfRecord: data.parties.importerOfRecord ?? null,
    shipper: data.parties.shipper,
    consignee: data.parties.consignee,
    commodities: data.lines.map((l) => ({
      description: l.description,
      hsCode: l.hsCode,
      countryOfOrigin: l.countryOfOrigin,
      quantity: l.quantity,
      uom: l.uom,
      unitPrice: l.unitPrice,
      currency: l.currency,
      lineTotal: l.lineTotal,
      netWeightKg: l.netWeightKg,
      grossWeightKg: l.grossWeightKg,
      marks: l.packages?.map((p) => p.shippingMarks) ?? [],
    })),
    totals: data.totals,
  };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export function generateEDI(data: ShipmentData): EdiResult {
  const carrier: Carrier = data.carrier;
  switch (carrier) {
    case 'FEDEX':
      return { format: 'FEDEX_ETD', payload: toFedexEtd(data) };
    case 'UPS':
      return { format: 'UPS_PAPERLESS', payload: toUpsPaperless(data) };
    case 'DHL':
      return { format: 'DHL_MYDHL_PLUS', payload: toDhlMyDhlPlus(data) };
    default:
      throw new Error(`EDI not supported for carrier: ${carrier}`);
  }
}

export function generateEDIFiltered(data: ShipmentData, docType: string): EdiResult | null {
  // EDI only applies to Commercial Invoices (not Proforma/PackingList/Bundle)
  if (!['CI_FEDEX', 'CI_UPS', 'CI_DHL'].includes(docType)) return null;
  return generateEDI(data);
}
