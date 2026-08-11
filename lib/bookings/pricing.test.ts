import { describe, expect, it } from "vitest";
import { calculateBookingTotal } from "@/lib/bookings/pricing";

describe("calculateBookingTotal", () => {
  it("charges full price per pax when nothing else is specified", () => {
    expect(calculateBookingTotal({ unitPrice: 10000, paxCount: 3, travelers: [], discountPercent: 0 })).toBe(30000);
  });

  it("treats a solo booking as one full-price pax", () => {
    expect(calculateBookingTotal({ unitPrice: 5000, paxCount: 1, travelers: [], discountPercent: 0 })).toBe(5000);
  });

  it("prices named travelers by their own priceType, leaving unnamed pax at full price", () => {
    // paxCount 4: primary customer (full) + 1 named HALF traveler + 2 unnamed (assumed full)
    const total = calculateBookingTotal({
      unitPrice: 10000,
      paxCount: 4,
      travelers: [{ priceType: "HALF" }],
      discountPercent: 0,
    });
    // 10000 (primary) + 5000 (half) + 10000 + 10000 (two unnamed, full) = 35000
    expect(total).toBe(35000);
  });

  it("treats FREE travelers as contributing zero", () => {
    const total = calculateBookingTotal({
      unitPrice: 10000,
      paxCount: 2,
      travelers: [{ priceType: "FREE" }],
      discountPercent: 0,
    });
    expect(total).toBe(10000);
  });

  it("applies a flat discount last, after all per-traveler pricing", () => {
    const total = calculateBookingTotal({
      unitPrice: 10000,
      paxCount: 2,
      travelers: [{ priceType: "FULL" }],
      discountPercent: 10,
    });
    expect(total).toBe(18000); // 20000 * 0.9
  });

  it("clamps discountPercent to [0, 100] instead of trusting the caller", () => {
    const over = calculateBookingTotal({ unitPrice: 10000, paxCount: 1, travelers: [], discountPercent: 150 });
    const under = calculateBookingTotal({ unitPrice: 10000, paxCount: 1, travelers: [], discountPercent: -20 });
    expect(over).toBe(0);
    expect(under).toBe(10000);
  });

  it("never returns a negative total even for pathological input", () => {
    const total = calculateBookingTotal({ unitPrice: 0, paxCount: 1, travelers: [], discountPercent: 100 });
    expect(total).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const total = calculateBookingTotal({ unitPrice: 33.333, paxCount: 3, travelers: [], discountPercent: 0 });
    expect(total).toBe(100); // 33.333 * 3 = 99.999, rounds to 100
  });

  it("matches the guest-booking flow's simplified call shape (no travelers, no discount)", () => {
    // lib/actions/guest-bookings.ts calls this with travelers: [] and discountPercent: 0 —
    // this must stay algebraically identical to a plain unitPrice * paxCount multiplication.
    const unitPrice = 12345;
    const paxCount = 4;
    const total = calculateBookingTotal({ unitPrice, paxCount, travelers: [], discountPercent: 0 });
    expect(total).toBe(unitPrice * paxCount);
  });
});
