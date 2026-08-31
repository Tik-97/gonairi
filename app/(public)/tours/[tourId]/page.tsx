import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PUBLIC_TOUR_VISIBILITY } from "@/lib/tours/visibility";

export default async function TourDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tourId: string }>;
  searchParams: Promise<PaginationParams>;
}) {
  const [{ tourId }, paginationParams, { dict }] = await Promise.all([params, searchParams, getDictionary()]);
  const pagination = parsePagination(paginationParams);

  const tour = await prisma.tour.findFirst({
    where: { id: tourId, ...PUBLIC_TOUR_VISIBILITY, organization: { isPublished: true } },
    include: {
      organization: true,
      tourRegions: {
        orderBy: { position: "asc" },
        select: {
          region: { select: { id: true, name: true, isoCode: true, country: { select: { name: true } } } },
        },
      },
      tourCategories: {
        orderBy: { position: "asc" },
        select: { category: { select: { id: true, slug: true } } },
      },
    },
  });
  if (!tour) {
    notFound();
  }
  const departureWhere = { tourId: tour.id, status: { not: "CANCELLED" as const }, date: { gte: new Date() } };
  const [departures, totalItems] = await Promise.all([
    prisma.departure.findMany({ where: departureWhere, orderBy: { date: "asc" }, skip: pagination.skip, take: pagination.take }),
    prisma.departure.count({ where: departureWhere }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-espresso">{tour.title}</h1>
        <p className="mt-2 text-sm text-espresso/60">
          {dict.tourDetailPage.byPrefix}{" "}
          <Link href={`/agencies/${tour.organization.slug}`} className="font-medium text-terracotta-700 underline">
            {tour.organization.name}
          </Link>
        </p>
      </div>

      {tour.description && (
        <p className="max-w-2xl text-espresso/80">{tour.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-cream-100 px-3 py-1.5 text-espresso/70">{tour.durationDays} {dict.tourDetailPage.daysSuffix}</span>
        <span className="rounded-full bg-cream-100 px-3 py-1.5 font-medium text-terracotta-700">
          {formatMoney(tour.basePrice.toString(), tour.currency)} {dict.tourDetailPage.perPaxSuffix}
        </span>
        {tour.tourCategories.map(({ category }) => (
          <span key={category.id} className="rounded-full bg-cream-100 px-3 py-1.5 text-espresso/70">
            #{category.slug}
          </span>
        ))}
        {tour.tourRegions.map(({ region }) => (
          <span key={region.id} className="rounded-full bg-cream-100 px-3 py-1.5 text-espresso/70">
            {region.name}, {region.country.name}
          </span>
        ))}
      </div>

      <div>
        <h2 className="mb-4 font-serif text-xl font-semibold text-espresso">{dict.tourDetailPage.upcomingDeparturesHeading}</h2>
        {departures.length === 0 ? (
          <p className="text-sm text-espresso/60">{dict.tourDetailPage.noUpcomingDepartures}</p>
        ) : (
          <div className="flex flex-col divide-y divide-terracotta/10 rounded-2xl border border-terracotta/15 bg-white/70">
            {departures.map((departure) => {
              const remaining = departure.capacity - departure.bookedCount;
              return (
                <div key={departure.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-espresso"><LocalDateTime value={departure.date.toISOString()} /></p>
                    <p className="text-sm text-espresso/60">
                      {remaining > 0 ? `${remaining} ${dict.tourDetailPage.seatsLeftSuffix}` : dict.tourDetailPage.fullyBooked} ·{" "}
                      {formatMoney((departure.priceOverride ?? tour.basePrice).toString(), tour.currency)}
                    </p>
                  </div>
                  {remaining > 0 && (
                    <Link
                      href={`/book/${departure.id}`}
                      className="rounded-full bg-terracotta px-5 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
                    >
                      {dict.tourDetailPage.bookButton}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
