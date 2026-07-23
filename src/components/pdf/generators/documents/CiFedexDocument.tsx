// ============================================================================
// CiFedexDocument — Commercial Invoice FedEx M-1054 (2 pages)
// ProformaFlow · FASE 3
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { CiFedexData } from '@/types/shipment';
import { createBaseStyles, formatCurrency, formatNumber, getIncotermDisplay, registerFonts } from '../BaseDocumentStyles';

export function CiFedexDocument({ data }: { data: CiFedexData }) {
  registerFonts();
  const { styles, orientation } = useMemo(() => createBaseStyles(data.output.paperSize, data.output.orientation), [data.output]);
  const fedex = data.carrierSpecific.fedex!;

  return (
    <Document>
      {/* PAGE 1 */}
      <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={orientation} style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { fontSize: 16 }]}>COMMERCIAL INVOICE</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>FedEx International — M-1054 Format</Text>
          </View>
          <View style={{ textAlign: 'right', width: '35%' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>AWB: {fedex.awbNumber}</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Date: {data.issueDate}</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Ref: {fedex.exportReferences || 'N/A'}</Text>
            {fedex.etdEnabled && <Text style={{ fontSize: 7, color: '#28a745', fontWeight: 'bold', marginTop: 6 }}>✓ ETD ENABLED — No physical copies required</Text>}
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
              <Text style={styles.partyValue}>{data.parties.shipper?.address.countryName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.taxIdType || "—"}: {data.parties.shipper?.taxId || "—"}</Text>
              {data.parties.shipper?.eori && <Text style={styles.partyValue}>EORI: {data.parties.shipper.eori}</Text>}
              {data.parties.shipper?.phone && <Text style={styles.partyValue}>Tel: {data.parties.shipper.phone}</Text>}
              {data.parties.shipper?.email && <Text style={styles.partyValue}>{data.parties.shipper.email}</Text>}
            </View>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Consignee / Importer</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.street || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.city || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.countryName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.taxIdType || "—"}: {data.parties.consignee?.taxId || "—"}</Text>
              {data.parties.consignee?.eori && <Text style={styles.partyValue}>EORI: {data.parties.consignee.eori}</Text>}
              {data.parties.consignee?.phone && <Text style={styles.partyValue}>Tel: {data.parties.consignee.phone}</Text>}
              {data.parties.consignee?.email && <Text style={styles.partyValue}>{data.parties.consignee.email}</Text>}
            </View>
          </View>
          {data.parties.buyer && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.partyLabel}>Importer of Record (if different)</Text>
              <Text style={styles.partyValue}>{data.parties.buyer.legalName}</Text>
              <Text style={styles.partyValue}>{data.parties.buyer.address.street}, {data.parties.buyer.address.city}, {data.parties.buyer.address.countryName}</Text>
              <Text style={styles.partyValue}>{data.parties.buyer.taxIdType}: {data.parties.buyer.taxId}</Text>
              {data.parties.buyer.eori && <Text style={styles.partyValue}>EORI: {data.parties.buyer.eori}</Text>}
              {data.parties.buyer.phone && <Text style={styles.partyValue}>Tel: {data.parties.buyer.phone}</Text>}
              {data.parties.buyer.email && <Text style={styles.partyValue}>{data.parties.buyer.email}</Text>}
            </View>
          )}
        </View>

        {/* SHIPMENT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipment Information</Text>
          <View style={styles.flexRow}>
            <View style={{ width: '25%' }}>
              <Text style={styles.partyLabel}>Reason for Export</Text>
              <Text style={styles.partyValue}>{fedex.reasonForExport}</Text>
            </View>
            <View style={{ width: '25%' }}>
              <Text style={styles.partyLabel}>Incoterms® 2020</Text>
              <Text style={styles.partyValue}>{getIncotermDisplay(data.lines[0]?.incoterm ? { code: data.lines[0].incoterm, place: data.parties.consignee.address.city } : { code: 'DAP', place: data.parties.consignee.address.city })}</Text>
            </View>
            <View style={{ width: '25%' }}>
              <Text style={styles.partyLabel}>Duty/Tax Billing</Text>
              <Text style={styles.partyValue}>{fedex.dutyTaxBilling === 'BILL_RECIPIENT' ? 'Bill Recipient' : 'Bill Shipper'}</Text>
            </View>
            <View style={{ width: '25%' }}>
              <Text style={styles.partyLabel}>CPC (Optional)</Text>
              <Text style={styles.partyValue}>{fedex.customsProcedureCode || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* COMMODITY TABLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commodity Description (19 CFR § 141.86)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '4%' }]}>#</Text>
            <Text style={[styles.tableCellHeader, { width: '26%' }]}>Description</Text>
            <Text style={[styles.tableCellHeader, { width: '8%' }]}>HS Code</Text>
            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Origin</Text>
            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Qty</Text>
            <Text style={[styles.tableCellHeader, { width: '4%' }]}>UOM</Text>
            <Text style={[styles.tableCellHeader, { width: '9%' }]}>Unit</Text>
            <Text style={[styles.tableCellHeader, { width: '9%' }]}>Total</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>Net kg</Text>
            <Text style={[styles.tableCellHeader, { width: '8%' }]}>Gross kg</Text>
            <Text style={[styles.tableCellHeader, { width: '13%' }]}>Marks & Numbers</Text>
          </View>
          {data.lines.map((line, idx) => {
            const marks = line.packages?.map((p) => p.shippingMarks).join(', ') || 'N/A';
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '4%' }]}>{idx + 1}</Text>
                <View style={[styles.tableCell, { width: '26%' }]}>
                  <Text style={{ fontWeight: 'bold' }}>{line.description}</Text>
                  {line.descriptionEs && <Text style={{ fontSize: 7, color: '#666' }}>{line.descriptionEs}</Text>}
                </View>
                <Text style={[styles.tableCell, { width: '8%' }]}>{line.hsCode}</Text>
                <Text style={[styles.tableCell, { width: '6%' }]}>{line.countryOfOrigin} ({line.countryOfOriginName})</Text>
                <Text style={[styles.tableCell, { width: '6%', textAlign: 'right' }]}>{formatNumber(line.quantity, 0)}</Text>
                <Text style={[styles.tableCell, { width: '4%' }]}>{line.uom}</Text>
                <Text style={[styles.tableCell, { width: '9%', textAlign: 'right' }]}>{formatCurrency(line.unitPrice, line.currency)}</Text>
                <Text style={[styles.tableCell, { width: '9%', textAlign: 'right' }]}>{formatCurrency(line.lineTotal, line.currency)}</Text>
                <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>{formatNumber(line.netWeightKg, 2)}</Text>
                <Text style={[styles.tableCell, { width: '8%', textAlign: 'right' }]}>{formatNumber(line.grossWeightKg, 2)}</Text>
                <Text style={[styles.tableCell, { width: '13%', fontSize: 7 }]}>{line.packages?.map((p) => p.shippingMarks).join(', ') || 'N/A'}</Text>
              </View>
            );
          })}
          <View style={[styles.totalsRow, styles.tableRow]}>
            <Text style={[styles.tableCell, { width: '4%' }]} />
            <Text style={[styles.tableCell, { width: '26%', fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.tableCell, { width: '8%' }]} />
            <Text style={[styles.tableCell, { width: '6%' }]} />
            <Text style={[styles.tableCell, { width: '6%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalQuantity, 0)}</Text>
            <Text style={[styles.tableCell, { width: '4%' }]} />
            <Text style={[styles.tableCell, { width: '9%' }]} />
            <Text style={[styles.tableCell, { width: '9%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(data.totals.subtotal, data.totals.currency)}</Text>
            <Text style={[styles.tableCell, { width: '7%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalNetWeightKg, 2)}</Text>
            <Text style={[styles.tableCell, { width: '8%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalGrossWeightKg, 2)}</Text>
            <Text style={[styles.tableCell, { width: '13%' }]} />
          </View>
        </View>

        {/* PREFERENTIAL ORIGIN DECLARATION */}
        {data.lines.some((l) => l.preferentialOrigin) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferential Origin Declaration</Text>
            <Text style={{ fontSize: 7, marginBottom: 6 }}>
              The exporter declares that the goods listed qualify for preferential tariff treatment under the applicable Free Trade Agreement.
            </Text>
            {data.lines.filter((l) => l.preferentialOrigin).map((line, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 7 }}>
                  <Text style={{ fontWeight: 'bold' }}>{line.description}:</Text> {line.preferentialOrigin!.agreement}
                  {' — Criterion '}{line.preferentialOrigin!.originCriterion}
                  {line.preferentialOrigin!.blanketPeriod && ` (Blanket: ${line.preferentialOrigin!.blanketPeriod.start} to ${line.preferentialOrigin!.blanketPeriod.end})`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* DECLARATION */}
        <View style={[styles.section, { marginTop: 'auto', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#000' }]}>
          <Text style={styles.sectionTitle}>Declaration</Text>
          <Text style={{ fontSize: 8, marginBottom: 8, lineHeight: 1.4 }}>
            I, the undersigned, declare that the information on this invoice is true and correct, and that the goods described above are of the origin,
            value, and classification stated. I understand that false statements may result in penalties under 19 CFR § 141.86 and applicable customs laws.
          </Text>
          {data.output.includeSignature ? (
                      <View style={{...styles.signatureBlock, marginTop: 16}}>
                        <View style={styles.signatureLine}><Text>Authorized Signature</Text><Text style={{ fontSize: 7 }}>Date: {data.issueDate}</Text></View>
                        <View style={styles.signatureLine}><Text>Printed Name / Title</Text></View>
                        <View style={styles.signatureLine}><Text>{data.parties.shipper.legalName}</Text></View>
                      </View>
                    ) : null}
                    <View style={{ position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 6, color: '#666', textAlign: 'center', lineHeight: 1.3 }}>
                      <Text>Generated by ProformaFlow — Not legal advice. Verify with your broker/carrier before shipping.</Text>
                    </View>
                  </View>
                </Page>

      {/* PAGE 2 */}
      <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>COMMERCIAL INVOICE — CONTINUATION</Text>
          <Text style={{ fontSize: 8 }}>AWB: {fedex.awbNumber} | Page 2 of 2</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.flexRow}>
            <View style={{ width: '50%' }}>
              <Text style={styles.partyLabel}>Currency</Text>
              <Text style={styles.partyValue}>{data.totals.currency}</Text>
            </View>
            <View style={{ width: '50%' }}>
              <Text style={styles.partyLabel}>Total Invoice Value</Text>
              <Text style={styles.partyValue}>{formatCurrency(data.totals.grandTotal, data.totals.currency)}</Text>
            </View>
          </View>
          {fedex.customsProcedureCode && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.partyLabel}>Customs Procedure Code</Text>
              <Text style={styles.partyValue}>{fedex.customsProcedureCode}</Text>
            </View>
          )}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.partyLabel}>Certification</Text>
            <Text style={{ fontSize: 7, lineHeight: 1.4 }}>
              These commodities, technology, or software were exported from the United States (or country of origin) in accordance with the Export
              Administration Regulations. Diversion contrary to U.S. law prohibited.
            </Text>
          </View>
        </View>
        <View style={{ position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 6, color: '#666', textAlign: 'center', lineHeight: 1.3 }}>
                  <Text>Generated by ProformaFlow — Not legal advice. Verify with your broker/carrier before shipping.</Text>
                </View>
              </Page>
    </Document>
  );
}