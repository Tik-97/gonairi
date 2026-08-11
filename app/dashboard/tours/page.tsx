import Link from "next/link";
import { Map } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { deleteTour } from "@/lib/actions/tours";
import { sortByNextDeparture } from "@/lib/tours/sort";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function ToursPage() {
  const session = await requirePermission(PERMISSIONS.toursView);
  const [canManage, canDelete] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.toursManage),
    roleHasPermission(session.user.role, PERMISSIONS.toursDelete),
  ]);
  const db = scopedPrisma(session.user.organizationId);
  const toursRaw = await db.tour.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      departures: {
        where: { status: { not: "CANCELLED" }, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
  });

  const toursSorted = sortByNextDeparture(toursRaw);

  const tours = await Promise.all(
    toursSorted.map(async (tour) => ({
      ...tour,
      bookingCount: canDelete ? await db.booking.count({ where: { departure: { tourId: tour.id } } }) : 0,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your catalogue"
        title="Tours"
        subtitle="The experiences your agency offers, from monastery day trips to multi-day journeys."
        action={
          canManage && (
            <Link
              href="/dashboard/tours/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              + New tour
            </Link>
          )
        }
      />

      {tours.length === 0 ? (
        <EmptyState
          title="Your catalogue is waiting"
          message="Add your first tour — an itinerary, a price, a story worth telling."
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {tours.map((tour) => {
            const nextDeparture = tour.departures[0];
            return (
              <div key={tour.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                  {tour.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tour.images[0]}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10">
                      <Map className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-espresso">{tour.title}</p>
                    <p className="text-sm text-espresso-muted">
                      {formatMoney(tour.basePrice.toString(), tour.currency)} · {tour.durationDays}d ·{" "}
                      {tour.isPublished ? "Published" : "Draft"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-terracotta-700">
                      {nextDeparture ? `Next: ${formatDate(nextDeparture.date)}` : "No upcoming departures"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <Link href={`/dashboard/tours/${tour.id}/departures`} className="text-terracotta-700 underline">
                    Departures
                  </Link>
                  {canManage && (
                    <Link href={`/dashboard/tours/${tour.id}/edit`} className="text-terracotta-700 underline">
                      Edit
                    </Link>
                  )}
                  {canDelete && tour.bookingCount === 0 && (
                    <form action={deleteTour.bind(null, tour.id)}>
                      <button type="submit" className="text-danger underline">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
