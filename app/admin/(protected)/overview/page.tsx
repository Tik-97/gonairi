import Link from "next/link";
import { Building2, CalendarCheck, CalendarClock, Map, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";

const PANEL = "rounded-[18px] bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6";

export default async function PlatformOverviewPage() {
  await requirePlatformAdmin();
  const now = new Date();
  const [agencyCount, tourCount, bookingCount, customerCount, upcomingDepartures, recentBookings, recentTours] = await Promise.all([
    prisma.organization.count(),
    prisma.tour.count({ where: { deletedAt: null } }),
    prisma.booking.count(),
    prisma.customer.count(),
    prisma.departure.count({ where: { date: { gte: now }, status: { not: "CANCELLED" } } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        organization: { select: { name: true } },
        customer: { select: { fullName: true } },
        departure: { select: { date: true, tour: { select: { title: true } } } },
      },
    }),
    prisma.tour.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { organization: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Platform-wide data"
        title="Super Admin overview"
        subtitle="Live totals and recent activity across every travel agency. Select a CRM agency above when you need to make changes."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
        <StatCard label="Agencies" value={agencyCount} icon={Building2} />
        <StatCard label="Tours" value={tourCount} icon={Map} />
        <StatCard label="Bookings" value={bookingCount} icon={CalendarCheck} />
        <StatCard label="Customers" value={customerCount} icon={Users} />
        <StatCard label="Upcoming departures" value={upcomingDepartures} icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className={PANEL}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-espresso">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-terracotta-700 underline">View all</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-espresso-muted">No bookings yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-espresso">{booking.customer.fullName} · {booking.departure.tour.title}</p>
                    <p className="text-espresso-muted">{booking.organization.name} · {formatDate(booking.departure.date)}</p>
                  </div>
                  <span className="font-medium text-terracotta-700">{formatMoney(booking.totalPrice.toString(), booking.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={PANEL}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-espresso">Recently added tours</h2>
            <Link href="/admin/tours" className="text-sm text-terracotta-700 underline">View all</Link>
          </div>
          {recentTours.length === 0 ? (
            <p className="text-sm text-espresso-muted">No tours yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentTours.map((tour) => (
                <div key={tour.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-espresso">{tour.title}</p>
                    <p className="text-espresso-muted">{tour.organization.name}</p>
                  </div>
                  <span className={tour.isPublished ? "text-success" : "text-espresso-muted"}>{tour.isPublished ? "Published" : "Draft"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
