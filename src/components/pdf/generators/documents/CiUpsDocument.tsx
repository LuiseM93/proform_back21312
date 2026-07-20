// ============================================================================
// CiUpsDocument — Commercial Invoice UPS (3-party layout)
// ProformaFlow · FASE 3
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { CiUpsData } from '@/types/shipment';
import { createBaseStyles, formatCurrency, formatNumber, getIncotermDisplay, registerFonts } from '../BaseDocumentStyles';

export function CiUpsDocument({ data }: { data: CiUpsData }) {
  registerFonts();
  const { styles, orientation } = useMemo(() => createBaseStyles(data.output.paperSize, data.output.orientation), [data.output]);
  const ups = data.carrierSpecific.ups!;

  return (
    <Document>
      <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={data.output.orientation === 'LANDSCAPE' ? 'landscape' : 'portrait'} style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { fontSize: 16 }]}>COMMERCIAL INVOICE</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>UPS International</Text>
          </View>
          <View style={{ textAlign: 'right', width: '35%' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Invoice: {ups.invoiceNumber}</Text>
            <Text style={{ fontSize: 8 }}>Date: {ups.invoiceDate}</Text>
            <Text style={{ fontSize: 8 }}>Currency: {ups.currencyOfSale}</Text>
          </View>
        </View>

        {/* 3-PARTY LAYOUT */}
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
          {data.parties.buyer && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.partyLabel}>Sold To Party (Buyer)</Text>
              <Text style={styles.partyValue}>{data.parties.buyer.legalName} — {data.parties.buyer.address.countryName}</Text>
            </View>
          )}
          {data.parties.producer && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.partyLabel}>Producer Name and Address</Text>
              <Text style={styles.partyValue}>{data.parties.producer.legalName} — {data.parties.producer.address.countryName}</Text>
              <Text style={styles.partyValue}>{data.parties.producer.address.street}, {data.parties.producer.address.city}</Text>
            </View>
          )}
          <View style={{ marginTop: 6 }}>
            <Text style={styles.partyLabel}>Parties to Transaction</Text>
            <Text style={[styles.partyValue, { fontWeight: 'bold', color: ups.partiesRelationship === 'RELATED' ? '#dc2626' : '#16a34a' }]}>
              {ups.partiesRelationship === 'RELATED' ? 'RELATED PARTIES (Intercompany)' : 'NOT RELATED (Standard Valuation)'}
            </Text>
          </View>
        </View>

        {/* SHIPMENT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipment Details</Text>
          <View style={styles.flexRow}>
            <View style={{ width: '33%' }}>
              <Text style={styles.partyLabel}>Terms of Sale</Text>
              <Text style={styles.partyValue}>{getIncotermDisplay(ups.termsOfSale)}</Text>
            </View>
            <View style={{ width: '33%' }}>
              <Text style={styles.partyLabel}>Brokerage/Duty Billing</Text>
              <Text style={styles.partyValue}>{ups.brokerageDutyBilling === 'CONSIGNEE' ? 'Consignee' : 'Shipper'}</Text>
            </View>
            <View style={{ width: '34%' }}>
              <Text style={styles.partyLabel}>Gross Weight</Text>
              <Text style={styles.partyValue}>{formatNumber(ups.grossWeightKg, 2)} kg</Text>
            </View>
          </View>
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
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Marks & Numbers</Text>
          </View>
          {data.lines.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '5%' }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>{line.description}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{line.hsCode}</Text>
              <Text style={[styles.tableCell, { width: '8%' }]}>{line.countryOfOrigin}</Text>
              <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>{formatNumber(line.quantity, 0)}</Text>
              <Text style={[styles.tableCell, { width: '5%' }]}>{line.uom}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatCurrency(line.unitPrice, line.currency)}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatCurrency(line.lineTotal, line.currency)}</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatNumber(line.netWeightKg, 2)}</Text>
              <Text style={[styles.tableCell, { width: '9%', textAlign: 'right' }]}>{formatNumber(line.grossWeightKg, 2)}</Text>
              <Text style={[styles.tableCell, { width: '10%', fontSize: 6 }]}>{line.packages?.map((p) => p.shippingMarks).join(', ') || 'N/A'}</Text>
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
            <Text style={[styles.tableCell, { width: '10%' }]} />
          </View>
        </View>

        {/* ADDITIONAL COSTS */}
        {ups.additionalCosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Costs</Text>
            {ups.additionalCosts.map((c, i) => (
              <View key={i} style={styles.flexRow}>
                <Text style={[styles.partyValue, { width: '20%' }]}>{c.type}</Text>
                <Text style={[styles.partyValue, { width: '60%' }]}>{c.description}</Text>
                <Text style={[styles.partyValue, { width: '20%', textAlign: 'right' }]}>{formatCurrency(c.amount, c.currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* DECLARATION */}
        <View style={[styles.section, { marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000' }]}>
          <Text style={styles.sectionTitle}>Declaration</Text>
          <Text style={{ fontSize: 7, marginBottom: 8 }}>
            I declare the above is true and correct. {ups.partiesRelationship === 'RELATED' && 'Parties are related; valuation per 19 CFR 152.103.'}
          </Text>
          {data.output.includeSignature && (
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}><Text>Authorized Signature</Text><Text style={{ fontSize: 6 }}>Date: {data.issueDate}</Text></View>
              <View style={styles.signatureLine}><Text>Name / Title</Text></View>
              <View style={styles.signatureLine}><Text>{data.parties.shipper.legalName}</Text></View>
            </View>
          )}
        </View>
        <Text style={{ position: 'absolute', bottom: 20, right: 36, fontSize: 7 }}>CI UPS — Generated by PlataformaFlow</Text>
      </Page>

      {/* USMCA CERT SEPARADO */}
      {ups.usmcaCertification && (
        <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={'portrait' as const} style={styles.page}>
          <Text style={[styles.title, { fontSize: 14 }]}>USMCA CERTIFICATE OF ORIGIN</Text>
          <Text style={{ fontSize: 9, marginBottom: 8 }}>Separate Document — Not Embedded in CI (per USMCA 2020)</Text>
          <View style={styles.section}>
            <Text style={styles.partyLabel}>Certifier Role: {ups.usmcaCertification.certifierRole}</Text>
            <Text style={styles.partyValue}>Certifier: {ups.usmcaCertification.certifier.legalName}</Text>
            <Text style={styles.partyValue}>Importer: {ups.usmcaCertification.importer.legalName}</Text>
            <Text style={styles.partyValue}>Authorized Signature: {ups.usmcaCertification.authorizedSignature}</Text>
            <Text style={styles.partyValue}>Date: {ups.usmcaCertification.date}</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Criterion</Text>
            <Text style={[styles.tableCellHeader, { width: '50%' }]}>Description</Text>
            <Text style={[styles.tableCellHeader, { width: '40%' }]}>HS Code</Text>
          </View>
          {ups.usmcaCertification.goods.map((g, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '10%' }]}>{g.originCriterion}</Text>
              <Text style={[styles.tableCell, { width: '50%' }]}>{g.description}</Text>
              <Text style={[styles.tableCell, { width: '40%' }]}>{g.hsCode}</Text>
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
}
