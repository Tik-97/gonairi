import "server-only";
import { scopedPrisma } from "@/lib/db/scoped";

function startOfMonth(date: Date, monthsAgo: number = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() - monthsAgo, 1);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const TREND_WINDOW_DAYS = 30;

export async function getDashboardStats(organizationId: string) {
  const db = scopedPrisma(organizationId);
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(now, 1);
  const windowStart = new Date(now.getTime() - TREND_WINDOW_DAYS * 24 * 3600 * 1000);

  const [
    totalTours,
    publishedTours,
    upcomingDepartures,
    totalCustomers,
    customersThisMonth,
    customersLastMonth,
    totalBookings,
    bookingsThisMonth,
    bookingsLastMonth,
    statusGroups,
    recentBookingsRaw,
    recentBookingsForWindow,
  ] = await Promise.all([
    db.tour.count({ where: { deletedAt: null } }),
    db.tour.count({ where: { isPublished: true, deletedAt: null } }),
    db.departure.count({ where: { date: { gte: now }, status: { not: "CANCELLED" } } }),
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.customer.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    db.booking.count(),
    db.booking.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.booking.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    db.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, departure: { include: { tour: true } } },
    }),
    db.booking.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { createdAt: true, departure: { select: { tourId: true, tour: { select: { title: true, images: true } } } } },
    }),
  ]);

  const monthOverMonth = (thisMonth: number, lastMonth: number): number | null => {
    if (lastMonth === 0) return null;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  };

  const statusCounts: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  };
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  const dayBuckets = new Map<string, number>();
  for (let i = TREND_WINDOW_DAYS - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 3600 * 1000);
    dayBuckets.set(dayKey(day), 0);
  }
  for (const booking of recentBookingsForWindow) {
    const key = dayKey(booking.createdAt);
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
  }
  const dailyBookingTrend = Array.from(dayBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const tourBookingCounts = new Map<string, { id: string; title: string; count: number; image: string | null }>();
  for (const booking of recentBookingsForWindow) {
    if (!booking.departure) continue;
    const tourId = booking.departure.tourId;
    const existing = tourBookingCounts.get(tourId);
    if (existing) {
      existing.count += 1;
    } else {
      tourBookingCounts.set(tourId, {
        id: tourId,
        title: booking.departure.tour.title,
        count: 1,
        image: booking.departure.tour.images[0] ?? null,
      });
    }
  }
  const popularTours = Array.from(tourBookingCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalTours,
    publishedTours,
    upcomingDepartures,
    totalCustomers,
    customersDelta: monthOverMonth(customersThisMonth, customersLastMonth),
    totalBookings,
    bookingsThisMonth,
    bookingsDelta: monthOverMonth(bookingsThisMonth, bookingsLastMonth),
    statusBarCounts: {
      pending: statusCounts.PENDING,
      confirmed: statusCounts.CONFIRMED + statusCounts.COMPLETED,
      cancelled: statusCounts.CANCELLED,
      noShow: statusCounts.NO_SHOW,
    },
    dailyBookingTrend,
    popularTours,
    recentBookings: recentBookingsRaw,
  };
}
