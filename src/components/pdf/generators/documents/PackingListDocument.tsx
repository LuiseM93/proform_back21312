// ============================================================================
// PackingListDocument — LANDSCAPE, packages[], shipping marks, PL folio
// ProformaFlow · FASE 3
//
// CBP COMPLIANCE: No prices or monetary totals (physical content only)
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import type { PackingListData } from '@/types/shipment';
import { createBaseStyles, formatNumber, getIncotermDisplay, registerFonts, renderPartyAddress } from '../BaseDocumentStyles';

export function PackingListDocument({ data }: { data: PackingListData }) {
  registerFonts();
  const { styles, orientation } = useMemo(() => createBaseStyles(data.output.paperSize, 'LANDSCAPE'), [data.output]);
  const pl = data.carrierSpecific.packingList!;

  // Flatten packages preservando shippingMarks por bulto.
  // SSOT: line.packages. carrierSpecific.packingList.packages se ignora en render
  // (consistencia garantizada por validación cross-document).
  const allPackages = data.lines.flatMap((line) =>
    (line.packages || []).map((pkg) => ({
      ...pkg,
      lineIdx: line.lineNumber,
      description: line.description,
      hsCode: line.hsCode,
      origin: line.countryOfOrigin,
      shippingMarks: pkg.shippingMarks,
    }))
  );
  const totalPackages = allPackages.length || pl.packages.length;

  return (
    <Document>
      <Page size={data.output.paperSize === 'LETTER' ? 'LETTER' : 'A4'} orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { fontSize: 16 }]}>PACKING LIST</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>Folio: {pl.plNumber}</Text>
          </View>
          <View style={{ textAlign: 'right', width: '35%' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Date: {pl.plDate}</Text>
            <Text style={{ fontSize: 8 }}>CI Ref: {pl.commercialInvoiceRef}</Text>
            <Text style={{ fontSize: 8 }}>AWB/BL: {pl.awbBlRef}</Text>
                      </View>
                                          </View>

        {/* PARTIES */}
                <View style={styles.section}>
                  <View style={styles.partyBlock}>
                    <View style={styles.partyColumn}>
                      <Text style={styles.partyLabel}>Shipper</Text>
                      {renderPartyAddress(data.parties.shipper).map((line, i) => (
                        <Text key={i} style={styles.partyValue}>{line}</Text>
                      ))}
                      {data.parties.shipper?.phone && <Text style={styles.partyValue}>Tel: {data.parties.shipper.phone}</Text>}
                      {data.parties.shipper?.email && <Text style={styles.partyValue}>{data.parties.shipper.email}</Text>}
                      {data.parties.shipper?.eori && <Text style={styles.partyValue}>EORI: {data.parties.shipper.eori}</Text>}
                    </View>
                    <View style={styles.partyColumn}>
                      <Text style={styles.partyLabel}>Consignee</Text>
                      {renderPartyAddress(data.parties.consignee).map((line, i) => (
                        <Text key={i} style={styles.partyValue}>{line}</Text>
                      ))}
                      {data.parties.consignee?.phone && <Text style={styles.partyValue}>Tel: {data.parties.consignee.phone}</Text>}
                      {data.parties.consignee?.email && <Text style={styles.partyValue}>{data.parties.consignee.email}</Text>}
                      {data.parties.consignee?.eori && <Text style={styles.partyValue}>EORI: {data.parties.consignee.eori}</Text>}
                    </View>
                  </View>
                </View>

                {data.parties.notifyParty && (
                  <View style={styles.section}>
                    <Text style={styles.partyLabel}>Notify Party</Text>
                    {renderPartyAddress(data.parties.notifyParty).map((line, i) => (
                      <Text key={i} style={styles.partyValue}>{line}</Text>
                    ))}
                    {data.parties.notifyParty?.phone && <Text style={styles.partyValue}>Tel: {data.parties.notifyParty.phone}</Text>}
                    {data.parties.notifyParty?.email && <Text style={styles.partyValue}>{data.parties.notifyParty.email}</Text>}
                  </View>
                )}
                {pl.incoterm && (
                  <View style={styles.section}>
                    <Text style={styles.partyLabel}>Incoterm</Text>
                    <Text style={styles.partyValue}>{getIncotermDisplay(pl.incoterm)}</Text>
                  </View>
                )}

        {/* PACKAGES TABLE - NO MONETARY FIELDS */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Packages Detail</Text>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCellHeader, { width: '6%' }]}>Pkg #</Text>
                    <Text style={[styles.tableCellHeader, { width: '8%' }]}>Type</Text>
                    <Text style={[styles.tableCellHeader, { width: '6%' }]}>Qty</Text>
                    <Text style={[styles.tableCellHeader, { width: '25%' }]}>Contents (Description)</Text>
                    <Text style={[styles.tableCellHeader, { width: '10%' }]}>HS Code</Text>
                    <Text style={[styles.tableCellHeader, { width: '8%' }]}>Origin</Text>
                    <Text style={[styles.tableCellHeader, { width: '10%' }]}>Net kg</Text>
                    <Text style={[styles.tableCellHeader, { width: '10%' }]}>Gross kg</Text>
                    <Text style={[styles.tableCellHeader, { width: '15%' }]}>Dimensions (L×W×H cm)</Text>
                    <Text style={[styles.tableCellHeader, { width: '12%' }]}>Marks</Text>
                  </View>
                  {allPackages.map((pkg, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: '6%' }]}>{idx + 1}</Text>
                      <Text style={[styles.tableCell, { width: '8%' }]}>{pkg.packageType}</Text>
                      <Text style={[styles.tableCell, { width: '6%', textAlign: 'right' }]}>{pkg.quantity}</Text>
                      <Text style={[styles.tableCell, { width: '25%' }]}>{pkg.description || "—"}</Text>
                      <Text style={[styles.tableCell, { width: '10%' }]}>{pkg.hsCode || "—"}</Text>
                      <Text style={[styles.tableCell, { width: '8%' }]}>{pkg.origin || "—"}</Text>
                      <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatNumber(pkg.netWeightKg, 2)}</Text>
                      <Text style={[styles.tableCell, { width: '10%', textAlign: 'right' }]}>{formatNumber(pkg.grossWeightKg, 2)}</Text>
                      <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                        {pkg.dimensions?.lengthCm || 0}×{pkg.dimensions?.widthCm || 0}×{pkg.dimensions?.heightCm || 0}
                      </Text>
                      <Text style={[styles.tableCell, { width: '12%', fontSize: 7 }]}>{pkg.shippingMarks || '—'}</Text>
                    </View>
                  ))}
                  <View style={[styles.totalsRow, styles.tableRow]}>
                    <Text style={[styles.tableCell, { width: '6%' }]} />
                    <Text style={[styles.tableCell, { width: '8%', fontWeight: 'bold' }]}>TOTAL</Text>
                    <Text style={[styles.tableCell, { width: '6%', textAlign: 'right', fontWeight: 'bold' }]}>{totalPackages}</Text>
                    <Text style={[styles.tableCell, { width: '25%' }]} />
                    <Text style={[styles.tableCell, { width: '10%' }]} />
                    <Text style={[styles.tableCell, { width: '8%' }]} />
                    <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalNetWeightKg, 2)}</Text>
                    <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalGrossWeightKg, 2)}</Text>
                    <Text style={[styles.tableCell, { width: '15%' }]} />
                    <Text style={[styles.tableCell, { width: '12%' }]} />
                  </View>
                </View>

                {/* SHIPPING MARKS */}
                <View style={[styles.section, { marginTop: 10 }]}>
                  <Text style={styles.sectionTitle}>Shipping Marks</Text>
                  <View style={{...styles.flexRow, flexWrap: 'wrap'}}>
                    {allPackages.map((pkg, idx) => (
                      <Text key={idx} style={[styles.partyValue, { width: '33%', marginBottom: 4 }]}>
                        Pkg {idx + 1}: {pkg.shippingMarks || '—'}
                      </Text>
                    ))}
                  </View>
                </View>

        <Text style={{ position: 'absolute', bottom: 20, right: 36, fontSize: 7 }}>Packing List — Generated by PlataformaFlow</Text>
      </Page>
    </Document>
  );
}