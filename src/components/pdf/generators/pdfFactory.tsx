// ============================================================================
// pdfFactory — generatePDF + generateShipmentBundle
// ProformaFlow · FASE 3
// ============================================================================
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import type { ShipmentData, DocumentType, ProformaData, CiFedexData, CiUpsData, CiDhlData, PackingListData, BundleData } from '@/types/shipment';
import { ProformaDocument } from './documents/ProformaDocument';
import { CiFedexDocument } from './documents/CiFedexDocument';
import { CiUpsDocument } from './documents/CiUpsDocument';
import { CiDhlDocument } from './documents/CiDhlDocument';
import { PackingListDocument } from './documents/PackingListDocument';
import { BundleDocument } from './documents/BundleDocument';
export { generateEDI } from '../edi/ediGenerators';

export type ReactPDFDocument = React.ReactElement;

function getDocumentComponent(data: ShipmentData) {
  switch (data.documentType) {
    case 'PROFORMA': return <ProformaDocument data={data as ProformaData} />;
    case 'CI_FEDEX': return <CiFedexDocument data={data as CiFedexData} />;
    case 'CI_UPS': return <CiUpsDocument data={data as CiUpsData} />;
    case 'CI_DHL': return <CiDhlDocument data={data as CiDhlData} />;
    case 'PACKING_LIST': return <PackingListDocument data={data as PackingListData} />;
    case 'BUNDLE_CIPL': return <BundleDocument data={data as BundleData} />;
    default: throw new Error(`Unsupported document type: ${data.documentType}`);
  }
}

export async function generatePDF(data: ShipmentData): Promise<Blob> {
  const roundedData = { ...data, totals: { ...data.totals, subtotal: Math.round(data.totals.subtotal * 100) / 100 } };
  const doc = getDocumentComponent(roundedData);
  return pdf(doc).toBlob();
}

export async function generatePDFBlobUrl(data: ShipmentData): Promise<string> {
  const blob = await generatePDF(data);
  return URL.createObjectURL(blob);
}

export function generateShipmentBundle(data: ShipmentData): {
  mainDocument: ReactPDFDocument;
  secondaryDocuments: ReactPDFDocument[];
} {
  const mainDocument = getDocumentComponent(data);
  const secondaryDocuments: ReactPDFDocument[] = [];

  // UPS: USMCA cert separado embebido en CiUpsDocument (ya lo maneja)
  // Bundle: no necesita secundarios (es combinado)
  // Proforma: standalone
  // Separate CI + PL: if user wants both, also generate PL
  if (data.documentType !== 'BUNDLE_CIPL' && data.documentType !== 'PACKING_LIST') {
    // Si hay datos de packing list, generar PL como secundario
    const hasPL = data.carrierSpecific.packingList?.plNumber;
    if (hasPL) {
      secondaryDocuments.push(<PackingListDocument data={data as PackingListData} />);
    }
  }

  return { mainDocument, secondaryDocuments };
}

export function getDocumentTitle(docType: DocumentType): string {
  const titles: Record<DocumentType, string> = {
    PROFORMA: 'Proforma Invoice',
    CI_FEDEX: 'Commercial Invoice (FedEx)',
    CI_UPS: 'Commercial Invoice (UPS)',
    CI_DHL: 'Commercial Invoice (DHL)',
    PACKING_LIST: 'Packing List',
    BUNDLE_CIPL: 'Bundle (CI + PL)',
  };
  return titles[docType];
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
