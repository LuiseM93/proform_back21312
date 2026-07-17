import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://proformaflow.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/generator", "/settings", "/profile", "/billing", "/templates", "/api"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
