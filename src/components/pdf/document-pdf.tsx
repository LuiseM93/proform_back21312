import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#1b1c1c" },
  section: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 8 },
  header: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#747878", paddingVertical: 4 },
  col: { flex: 1, paddingHorizontal: 2 },
  colWide: { flex: 2, paddingHorizontal: 2 },
  small: { fontSize: 7 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 7 },
});

export function DocumentPdf({ draft, watermark, carrier }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const showWatermark = watermark;
  const carrierLabel = carrier && carrier !== "other" ? carrier.toUpperCase() : "STANDARD";
  const totalWeight = draft.items.reduce((sum, i) => sum + (i.weightKg || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {showWatermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.05 }}>
            <Text style={{ fontSize: 60, transform: "rotate(-45deg)", color: "#000" }}>PROFORMAFLOW DRAFT</Text>
          </View>
        )}
        
        {draft.logoDataUrl && (
          <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={draft.logoDataUrl} style={{ width: 100, height: "auto", maxHeight: 40 }} />
          </View>
        )}
        
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
          <View>
            {carrierLabel !== "STANDARD" && (
              <Text style={styles.header}>{carrierLabel} DOCUMENT</Text>
            )}
            <Text style={styles.header}>EXPORTER / SHIPPER</Text>
            <Text>{draft.exporter.companyName}</Text>
            <Text>{draft.exporter.address}</Text>
            <Text>{draft.exporter.country}</Text>
            {draft.exporter.taxId && <Text>Tax ID: {draft.exporter.taxId}</Text>}
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.header}>IMPORTER / CONSIGNEE</Text>
            <Text>{draft.importer.companyName}</Text>
            <Text>{draft.importer.address}</Text>
            <Text>{draft.importer.country}</Text>
            {draft.importer.taxId && <Text>Tax ID: {draft.importer.taxId}</Text>}
          </View>
        </View>

        {draft.shipment.notifyParty && (
          <View style={styles.section}>
            <Text style={styles.header}>NOTIFY PARTY</Text>
            <Text>{draft.shipment.notifyParty.companyName}</Text>
            <Text>{draft.shipment.notifyParty.address}</Text>
            <Text>{draft.shipment.notifyParty.country}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Incoterm:</Text> {draft.shipment.incoterm} | 
          <Text style={styles.label}> Origin:</Text> {draft.shipment.countryOfOrigin || "—"} | 
          <Text style={styles.label}> Destination:</Text> {draft.shipment.countryOfDestination || "—"}
          {draft.shipment.transportMode && ` | Mode: ${draft.shipment.transportMode}`}
          {draft.shipment.trackingNumber && ` | Tracking: ${draft.shipment.trackingNumber}`}
        </View>

        {totalWeight > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Total Weight:</Text> {totalWeight.toFixed(2)} kg
          </View>
        )}

        <View style={styles.tableRow}>
          <Text style={styles.colWide}>Description</Text>
          <Text style={styles.col}>HS Code</Text>
          <Text style={styles.col}>Origin</Text>
          <Text style={styles.col}>Qty</Text>
          <Text style={styles.col}>Total</Text>
        </View>
        {draft.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colWide}>{item.description}</Text>
            <Text style={styles.col}>{item.hsCode || "--"}</Text>
            <Text style={styles.col}>{item.countryOfOrigin || draft.shipment.countryOfOrigin || "—"}</Text>
            <Text style={styles.col}>{item.quantity} {item.unit}</Text>
            <Text style={styles.col}>{(item.quantity * item.unitPrice).toFixed(2)}</Text>
          </View>
        ))}

        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
          <Text>Total: {draft.totals.total.toFixed(2)} {draft.items[0]?.currency}</Text>
        </View>
        
        {draft.banking && (
          <View style={{ marginTop: 8, fontSize: 7 }}>
            <Text>{draft.banking.beneficiary && `Beneficiary: ${draft.banking.beneficiary}`}</Text>
            <Text>{draft.banking.bankName && `Bank: ${draft.banking.bankName}`}</Text>
            <Text>{draft.banking.swiftBic && `SWIFT: ${draft.banking.swiftBic}`}</Text>
          </View>
        )}
        
        <Text style={{ fontSize: 6, marginTop: 10, color: "#444" }}>
          {draft.legalDeclaration || "These commodities..."}
        </Text>
        
        {draft.signature && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Signature:</Text>
            <Text>{draft.signature}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}