// ============================================================================
// BaseDocumentStyles — Estilos + helpers compartidos para @react-pdf/renderer
// ProformaFlow · FASE 3
// ============================================================================
import { StyleSheet, Font } from '@react-pdf/renderer';
import type { PaperSize, Orientation, Party } from '@/types/shipment';

// Registrar fuentes una sola vez
let fontsRegistered = false;
export function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'https://cdn.jsdelivr.net/npm/@fontsource/helvetica@5.0.0/files/helvetica-latin-400-normal.woff', fontWeight: 'normal' },
      { src: 'https://cdn.jsdelivr.net/npm/@fontsource/helvetica@5.0.0/files/helvetica-latin-700-normal.woff', fontWeight: 'bold' },
    ],
  });
  fontsRegistered = true;
}

export function createBaseStyles(paperSize: PaperSize, orientation: Orientation) {
  const isLandscape = orientation === 'LANDSCAPE';
  const pageWidth = paperSize === 'LETTER'
    ? (isLandscape ? 792 : 612)
    : (isLandscape ? 841.89 : 595.28);
  const pageHeight = paperSize === 'LETTER'
    ? (isLandscape ? 612 : 792)
    : (isLandscape ? 595.28 : 841.89);
  const margin = 36;
  const reactPdfOrientation: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';

  const styles = StyleSheet.create({
    page: {
      width: pageWidth, height: pageHeight, padding: margin,
      fontFamily: 'Helvetica', fontSize: 8, lineHeight: 1.2, color: '#000',
    },
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 6,
    },
    title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 10, textAlign: 'center', marginBottom: 8 },
    section: { marginBottom: 10 },
    sectionTitle: {
      fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase',
      marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#999',
    },
    partyBlock: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    partyColumn: { width: '48%' },
    partyLabel: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#666' },
    partyValue: { fontSize: 8, marginBottom: 1 },
    flexRow: { flexDirection: 'row', flexWrap: 'wrap' },
    table: { width: '100%', borderWidth: 0.5, borderColor: '#000', marginTop: 4 },
    tableHeader: {
      flexDirection: 'row', backgroundColor: '#f0f0f0',
      borderBottomWidth: 1, borderBottomColor: '#000',
    },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', minHeight: 20, flexWrap: 'wrap' },
    tableCell: { padding: 3, fontSize: 7 },
    tableCellHeader: { padding: 3, fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },
    totalsRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderTopWidth: 1, borderTopColor: '#000' },
    signatureBlock: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
    signatureLine: { width: '30%', borderTopWidth: 0.5, borderTopColor: '#000', paddingTop: 4, textAlign: 'center', fontSize: 7 },
    errorHighlight: { backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffc107' },
    errorCritical: { backgroundColor: '#f8d7da', borderWidth: 1, borderColor: '#dc3545' },
    disclaimer: { fontSize: 7, lineHeight: 1.3, color: '#666' },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { styles, orientation: reactPdfOrientation };
}

// Helpers de formato
export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function getIncotermDisplay(incoterm: { code: string; place: string }): string {
  return `${incoterm.code} ${incoterm.place} (Incoterms® 2020)`;
}

// Render de party block reutilizable
export function renderPartyBlock(party: Party, label: string) {
  return {
    label,
    legalName: party?.legalName || '',
    address: party?.address ? `${party.address.street}${party.address.street2 ? ', ' + party.address.street2 : ''}` : '',
    city: party?.address ? `${party.address.city}, ${party.address.stateProvince} ${party.address.postalCode}` : '',
    country: party?.address?.countryName || '',
    taxId: party?.taxId ? `${party.taxIdType}: ${party.taxId}` : '',
    contact: party?.contactName ? `Attn: ${party.contactName}` : '',
    phone: party?.phone ? `Tel: ${party.phone}` : '',
    email: party?.email || '',
    relationship: party?.relationship ? `(${party.relationship})` : '',
  };
}
