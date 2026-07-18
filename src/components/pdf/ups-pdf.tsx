import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";
import { calculateTotalGrossWeight, calculateTotalNetWeight, calculateTotalPackages } from "@/lib/document-types";
import { getPageSize, FONT_SIZES, DARK, MID, LIGHT } from "@/lib/pdf-styles";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: FONT_SIZES.body, fontFamily: "NotoSans", color: DARK },
  // ── HEADER ──
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
  // ── PARTIES: three-box layout (UPS style) ──
  partyRow: { flexDirection: "row" as const, gap: 8, marginBottom: 8 },
  partyBox: {
    flex: 1,
    border: "1.5px solid " + DARK,
    padding: 6,
  },
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
    marginBottom: 6,
  },
  refLabel: { fontFamily: "NotoSans", fontWeight: 700 },
  // ── SHIPMENT INFO TAGS ──
  infoRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 4,
    marginBottom: 8,
    fontSize: FONT_SIZES.small,
    borderBottom: "1px solid " + MID,
    paddingBottom: 6,
  },
  infoTag: { border: "1px solid " + LIGHT, padding: "2 6" },
  // ── WEIGHT / PACKAGES ──
  weightRow: {
    flexDirection: "row" as const,
    gap: 16,
    marginBottom: 8,
    fontSize: FONT_SIZES.body,
  },
  weightLabel: { fontFamily: "NotoSans", fontWeight: 700 },
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
  colQty: { width: "8%", paddingRight: 2 },
  colUom: { width: "8%", paddingRight: 2 },
  colDesc: { width: "32%", paddingRight: 4 },
  colHs: { width: "14%", paddingRight: 2 },
  colOrigin: { width: "12%", paddingRight: 2 },
  colUnitVal: { width: "12%", paddingRight: 2, textAlign: "right" as const },
  colTotalVal: { width: "14%", textAlign: "right" as const },
  // ── TOTALS ──
  totalsSection: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    marginBottom: 12,
  },
  totalsBox: { width: "45%", border: "1.5px solid " + DARK, padding: 8 },
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
  // ── DECLARATION ──
  declaration: {
    fontSize: FONT_SIZES.small,
    color: MID,
    marginBottom: 12,
    lineHeight: 1.5,
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
  // ── NOTIFY ──
  notifyBox: {
    border: "1.5px solid " + DARK,
    padding: 6,
    marginBottom: 8,
    fontSize: FONT_SIZES.body,
  },
  notifyTitle: {
    fontSize: FONT_SIZES.small,
    fontFamily: "NotoSans",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
});

export function UpsPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalGross = calculateTotalGrossWeight(draft.items);
  const totalNet = calculateTotalNetWeight(draft.items);
  const totalPkgs = calculateTotalPackages(draft.items);
  const hasDapDdp = draft.shipment.incoterm === "DAP" || draft.shipment.incoterm === "DPU" || draft.shipment.incoterm === "DDP";
  const pageSize = getPageSize(draft.pageSize);

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap>
        {watermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.04 }} fixed>
            <Text style={{ fontSize: 72, transform: "rotate(-45deg)", color: "#000" }}>DRAFT</Text>
          </View>
        )}

        {/* ─── HEADER ─── */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.headerTitle}>UPS COMMERCIAL INVOICE</Text>
        </View>

        {/* ─── PARTIES: UPS uses Shipper + Consignee + Sold To ─── */}
        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SHIPPER</Text>
            <Text style={styles.partyText}>
              {draft.exporter.companyName}{"\n"}
              {draft.exporter.address}{"\n"}
              {draft.exporter.country}
              {draft.exporter.taxId ? `\nTax ID: ${draft.exporter.taxId}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>CONSIGNEE</Text>
            <Text style={styles.partyText}>
              {draft.importer.companyName}{"\n"}
              {draft.importer.address}{"\n"}
              {draft.importer.country}
              {draft.importer.taxId ? `\nTax ID: ${draft.importer.taxId}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SOLD TO</Text>
            <Text style={styles.partyText}>
              {draft.importer.companyName}{"\n"}
              {draft.importer.country}
            </Text>
          </View>
        </View>

        {/* ─── REFERENCE ─── */}
        <View style={styles.refRow}>
          <Text>
            <Text style={styles.refLabel}>Invoice: </Text>{draft.documentNumber}
          </Text>
          <Text>
            <Text style={styles.refLabel}>Date: </Text>{draft.date}
          </Text>
          {draft.shipment.trackingNumber && (
            <Text>
              <Text style={styles.refLabel}>AWB: </Text>{draft.shipment.trackingNumber}
            </Text>
          )}
        </View>

        {/* ─── NOTIFY PARTY ─── */}
        {draft.shipment.notifyParty?.companyName && (
          <View style={styles.notifyBox}>
            <Text style={styles.notifyTitle}>NOTIFY PARTY</Text>
            <Text>
              {draft.shipment.notifyParty.companyName}
              {draft.shipment.notifyParty.address ? `, ${draft.shipment.notifyParty.address}` : ""}
              {draft.shipment.notifyParty.country ? `, ${draft.shipment.notifyParty.country}` : ""}
            </Text>
          </View>
        )}

        {/* ─── SHIPMENT INFO ─── */}
        <View style={styles.infoRow}>
          <Text style={styles.infoTag}>
            <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Incoterm: </Text>
            {draft.shipment.incoterm}
          </Text>
          {draft.shipment.exportReason && (
            <Text style={styles.infoTag}>Reason: {draft.shipment.exportReason.toUpperCase()}</Text>
          )}
          <Text style={styles.infoTag}>Currency: {draft.currency}</Text>
          {!hasDapDdp && draft.shipment.portOfLoading && <Text style={styles.infoTag}>POL: {draft.shipment.portOfLoading}</Text>}
          {!hasDapDdp && draft.shipment.portOfDischarge && <Text style={styles.infoTag}>POD: {draft.shipment.portOfDischarge}</Text>}
          {hasDapDdp && draft.shipment.placeOfDelivery && <Text style={styles.infoTag}>Delivery: {draft.shipment.placeOfDelivery}</Text>}
        </View>

        {/* ─── WEIGHT ─── */}
        {(totalGross > 0 || totalPkgs > 0) && (
          <View style={styles.weightRow}>
            {totalGross > 0 && <Text><Text style={styles.weightLabel}>Gross Wt:</Text> {totalGross.toFixed(2)} kg{totalNet > 0 ? ` (Net: ${totalNet.toFixed(2)} kg)` : ""}</Text>}
            {totalPkgs > 0 && <Text><Text style={styles.weightLabel}>Pkgs:</Text> {totalPkgs}</Text>}
          </View>
        )}

        {/* ─── TABLE ─── */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUom}>UOM</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colHs}>HTS Code</Text>
            <Text style={styles.colOrigin}>Origin</Text>
            <Text style={styles.colUnitVal}>Unit $</Text>
            <Text style={styles.colTotalVal}>Total $</Text>
          </View>
          {draft.items.map((item) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUom}>{item.unit}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colHs}>{item.hsCode || "--"}</Text>
              <Text style={styles.colOrigin}>{item.countryOfOrigin || draft.shipment.countryOfOrigin || "—"}</Text>
              <Text style={styles.colUnitVal}>{item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colTotalVal}>{(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* ─── TOTALS ─── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            {draft.totals.freight > 0 && (
              <View style={styles.totalLine}><Text>Freight</Text><Text>{draft.totals.freight.toFixed(2)}</Text></View>
            )}
            {draft.totals.insurance > 0 && (
              <View style={styles.totalLine}><Text>Insurance</Text><Text>{draft.totals.insurance.toFixed(2)}</Text></View>
            )}
            <View style={styles.totalLineFinal}>
              <Text>TOTAL DECLARED VALUE</Text>
              <Text>{draft.totals.total.toFixed(2)} {draft.currency}</Text>
            </View>
          </View>
        </View>

        {/* ─── DECLARATION ─── */}
        <Text style={styles.declaration}>
          {draft.legalDeclaration || "I declare that the information contained in this invoice is true and correct."}
        </Text>

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