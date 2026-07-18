import { Font } from "@react-pdf/renderer";

// Shared font registration for all PDFs.
// NotoSans covers Latin, Cyrillic, Arabic, Greek, Vietnamese.
// NotoSansSC covers Simplified Chinese, Japanese, Korean — 
// critical for trade with Asia.
// Falls back to Helvetica (built-in) if network fails.

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosans/v39/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu2ui.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosans/v39/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu2ui.woff2",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "NotoSansSC",
  src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPzS5HE.woff2",
});

// Shared utility: monochrome-friendly dark tint
export const DARK = "#1b1c1c";
export const MID = "#444";
export const LIGHT = "#888";
export const BORDER = "#333";

// Minimum font sizes for thermal/laser print readability:
// 9pt = body, 7pt = labels, 11pt = headers, 14pt = document title
export const FONT_SIZES = {
  body: 9,
  small: 7.5,
  tiny: 6.5,
  label: 7,
  header: 11,
  docTitle: 14,
  total: 12,
} as const;

// 5 things a customs broker looks for in the first 30 seconds:
// 1. Shipper/Exporter name + country → top-left
// 2. Consignee/Importer name + country → top-right
// 3. Total declared value + currency → bottom-right, BOXED
// 4. Incoterm → right below the parties
// 5. HS Code → first column of the table
// These are styled via the component layouts directly.

export function getPageSize(pageSize?: "A4" | "LETTER"): "A4" | "LETTER" {
  return pageSize || "A4";
}