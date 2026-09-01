import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { PUBLIC_TOUR_VISIBILITY } from "@/lib/tours/visibility";

const CRM_HOST = "crm.gonairi.com";
const MARKETING_ORIGIN = "https://gonairi.com";
// Same kill-switch proxy.ts uses — the marketplace URLs below only exist
// once tour browsing is actually open to the public.
const MARKETPLACE_ENABLED = process.env.MARKETPLACE_ENABLED === "true";

// Refresh at most once an hour via Next's built-in ISR cache instead of a
// server cron job — this works the same self-hosted under `next start`/PM2
// as it does on Vercel, so a new tour/agency shows up within the hour with
// no extra infrastructure.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  if (host === CRM_HOST) return [];

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${MARKETING_ORIGIN}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${MARKETING_ORIGIN}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${MARKETING_ORIGIN}/contact-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${MARKETING_ORIGIN}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${MARKETING_ORIGIN}/terms-of-service`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  if (!MARKETPLACE_ENABLED) return staticEntries;

  const [tours, organizations] = await Promise.all([
    prisma.tour.findMany({
      where: { ...PUBLIC_TOUR_VISIBILITY, organization: { isPublished: true } },
      select: { id: true, updatedAt: true },
    }),
    prisma.organization.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const marketplaceEntries: MetadataRoute.Sitemap = [
    { url: `${MARKETING_ORIGIN}/tours`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...tours.map((tour) => ({
      url: `${MARKETING_ORIGIN}/tours/${tour.id}`,
      lastModified: tour.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...organizations.map((organization) => ({
      url: `${MARKETING_ORIGIN}/agencies/${organization.slug}`,
      lastModified: organization.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticEntries, ...marketplaceEntries];
}
