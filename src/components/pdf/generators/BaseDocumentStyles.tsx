// ============================================================================
// BaseDocumentStyles — Estilos + helpers compartidos para @react-pdf/renderer
// ProformaFlow · FASE 3
// ============================================================================
import { StyleSheet, Font } from '@react-pdf/renderer';
import type { PaperSize, Orientation, Party, Incoterm2020 } from '@/types/shipment';

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
      fontFamily: 'Helvetica', fontSize: 9, lineHeight: 1.35, color: '#000',
    },
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8,
    },
    title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 10, textAlign: 'center', marginBottom: 10 },
    section: { marginBottom: 14 },
    sectionTitle: {
      fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase',
      marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#999',
    },
    partyBlock: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    partyColumn: { width: '48%' },
    partyLabel: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#666', marginBottom: 2 },
    partyValue: { fontSize: 8, marginBottom: 2 },
    flexRow: { flexDirection: 'row', flexWrap: 'wrap' },
    table: { width: '100%', borderWidth: 0.5, borderColor: '#000', marginTop: 6 },
    tableHeader: {
      flexDirection: 'row', backgroundColor: '#f0f0f0',
      borderBottomWidth: 1, borderBottomColor: '#000',
    },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', minHeight: 22, flexWrap: 'wrap' },
    tableCell: { padding: 4, fontSize: 7.5 },
    tableCellHeader: { padding: 4, fontSize: 7.5, fontWeight: 'bold', textTransform: 'uppercase' },
    totalsRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderTopWidth: 1, borderTopColor: '#000' },
    signatureBlock: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
    signatureLine: { width: '30%', borderTopWidth: 0.5, borderTopColor: '#000', paddingTop: 6, textAlign: 'center', fontSize: 7.5 },
    errorHighlight: { backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#ffc107' },
    errorCritical: { backgroundColor: '#f8d7da', borderWidth: 1, borderColor: '#dc3545' },
    disclaimer: { fontSize: 7.5, lineHeight: 1.4, color: '#666' },
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

export function getIncotermDisplay(code: Incoterm2020 | { code: string; place: string }): string {
  const c = typeof code === 'string' ? code : code.code;
  const p = typeof code === 'string' ? '' : code.place;
  return `${c} ${p} (Incoterms® 2020)`.trim();
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
    eori: party?.eori ? `EORI: ${party.eori}` : '',
  };
}

// Render party address lines properly for INFORME compliance
export function renderPartyAddress(party: Party) {
  if (!party?.address) return ['—'];
  return [
    party.address.street || '—',
    party.address.street2 || '',
    `${party.address.city || '—'}, ${party.address.stateProvince || '—'} ${party.address.postalCode || '—'}`,
    party.address.countryName || '—',
  ].filter(Boolean);
}
