// ============================================================================
// CiDhlDocument — Commercial Invoice DHL (MyDHL+ compatible)
// ProformaFlow · FASE 3
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { CiDhlData } from '@/types/shipment';
import { createBaseStyles, formatCurrency, formatNumber, getIncotermDisplay, registerFonts } from '../BaseDocumentStyles';

export function CiDhlDocument({ data }: { data: CiDhlData }) {
  registerFonts();
  const { styles, orientation } = useMemo(() => createBaseStyles(data.output.paperSize, data.output.orientation), [data.output]);
  const dhl = data.carrierSpecific.dhl!;

  return (
    <Document>
      <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={data.output.orientation === 'LANDSCAPE' ? 'landscape' : 'portrait'} style={styles.page}>
        {/* AWB SAFE ZONE */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { fontSize: 16 }]}>COMMERCIAL INVOICE</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>DHL Express — MyDHL+ Compatible</Text>
          </View>
          {/* SAFE ZONE: 10-digit AWB top-right, no overlap */}
          <View style={{ textAlign: 'right', width: '35%', paddingTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>{dhl.awbNumber}</Text>
            <Text style={{ fontSize: 7, color: '#666' }}>AWB (10 digits) — DHL Zone</Text>
            <Text style={{ fontSize: 8 }}>Ref: {dhl.shipmentReference || 'N/A'}</Text>
            <Text style={{ fontSize: 8 }}>Date: {data.issueDate}</Text>
            {dhl.mydhlGenerated && <Text style={{ fontSize: 7, color: '#28a745', fontWeight: 'bold' }}>✓ via MyDHL+</Text>}
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.partyBlock}>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Shipper / Exporter</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.address.street || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.address.city || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.taxIdType || "—"}: {data.parties.shipper?.taxId || "—"}</Text>
            </View>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Consignee / Importer</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.street || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.city || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.taxIdType || "—"}: {data.parties.consignee?.taxId || "—"}</Text>
            </View>
          </View>
          {data.parties.importerOfRecord && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.partyLabel}>Importer of Record (IOR)</Text>
              <Text style={styles.partyValue}>{data.parties.importerOfRecord.legalName} — {data.parties.importerOfRecord.address.countryName}</Text>
            </View>
          )}
        </View>

        {/* SHIPMENT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipment Details</Text>
          <View style={styles.flexRow}>
            <View style={{ width: '33%' }}>
              <Text style={styles.partyLabel}>Reason for Export</Text>
              <Text style={styles.partyValue}>{dhl.reasonForExport}</Text>
            </View>
            <View style={{ width: '33%' }}>
              <Text style={styles.partyLabel}>Type of Export</Text>
              <Text style={styles.partyValue}>{dhl.typeOfExport}</Text>
            </View>
            <View style={{ width: '34%' }}>
              <Text style={styles.partyLabel}>Terms of Trade</Text>
              <Text style={styles.partyValue}>{getIncotermDisplay(dhl.termsOfTrade)}</Text>
            </View>
          </View>
          {dhl.exportLicenseNumber && (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.partyLabel}>Export License</Text>
              <Text style={styles.partyValue}>{dhl.exportLicenseNumber}</Text>
            </View>
          )}
          {dhl.importLicenseNumber && (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.partyLabel}>Import License</Text>
              <Text style={styles.partyValue}>{dhl.importLicenseNumber}</Text>
            </View>
          )}
          {dhl.paymentMethod && (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.partyLabel}>Payment Method</Text>
              <Text style={styles.partyValue}>{dhl.paymentMethod}</Text>
            </View>
          )}
        </View>

        {/* COMMODITY TABLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commodity Description</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '5%' }]}>#</Text>
            <Text style={[styles.tableCellHeader, { width: '35%' }]}>Description</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>HS Code</Text>
            <Text style={[styles.tableCellHeader, { width: '8%' }]}>Origin</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>Qty</Text>
            <Text style={[styles.tableCellHeader, { width: '5%' }]}>UOM</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Unit</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Total</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Net kg</Text>
            <Text style={[styles.tableCellHeader, { width: '9%' }]}>Gross kg</Text>
            <Text style={[styles.tableCellHeader, { width: '11%' }]}>Marks & Numbers</Text>
          </View>
          {data.lines.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '5%' }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>{line.description}</Text>
              {line.descriptionEs && <Text style={[styles.tableCell, { width: '35%', fontSize: 6, color: '#666' }]}>{line.descriptionEs}</Text>}
              <Text style={[styles.tableCell, { width: '10%' }]}>{line.hsCode}</Text>
              <Text style={[styles.tableCell, { width: '8%' }]}>{line.countryOfOrigin} ({line.countryOfOriginName})</Text>
              <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>{formatNumber(line.quantity, 0)}</Text>
              <Text style={[styles.tableCell, { width: '5%' }]}>{line.uom}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatCurrency(line.unitPrice, line.currency)}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatCurrency(line.lineTotal, line.currency)}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatNumber(line.netWeightKg, 2)}</Text>
              <Text style={[styles.tableCell, { width: '9%', textAlign: 'right' }]}>{formatNumber(line.grossWeightKg, 2)}</Text>
              <Text style={[styles.tableCell, { width: '11%', fontSize: 6 }]}>{line.packages?.map((p) => p.shippingMarks).join(', ') || 'N/A'}</Text>
            </View>
          ))}
          <View style={[styles.totalsRow, styles.tableRow]}>
            <Text style={[styles.tableCell, { width: '5%' }]} />
            <Text style={[styles.tableCell, { width: '35%', fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.tableCell, { width: '10%' }]} />
            <Text style={[styles.tableCell, { width: '8%' }]} />
            <Text style={[styles.tableCell, { width: '7%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalQuantity, 0)}</Text>
            <Text style={[styles.tableCell, { width: '5%' }]} />
            <Text style={[styles.tableCell, { width: '10%' }]} />
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(data.totals.subtotal, data.totals.currency)}</Text>
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalNetWeightKg, 2)}</Text>
            <Text style={[styles.tableCell, { width: '9%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalGrossWeightKg, 2)}</Text>
            <Text style={[styles.tableCell, { width: '11%' }]} />
          </View>
        </View>

        {/* DECLARATION */}
        <View style={[styles.section, { marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000' }]}>
          <Text style={styles.sectionTitle}>Declaration</Text>
          <Text style={{ fontSize: 7, marginBottom: 8 }}>
            I declare that the information on this invoice is true and correct. Goods comply with DHL Express terms and applicable customs regulations.
          </Text>
          {data.output.includeSignature && (
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}><Text>Authorized Signature</Text><Text style={{ fontSize: 6 }}>Date: {data.issueDate}</Text></View>
              <View style={styles.signatureLine}><Text>Name / Title</Text></View>
              <View style={styles.signatureLine}><Text>{data.parties.shipper.legalName}</Text></View>
            </View>
          )}
        </View>
        <Text style={{ position: 'absolute', bottom: 20, right: 36, fontSize: 7 }}>CI DHL — Generated by PlataformaFlow</Text>
      </Page>
    </Document>
  );
}
