import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { createDeparture, cancelDeparture } from "@/lib/actions/departures";
import { DepartureForm } from "@/components/departure-form";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

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
  searchParams: Promise<{ when?: string }>;
}) {
  const { tourId } = await params;
  const { when: whenParam } = await searchParams;
  const when = whenParam === "past" || whenParam === "all" ? whenParam : "upcoming";

  const session = await requirePermission(PERMISSIONS.toursView);
  const [canViewBookings, canManageBookings, canManageDepartures] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.bookingsView),
    roleHasPermission(session.user.role, PERMISSIONS.bookingsManage),
    roleHasPermission(session.user.role, PERMISSIONS.departuresManage),
  ]);
  const db = scopedPrisma(session.user.organizationId);

  const tour = await db.tour.findFirst({ where: { id: tourId } });
  if (!tour) {
    notFound();
  }

  const now = new Date();
  const [departures, vehicles, drivers, guides] = await Promise.all([
    db.departure.findMany({
      where: {
        tourId,
        ...(when === "upcoming" ? { date: { gte: now } } : {}),
        ...(when === "past" ? { date: { lt: now } } : {}),
      },
      include: { assignedVehicle: true, assignedDriver: true, assignedGuide: true },
      orderBy: { date: when === "past" ? "desc" : "asc" },
    }),
    db.vehicle.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { role: "DRIVER", status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { role: "GUIDE", status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

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
          title={when === "upcoming" ? "No upcoming departures" : when === "past" ? "No past departures" : "No departures on the calendar"}
          message={
            when === "upcoming"
              ? "Schedule a date and this tour becomes bookable — by you and by travelers."
              : "Nothing to show for this filter yet."
          }
        />
      ) : (
      <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {departures.map((departure) => (
          <div key={departure.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <Link
              href={`/dashboard/bookings?departureId=${departure.id}`}
              className="-m-1 rounded-md p-1 transition-colors hover:bg-cream-100/70"
            >
              <p className="font-medium text-espresso">{formatDate(departure.date)}</p>
              <p className="text-sm text-espresso-muted">
                {departure.bookedCount}/{departure.capacity} booked ·{" "}
                {formatMoney(
                  (departure.priceOverride ?? tour.basePrice).toString(),
                  tour.currency,
                )}{" "}
                · {departure.status}
                {departure.assignedVehicle && ` · ${departure.assignedVehicle.name}`}
                {departure.assignedDriver && ` · Driver: ${departure.assignedDriver.name}`}
                {departure.assignedGuide && ` · Guide: ${departure.assignedGuide.name}`}
              </p>
            </Link>
            {departure.status !== "CANCELLED" && (canManageBookings || canManageDepartures) && (
              <div className="flex items-center gap-3">
                {canManageBookings && departure.bookedCount < departure.capacity && (
                  <Link href={`/dashboard/bookings/new?departureId=${departure.id}`} className="text-sm text-terracotta-700 underline">
                    Book
                  </Link>
                )}
                {canManageDepartures && (
                  <form action={cancelDeparture.bind(null, departure.id)}>
                    <button type="submit" className="text-sm text-danger underline">
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {canManageDepartures && (
        <div>
          <h2 className="mb-4 font-serif text-lg font-medium text-espresso">Add a departure</h2>
          <DepartureForm action={createDepartureForTour} vehicles={vehicles} drivers={drivers} guides={guides} />
        </div>
      )}
    </div>
  );
}
