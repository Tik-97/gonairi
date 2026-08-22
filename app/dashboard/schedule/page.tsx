import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { LocalDateTime } from "@/components/local-date-time";
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

export default async function MySchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ when?: string } & PaginationParams>;
}) {
  const params = await searchParams;
  const { when: whenParam } = params;
  const pagination = parsePagination(params);
  const when = whenParam === "past" || whenParam === "all" ? whenParam : "upcoming";

  const session = await requirePermission(PERMISSIONS.scheduleViewOwn);
  const db = scopedPrisma(session.user.organizationId);

  const now = new Date();
  const where = {
      status: { not: "CANCELLED" as const },
      vehicles: { some: { OR: [{ driverId: session.user.id }, { guideId: session.user.id }] } },
      ...(when === "upcoming" ? { date: { gte: now } } : {}),
      ...(when === "past" ? { date: { lt: now } } : {}),
  };
  const [departuresRaw, totalItems] = await Promise.all([
    db.departure.findMany({
    where,
    include: { tour: true, vehicles: { include: { vehicle: true, driver: true, guide: true } } },
    orderBy: { date: when === "past" ? "desc" : "asc" },
    skip: pagination.skip,
    take: pagination.take,
    }),
    db.departure.count({ where }),
  ]);

  // Only the rows *this viewer* is crewed on — a driver on jeep 2 of 5
  // shouldn't see jeeps 1/3/4/5 mixed into their own personal schedule.
  const departures = departuresRaw.map((departure) => ({
    ...departure,
    myVehicles: departure.vehicles.filter(
      (v) => v.driverId === session.user.id || v.guideId === session.user.id,
    ),
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Your assignments"
        title="My schedule"
        subtitle="Tours you're driving or guiding."
      />

      <div className="flex flex-wrap gap-2">
        {WHEN_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/schedule?when=${opt.value}`}
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
          title={when === "upcoming" ? "No upcoming assignments" : when === "past" ? "No past assignments" : "Nothing assigned yet"}
          message="When you're assigned as a driver or guide on a departure, it shows up here."
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {departures.map((departure) => (
            <div key={departure.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10">
                  <CalendarClock className="h-4 w-4 text-terracotta-700" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-medium text-espresso">{departure.tour.title}</p>
                  <p className="text-sm text-espresso-muted">
                    <LocalDateTime value={departure.date.toISOString()} /> · {departure.bookedCount}/{departure.capacity} pax · {departure.status}
                    {departure.myVehicles.length > 0 && ` · ${formatDepartureCrew(departure.myVehicles)}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
