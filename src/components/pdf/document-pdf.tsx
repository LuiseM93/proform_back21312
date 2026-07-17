import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { DocumentDraft } from "@/lib/document-types";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1b1c1c",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 12,
    marginBottom: 20,
  },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  muted: { color: "#444748" },
  right: { textAlign: "right" },
  partiesRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  partyBox: { flex: 1, borderWidth: 1, borderColor: "#747878", padding: 10 },
  partyLabel: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#747878",
    paddingBottom: 4,
    textTransform: "uppercase",
    fontSize: 8,
  },
  shipmentBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    paddingVertical: 6,
    marginBottom: 16,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  table: { marginBottom: 16 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingVertical: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#c4c7c7",
    paddingVertical: 6,
  },
  colDesc: { flex: 3 },
  colHs: { flex: 1.2 },
  colQty: { flex: 0.8, textAlign: "right" },
  colUnitPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  totalsBox: { alignSelf: "flex-end", width: 220, marginBottom: 20 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#000000",
    paddingTop: 6,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  bankingBox: { borderWidth: 1, borderColor: "#747878", padding: 10, marginBottom: 16 },
  legalText: { fontSize: 7, color: "#444748", lineHeight: 1.4, marginBottom: 20 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#000000", width: 180, paddingTop: 4, fontSize: 7 },
  logo: { width: 60, height: 60, objectFit: "contain", marginBottom: 8 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#747878",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#c4c7c7",
    paddingTop: 6,
  },
});

const DOC_TITLES: Record<string, string> = {
  proforma: "Proforma Invoice",
  commercial: "Commercial Invoice",
  packing: "Packing List",
  bundle: "Commercial Invoice & Packing List",
};

function money(n: number, currency: string) {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PartyBlock({ label, name, address, country, taxId, contact }: {
  label: string; name: string; address: string; country: string; taxId?: string; contact?: string;
}) {
  return (
    <View style={styles.partyBox}>
      <Text style={styles.partyLabel}>{label}</Text>
      <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{name}</Text>
      <Text style={styles.muted}>{address}</Text>
      <Text style={styles.muted}>{country}</Text>
      {taxId ? <Text style={styles.muted}>Tax ID: {taxId}</Text> : null}
      {contact ? <Text style={styles.muted}>Contact: {contact}</Text> : null}
    </View>
  );
}

export function DocumentPdf({ draft, watermark, carrier }: {
  draft: DocumentDraft;
  watermark?: boolean;
  carrier?: "fedex" | "ups" | "dhl" | "aramex" | "other";
}) {
  const currency = draft.items[0]?.currency || "USD";
  const showItems = draft.documentType !== "packing";
  const showBanking = draft.documentType === "commercial" || draft.documentType === "bundle" || draft.documentType === "proforma";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && (
          <Text
            style={{
              position: "absolute",
              top: "45%",
              left: "15%",
              fontSize: 60,
              color: "#000000",
              opacity: 0.06,
              transform: "rotate(-30deg)",
            }}
          >
            PROFORMAFLOW DRAFT
          </Text>
        )}

        <View style={styles.headerRow}>
          <View>
            {draft.logoDataUrl ? <Image style={styles.logo} src={draft.logoDataUrl} /> : null}
            <Text style={styles.docTitle}>{DOC_TITLES[draft.documentType]}</Text>
            <Text style={styles.muted}>No: {draft.documentNumber}</Text>
            <Text style={styles.muted}>Date: {draft.date}</Text>
            {carrier && carrier !== "other" ? (
              <Text style={{ ...styles.muted, marginTop: 4, textTransform: "uppercase", fontFamily: "Helvetica-Bold" }}>
                Carrier: {carrier.toUpperCase()}
              </Text>
            ) : null}
          </View>
          <View style={styles.right}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{draft.exporter.companyName}</Text>
            <Text style={styles.muted}>{draft.exporter.address}</Text>
            <Text style={styles.muted}>{draft.exporter.country}</Text>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <PartyBlock
            label="Shipper / Exporter"
            name={draft.exporter.companyName}
            address={draft.exporter.address}
            country={draft.exporter.country}
            taxId={draft.exporter.taxId}
            contact={draft.exporter.contactName}
          />
          <PartyBlock
            label="Consignee / Importer"
            name={draft.importer.companyName}
            address={draft.importer.address}
            country={draft.importer.country}
            taxId={draft.importer.taxId}
            contact={draft.importer.contactName}
          />
        </View>

        <View style={styles.shipmentBar}>
          <Text>Incoterm: {draft.shipment.incoterm}</Text>
          <Text>Origin: {draft.shipment.countryOfOrigin}</Text>
          <Text>Destination: {draft.shipment.countryOfDestination}</Text>
          {draft.shipment.portOfLoading ? <Text>POL: {draft.shipment.portOfLoading}</Text> : null}
          {draft.shipment.portOfDischarge ? <Text>POD: {draft.shipment.portOfDischarge}</Text> : null}
        </View>

        {showItems && (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colHs}>HS Code</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colUnitPrice}>Unit Price</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>
            {draft.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colHs}>{item.hsCode || "—"}</Text>
                <Text style={styles.colQty}>{item.quantity} {item.unit}</Text>
                <Text style={styles.colUnitPrice}>{money(item.unitPrice, item.currency)}</Text>
                <Text style={styles.colTotal}>{money(item.quantity * item.unitPrice, item.currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {draft.documentType === "packing" && (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colTotal}>Weight (kg)</Text>
            </View>
            {draft.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity} {item.unit}</Text>
                <Text style={styles.colTotal}>{item.weightKg ?? "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {showItems && (
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{money(draft.totals.subtotal, currency)}</Text>
            </View>
            {draft.totals.discount > 0 && (
              <View style={styles.totalsRow}>
                <Text>Discount</Text>
                <Text>-{money(draft.totals.discount, currency)}</Text>
              </View>
            )}
            {draft.totals.freight > 0 && (
              <View style={styles.totalsRow}>
                <Text>Freight</Text>
                <Text>{money(draft.totals.freight, currency)}</Text>
              </View>
            )}
            {draft.totals.insurance > 0 && (
              <View style={styles.totalsRow}>
                <Text>Insurance</Text>
                <Text>{money(draft.totals.insurance, currency)}</Text>
              </View>
            )}
            {draft.totals.otherCharges > 0 && (
              <View style={styles.totalsRow}>
                <Text>Other Charges</Text>
                <Text>{money(draft.totals.otherCharges, currency)}</Text>
              </View>
            )}
            <View style={styles.totalsFinal}>
              <Text>Total</Text>
              <Text>{money(draft.totals.total, currency)}</Text>
            </View>
          </View>
        )}

        {showBanking && draft.banking?.bankName && (
          <View style={styles.bankingBox}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4, textTransform: "uppercase", fontSize: 8 }}>
              Banking Details
            </Text>
            {draft.banking.beneficiary ? <Text>Beneficiary: {draft.banking.beneficiary}</Text> : null}
            <Text>Bank: {draft.banking.bankName}</Text>
            {draft.banking.swiftBic ? <Text>SWIFT/BIC: {draft.banking.swiftBic}</Text> : null}
            {draft.banking.ibanAccount ? <Text>IBAN/Account: {draft.banking.ibanAccount}</Text> : null}
            {draft.banking.paymentInstructions ? (
              <Text style={{ marginTop: 4 }}>{draft.banking.paymentInstructions}</Text>
            ) : null}
          </View>
        )}

        {draft.legalDeclaration ? (
          <Text style={styles.legalText}>{draft.legalDeclaration}</Text>
        ) : null}

        <View style={styles.signatureRow}>
          <Text style={styles.signatureLine}>Authorized Signature — {draft.exporter.companyName}</Text>
          <Text style={styles.signatureLine}>Date: {draft.date}</Text>
        </View>

        <Text style={styles.footer}>
          Generated with ProformaFlow — proformaflow.app — This document is not stored on our
          servers. Privacy by design.
        </Text>
      </Page>
    </Document>
  );
}
