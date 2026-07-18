import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";
import { calculateTotalGrossWeight, calculateTotalNetWeight, calculateTotalPackages } from "@/lib/document-types";
import { baseStyles, COL, t, AWB_SAFE_ZONE } from "@/lib/pdf-styles";

const styles = StyleSheet.create({
  ...baseStyles,
  // FedEx-specific overrides
  headerBar: { ...baseStyles.headerBar, backgroundColor: "#1b1c1c" },
  headerTitle: { ...baseStyles.headerTitle },
});

export function FedexPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
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

        {/* Logo */}
        {draft.logoDataUrl && <Image src={draft.logoDataUrl} style={styles.logo} />}

        {/* Header Bar */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.headerTitle}>FEDEX COMMERCIAL INVOICE</Text>
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
              {draft.exporter.contactPhone ? `\nPhone: ${t(draft.exporter.contactPhone)}` : ""}
            </Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>CONSIGNEE / IMPORTER</Text>
            <Text style={styles.partyText}>
              {t(draft.importer.companyName)}{"\n"}
              {t(draft.importer.address)}{"\n"}
              {t(draft.importer.country)}
              {draft.importer.taxId ? `\nTax ID: ${t(draft.importer.taxId)}` : ""}
              {draft.importer.contactPhone ? `\nPhone: ${t(draft.importer.contactPhone)}` : ""}
            </Text>
          </View>
        </View>

        {/* Reference Line - what the counter clerk checks first */}
        <View style={styles.refRow}>
          <Text><Text style={styles.refLabel}>Invoice: </Text>{t(draft.documentNumber)}</Text>
          <Text><Text style={styles.refLabel}>Date: </Text>{t(draft.date)}</Text>
          {draft.shipment.trackingNumber && (
            <Text><Text style={styles.refLabel}>AWB: </Text>{t(draft.shipment.trackingNumber)}</Text>
          )}
        </View>

        {/* Shipment Info Tags */}
        <View style={styles.infoRow}>
          <Text style={styles.infoTag}>
            <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Incoterm: </Text>{t(draft.shipment.incoterm)}
          </Text>
          {draft.shipment.exportReason && (
            <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Reason: </Text>{t(draft.shipment.exportReason).toUpperCase()}</Text>
          )}
          <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Currency: </Text>{t(draft.currency)}</Text>
          {draft.shipment.countryOfOrigin && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Origin: </Text>{t(draft.shipment.countryOfOrigin)}</Text>}
          {draft.shipment.transportMode && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Mode: </Text>{t(draft.shipment.transportMode).toUpperCase()}</Text>}
          {!hasDapDdp && draft.shipment.portOfLoading && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>POL: </Text>{t(draft.shipment.portOfLoading)}</Text>}
          {!hasDapDdp && draft.shipment.portOfDischarge && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>POD: </Text>{t(draft.shipment.portOfDischarge)}</Text>}
          {hasDapDdp && draft.shipment.placeOfDelivery && <Text style={styles.infoTag}><Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Delivery: </Text>{t(draft.shipment.placeOfDelivery)}</Text>}
        </View>

        {/* Weight & Packages */}
        {(totalGross > 0 || totalPkgs > 0) && (
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 10, fontSize: FONT_SIZES.body }}>
            {totalGross > 0 && (
              <Text>
                <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Gross Weight: </Text>
                {totalGross.toFixed(2)} kg
                {totalNet > 0 ? ` (Net: ${totalNet.toFixed(2)} kg)` : ""}
              </Text>
            )}
            {totalPkgs > 0 && (
              <Text>
                <Text style={{ fontFamily: "NotoSans", fontWeight: 700 }}>Total Packages: </Text>
                {totalPkgs}
              </Text>
            )}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={COL.ci.qty}>Qty</Text>
            <Text style={COL.ci.uom}>UOM</Text>
            <Text style={COL.ci.desc}>Description of Goods</Text>
            <Text style={COL.ci.hs}>HS Code</Text>
            <Text style={COL.ci.origin}>Origin</Text>
            <Text style={COL.ci.unitVal}>Unit Price</Text>
            <Text style={COL.ci.totalVal}>Total</Text>
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

        {/* Totals Box */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            {draft.totals.freight > 0 && (
              <View style={styles.totalLine}><Text>Freight</Text><Text>{draft.totals.freight.toFixed(2)}</Text></View>
            )}
            {draft.totals.insurance > 0 && (
              <View style={styles.totalLine}><Text>Insurance</Text><Text>{draft.totals.insurance.toFixed(2)}</Text></View>
            )}
            {draft.totals.discount > 0 && (
              <View style={styles.totalLine}><Text>Discount</Text><Text>-{draft.totals.discount.toFixed(2)}</Text></View>
            )}
            <View style={styles.totalLineFinal}>
              <Text>TOTAL DECLARED VALUE</Text>
              <Text>{draft.totals.total.toFixed(2)} {t(draft.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Legal Declaration */}
        <Text style={styles.declaration}>
          {t(draft.legalDeclaration, "These commodities, technology, or software were exported in accordance with applicable export regulations. Diversion contrary to law is prohibited.")}
        </Text>

        {/* Signature - 2 inch line for wet signature */}
        <View style={styles.sigSection}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>SHIPPER'S SIGNATURE</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>{draft.signature ? `Signed: ${t(draft.signature)}` : "(wet signature required)"}</Text>
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

// Import FONT_SIZES for weight row
import { FONT_SIZES } from "@/lib/pdf-styles";