import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const countryId = new URL(request.url).searchParams.get("country_id")?.trim();
  if (!countryId || countryId.length > 100) {
    return Response.json({ error: "A valid country_id is required." }, { status: 400 });
  }

  const country = await prisma.country.findFirst({
    where: { id: countryId, isActive: true },
    select: {
      regions: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          countryId: true,
          isoCode: true,
          name: true,
          type: true,
          isActive: true,
        },
      },
    },
  });

  if (!country) return Response.json({ error: "Country not found." }, { status: 404 });

  return Response.json(country.regions, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
