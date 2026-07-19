import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
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
  refRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    fontSize: FONT_SIZES.body,
    borderBottom: "1px solid " + DARK,
    paddingBottom: 6,
    marginBottom: 6,
  },
  refLabel: { fontFamily: "NotoSans", fontWeight: 700 },
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
  weightRow: {
    flexDirection: "row" as const,
    gap: 16,
    marginBottom: 8,
    fontSize: FONT_SIZES.body,
  },
  weightLabel: { fontFamily: "NotoSans", fontWeight: 700 },
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
  colDesc: { width: "36%", paddingRight: 4 },
  colHs: { width: "14%", paddingRight: 2 },
  colOrigin: { width: "12%", paddingRight: 2 },
  colUnitVal: { width: "10%", paddingRight: 2, textAlign: "right" as const },
  colTotalVal: { width: "12%", textAlign: "right" as const },
  totalsSection: { flexDirection: "row" as const, justifyContent: "flex-end" as const, marginBottom: 12 },
  totalsBox: { width: "45%", border: "1.5px solid " + DARK, padding: 8 },
  totalLine: { flexDirection: "row" as const, justifyContent: "space-between" as const, fontSize: FONT_SIZES.body, paddingVertical: 1 },
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
  declaration: { fontSize: FONT_SIZES.small, color: MID, marginBottom: 12, lineHeight: 1.5 },
  sigSection: { flexDirection: "row" as const, justifyContent: "space-between" as const, borderTop: "1px solid " + DARK, paddingTop: 8 },
  sigBlock: { width: "45%" },
  sigLabel: { fontSize: FONT_SIZES.small, fontFamily: "NotoSans", fontWeight: 700, marginBottom: 2 },
  sigLine: { borderBottom: "1px solid " + DARK, height: 144, marginBottom: 2 },
  sigText: { fontSize: FONT_SIZES.tiny, color: MID },
  logo: { marginBottom: 10, maxHeight: 36, maxWidth: 100 },
});

export function DocumentPdf({ draft, watermark, carrier }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalGross = calculateTotalGrossWeight(draft.items);
  const totalNet = calculateTotalNetWeight(draft.items);
  const totalPkgs = calculateTotalPackages(draft.items);
  const hasDapDdp = draft.shipment.incoterm === "DAP" || draft.shipment.incoterm === "DPU" || draft.shipment.incoterm === "DDP";
  const pageSize = getPageSize(draft.pageSize);
  const carrierLabel = carrier && carrier !== "other" ? carrier.toUpperCase() : "STANDARD";

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap>
        {watermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.04 }} fixed>
            <Text style={{ fontSize: 72, transform: "rotate(-45deg)", color: "#000" }}>DRAFT</Text>
          </View>
        )}

        {/* Logo */}
        {draft.logoDataUrl && (
          <Image src={draft.logoDataUrl} style={styles.logo} />
        )}

        {/* Header bar */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.headerTitle}>
            {draft.documentType === "proforma" ? "PROFORMA INVOICE" :
             draft.documentType === "commercial" ? "COMMERCIAL INVOICE" :
             draft.documentType === "bundle" ? "COMMERCIAL INVOICE & PACKING LIST" :
             "EXPORT DOCUMENT"}
            {carrierLabel !== "STANDARD" ? ` — ${carrierLabel}` : ""}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SHIPPER / EXPORTER</Text>
            <Text style={styles.partyText}>
              {draft.exporter.companyName}{"\n"}
              {draft.exporter.address}{"\n"}
              {draft.exporter.country}
              {draft.exporter.taxId ? `\nTax ID: ${draft.exporter.taxId}` : ""}
              {draft.exporter.contactName ? `\nAttn: ${draft.exporter.contactName}` : ""}
              {draft.exporter.contactEmail ? `\n${draft.exporter.contactEmail}` : ""}
              {draft.exporter.contactPhone ? `\nTel: ${draft.exporter.contactPhone}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>CONSIGNEE / IMPORTER</Text>
            <Text style={styles.partyText}>
              {draft.importer.companyName}{"\n"}
              {draft.importer.address}{"\n"}
              {draft.importer.country}
              {draft.importer.taxId ? `\nTax ID: ${draft.importer.taxId}` : ""}
              {draft.importer.contactName ? `\nAttn: ${draft.importer.contactName}` : ""}
              {draft.importer.contactEmail ? `\n${draft.importer.contactEmail}` : ""}
              {draft.importer.contactPhone ? `\nTel: ${draft.importer.contactPhone}` : ""}
            </Text>
          </View>
        </View>

        {/* Reference */}
        <View style={styles.refRow}>
          <Text><Text style={styles.refLabel}>Doc #:</Text> {draft.documentNumber}</Text>
          <Text><Text style={styles.refLabel}>Date:</Text> {draft.date}</Text>
          {draft.shipment.trackingNumber && (
            <Text><Text style={styles.refLabel}>Tracking:</Text> {draft.shipment.trackingNumber}</Text>
          )}
        </View>

        {/* Shipment info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoTag}>
            <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Incoterm: </Text>{draft.shipment.incoterm}
          </Text>
          <Text style={styles.infoTag}>Currency: {draft.currency}</Text>
          {draft.shipment.countryOfOrigin && <Text style={styles.infoTag}>Origin: {draft.shipment.countryOfOrigin}</Text>}
          {draft.shipment.transportMode && <Text style={styles.infoTag}>Mode: {draft.shipment.transportMode.toUpperCase()}</Text>}
          {draft.shipment.exportReason && <Text style={styles.infoTag}>Reason: {draft.shipment.exportReason.toUpperCase()}</Text>}
          {!hasDapDdp && draft.shipment.portOfLoading && <Text style={styles.infoTag}>POL: {draft.shipment.portOfLoading}</Text>}
          {!hasDapDdp && draft.shipment.portOfDischarge && <Text style={styles.infoTag}>POD: {draft.shipment.portOfDischarge}</Text>}
          {hasDapDdp && draft.shipment.placeOfDelivery && <Text style={styles.infoTag}>Delivery: {draft.shipment.placeOfDelivery}</Text>}
        </View>

        {/* Weight */}
        {(totalGross > 0 || totalPkgs > 0) && (
          <View style={styles.weightRow}>
            {totalGross > 0 && <Text><Text style={styles.weightLabel}>Gross Wt:</Text> {totalGross.toFixed(2)} kg{totalNet > 0 ? ` (Net: ${totalNet.toFixed(2)} kg)` : ""}</Text>}
            {totalPkgs > 0 && <Text><Text style={styles.weightLabel}>Pkgs:</Text> {totalPkgs}</Text>}
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUom}>UOM</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colHs}>HS Code</Text>
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

        {/* Totals box */}
                <View style={styles.totalsSection}>
                  <View style={styles.totalsBox}>
                    {draft.totals.freight > 0 && (
                      <View style={styles.totalLine}><Text>Freight</Text><Text>{draft.totals.freight.toFixed(2)}</Text></View>
                    )}
                    {draft.totals.insurance > 0 && (
                      <View style={styles.totalLine}><Text>Insurance</Text><Text>{draft.totals.insurance.toFixed(2)}</Text></View>
                    )}
                    {draft.totals.otherCharges > 0 && (
                      <View style={styles.totalLine}><Text>Other Charges</Text><Text>{draft.totals.otherCharges.toFixed(2)}</Text></View>
                    )}
                    {draft.totals.discount > 0 && (
                      <View style={styles.totalLine}><Text>Discount</Text><Text>-{draft.totals.discount.toFixed(2)}</Text></View>
                    )}
                    <View style={styles.totalLineFinal}>
                      <Text>TOTAL DECLARED VALUE</Text>
                      <Text>{draft.totals.total.toFixed(2)} {draft.currency}</Text>
                    </View>
                  </View>
                </View>

        {/* Banking */}
        {draft.banking?.bankName && (
          <View style={{ fontSize: FONT_SIZES.small, color: MID, marginBottom: 8 }}>
            <Text>
              {draft.banking.beneficiary ? `Beneficiary: ${draft.banking.beneficiary}` : ""}
              {draft.banking.bankName ? ` | Bank: ${draft.banking.bankName}` : ""}
              {draft.banking.swiftBic ? ` | SWIFT: ${draft.banking.swiftBic}` : ""}
            </Text>
          </View>
        )}

        {draft.paymentTerms && (
          <Text style={{ fontSize: FONT_SIZES.small, color: MID, marginBottom: 6 }}>
            Payment Terms: {draft.paymentTerms}
          </Text>
        )}

        {/* Declaration */}
        <Text style={styles.declaration}>
          {draft.legalDeclaration || "I declare that the information contained in this document is true and correct."}
        </Text>

        {/* Signature */}
        <View style={styles.sigSection}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>SHIPPER&apos;S SIGNATURE</Text>
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