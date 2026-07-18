import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#1b1c1c" },
  section: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 8 },
  header: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#747878", paddingVertical: 4 },
  col: { flex: 1, paddingHorizontal: 2 },
  colWide: { flex: 2, paddingHorizontal: 2 },
  small: { fontSize: 7 },
  carrierHeader: {
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  label: { fontFamily: "Helvetica-Bold", fontSize: 7 },
});

export function FedexPdf({ draft, watermark }: { draft: DocumentDraft; watermark?: boolean; carrier?: string }) {
  const totalWeight = draft.items.reduce((sum, i) => sum + (i.weightKg || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && (
          <View style={{ position: "absolute", top: 300, left: 150, opacity: 0.05 }}>
            <Text style={{ fontSize: 60, transform: "rotate(-45deg)", color: "#000" }}>PROFORMAFLOW DRAFT</Text>
          </View>
        )}
        <Text style={styles.carrierHeader}>FEDEX COMMERCIAL INVOICE</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Text style={styles.header}>SHIP FROM / EXPORTER</Text>
            <Text>{draft.exporter.companyName}</Text>
            <Text>{draft.exporter.address}</Text>
            <Text>{draft.exporter.country}</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.header}>SHIP TO / IMPORTER</Text>
            <Text>{draft.importer.companyName}</Text>
            <Text>{draft.importer.address}</Text>
            <Text>{draft.importer.country}</Text>
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
          <Text><Text style={styles.label}>Incoterm:</Text> {draft.shipment.incoterm} | 
              <Text style={styles.label}> Origin:</Text> {draft.shipment.countryOfOrigin} | 
              <Text style={styles.label}> Destination:</Text> {draft.shipment.countryOfDestination}
              {draft.shipment.transportMode && ` | Mode: ${draft.shipment.transportMode}`}
              {draft.shipment.trackingNumber && ` | Tracking: ${draft.shipment.trackingNumber}`}</Text>
          {totalWeight > 0 && <Text style={{ marginTop: 4 }}><Text style={styles.label}>Weight:</Text> {totalWeight.toFixed(2)} kg</Text>}
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colWide}>Description of Goods</Text>
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
            <Text style={styles.col}>{item.quantity}</Text>
            <Text style={styles.col}>{(item.quantity * item.unitPrice).toFixed(2)}</Text>
          </View>
        ))}

        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
          <Text>Total: {draft.totals.total.toFixed(2)} {draft.items[0]?.currency}</Text>
        </View>

        <Text style={{ fontSize: 7, marginTop: 20, color: "#444" }}>
          Invoice: {draft.documentNumber}
        </Text>
      </Page>
    </Document>
  );
}