import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";
import { calculateTotalGrossWeight, calculateTotalNetWeight, calculateTotalPackages } from "@/lib/document-types";
import { baseStyles, COL, t } from "@/lib/pdf-styles";

const styles = StyleSheet.create({
  ...baseStyles,
  headerTitle: { ...baseStyles.headerTitle, textAlign: "center" },
  // Cross-reference box linking to Commercial Invoice
  xrefBox: {
    border: `1.5px solid ${"#1b1c1c"}`,
    padding: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
  },
  xrefLabel: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 9 },
});

export function PackingListPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalNet = calculateTotalNetWeight(draft.items);
  const totalGross = calculateTotalGrossWeight(draft.items);
  const totalPkgs = calculateTotalPackages(draft.items);
  const pageSize = draft.pageSize || "A4";

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap>
        {/* AWB Safe Zone - Fixed top-right on every page */}
        <View style={styles.awbSafeZone} fixed>
          <Text style={styles.awbSafeZoneText}>AWB / BARCODE AREA\nKEEP CLEAR\n50×30 mm</Text>
        </View>

        {watermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.04 }} fixed>
            <Text style={{ fontSize: 72, transform: "rotate(-45deg)", color: "#000" }}>DRAFT</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.headerTitle}>PACKING LIST</Text>
        </View>

        {/* Parties (matching CI layout for visual match) */}
        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SHIPPER / EXPORTER</Text>
            <Text style={styles.partyText}>
              {t(draft.exporter.companyName)}{"\n"}
              {t(draft.exporter.address)}{"\n"}
              {t(draft.exporter.country)}
              {draft.exporter.taxId ? `\nTax ID: ${t(draft.exporter.taxId)}` : ""}
              {draft.exporter.contactName ? `\nAttn: ${t(draft.exporter.contactName)}` : ""}
              {draft.exporter.contactEmail ? `\n${t(draft.exporter.contactEmail)}` : ""}
              {draft.exporter.contactPhone ? `\nTel: ${t(draft.exporter.contactPhone)}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>CONSIGNEE</Text>
            <Text style={styles.partyText}>
              {t(draft.importer.companyName)}{"\n"}
              {t(draft.importer.address)}{"\n"}
              {t(draft.importer.country)}
              {draft.importer.taxId ? `\nTax ID: ${t(draft.importer.taxId)}` : ""}
              {draft.importer.contactName ? `\nAttn: ${t(draft.importer.contactName)}` : ""}
              {draft.importer.contactEmail ? `\n${t(draft.importer.contactEmail)}` : ""}
              {draft.importer.contactPhone ? `\nTel: ${t(draft.importer.contactPhone)}` : ""}
            </Text>
          </View>
        </View>

        {/* Cross-Reference to Commercial Invoice */}
        <View style={styles.xrefBox}>
          <Text><Text style={styles.xrefLabel}>Related Invoice:</Text> {t(draft.documentNumber)}</Text>
          <Text><Text style={styles.xrefLabel}>Date:</Text> {t(draft.date)}</Text>
          {draft.shipment.trackingNumber && (
            <Text><Text style={styles.xrefLabel}>AWB:</Text> {t(draft.shipment.trackingNumber)}</Text>
          )}
        </View>

        {/* Table: Packing-specific columns with Dimensions */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={COL.pl.marks}>Marks & Nos.</Text>
            <Text style={COL.pl.desc}>Description</Text>
            <Text style={COL.pl.hs}>HS Code</Text>
            <Text style={COL.pl.qty}>Qty</Text>
            <Text style={COL.pl.pkgType}>Pkg Type</Text>
            <Text style={COL.pl.pkgCount}>Pkgs</Text>
            <Text style={COL.pl.dims}>Dimensions</Text>
            <Text style={COL.pl.netWt}>Net kg</Text>
            <Text style={COL.pl.grossWt}>Gross kg</Text>
          </View>
          {draft.items.map((item) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={COL.pl.marks}>{t(item.marksAndNumbers, "—")}</Text>
              <Text style={COL.pl.desc}>{t(item.description)}</Text>
              <Text style={COL.pl.hs}>{t(item.hsCode, "--")}</Text>
              <Text style={COL.pl.qty}>{item.quantity}</Text>
              <Text style={COL.pl.pkgType}>{t(item.packageType, "—")}</Text>
              <Text style={COL.pl.pkgCount}>{t(item.packageCount, "—")}</Text>
              <Text style={COL.pl.dims}>{t(item.packageDimensions, "—")}</Text>
              <Text style={COL.pl.netWt}>{(item.weightKg || 0).toFixed(2)}</Text>
              <Text style={COL.pl.grossWt}>{(item.weightGrossKg || item.weightKg || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}><Text>Total Packages</Text><Text>{totalPkgs}</Text></View>
            <View style={styles.totalLine}><Text>Total Net Weight</Text><Text>{totalNet.toFixed(2)} kg</Text></View>
            <View style={styles.totalLineFinal}>
              <Text>Total Gross Weight</Text>
              <Text>{totalGross.toFixed(2)} kg</Text>
            </View>
          </View>
        </View>

        {/* Signature - 2 inch line */}
        <View style={styles.sigSection}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>SHIPPER&apos;S SIGNATURE</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>{draft.signature ? `Signed: ${t(draft.signature)}` : ""}</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>DATE</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>{t(draft.date)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}