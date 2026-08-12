"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma, type ScopedPrisma } from "@/lib/db/scoped";
import { derivePaymentStatus } from "@/lib/payments/derive-status";
import { formStateFromZodError, type FormState } from "@/lib/form-state";

const RecordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero."),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD_ONLINE", "OTHER"]),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
  reference: z.string().trim().optional(),
});

/** Recomputes and persists a booking's derived paymentStatus from the sum of
 *  its COMPLETED payments — called after every payment create/delete so the
 *  field never drifts from the actual ledger. */
async function recalculateBookingPaymentStatus(
  db: ScopedPrisma,
  bookingId: string,
  totalPrice: number | string,
): Promise<void> {
  const sum = await db.payment.aggregate({
    where: { bookingId, status: "COMPLETED" },
    _sum: { amount: true },
  });
  const totalPaid = Number(sum._sum.amount ?? 0);
  const paymentStatus = derivePaymentStatus(totalPaid, Number(totalPrice));
  await db.booking.update({
    where: { id: bookingId },
    data: { paymentStatus },
  });
}

export async function recordPayment(
  bookingId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.financesManage);
  const parsed = RecordPaymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    paidAt: formData.get("paidAt"),
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  const booking = await db.booking.findFirst({ where: { id: bookingId } });
  if (!booking) {
    return { error: "Booking not found." };
  }

  await db.payment.create({
    data: {
      organizationId: session.user.organizationId,
      bookingId,
      amount: parsed.data.amount,
      currency: booking.currency,
      method: parsed.data.method,
      status: "COMPLETED",
      externalReference: parsed.data.reference || null,
      recordedByUserId: session.user.id,
      paidAt: new Date(`${parsed.data.paidAt}T00:00:00`),
    },
  });

  await recalculateBookingPaymentStatus(
    db,
    bookingId,
    booking.totalPrice.toString(),
  );

  redirect(`/dashboard/bookings/${bookingId}`);
}

export async function deletePayment(paymentId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.financesManage);
  const db = scopedPrisma(session.user.organizationId);
  const payment = await db.payment.findFirst({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) {
    return;
  }

  await db.payment.delete({ where: { id: payment.id } });
  await recalculateBookingPaymentStatus(
    db,
    payment.bookingId,
    payment.booking.totalPrice.toString(),
  );

  redirect(`/dashboard/bookings/${payment.bookingId}`);
}
