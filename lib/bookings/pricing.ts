export type TravelerPriceType = "FULL" | "HALF" | "FREE";

export const PRICE_MULTIPLIER: Record<TravelerPriceType, number> = {
  FULL: 1,
  HALF: 0.5,
  FREE: 0,
};

/**
 * The primary Customer on a booking always counts as one full-price traveler.
 * `travelers` covers pax 2..N — any named traveler is priced by its own
 * priceType; any pax left unnamed (paxCount - 1 - travelers.length) is
 * assumed full price. A flat discountPercent (0-100) is applied last.
 */
export function calculateBookingTotal({
  unitPrice,
  paxCount,
  travelers,
  discountPercent,
}: {
  unitPrice: number;
  paxCount: number;
  travelers: { priceType: TravelerPriceType }[];
  discountPercent: number;
}): number {
  const namedExtraCount = travelers.length;
  const unnamedExtraCount = Math.max(0, paxCount - 1 - namedExtraCount);

  const subtotal =
    unitPrice * 1 +
    travelers.reduce((sum, t) => sum + unitPrice * PRICE_MULTIPLIER[t.priceType], 0) +
    unitPrice * unnamedExtraCount;

  const clampedDiscount = Math.min(100, Math.max(0, discountPercent));
  const total = subtotal * (1 - clampedDiscount / 100);
  return Math.max(0, Math.round(total * 100) / 100);
}
