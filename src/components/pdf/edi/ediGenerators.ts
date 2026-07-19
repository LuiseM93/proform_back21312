// ============================================================================
// EDI Generators — FedEx ETD, UPS Paperless, DHL MyDHL+
// ProformaFlow · FASE 4
// ============================================================================
import type { CiFedexData, CiUpsData, CiDhlData, ShipmentData } from '@/types/shipment';

export function generateFedExETD(data: CiFedexData): object {
  const fedex = data.carrierSpecific.fedex!;
  return {
    awbNumber: fedex.awbNumber,
    reasonForExport: fedex.reasonForExport,
    dutyAndTaxBilling: fedex.dutyTaxBilling,
    customsValue: {
      currency: data.totals.currency,
      amount: data.totals.subtotal,
    },
    shipper: {
      companyName: data.parties.shipper.legalName,
      address: data.parties.shipper.address,
      taxId: { type: data.parties.shipper.taxIdType, number: data.parties.shipper.taxId },
    },
    recipient: {
      companyName: data.parties.consignee.legalName,
      address: data.parties.consignee.address,
      taxId: { type: data.parties.consignee.taxIdType, number: data.parties.consignee.taxId },
    },
    commodities: data.lines.map((line) => ({
      description: line.description,
      customsValue: { currency: line.currency, amount: line.lineTotal },
      quantity: line.quantity,
      unitOfMeasure: line.uom,
      countryOfManufacture: line.countryOfOrigin,
      harmonizedCode: line.hsCode,
      weight: { value: line.netWeightKg, unit: 'KG' },
    })),
    etdEnabled: fedex.etdEnabled,
  };
}

export function generateUpsPaperless(data: CiUpsData): object {
  const ups = data.carrierSpecific.ups!;
  return {
    invoiceNumber: ups.invoiceNumber,
    invoiceDate: ups.invoiceDate,
    currencyOfSale: ups.currencyOfSale,
    grossWeight: { value: ups.grossWeightKg, unit: 'KG' },
    termsOfSale: ups.termsOfSale,
    partiesRelationship: ups.partiesRelationship,
    brokerageDutyBilling: ups.brokerageDutyBilling,
    soldToParty: data.parties.buyer
      ? { companyName: data.parties.buyer.legalName, address: data.parties.buyer.address }
      : null,
    producer: data.parties.producer
      ? { companyName: data.parties.producer.legalName, address: data.parties.producer.address }
      : null,
    commodityDetails: data.lines.map((line) => ({
      description: line.description,
      customsValue: { currency: line.currency, amount: line.lineTotal },
      quantity: { value: line.quantity, unitOfMeasure: line.uom },
      countryOfOrigin: line.countryOfOrigin,
      harmonizedCode: line.hsCode,
      weight: { value: line.netWeightKg, unit: 'KG' },
    })),
    additionalCosts: ups.additionalCosts,
    usmcaCertification: ups.usmcaCertification || null,
  };
}

export function generateDhlMyDhl(data: CiDhlData): object {
  const dhl = data.carrierSpecific.dhl!;
  return {
    shipmentIdentificationNumber: dhl.awbNumber,
    shipmentReference: dhl.shipmentReference,
    reasonForExport: dhl.reasonForExport,
    typeOfExport: dhl.typeOfExport,
    termsOfTrade: dhl.termsOfTrade,
    shipper: {
      name: data.parties.shipper.legalName,
      address: data.parties.shipper.address,
      taxId: { type: data.parties.shipper.taxIdType, number: data.parties.shipper.taxId },
    },
    consignee: {
      name: data.parties.consignee.legalName,
      address: data.parties.consignee.address,
      taxId: { type: data.parties.consignee.taxIdType, number: data.parties.consignee.taxId },
    },
    importerOfRecord: data.parties.importerOfRecord
      ? { name: data.parties.importerOfRecord.legalName, address: data.parties.importerOfRecord.address }
      : null,
    exportLicenseNumber: dhl.exportLicenseNumber || null,
    importLicenseNumber: dhl.importLicenseNumber || null,
    content: data.lines.map((line) => ({
      description: line.description,
      customsValue: { currency: line.currency, amount: line.lineTotal },
      quantity: { value: line.quantity, unitOfMeasure: line.uom },
      countryOfOrigin: line.countryOfOrigin,
      harmonizedSystemCode: line.hsCode,
      grossWeight: { value: line.grossWeightKg, unit: 'KG' },
      netWeight: { value: line.netWeightKg, unit: 'KG' },
    })),
  };
}

export function generateEDI(data: ShipmentData): { format: string; payload: object } | null {
  switch (data.documentType) {
    case 'CI_FEDEX':
      return { format: 'FEDEX_ETD', payload: generateFedExETD(data as CiFedexData) };
    case 'CI_UPS':
      return { format: 'UPS_PAPERLESS', payload: generateUpsPaperless(data as CiUpsData) };
    case 'CI_DHL':
      return { format: 'DHL_MYDHL', payload: generateDhlMyDhl(data as CiDhlData) };
    default:
      return null;
  }
}
