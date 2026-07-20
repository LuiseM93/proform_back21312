// ============================================================================
// BundleDocument — LANDSCAPE, tabla combinada 13 columnas, dual declarations
// ProformaFlow · FASE 3
// ============================================================================
import React, { useMemo } from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { BundleData } from '@/types/shipment';
import { createBaseStyles, formatCurrency, formatNumber, registerFonts } from '../BaseDocumentStyles';

export function BundleDocument({ data }: { data: BundleData }) {
  registerFonts();
  const { styles, orientation } = useMemo(() => createBaseStyles(data.output.paperSize, 'LANDSCAPE'), [data.output]);
  const bundle = data.carrierSpecific.bundle!;

  return (
    <Document>
      <Page size={data.output.paperSize === 'LETTER' ? [792, 612] : [841.89, 595.28]} orientation={'landscape' as const} style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { fontSize: 14 }]}>COMMERCIAL INVOICE + PACKING LIST</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>Combined Document (Bundle)</Text>
          </View>
          <View style={{ textAlign: 'right', width: '35%' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Doc: {bundle.documentNumber}</Text>
            <Text style={{ fontSize: 8 }}>CI Ref: {bundle.commercialInvoiceRef}</Text>
            <Text style={{ fontSize: 8 }}>PL Ref: {bundle.packingListRef}</Text>
            <Text style={{ fontSize: 8 }}>Date: {data.issueDate}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={styles.section}>
          <View style={styles.partyBlock}>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Shipper</Text>
              <Text style={styles.partyValue}>{data.parties.shipper.legalName}</Text>
              <Text style={styles.partyValue}>{data.parties.shipper.address.city}, {data.parties.shipper.address.countryName}</Text>
            </View>
            <View style={styles.partyColumn}>
              <Text style={styles.partyLabel}>Consignee</Text>
              <Text style={styles.partyValue}>{data.parties.consignee.legalName}</Text>
              <Text style={styles.partyValue}>{data.parties.consignee.address.city}, {data.parties.consignee.address.countryName}</Text>
            </View>
          </View>
        </View>

        {/* COMBINED 13-COLUMN TABLE — una fila por bulto (granularidad total) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combined Commodity & Packing Detail (13 cols)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '4%' }]}>#</Text>
            <Text style={[styles.tableCellHeader, { width: '18%' }]}>Description</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>HS Code</Text>
            <Text style={[styles.tableCellHeader, { width: '5%' }]}>Origin</Text>
            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Qty</Text>
            <Text style={[styles.tableCellHeader, { width: '4%' }]}>UOM</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>Unit</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>Amount</Text>
            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Net kg</Text>
            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Gross kg</Text>
            <Text style={[styles.tableCellHeader, { width: '7%' }]}>Pkgs</Text>
            <Text style={[styles.tableCellHeader, { width: '8%' }]}>Dims cm</Text>
            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Marks</Text>
          </View>
          {data.lines.flatMap((line, li) =>
            (line.packages && line.packages.length > 0 ? line.packages : [{ packageType: '—', quantity: line.quantity, netWeightKg: line.netWeightKg, grossWeightKg: line.grossWeightKg, dimensions: line.dimensions, shippingMarks: '—' } as any]).map((pkg: any, pi: number) => (
              <View key={`${li}-${pi}`} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '4%' }]}>{li + 1}.{pi + 1}</Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>{line.description}</Text>
                <Text style={[styles.tableCell, { width: '7%' }]}>{line.hsCode}</Text>
                <Text style={[styles.tableCell, { width: '5%' }]}>{line.countryOfOrigin} ({line.countryOfOriginName})</Text>
                <Text style={[styles.tableCell, { width: '6%', textAlign: 'right' }]}>{formatNumber(pkg.quantity, 0)}</Text>
                <Text style={[styles.tableCell, { width: '4%' }]}>{line.uom}</Text>
                <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>{formatCurrency(line.unitPrice, line.currency)}</Text>
                <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>{formatCurrency(line.lineTotal, line.currency)}</Text>
                <Text style={[styles.tableCell, { width: '6%', textAlign: 'right' }]}>{formatNumber(pkg.netWeightKg, 2)}</Text>
                <Text style={[styles.tableCell, { width: '6%', textAlign: 'right' }]}>{formatNumber(pkg.grossWeightKg, 2)}</Text>
                <Text style={[styles.tableCell, { width: '7%', textAlign: 'right' }]}>1</Text>
                <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>
                  {pkg.dimensions ? `${pkg.dimensions.lengthCm}×${pkg.dimensions.widthCm}×${pkg.dimensions.heightCm}` : '—'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%', fontSize: 6 }]}>{pkg.shippingMarks || '—'}</Text>
              </View>
            ))
          )}
          <View style={[styles.totalsRow, styles.tableRow]}>
            <Text style={[styles.tableCell, { width: '4%' }]} />
            <Text style={[styles.tableCell, { width: '18%', fontWeight: 'bold' }]}>TOTALS</Text>
            <Text style={[styles.tableCell, { width: '7%' }]} />
            <Text style={[styles.tableCell, { width: '5%' }]} />
            <Text style={[styles.tableCell, { width: '6%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalQuantity, 0)}</Text>
            <Text style={[styles.tableCell, { width: '4%' }]} />
            <Text style={[styles.tableCell, { width: '7%' }]} />
            <Text style={[styles.tableCell, { width: '7%', textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(data.totals.subtotal, data.totals.currency)}</Text>
            <Text style={[styles.tableCell, { width: '6%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalNetWeightKg, 2)}</Text>
            <Text style={[styles.tableCell, { width: '6%', textAlign: 'right', fontWeight: 'bold' }]}>{formatNumber(data.totals.totalGrossWeightKg, 2)}</Text>
            <Text style={[styles.tableCell, { width: '7%', textAlign: 'right', fontWeight: 'bold' }]}>{data.totals.totalPackages}</Text>
            <Text style={[styles.tableCell, { width: '8%' }]} />
            <Text style={[styles.tableCell, { width: '15%' }]} />
          </View>
        </View>

        {/* DUAL DECLARATIONS */}
        <View style={[styles.section, { marginTop: 'auto', paddingTop: 8 }]}>
          <View style={styles.flexRow}>
            <View style={{ width: '50%', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 8 }}>
              <Text style={styles.sectionTitle}>Invoice Declaration</Text>
              <Text style={{ fontSize: 6, lineHeight: 1.3 }}>
                I declare the invoice info true and correct per customs regulations. Goods classified and valued as stated.
              </Text>
              {data.output.includeSignature && <Text style={{ fontSize: 6, marginTop: 4 }}>Signature: {data.parties.shipper.legalName}</Text>}
            </View>
            <View style={{ width: '50%', paddingLeft: 8 }}>
              <Text style={styles.sectionTitle}>Packing Declaration</Text>
              <Text style={{ fontSize: 6, lineHeight: 1.3 }}>
                I certify packages listed reflect actual contents, weights, and dimensions. Marks correspond to external labels.
              </Text>
              {data.output.includeSignature && <Text style={{ fontSize: 6, marginTop: 4 }}>Signature: {data.parties.shipper.legalName}</Text>}
            </View>
          </View>
        </View>

        <Text style={{ position: 'absolute', bottom: 20, right: 36, fontSize: 7 }}>Bundle CI+PL — Generated by PlataformaFlow</Text>
      </Page>
    </Document>
  );
}
