import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { formatDate } from "@/lib/format";
import { formatDepartureCrew } from "@/lib/departures/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function MySchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ when?: string }>;
}) {
  const [{ when: whenParam }, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const when = whenParam === "past" || whenParam === "all" ? whenParam : "upcoming";
  const WHEN_OPTIONS = [
    { value: "upcoming", label: dict.departuresPage.whenUpcoming },
    { value: "past", label: dict.departuresPage.whenPast },
    { value: "all", label: dict.departuresPage.whenAll },
  ] as const;

  const session = await requirePermission(PERMISSIONS.scheduleViewOwn);
  const db = scopedPrisma(session.user.organizationId);

  const now = new Date();
  const departuresRaw = await db.departure.findMany({
    where: {
      status: { not: "CANCELLED" },
      vehicles: { some: { OR: [{ driverId: session.user.id }, { guideId: session.user.id }] } },
      ...(when === "upcoming" ? { date: { gte: now } } : {}),
      ...(when === "past" ? { date: { lt: now } } : {}),
    },
    include: { tour: true, vehicles: { include: { vehicle: true, driver: true, guide: true } } },
    orderBy: { date: when === "past" ? "desc" : "asc" },
  });

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
        eyebrow={dict.schedulePage.eyebrow}
        title={dict.schedulePage.title}
        subtitle={dict.schedulePage.subtitle}
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
          title={when === "upcoming" ? dict.schedulePage.emptyNoUpcomingTitle : when === "past" ? dict.schedulePage.emptyNoPastTitle : dict.schedulePage.emptyNoneTitle}
          message={dict.schedulePage.emptyMessage}
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
                    {formatDate(departure.date)} · {departure.bookedCount}/{departure.capacity} {dict.bookingsPage.paxSuffix} · {dict.departureStatus[departure.status]}
                    {departure.myVehicles.length > 0 && ` · ${formatDepartureCrew(departure.myVehicles, dict.departureCrew)}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
