import "server-only";
import { scopedPrisma } from "@/lib/db/scoped";
import type { TravelerPriceType } from "@/lib/bookings/pricing";

type CreateBookingInput = {
  organizationId: string;
  departureId: string;
  customerId: string;
  paxCount: number;
  totalPrice: number;
  discountPercent?: number;
  currency: string;
  source: "MANUAL" | "ONLINE";
  createdByUserId?: string;
  specialRequests?: string;
  travelers?: { fullName: string; isChild: boolean; priceType: TravelerPriceType }[];
};

export class NotEnoughAvailabilityError extends Error {
  constructor() {
    super("Not enough availability for this departure.");
  }
}

/**
 * Atomically checks remaining capacity and creates the Booking, so two concurrent
 * requests can never both succeed for the same last seats. The conditional UPDATE
 * (bookedCount + pax <= capacity, checked and applied in one statement) is what makes
 * this safe — a plain read-then-write would race. Used by both the agent-facing manual
 * booking flow and (later) the public guest booking flow, so the guarantee is uniform.
 *
 * Raw SQL bypasses the tenant-scoping Prisma extension, so organizationId is included
 * in the WHERE clause explicitly here.
 */
export async function createBooking(input: CreateBookingInput) {
  const db = scopedPrisma(input.organizationId);

  return db.$transaction(async (tx) => {
    const updatedRows = await tx.$executeRaw`
      UPDATE "Departure"
      SET "bookedCount" = "bookedCount" + ${input.paxCount}
      WHERE "id" = ${input.departureId}
        AND "organizationId" = ${input.organizationId}
        AND "bookedCount" + ${input.paxCount} <= "capacity"
    `;

    if (updatedRows === 0) {
      throw new NotEnoughAvailabilityError();
    }

    const booking = await tx.booking.create({
      data: {
        organizationId: input.organizationId,
        departureId: input.departureId,
        customerId: input.customerId,
        paxCount: input.paxCount,
        totalPrice: input.totalPrice,
        discountPercent: input.discountPercent ?? 0,
        currency: input.currency,
        source: input.source,
        createdByUserId: input.createdByUserId,
        specialRequests: input.specialRequests || null,
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
    });

    if (input.travelers?.length) {
      await tx.bookingTraveler.createMany({
        data: input.travelers.map((t) => ({
          organizationId: input.organizationId,
          bookingId: booking.id,
          fullName: t.fullName,
          isChild: t.isChild,
          priceType: t.priceType,
        })),
      });
    }

    return booking;
  });
}
