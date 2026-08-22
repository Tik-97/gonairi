import Link from "next/link";
import { redirect } from "next/navigation";
import { Map, CalendarCheck, Users, CalendarClock, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { isBackOfficeRole, roleHasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { BookingsTrendChart } from "@/components/dashboard/bookings-trend-chart";
import { BookingStatusBar } from "@/components/dashboard/booking-status-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrnamentDivider } from "@/components/ornaments/ornament-divider";
import { InterlacePattern } from "@/components/ornaments/interlace-pattern";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  CONFIRMED: "bg-success/15 text-success",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/15 text-danger",
  NO_SHOW: "bg-olive/15 text-olive",
};

const PANEL = "rounded-[16px] sm:rounded-[18px] bg-card p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]";

export default async function DashboardOverviewPage() {
  const session = await requireSession();
  if (!isBackOfficeRole(session.user.role)) {
    redirect("/dashboard/schedule");
  }
  const [stats, organization, canCreateTour] = await Promise.all([
    getDashboardStats(session.user.organizationId),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, description: true },
    }),
    roleHasPermission(session.user.role, PERMISSIONS.toursManage),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 pt-1 pb-14 duration-700 animate-in fade-in sm:gap-3 sm:pb-20 lg:pb-28">
        <h1 className="font-serif text-2xl leading-[1.1] font-bold text-espresso sm:text-4xl lg:text-[48px]">
          Welcome back, {firstName(session.user.name)}! 👋
        </h1>
        <p className="max-w-md font-sans text-sm text-espresso-muted sm:text-base lg:text-lg">
          Here&apos;s what&apos;s happening with {organization?.name ?? "your agency"} today.
        </p>
        <OrnamentDivider className="mt-1 hidden h-4 w-64 text-terracotta opacity-20 sm:block" />
      </div>

      <div className="relative z-20 -mt-12 grid grid-cols-2 gap-3 sm:-mt-16 sm:gap-5 lg:-mt-20 lg:grid-cols-4">
        <StatCard
          label="Total tours"
          value={stats.totalTours}
          hint={`${stats.publishedTours} published`}
          icon={Map}
        />
        <StatCard
          label="Total bookings"
          value={stats.totalBookings}
          delta={stats.bookingsDelta}
          hint={`${stats.bookingsThisMonth} this month`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Total customers"
          value={stats.totalCustomers}
          delta={stats.customersDelta}
          icon={Users}
        />
        <StatCard label="Upcoming departures" value={stats.upcomingDepartures} icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className={PANEL}>
            <h2 className="mb-5 font-serif text-xl font-semibold text-espresso">Bookings, last 30 days</h2>
            <BookingsTrendChart data={stats.dailyBookingTrend} />
          </section>

          <section className={PANEL}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-espresso">Recent bookings</h2>
              <Link href="/dashboard/bookings" className="text-sm text-terracotta-700 underline">
                View all
              </Link>
            </div>
            {stats.recentBookings.length === 0 ? (
              <p className="text-sm text-espresso-muted">No bookings yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {stats.recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="-mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3.5 text-sm transition-colors hover:bg-cream-100/70 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-xs font-semibold text-terracotta-700">
                        {initials(booking.customer.fullName) || "?"}
                      </span>
                      <div>
                        <p className="font-medium text-espresso">{booking.customer.fullName}</p>
                        <p className="text-espresso-muted">
                          {booking.departure.tour.title} · <LocalDateTime value={booking.departure.date.toISOString()} />
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-12 sm:pl-0">
                      <span className="font-medium text-terracotta-700">
                        {formatMoney(booking.totalPrice.toString(), booking.currency)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className={PANEL}>
            <h2 className="mb-5 font-serif text-xl font-semibold text-espresso">Booking status</h2>
            <BookingStatusBar counts={stats.statusBarCounts} />
          </section>

          <section className={PANEL}>
            <h2 className="mb-5 font-serif text-xl font-semibold text-espresso">Popular tours</h2>
            {stats.popularTours.length === 0 ? (
              <p className="text-sm text-espresso-muted">No bookings yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {stats.popularTours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/dashboard/tours/${tour.id}/departures`}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 text-sm transition-colors hover:bg-cream-100/70"
                  >
                    {tour.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tour.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-[10px] object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10">
                        <Map className="h-4 w-4 text-terracotta-700" strokeWidth={1.75} />
                      </span>
                    )}
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-espresso">{tour.title}</span>
                      <span className="text-espresso-muted">{tour.count} bookings</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {canCreateTour && (
            <div className="relative overflow-hidden rounded-[18px] bg-navy px-7 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <InterlacePattern
                id="interlace-cta"
                className="pointer-events-none absolute inset-0 h-full w-full text-terracotta opacity-[0.07]"
              />
              <div className="relative flex flex-col gap-3">
                <p className="text-sm font-medium text-white">Ready for your next departure?</p>
                <Link
                  href="/dashboard/tours/new"
                  className="inline-flex w-fit items-center gap-2 rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-terracotta-700"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  New tour
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
