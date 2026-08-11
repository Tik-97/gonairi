import { describe, expect, it } from "vitest";
import { calculateCustomerBookingStats } from "@/lib/customers/stats";

describe("calculateCustomerBookingStats", () => {
  it("returns all zeros for a customer with no bookings", () => {
    expect(calculateCustomerBookingStats([])).toEqual({
      totalBookings: 0,
      confirmedCount: 0,
      cancelledCount: 0,
      noShowCount: 0,
      totalSpent: 0,
      currency: "AMD",
      cancellationRate: 0,
    });
  });

  it("counts CONFIRMED and COMPLETED as honored bookings, and sums their spend", () => {
    const stats = calculateCustomerBookingStats([
      { status: "CONFIRMED", totalPrice: 10000, currency: "AMD" },
      { status: "COMPLETED", totalPrice: 20000, currency: "AMD" },
      { status: "PENDING", totalPrice: 5000, currency: "AMD" },
    ]);
    expect(stats.confirmedCount).toBe(2);
    expect(stats.totalSpent).toBe(30000);
    expect(stats.totalBookings).toBe(3);
  });

  it("excludes cancelled and pending bookings from totalSpent", () => {
    const stats = calculateCustomerBookingStats([
      { status: "CANCELLED", totalPrice: 10000, currency: "AMD" },
      { status: "PENDING", totalPrice: 10000, currency: "AMD" },
    ]);
    expect(stats.totalSpent).toBe(0);
  });

  it("computes cancellationRate as a rounded percentage of total bookings", () => {
    const stats = calculateCustomerBookingStats([
      { status: "CANCELLED", totalPrice: 0, currency: "AMD" },
      { status: "CONFIRMED", totalPrice: 0, currency: "AMD" },
      { status: "CONFIRMED", totalPrice: 0, currency: "AMD" },
    ]);
    expect(stats.cancellationRate).toBe(33); // 1/3 rounded
  });

  it("counts NO_SHOW separately from cancellations", () => {
    const stats = calculateCustomerBookingStats([
      { status: "NO_SHOW", totalPrice: 0, currency: "AMD" },
      { status: "CANCELLED", totalPrice: 0, currency: "AMD" },
    ]);
    expect(stats.noShowCount).toBe(1);
    expect(stats.cancelledCount).toBe(1);
  });

  it("takes currency from the first booking", () => {
    const stats = calculateCustomerBookingStats([{ status: "CONFIRMED", totalPrice: 100, currency: "USD" }]);
    expect(stats.currency).toBe("USD");
  });
});
