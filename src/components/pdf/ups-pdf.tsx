import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";
import { calculateTotalGrossWeight, calculateTotalNetWeight, calculateTotalPackages } from "@/lib/document-types";
import { baseStyles, COL, t } from "@/lib/pdf-styles";

const styles = StyleSheet.create({
  ...baseStyles,
  // UPS-specific: three-party layout
  partyBox: { ...baseStyles.partyBox, padding: 6 },
  partyTitle: { ...baseStyles.partyTitle, fontSize: 9, letterSpacing: 0.5, marginBottom: 3 },
  partyText: { ...baseStyles.partyText, fontSize: 9, lineHeight: 1.3 },
  notifyBox: {
    border: `1.5px solid ${"#1b1c1c"}`,
    padding: 6,
    marginBottom: 8,
    fontSize: 9,
  },
  notifyTitle: {
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoTag: { border: `1px solid ${"#888"}`, padding: "2 6", fontSize: 8 },
});

export function UpsPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalGross = calculateTotalGrossWeight(draft.items);
  const totalNet = calculateTotalNetWeight(draft.items);
  const totalPkgs = calculateTotalPackages(draft.items);
  const hasDapDdp = draft.shipment.incoterm === "DAP" || draft.shipment.incoterm === "DPU" || draft.shipment.incoterm === "DDP";
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
          <Text style={styles.headerTitle}>UPS COMMERCIAL INVOICE</Text>
        </View>

        {/* Parties: UPS uses Shipper + Consignee + Sold To */}
        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SHIPPER</Text>
            <Text style={styles.partyText}>
              {t(draft.exporter.companyName)}{"\n"}
              {t(draft.exporter.address)}{"\n"}
              {t(draft.exporter.country)}
              {draft.exporter.taxId ? `\nTax ID: ${t(draft.exporter.taxId)}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>CONSIGNEE</Text>
            <Text style={styles.partyText}>
              {t(draft.importer.companyName)}{"\n"}
              {t(draft.importer.address)}{"\n"}
              {t(draft.importer.country)}
              {draft.importer.taxId ? `\nTax ID: ${t(draft.importer.taxId)}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>SOLD TO</Text>
            <Text style={styles.partyText}>
              {t(draft.importer.companyName)}{"\n"}
              {t(draft.importer.country)}
            </Text>
          </View>
        </View>

        {/* Reference Line */}
        <View style={styles.refRow}>
          <Text><Text style={styles.refLabel}>Invoice: </Text>{t(draft.documentNumber)}</Text>
          <Text><Text style={styles.refLabel}>Date: </Text>{t(draft.date)}</Text>
          {draft.shipment.trackingNumber && (
            <Text><Text style={styles.refLabel}>AWB: </Text>{t(draft.shipment.trackingNumber)}</Text>
          )}
        </View>

        {/* Notify Party Box */}
        {draft.shipment.notifyParty?.companyName && (
          <View style={styles.notifyBox}>
            <Text style={styles.notifyTitle}>NOTIFY PARTY</Text>
            <Text>
              {t(draft.shipment.notifyParty.companyName)}
              {draft.shipment.notifyParty.address ? `, ${t(draft.shipment.notifyParty.address)}` : ""}
              {draft.shipment.notifyParty.country ? `, ${t(draft.shipment.notifyParty.country)}` : ""}
            </Text>
          </View>
        )}

        {/* Shipment Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoTag}>
            <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Incoterm: </Text>{t(draft.shipment.incoterm)}
          </Text>
          {draft.shipment.exportReason && <Text style={styles.infoTag}>Reason: {t(draft.shipment.exportReason).toUpperCase()}</Text>}
          <Text style={styles.infoTag}>Currency: {t(draft.currency)}</Text>
          {!hasDapDdp && draft.shipment.portOfLoading && <Text style={styles.infoTag}>POL: {t(draft.shipment.portOfLoading)}</Text>}
          {!hasDapDdp && draft.shipment.portOfDischarge && <Text style={styles.infoTag}>POD: {t(draft.shipment.portOfDischarge)}</Text>}
          {hasDapDdp && draft.shipment.placeOfDelivery && <Text style={styles.infoTag}>Delivery: {t(draft.shipment.placeOfDelivery)}</Text>}
        </View>

        {/* Weight */}
        {(totalGross > 0 || totalPkgs > 0) && (
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 8, fontSize: 9 }}>
            {totalGross > 0 && <Text><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Gross Wt:</Text> {totalGross.toFixed(2)} kg{totalNet > 0 ? ` (Net: ${totalNet.toFixed(2)} kg)` : ""}</Text>}
            {totalPkgs > 0 && <Text><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Pkgs:</Text> {totalPkgs}</Text>}
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={COL.ci.qty}>Qty</Text>
            <Text style={COL.ci.uom}>UOM</Text>
            <Text style={COL.ci.desc}>Description</Text>
            <Text style={COL.ci.hs}>HTS Code</Text>
            <Text style={COL.ci.origin}>Origin</Text>
            <Text style={COL.ci.unitVal}>Unit $</Text>
            <Text style={COL.ci.totalVal}>Total $</Text>
          </View>
          {draft.items.map((item) => (
            <View key={item.id} style={styles.tableRow} wrap={false}>
              <Text style={COL.ci.qty}>{item.quantity}</Text>
              <Text style={COL.ci.uom}>{t(item.unit)}</Text>
              <Text style={COL.ci.desc}>{t(item.description)}</Text>
              <Text style={COL.ci.hs}>{t(item.hsCode, "--")}</Text>
              <Text style={COL.ci.origin}>{t(item.countryOfOrigin, draft.shipment.countryOfOrigin, "—")}</Text>
              <Text style={COL.ci.unitVal}>{item.unitPrice.toFixed(2)}</Text>
              <Text style={COL.ci.totalVal}>{(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            {draft.totals.freight > 0 && <View style={styles.totalLine}><Text>Freight</Text><Text>{draft.totals.freight.toFixed(2)}</Text></View>}
            {draft.totals.insurance > 0 && <View style={styles.totalLine}><Text>Insurance</Text><Text>{draft.totals.insurance.toFixed(2)}</Text></View>}
            {draft.totals.otherCharges > 0 && <View style={styles.totalLine}><Text>Other Charges</Text><Text>{draft.totals.otherCharges.toFixed(2)}</Text></View>}
            <View style={styles.totalLineFinal}>
              <Text>TOTAL DECLARED VALUE</Text>
              <Text>{draft.totals.total.toFixed(2)} {t(draft.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Declaration */}
        <Text style={styles.declaration}>
          {t(draft.legalDeclaration, "I declare that the information contained in this invoice is true and correct.")}
        </Text>

        {/* Signature */}
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