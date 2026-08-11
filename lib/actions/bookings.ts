"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { createBooking, NotEnoughAvailabilityError } from "@/lib/bookings/createBooking";
import { calculateBookingTotal, type TravelerPriceType } from "@/lib/bookings/pricing";
import { optionalPhoneField } from "@/lib/phone";
import { formStateFromZodError, type FormState } from "@/lib/form-state";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma/enums";

const TRAVELER_PRICE_TYPES = new Set<TravelerPriceType>(["FULL", "HALF", "FREE"]);

const BookingSchema = z.object({
  existingCustomerId: z.string().trim().optional(),
  newCustomerName: z.string().trim().optional(),
  newCustomerEmail: z.string().trim().optional(),
  newCustomerPhone: optionalPhoneField,
  paxCount: z.coerce.number().int().min(1, "At least 1 pax required."),
  discountPercent: z.coerce.number().int().min(0).max(100).optional(),
  specialRequests: z.string().trim().optional(),
});

/** Reads traveler_{i}_name/isChild/priceType fields for pax 2..N. Blank names are skipped —
 *  those slots are priced as unnamed full-price pax rather than forcing every seat to be named. */
function parseTravelers(formData: FormData, paxCount: number) {
  const travelers: { fullName: string; isChild: boolean; priceType: TravelerPriceType }[] = [];
  for (let i = 0; i < paxCount - 1; i++) {
    const fullName = formData.get(`traveler_${i}_name`)?.toString().trim();
    if (!fullName) continue;
    const priceTypeRaw = formData.get(`traveler_${i}_priceType`)?.toString();
    const priceType = TRAVELER_PRICE_TYPES.has(priceTypeRaw as TravelerPriceType)
      ? (priceTypeRaw as TravelerPriceType)
      : "FULL";
    travelers.push({
      fullName,
      isChild: formData.get(`traveler_${i}_isChild`) === "on",
      priceType,
    });
  }
  return travelers;
}

export async function createManualBooking(
  departureId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.bookingsManage);
  const parsed = BookingSchema.safeParse({
    existingCustomerId: formData.get("existingCustomerId") || undefined,
    newCustomerName: formData.get("newCustomerName") || undefined,
    newCustomerEmail: formData.get("newCustomerEmail") || undefined,
    newCustomerPhone: formData.get("newCustomerPhone") || undefined,
    paxCount: formData.get("paxCount"),
    discountPercent: formData.get("discountPercent") || undefined,
    specialRequests: formData.get("specialRequests"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }
  const travelers = parseTravelers(formData, parsed.data.paxCount);

  const db = scopedPrisma(session.user.organizationId);
  const departure = await db.departure.findFirst({
    where: { id: departureId },
    include: { tour: true },
  });
  if (!departure) {
    return { error: "Departure not found." };
  }

  let customerId = parsed.data.existingCustomerId;
  if (!customerId) {
    if (!parsed.data.newCustomerName) {
      return { error: "Enter a name for the new customer, or pick an existing one." };
    }
    // Reuse the existing CRM record by email rather than fragmenting one traveler's
    // history across duplicate Customer rows (and their booking-behavior stats).
    const existingByEmail = parsed.data.newCustomerEmail
      ? await db.customer.findFirst({ where: { email: { equals: parsed.data.newCustomerEmail, mode: "insensitive" } } })
      : null;
    if (existingByEmail) {
      customerId = existingByEmail.id;
    } else {
      const customer = await db.customer.create({
        data: {
          organizationId: session.user.organizationId,
          fullName: parsed.data.newCustomerName,
          email: parsed.data.newCustomerEmail || null,
          phone: parsed.data.newCustomerPhone || null,
          source: "MANUAL",
        },
      });
      customerId = customer.id;
    }
  }

  const unitPrice = Number(departure.priceOverride ?? departure.tour.basePrice);
  const discountPercent = parsed.data.discountPercent ?? 0;
  const totalPrice = calculateBookingTotal({
    unitPrice,
    paxCount: parsed.data.paxCount,
    travelers,
    discountPercent,
  });

  try {
    await createBooking({
      organizationId: session.user.organizationId,
      departureId,
      customerId,
      paxCount: parsed.data.paxCount,
      totalPrice,
      discountPercent,
      currency: departure.tour.currency,
      source: "MANUAL",
      createdByUserId: session.user.id,
      specialRequests: parsed.data.specialRequests,
      travelers,
    });
  } catch (error) {
    if (error instanceof NotEnoughAvailabilityError) {
      return { error: "Not enough availability left on this departure." };
    }
    throw error;
  }

  redirect(`/dashboard/tours/${departure.tourId}/departures`);
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const session = await requirePermission(PERMISSIONS.bookingsManage);
  const db = scopedPrisma(session.user.organizationId);
  const booking = await db.booking.findFirst({ where: { id: bookingId } });
  if (!booking) {
    return;
  }

  if (status === "CANCELLED" && booking.status !== "CANCELLED") {
    await db.$transaction(async (tx) => {
      await tx.departure.update({
        where: { id: booking.departureId },
        data: { bookedCount: { decrement: booking.paxCount } },
      });
      await tx.booking.update({ where: { id: bookingId }, data: { status } });
    });
  } else {
    await db.booking.update({ where: { id: bookingId }, data: { status } });
  }

  redirect(`/dashboard/bookings/${bookingId}`);
}

export async function updateBookingPaymentStatus(bookingId: string, paymentStatus: PaymentStatus): Promise<void> {
  const session = await requirePermission(PERMISSIONS.bookingsManage);
  const db = scopedPrisma(session.user.organizationId);
  const booking = await db.booking.findFirst({ where: { id: bookingId } });
  if (!booking) {
    return;
  }

  await db.booking.update({ where: { id: bookingId }, data: { paymentStatus } });

  redirect(`/dashboard/bookings/${bookingId}`);
}
