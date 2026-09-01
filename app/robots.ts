import { headers } from "next/headers";
import type { MetadataRoute } from "next";

const CRM_HOST = "crm.gonairi.com";
const MARKETING_ORIGIN = "https://gonairi.com";

// The CRM app is a private, authenticated back office — nothing there should
// be indexed. Only the marketing site (gonairi.com) is public and crawlable.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";

  if (host === CRM_HOST) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${MARKETING_ORIGIN}/sitemap.xml`,
  };
}
