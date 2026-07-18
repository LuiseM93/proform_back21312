import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: "Helvetica", color: "#000" },
  upsHeader: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#777", paddingVertical: 3 },
  col: { flex: 1, paddingHorizontal: 2 },
  colWide: { flex: 2, paddingHorizontal: 2 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 7 },
});

export function UpsPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalWeight = draft.items.reduce((sum, i) => sum + (i.weightKg || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.05 }}>
            <Text style={{ fontSize: 60, transform: "rotate(-45deg)", color: "#000" }}>PROFORMAFLOW DRAFT</Text>
          </View>
        )}
        <Text style={styles.upsHeader}>UPS COMMERCIAL INVOICE</Text>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, border: "1px solid #000", padding: 6 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>SHIPPER</Text>
            <Text>{draft.exporter.companyName}</Text>
            <Text>{draft.exporter.address}</Text>
            <Text>{draft.exporter.country}</Text>
          </View>
          <View style={{ flex: 1, border: "1px solid #000", padding: 6 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>CONSIGNEE</Text>
            <Text>{draft.importer.companyName}</Text>
            <Text>{draft.importer.address}</Text>
            <Text>{draft.importer.country}</Text>
          </View>
        </View>

        {draft.shipment.notifyParty && (
          <View style={{ marginBottom: 8, fontSize: 7, border: "1px solid #000", padding: 6 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>NOTIFY PARTY</Text>
            <Text>{draft.shipment.notifyParty.companyName}</Text>
            <Text>{draft.shipment.notifyParty.address}</Text>
            <Text>{draft.shipment.notifyParty.country}</Text>
          </View>
        )}

        <View style={{ marginBottom: 8, fontSize: 7 }}>
          <Text><Text style={styles.label}>Incoterm:</Text> {draft.shipment.incoterm} | 
              <Text style={styles.label}> Origin:</Text> {draft.shipment.countryOfOrigin} | 
              <Text style={styles.label}> Dest:</Text> {draft.shipment.countryOfDestination}
              {draft.shipment.transportMode && ` | Mode: ${draft.shipment.transportMode}`}
              {draft.shipment.trackingNumber && ` | Tracking: ${draft.shipment.trackingNumber}`}
              {totalWeight > 0 && ` | Wt: ${totalWeight.toFixed(2)}kg`}</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colWide}>Part Description</Text>
          <Text style={styles.col}>HTS Code</Text>
          <Text style={styles.col}>Origin</Text>
          <Text style={styles.col}>Qty</Text>
          <Text style={styles.col}>Total Value</Text>
        </View>
        {draft.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colWide}>{item.description}</Text>
            <Text style={styles.col}>{item.hsCode || "--"}</Text>
            <Text style={styles.col}>{item.countryOfOrigin || draft.shipment.countryOfOrigin || "—"}</Text>
            <Text style={styles.col}>{item.quantity}</Text>
            <Text style={styles.col}>{(item.quantity * item.unitPrice).toFixed(2)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}