import type { BookingStatus } from "@/generated/prisma/enums";

export type CustomerBookingStats = {
  totalBookings: number;
  confirmedCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalSpent: number;
  currency: string;
  /** Rounded percentage, 0-100. */
  cancellationRate: number;
};

/**
 * Derives a customer's booking-behavior stats (shown on their detail page) from
 * their booking history. Pulled out of the page component so it's testable
 * without a database and reusable if the same numbers are ever needed
 * elsewhere (e.g. a cross-customer report).
 */
export function calculateCustomerBookingStats(
  bookings: { status: BookingStatus; totalPrice: number; currency: string }[],
): CustomerBookingStats {
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;
  const noShowCount = bookings.filter((b) => b.status === "NO_SHOW").length;
  const totalSpent = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const currency = bookings[0]?.currency ?? "AMD";
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;

  return { totalBookings, confirmedCount, cancelledCount, noShowCount, totalSpent, currency, cancellationRate };
}
