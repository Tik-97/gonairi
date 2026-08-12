import type { PaymentStatus } from "@/generated/prisma/enums";

/**
 * A booking's paymentStatus is derived, not asserted: it's recomputed from
 * the sum of its COMPLETED Payment rows every time one is recorded or
 * deleted, rather than toggled by hand. REFUNDED is intentionally never
 * produced here — there's no refund flow yet, so that status stays unused.
 */
export function derivePaymentStatus(
  totalPaid: number,
  totalPrice: number,
): PaymentStatus {
  if (totalPaid <= 0) return "UNPAID";
  if (totalPaid >= totalPrice) return "PAID";
  return "PARTIAL";
}
