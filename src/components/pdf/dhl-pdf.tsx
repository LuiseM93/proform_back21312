import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";
import { calculateTotalGrossWeight, calculateTotalNetWeight, calculateTotalPackages } from "@/lib/document-types";
import { baseStyles, COL, t, RED_ACCENT } from "@/lib/pdf-styles";

const styles = StyleSheet.create({
  ...baseStyles,
  // DHL: Dark gray header with red accent border (thermal-safe)
  headerBar: {
    ...baseStyles.headerBar,
    backgroundColor: "#1b1c1c",
    borderBottom: `3px solid ${RED_ACCENT}`,
  },
  headerTitle: { ...baseStyles.headerTitle },
  weightBox: {
    border: `1.5px solid ${"#1b1c1c"}`,
    padding: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weightLabel: { fontFamily: "NotoSans", fontWeight: 700 },
});

export function DhlPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
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

        {/* Header - Dark gray with red accent border (thermal-safe) */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.headerTitle}>DHL COMMERCIAL INVOICE</Text>
        </View>

        {/* Parties */}
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
              {draft.exporter.contactPhone ? `\nPhone: ${t(draft.exporter.contactPhone)}` : ""}
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
              {draft.importer.contactPhone ? `\nPhone: ${t(draft.importer.contactPhone)}` : ""}
            </Text>
          </View>
        </View>

        {/* Reference */}
        <View style={styles.refRow}>
          <Text><Text style={styles.refLabel}>Invoice: </Text>{t(draft.documentNumber)}</Text>
          <Text><Text style={styles.refLabel}>Date: </Text>{t(draft.date)}</Text>
          {draft.shipment.trackingNumber && (
            <Text><Text style={styles.refLabel}>AWB: </Text>{t(draft.shipment.trackingNumber)}</Text>
          )}
        </View>

        {/* Shipment Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoTag}>
            <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Incoterm: </Text>
            {t(draft.shipment.incoterm)}
          </Text>
          {draft.shipment.exportReason && (
            <Text style={styles.infoTag}>Reason: {t(draft.shipment.exportReason).toUpperCase()}</Text>
          )}
          <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Currency: </Text>{t(draft.currency)}</Text>
          {draft.shipment.countryOfOrigin && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Origin: </Text>{t(draft.shipment.countryOfOrigin)}</Text>}
          {!hasDapDdp && draft.shipment.portOfLoading && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>POL: </Text>{t(draft.shipment.portOfLoading)}</Text>}
          {!hasDapDdp && draft.shipment.portOfDischarge && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>POD: </Text>{t(draft.shipment.portOfDischarge)}</Text>}
          {hasDapDdp && draft.shipment.placeOfDelivery && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Delivery: </Text>{t(draft.shipment.placeOfDelivery)}</Text>}
        </View>

        {/* Notify Party */}
        {draft.shipment.notifyParty?.companyName && (
          <View style={{ border: `1.5px solid ${"#1b1c1c"}`, padding: 6, marginBottom: 8, fontSize: 9 }}>
            <Text style={{ fontSize: 9, fontFamily: "NotoSans", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>NOTIFY PARTY</Text>
            <Text>
              {t(draft.shipment.notifyParty.companyName)}
              {draft.shipment.notifyParty.address ? `, ${t(draft.shipment.notifyParty.address)}` : ""}
              {draft.shipment.notifyParty.country ? `, ${t(draft.shipment.notifyParty.country)}` : ""}
            </Text>
          </View>
        )}

        {/* Weight Box - DHL Prominent */}
        <View style={styles.weightBox}>
          <Text><Text style={styles.weightLabel}>Gross Weight:</Text> {totalGross > 0 ? `${totalGross.toFixed(2)} kg` : "—"}</Text>
          <Text><Text style={styles.weightLabel}>Net Weight:</Text> {totalNet > 0 ? `${totalNet.toFixed(2)} kg` : "—"}</Text>
          <Text><Text style={styles.weightLabel}>Packages:</Text> {totalPkgs > 0 ? `${totalPkgs}` : "—"}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={COL.ci.qty}>Qty</Text>
            <Text style={COL.ci.uom}>UOM</Text>
            <Text style={COL.ci.desc}>Description of Goods</Text>
            <Text style={COL.ci.hs}>HS Code</Text>
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
            {draft.totals.freight > 0 && (
              <View style={styles.totalLine}><Text>Freight</Text><Text>{draft.totals.freight.toFixed(2)}</Text></View>
            )}
            {draft.totals.insurance > 0 && (
              <View style={styles.totalLine}><Text>Insurance</Text><Text>{draft.totals.insurance.toFixed(2)}</Text></View>
            )}
            {draft.totals.otherCharges > 0 && (
              <View style={styles.totalLine}><Text>Other Charges</Text><Text>{draft.totals.otherCharges.toFixed(2)}</Text></View>
            )}
            <View style={styles.totalLineFinal}>
              <Text>TOTAL DECLARED VALUE</Text>
              <Text>{draft.totals.total.toFixed(2)} {t(draft.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Declaration */}
        <Text style={styles.declaration}>
          {t(draft.legalDeclaration, "I hereby declare that the information provided is correct and that the goods are of the stated origin.")}
        </Text>

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