import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import {
  createDeparture,
  cancelDeparture,
  deleteDeparture,
} from "@/lib/actions/departures";
import { DepartureForm } from "@/components/departure-form";
import { formatDate, formatMoney } from "@/lib/format";
import { formatDepartureCrew } from "@/lib/departures/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

const WHEN_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
] as const;

export default async function TourDeparturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tourId: string }>;
  searchParams: Promise<{ when?: string } & PaginationParams>;
}) {
  const { tourId } = await params;
  const query = await searchParams;
  const { when: whenParam } = query;
  const pagination = parsePagination(query);
  const when =
    whenParam === "past" || whenParam === "all" ? whenParam : "upcoming";

  const session = await requirePermission(PERMISSIONS.toursView);
  const [
    canViewBookings,
    canManageBookings,
    canManageDepartures,
    canDeleteDepartures,
  ] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.bookingsView),
    roleHasPermission(session.user.role, PERMISSIONS.bookingsManage),
    roleHasPermission(session.user.role, PERMISSIONS.departuresManage),
    roleHasPermission(session.user.role, PERMISSIONS.departuresDelete),
  ]);
  const db = scopedPrisma(session.user.organizationId);

  const tour = await db.tour.findFirst({ where: { id: tourId, deletedAt: null } });
  if (!tour) {
    notFound();
  }

  const now = new Date();
  const departureWhere = {
    tourId,
    ...(when === "upcoming" ? { date: { gte: now } } : {}),
    ...(when === "past" ? { date: { lt: now } } : {}),
  };
  const [departuresRaw, totalItems, vehicles, drivers, guides] = await Promise.all([
    db.departure.findMany({
      where: departureWhere,
      include: {
        vehicles: { include: { vehicle: true, driver: true, guide: true } },
      },
      orderBy: { date: when === "past" ? "desc" : "asc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.departure.count({ where: departureWhere }),
    db.vehicle.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { roles: { hasSome: ["DRIVER", "DRIVER_GUIDE"] }, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { roles: { hasSome: ["GUIDE", "DRIVER_GUIDE"] }, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const bookingCountByDeparture = new Map<string, number>();
  if (canDeleteDepartures && departuresRaw.length > 0) {
    const bookings = await db.booking.findMany({
      where: { departureId: { in: departuresRaw.map((d) => d.id) } },
      select: { departureId: true },
    });
    for (const booking of bookings) {
      bookingCountByDeparture.set(
        booking.departureId,
        (bookingCountByDeparture.get(booking.departureId) ?? 0) + 1,
      );
    }
  }
  const departures = departuresRaw.map((departure) => ({
    ...departure,
    bookingCount: bookingCountByDeparture.get(departure.id) ?? 0,
  }));

  const createDepartureForTour = createDeparture.bind(null, tourId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Your catalogue"
        title={tour.title}
        subtitle="Scheduled departures and their remaining seats."
        action={
          canViewBookings && (
            <Link
              href={`/dashboard/bookings?tourId=${tourId}`}
              className="rounded-[12px] border border-terracotta/25 px-4 py-2 text-sm font-medium text-terracotta-700 transition-colors hover:bg-cream-100"
            >
              View bookings
            </Link>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        {WHEN_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/tours/${tourId}/departures?when=${opt.value}`}
            className={
              when === opt.value
                ? "rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-espresso-muted transition-colors hover:bg-cream-100"
            }
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {departures.length === 0 ? (
        <EmptyState
          title={
            when === "upcoming"
              ? "No upcoming departures"
              : when === "past"
                ? "No past departures"
                : "No departures on the calendar"
          }
          message={
            when === "upcoming"
              ? "Schedule a date and this tour becomes bookable — by you and by travelers."
              : "Nothing to show for this filter yet."
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {departures.map((departure) => (
            <div
              key={departure.id}
              className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
            >
              <Link
                href={`/dashboard/bookings?departureId=${departure.id}`}
                className="-m-1 rounded-md p-1 transition-colors hover:bg-cream-100/70"
              >
                <p className="font-medium text-espresso">
                  {formatDate(departure.date)}
                </p>
                <p className="text-sm text-espresso-muted">
                  {departure.bookedCount}/{departure.capacity} booked ·{" "}
                  {formatMoney(
                    (departure.priceOverride ?? tour.basePrice).toString(),
                    tour.currency,
                  )}{" "}
                  · {departure.status}
                  {departure.returnAt &&
                    ` (back ${formatDate(departure.returnAt)})`}
                  {departure.vehicles.length > 0 &&
                    ` · ${formatDepartureCrew(departure.vehicles)}`}
                </p>
              </Link>
              {(canManageDepartures ||
                (departure.status !== "CANCELLED" && canManageBookings) ||
                (canDeleteDepartures && departure.bookingCount === 0)) && (
                <div className="flex items-center gap-3">
                  {departure.status !== "CANCELLED" &&
                    canManageBookings &&
                    departure.bookedCount < departure.capacity && (
                      <Link
                        href={`/dashboard/bookings/new?departureId=${departure.id}`}
                        className="text-sm text-terracotta-700 underline"
                      >
                        Book
                      </Link>
                    )}
                  {canManageDepartures && (
                    <Link
                      href={`/dashboard/tours/${tourId}/departures/${departure.id}/edit`}
                      className="text-sm text-terracotta-700 underline"
                    >
                      Edit
                    </Link>
                  )}
                  {departure.status !== "CANCELLED" && canManageDepartures && (
                    <form action={cancelDeparture.bind(null, departure.id)}>
                      <button
                        type="submit"
                        className="text-sm text-danger underline"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                  {canDeleteDepartures && departure.bookingCount === 0 && (
                    <form action={deleteDeparture.bind(null, departure.id)}>
                      <button
                        type="submit"
                        className="text-sm text-danger underline"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />

      {canManageDepartures && (
        <div>
          <h2 className="mb-4 font-serif text-lg font-medium text-espresso">
            Add a departure
          </h2>
          <DepartureForm
            action={createDepartureForTour}
            vehicles={vehicles}
            drivers={drivers}
            guides={guides}
          />
        </div>
      )}
    </div>
  );
}
