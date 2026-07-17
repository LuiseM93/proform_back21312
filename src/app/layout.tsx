import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-headline-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ProformaFlow — Proforma & Commercial Invoice Generator",
    template: "%s | ProformaFlow",
  },
  description:
    "Generate proforma invoices, commercial invoices, and packing lists with Incoterms, HS Codes, and carrier-ready PDFs for FedEx, UPS, and DHL. From quote to customs, in one flow.",
  icons: {
    icon: [
      { url: "/assets/favicon.ico", sizes: "any" },
      { url: "/assets/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/assets/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/assets/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "manifest", url: "/assets/site.webmanifest" },
    ],
  },
  keywords: [
    "proforma invoice generator",
    "commercial invoice template",
    "export invoice",
    "incoterms",
    "hs code",
    "fedex commercial invoice",
    "packing list generator",
  ],
  openGraph: {
    title: "ProformaFlow — Export Documentation, Simplified",
    description:
      "Proforma + Commercial Invoice + Packing List. Carrier-ready for FedEx, UPS, DHL. We never store your documents.",
    url: siteUrl,
    siteName: "ProformaFlow",
    type: "website",
    images: [
      {
        url: "/assets/logo.png",
        width: 512,
        height: 512,
        alt: "ProformaFlow Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProformaFlow — Export Documentation, Simplified",
    description:
      "Proforma + Commercial Invoice + Packing List. Carrier-ready for FedEx, UPS, DHL.",
    images: ["/assets/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} bg-background text-on-background antialiased font-body-md min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}