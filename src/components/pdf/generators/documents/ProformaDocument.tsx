// ============================================================================
// ProformaDocument — PDF final @react-pdf/renderer
// ProformaFlow · FASE 3
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { ProformaData } from '@/types/shipment';
import { createBaseStyles, formatCurrency, formatNumber, registerFonts } from '../BaseDocumentStyles';

export function ProformaDocument({ data }: { data: ProformaData }) {
  registerFonts();
  const { styles, orientation } = useMemo(() => createBaseStyles(data.output.paperSize, data.output.orientation), [data.output]);
  const validityDate = new Date(data.issueDate);
  validityDate.setDate(validityDate.getDate() + (data.validityDays || 30));
  const validityStr = validityDate.toISOString().split('T')[0];

  return (
    <Document>
      <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={data.output.orientation === 'LANDSCAPE' ? 'landscape' : 'portrait'} style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1, textAlign: 'center' }}>
            <Text style={[styles.title, { fontSize: 18, color: '#dc3545' }]}>PROFORMA INVOICE</Text>
            <Text style={{ fontSize: 9, color: '#dc3545', fontWeight: 'bold' }}>
              THIS IS NOT A COMMERCIAL INVOICE — FOR QUOTATION PURPOSES ONLY
            </Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              {data.carrierSpecific.bundle?.documentNumber || `PF-${data.issueDate.replace(/-/g, '')}-${data.shipmentId.slice(0, 6).toUpperCase()}`}
            </Text>
          </View>
          <View style={{ width: '30%', textAlign: 'right' }}>
            <Text style={{ fontSize: 8 }}>Date: {data.issueDate}</Text>
            <Text style={{ fontSize: 8 }}>Valid Until: {validityStr}</Text>
            <Text style={{ fontSize: 8 }}>Validity: {data.validityDays || 30} days</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.partyBlock}>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Seller / Exporter (Shipper)</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.address.street ?? ""}{data.parties.shipper?.address.street2 ? `, ${data.parties.shipper.address.street2}` : ''}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.address.city ?? "—"}, {data.parties.shipper?.address.stateProvince ?? "—"} {data.parties.shipper?.address.postalCode ?? "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.address.countryName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.taxIdType || "—"}: {data.parties.shipper?.taxId || "—"}</Text>
            </View>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Prospective Buyer / Consignee</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.street ?? ""}{data.parties.consignee?.address.street2 ? `, ${data.parties.consignee.address.street2}` : ''}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.city ?? "—"}, {data.parties.consignee?.address.stateProvince ?? "—"} {data.parties.consignee?.address.postalCode ?? "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.countryName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.taxIdType || "—"}: {data.parties.consignee?.taxId || "—"}</Text>
            </View>
          </View>
        </View>

        {/* TERMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposed Terms</Text>
          <View style={styles.flexRow}>
            <View style={{ width: '50%' }}>
              <Text style={styles.partyLabel}>Incoterms® 2020</Text>
              <Text style={styles.partyValue}>
                {data.lines[0]?.incoterm ? `${data.lines[0].incoterm} (Incoterms® 2020)` : 'FCA Shipping Point (Incoterms® 2020)'}
              </Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={styles.partyLabel}>Payment Terms</Text>
              <Text style={styles.partyValue}>30% advance, 70% against shipping documents</Text>
            </View>
          </View>
        </View>

        {/* LINES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposed Commodities</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '5%' }]}>#</Text>
            <Text style={[styles.tableCellHeader, { width: '35%' }]}>Description</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>HS Code</Text>
            <Text style={[styles.tableCellHeader, { width: '8%' }]}>Origin</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>Qty</Text>
            <Text style={[styles.tableCellHeader, { width: '5%' }]}>UOM</Text>
            <Text style={[styles.tableCellHeader, { width: '12%' }]}>Unit (Est)</Text>
            <Text style={[styles.tableCellHeader, { width: '12%' }]}>Total (Est)</Text>
            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Net kg</Text>
          </View>
          {data.lines.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '4%' }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>{line.description}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{line.hsCode}</Text>
              <Text style={[styles.tableCell, { width: '8%' }]}>{line.countryOfOrigin}</Text>
              <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>{formatNumber(line.quantity, 0)}</Text>
              <Text style={[styles.tableCell, { width: '5%' }]}>{line.uom}</Text>
              <Text style={[styles.tableCell, { width: '12%', textAlign: 'right' }]}>{formatCurrency(line.unitPrice, line.currency)}</Text>
              <Text style={[styles.tableCell, { width: '12%', textAlign: 'right' }]}>{formatCurrency(line.lineTotal, line.currency)}</Text>
              <Text style={[styles.tableCell, { width: '6%', textAlign: 'right' }]}>{formatNumber(line.netWeightKg, 2)}</Text>
            </View>
          ))}
          <View style={[styles.totalsRow, styles.tableRow]}>
            <Text style={[styles.tableCell, { width: '5%' }]} />
            <Text style={[styles.tableCell, { width: '35%', fontWeight: 'bold' }]}>ESTIMATED TOTAL</Text>
            <Text style={[styles.tableCell, { width: '10%' }]} />
            <Text style={[styles.tableCell, { width: '8%' }]} />
            <Text style={[styles.tableCell, { width: '7%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalQuantity, 0)}</Text>
            <Text style={[styles.tableCell, { width: '5%' }]} />
            <Text style={[styles.tableCell, { width: '12%' }]} />
            <Text style={[styles.tableCell, { width: '12%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(data.totals.subtotal, data.totals.currency)}</Text>
            <Text style={[styles.tableCell, { width: '6%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalNetWeightKg, 2)}</Text>
          </View>
        </View>

        {/* DISCLAIMER */}
        <View style={[styles.section, { marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000' }]}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 4, color: '#dc3545' }}>IMPORTANT NOTICE</Text>
          <Text style={styles.disclaimer}>
            This Proforma Invoice is issued for quotation / customs valuation / import permit purposes only. It does not constitute a demand for payment,
            a commercial invoice, or a customs declaration document. The values, quantities, and specifications herein are estimates subject to change upon
            final negotiation. A formal Commercial Invoice must be issued for actual shipment and customs clearance.{' '}
            <Text style={{ fontWeight: 'bold' }}>THIS DOCUMENT CANNOT BE USED FOR CUSTOMS CLEARANCE.</Text>
          </Text>
        </View>

        {/* SIGNATURE */}
        {data.output.includeSignature && (
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}><Text>Authorized Signature</Text><Text style={{ fontSize: 6 }}>Date: {data.issueDate}</Text></View>
            <View style={styles.signatureLine}><Text>Name / Title</Text></View>
            <View style={styles.signatureLine}><Text>{data.parties.shipper.legalName}</Text></View>
          </View>
        )}
        <Text style={{ position: 'absolute', bottom: 20, right: 36, fontSize: 7 }}>Proforma — Generated by PlataformaFlow</Text>
      </Page>
    </Document>
  );
}
