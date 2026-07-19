// ============================================================================
// PackingListDocument — LANDSCAPE, packages[], shipping marks, PL folio
// ProformaFlow · FASE 3
//
// CBP COMPLIANCE: No precios ni totales monetarios (solo contenido físico)
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { PackingListData } from '@/types/shipment';
import { createBaseStyles, formatNumber, registerFonts } from '../BaseDocumentStyles';

export function PackingListDocument({ data }: { data: PackingListData }) {
  registerFonts();
  const { styles } = useMemo(() => createBaseStyles(data.output.paperSize, 'LANDSCAPE'), [data.output]);
  const pl = data.carrierSpecific.packingList!;

  // Flatten packages
  const allPackages = data.lines.flatMap((line) =>
    (line.packages || []).map((pkg, i) => ({
      ...pkg, lineIdx: line.lineNumber, description: line.description, hsCode: line.hsCode, origin: line.countryOfOrigin,
    }))
  );
  const totalPackages = allPackages.length || pl.packages.length;

  return (
    <Document>
      <Page size={data.output.paperSize === 'LETTER' ? [792, 612] : [841.89, 595.28]} orientation={'landscape' as const} style={styles.page}>
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
              <Text style={styles.partyValue}>{data.parties.shipper?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper?.address.city || "—"}, {data.parties.shipper?.address.countryName || "—"}</Text>
            </View>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Consignee</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.legalName || "—"}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee?.address.city || "—"}, {data.parties.consignee?.address.countryName || "—"}</Text>
            </View>
          </View>
        </View>

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
            <Text style={[styles.tableCellHeader, { width: '17%' }]}>Dimensions (L×W×H cm)</Text>
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
              <Text style={[styles.tableCell, { width: '17%', textAlign: 'center' }]}>
                {pkg.dimensions?.lengthCm || 0}×{pkg.dimensions?.widthCm || 0}×{pkg.dimensions?.heightCm || 0}
              </Text>
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
            <Text style={[styles.tableCell, { width: '17%' }]} />
          </View>
        </View>

        {/* SHIPPING MARKS */}
        <View style={[styles.section, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Shipping Marks</Text>
          <View style={styles.flexRow}>
            {allPackages.map((pkg, idx) => (
              <Text key={idx} style={[styles.partyValue, { width: '25%', marginBottom: 4 }]}>
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