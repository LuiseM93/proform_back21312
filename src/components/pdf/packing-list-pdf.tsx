import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";
import { calculateTotalGrossWeight, calculateTotalNetWeight, calculateTotalPackages } from "@/lib/document-types";
import { getPageSize, FONT_SIZES, DARK, MID, LIGHT } from "@/lib/pdf-styles";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: FONT_SIZES.body, fontFamily: "NotoSans", color: DARK },
  headerBar: {
    backgroundColor: DARK,
    padding: "8 0",
    marginBottom: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: {
    color: "#fff",
    fontSize: FONT_SIZES.docTitle,
    fontFamily: "NotoSans",
    fontWeight: 700,
    letterSpacing: 2,
    textAlign: "center" as const,
  },
  // ── MATCHING PARTIES ──
  partyRow: { flexDirection: "row" as const, gap: 10, marginBottom: 8 },
  partyBox: { flex: 1, border: "1.5px solid " + DARK, padding: 8 },
  partyTitle: {
    fontSize: FONT_SIZES.small,
    fontFamily: "NotoSans",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  partyText: { fontSize: FONT_SIZES.body, lineHeight: 1.3 },
  // ── REFERENCE LINE ──
  refRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    fontSize: FONT_SIZES.body,
    borderBottom: "1px solid " + DARK,
    paddingBottom: 6,
    marginBottom: 8,
  },
  refLabel: { fontFamily: "NotoSans", fontWeight: 700 },
  // ── CROSS-REFERENCE INVOICE ──
  xrefBox: {
    border: "1.5px solid " + DARK,
    padding: 6,
    marginBottom: 8,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#f0f0f0",
  },
  // ── TABLE ──
  table: { marginTop: 2, marginBottom: 10 },
  tableHeader: {
    flexDirection: "row" as const,
    borderBottom: "2px solid " + DARK,
    paddingBottom: 4,
    marginBottom: 2,
    fontSize: FONT_SIZES.small,
    fontFamily: "NotoSans",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottom: "0.5px solid " + LIGHT,
    paddingVertical: 3,
    alignItems: "flex-start" as const,
  },
  colMarks: { width: "18%", paddingRight: 2 },
  colDesc: { width: "30%", paddingRight: 4 },
  colHs: { width: "12%", paddingRight: 2 },
  colQty: { width: "8%", paddingRight: 2 },
  colPkgType: { width: "10%", paddingRight: 2 },
  colPkgCount: { width: "8%", paddingRight: 2 },
  colNetWt: { width: "7%", paddingRight: 2, textAlign: "right" as const },
  colGrossWt: { width: "7%", textAlign: "right" as const },
  // ── TOTALS ──
  totalsSection: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    marginBottom: 14,
  },
  totalsBox: { width: "50%", border: "1.5px solid " + DARK, padding: 8 },
  totalLine: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    fontSize: FONT_SIZES.body,
    paddingVertical: 1,
  },
  totalLineFinal: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    fontSize: FONT_SIZES.total,
    fontFamily: "NotoSans",
    fontWeight: 700,
    borderTop: "1.5px solid " + DARK,
    paddingTop: 4,
    marginTop: 2,
  },
  // ── SIGNATURE ──
  sigSection: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    borderTop: "1px solid " + DARK,
    paddingTop: 8,
  },
  sigBlock: { width: "45%" },
  sigLabel: {
    fontSize: FONT_SIZES.small,
    fontFamily: "NotoSans",
    fontWeight: 700,
    marginBottom: 2,
  },
  sigLine: { borderBottom: "1px solid " + DARK, height: 24, marginBottom: 2 },
  sigText: { fontSize: FONT_SIZES.tiny, color: MID },
});

export function PackingListPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalNet = calculateTotalNetWeight(draft.items);
  const totalGross = calculateTotalGrossWeight(draft.items);
  const totalPkgs = calculateTotalPackages(draft.items);
  const pageSize = getPageSize(draft.pageSize);

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap>
        {watermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.04 }} fixed>
            <Text style={{ fontSize: 72, transform: "rotate(-45deg)", color: "#000" }}>DRAFT</Text>
          </View>
        )}

        <View style={styles.headerBar} fixed>
          <Text style={styles.headerTitle}>PACKING LIST</Text>
        </View>

        {/* ─── PARTIES (same layout as CI for visual match) ─── */}
        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SHIPPER / EXPORTER</Text>
            <Text style={styles.partyText}>
              {draft.exporter.companyName}{"\n"}
              {draft.exporter.country}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>CONSIGNEE</Text>
            <Text style={styles.partyText}>
              {draft.importer.companyName}{"\n"}
              {draft.importer.country}
            </Text>
          </View>
        </View>

        {/* ─── CROSS-REFERENCE TO INVOICE ─── */}
        <View style={styles.xrefBox}>
          <Text><Text style={styles.refLabel}>Related Invoice:</Text> {draft.documentNumber}</Text>
          <Text><Text style={styles.refLabel}>Date:</Text> {draft.date}</Text>
          {draft.shipment.trackingNumber && (
            <Text><Text style={styles.refLabel}>AWB:</Text> {draft.shipment.trackingNumber}</Text>
          )}
        </View>

        {/* ─── TABLE: packing-specific columns ─── */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colMarks}>Marks & Nos.</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colHs}>HS Code</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPkgType}>Pkg Type</Text>
            <Text style={styles.colPkgCount}>Pkgs</Text>
            <Text style={styles.colNetWt}>Net kg</Text>
            <Text style={styles.colGrossWt}>Gross kg</Text>
          </View>
          {draft.items.map((item) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colMarks}>{item.marksAndNumbers || "—"}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colHs}>{item.hsCode || "--"}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPkgType}>{item.packageType || "—"}</Text>
              <Text style={styles.colPkgCount}>{item.packageCount || "—"}</Text>
              <Text style={styles.colNetWt}>{(item.weightKg || 0).toFixed(2)}</Text>
              <Text style={styles.colGrossWt}>{(item.weightGrossKg || item.weightKg || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* ─── TOTALS ─── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text>Total Packages</Text>
              <Text>{totalPkgs}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text>Total Net Weight</Text>
              <Text>{totalNet.toFixed(2)} kg</Text>
            </View>
            <View style={styles.totalLineFinal}>
              <Text>Total Gross Weight</Text>
              <Text>{totalGross.toFixed(2)} kg</Text>
            </View>
          </View>
        </View>

        {/* ─── SIGNATURE ─── */}
        <View style={styles.sigSection}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>SHIPPER'S SIGNATURE</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>{draft.signature ? `Signed: ${draft.signature}` : ""}</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>DATE</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>{draft.date}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}