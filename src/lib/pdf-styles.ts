import { Font, StyleSheet } from "@react-pdf/renderer";

// ─── Font Registration ────────────────────────────────────────────────────────
// PRODUCTION: Place NotoSans-Regular.ttf, NotoSans-Bold.ttf, NotoSansSC-Regular.ttf in public/fonts/
// Font registration tries local first (production), falls back to CDN (dev)
try {
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
    ],
  });
} catch {
  // Fallback to CDN for development
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: "https://fonts.gstatic.com/s/notosans/v39/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu2ui.woff2", fontWeight: 400 },
      { src: "https://fonts.gstatic.com/s/notosans/v39/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu2ui.woff2", fontWeight: 700 },
    ],
  });
}

try {
  Font.register({
    family: "NotoSansSC",
    src: "/fonts/NotoSansSC-Regular.ttf",
  });
} catch {
  Font.register({
    family: "NotoSansSC",
    src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPzS5HE.woff2",
  });
}

// ─── Color Palette (Monochrome-first for thermal printers) ───────────────────
export const DARK = "#1b1c1c";
export const MID  = "#444";
export const LIGHT = "#888";
export const WHITE = "#fff";
export const RED_ACCENT = "#D40511"; // DHL red - used only as accent border

// ─── Font Sizes (9pt minimum for thermal legibility) ─────────────────────────
export const FONT_SIZES = {
  body: 9,
  small: 7.5,
  tiny: 6.5,
  label: 7,
  header: 11,
  docTitle: 14,
  total: 12,
} as const;

// ─── Page Size Helper ────────────────────────────────────────────────────────
export function getPageSize(pageSize?: "A4" | "LETTER"): "A4" | "LETTER" {
  return pageSize || "A4";
}

// ─── AWB Safe Zone Dimensions (50mm x 30mm = 141.7pt x 85pt) ────────────────
export const AWB_SAFE_ZONE = {
  width: 142,
  height: 85,
  top: 36,
  right: 36,
} as const;

// ─── Safe Text Helper (null/undefined protection with multiple fallbacks) ────────────────────────────
export const t = (val: unknown, ...fallbacks: unknown[]): string => {
  if (val !== null && val !== undefined && val !== "") return String(val);
  for (const fb of fallbacks) {
    if (fb !== null && fb !== undefined && fb !== "") return String(fb);
  }
  return "—";
};

// ─── Shared Styles (common to all PDFs) ──────────────────────────────────────
export const baseStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: FONT_SIZES.body,
    fontFamily: "NotoSans",
    color: DARK,
  },
  headerBar: {
    backgroundColor: DARK,
    padding: "8 0",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: WHITE,
    fontSize: FONT_SIZES.docTitle,
    fontFamily: "NotoSans",
    fontWeight: 700,
    letterSpacing: 2,
    textAlign: "center",
  },
  partyRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  partyBox: { flex: 1, border: `1.5px solid ${DARK}`, padding: 8 },
  partyTitle: {
    fontSize: FONT_SIZES.small,
    fontFamily: "NotoSans",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  partyText: { fontSize: FONT_SIZES.body, lineHeight: 1.3 },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: FONT_SIZES.body,
    borderBottom: `1px solid ${DARK}`,
    paddingBottom: 6,
    marginBottom: 6,
  },
  refLabel: { fontFamily: "NotoSans", fontWeight: 700 },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
    fontSize: FONT_SIZES.small,
    borderBottom: `1px solid ${MID}`,
    paddingBottom: 6,
  },
  infoTag: { border: `1px solid ${LIGHT}`, padding: "2 6" },
  table: { marginTop: 2, marginBottom: 10 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: `2px solid ${DARK}`,
    paddingBottom: 4,
    marginBottom: 2,
    fontSize: FONT_SIZES.small,
    fontFamily: "NotoSans",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `0.5px solid ${LIGHT}`,
    paddingVertical: 3,
    alignItems: "flex-start",
  },
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 },
  totalsBox: { width: "45%", border: `1.5px solid ${DARK}`, padding: 8 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", fontSize: FONT_SIZES.body, paddingVertical: 1 },
  totalLineFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: FONT_SIZES.total,
    fontFamily: "NotoSans",
    fontWeight: 700,
    borderTop: `1.5px solid ${DARK}`,
    paddingTop: 4,
    marginTop: 2,
  },
  declaration: { fontSize: FONT_SIZES.small, color: MID, marginBottom: 12, lineHeight: 1.5 },
  sigSection: { flexDirection: "row", justifyContent: "space-between", borderTop: `1px solid ${DARK}`, paddingTop: 8 },
  sigBlock: { width: "45%" },
  sigLabel: { fontSize: FONT_SIZES.small, fontFamily: "NotoSans", fontWeight: 700, marginBottom: 2 },
  // 144pt = 2 inches for wet signature
  sigLine: { borderBottom: `1px solid ${DARK}`, height: 144, marginBottom: 2 },
  sigText: { fontSize: FONT_SIZES.tiny, color: MID },
  logo: { marginBottom: 10, maxHeight: 36, maxWidth: 100 },
  // AWB Safe Zone - fixed top-right
  awbSafeZone: {
    position: "absolute",
    top: AWB_SAFE_ZONE.top,
    right: AWB_SAFE_ZONE.right,
    width: AWB_SAFE_ZONE.width,
    height: AWB_SAFE_ZONE.height,
    border: `1px dashed ${MID}`,
    justifyContent: "center",
    alignItems: "center",
  },
  awbSafeZoneText: { fontSize: 8, color: MID, textAlign: "center" },
});

// ─── Column Width Presets ────────────────────────────────────────────────────
export const COL = {
  // Commercial Invoice standard
  ci: {
    qty: { width: "8%", paddingRight: 2 },
    uom: { width: "8%", paddingRight: 2 },
    desc: { width: "32%", paddingRight: 4 },
    hs: { width: "14%", paddingRight: 2 },
    origin: { width: "12%", paddingRight: 2 },
    unitVal: { width: "12%", paddingRight: 2, textAlign: "right" as const },
    totalVal: { width: "14%", textAlign: "right" as const },
  },
  // Packing List
  pl: {
    marks: { width: "16%", paddingRight: 2 },
    desc: { width: "26%", paddingRight: 4 },
    hs: { width: "10%", paddingRight: 2 },
    qty: { width: "7%", paddingRight: 2 },
    pkgType: { width: "9%", paddingRight: 2 },
    pkgCount: { width: "7%", paddingRight: 2 },
    dims: { width: "11%", paddingRight: 2 },
    netWt: { width: "7%", paddingRight: 2, textAlign: "right" as const },
    grossWt: { width: "7%", textAlign: "right" as const },
  },
} as const;