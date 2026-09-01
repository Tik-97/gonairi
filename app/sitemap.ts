import { headers } from "next/headers";
import type { MetadataRoute } from "next";

const CRM_HOST = "crm.gonairi.com";
const MARKETING_ORIGIN = "https://gonairi.com";

// Mirrors the marketing-only paths the proxy keeps on the apex domain (see
// proxy.ts MARKETING_PATHS) — nothing else renders there to index.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  if (host === CRM_HOST) return [];

  const now = new Date();
  return [
    { url: `${MARKETING_ORIGIN}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${MARKETING_ORIGIN}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${MARKETING_ORIGIN}/contact-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${MARKETING_ORIGIN}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${MARKETING_ORIGIN}/terms-of-service`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
