import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;

  const tour = await prisma.tour.findFirst({
    where: { id: tourId, isPublished: true, deletedAt: null, organization: { isPublished: true } },
    include: {
      organization: true,
      departures: {
        where: { status: { not: "CANCELLED" }, date: { gte: new Date() } },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!tour) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-espresso">{tour.title}</h1>
        <p className="mt-2 text-sm text-espresso/60">
          By{" "}
          <Link href={`/agencies/${tour.organization.slug}`} className="font-medium text-terracotta-700 underline">
            {tour.organization.name}
          </Link>
        </p>
      </div>

      {tour.description && (
        <p className="max-w-2xl text-espresso/80">{tour.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-cream-100 px-3 py-1.5 text-espresso/70">{tour.durationDays} day(s)</span>
        <span className="rounded-full bg-cream-100 px-3 py-1.5 font-medium text-terracotta-700">
          {formatMoney(tour.basePrice.toString(), tour.currency)} / pax
        </span>
        {tour.category && <span className="rounded-full bg-cream-100 px-3 py-1.5 text-espresso/70">{tour.category}</span>}
      </div>

      <div>
        <h2 className="mb-4 font-serif text-xl font-semibold text-espresso">Upcoming departures</h2>
        {tour.departures.length === 0 ? (
          <p className="text-sm text-espresso/60">No upcoming departures scheduled.</p>
        ) : (
          <div className="flex flex-col divide-y divide-terracotta/10 rounded-2xl border border-terracotta/15 bg-white/70">
            {tour.departures.map((departure) => {
              const remaining = departure.capacity - departure.bookedCount;
              return (
                <div key={departure.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-espresso">{formatDate(departure.date)}</p>
                    <p className="text-sm text-espresso/60">
                      {remaining > 0 ? `${remaining} seats left` : "Fully booked"} ·{" "}
                      {formatMoney((departure.priceOverride ?? tour.basePrice).toString(), tour.currency)}
                    </p>
                  </div>
                  {remaining > 0 && (
                    <Link
                      href={`/book/${departure.id}`}
                      className="rounded-full bg-terracotta px-5 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
                    >
                      Book
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
