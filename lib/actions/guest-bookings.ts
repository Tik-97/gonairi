"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { scopedPrisma } from "@/lib/db/scoped";
import { createBooking, NotEnoughAvailabilityError } from "@/lib/bookings/createBooking";
import { calculateBookingTotal } from "@/lib/bookings/pricing";
import { formStateFromZodError, type FormState } from "@/lib/form-state";

const GuestBookingSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required."),
  email: z.email("Enter a valid email."),
  phone: z.string().trim().optional(),
  paxCount: z.coerce.number().int().min(1),
  specialRequests: z.string().trim().optional(),
});

export async function createGuestBooking(
  departureId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = GuestBookingSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    paxCount: formData.get("paxCount"),
    specialRequests: formData.get("specialRequests"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  // Unscoped lookup is intentional: the guest has no session/organization context yet.
  // Explicitly requiring both the tour and its organization to be published prevents
  // booking on a departure that only exists in someone's private draft data.
  const departure = await prisma.departure.findFirst({
    where: {
      id: departureId,
      organization: { isPublished: true },
      tour: { isPublished: true },
    },
    include: { tour: true },
  });
  if (!departure) {
    return { error: "This tour departure is not available." };
  }

  const db = scopedPrisma(departure.organizationId);

  let customer = await db.customer.findFirst({ where: { email: { equals: parsed.data.email, mode: "insensitive" } } });
  if (!customer) {
    customer = await db.customer.create({
      data: {
        organizationId: departure.organizationId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        source: "ONLINE",
      },
    });
  }

  // Same pricing rule as the staff-manual flow (lib/actions/bookings.ts) — guests just
  // never supply named travelers or a discount, so this reduces to unitPrice * paxCount.
  const unitPrice = Number(departure.priceOverride ?? departure.tour.basePrice);
  const totalPrice = calculateBookingTotal({
    unitPrice,
    paxCount: parsed.data.paxCount,
    travelers: [],
    discountPercent: 0,
  });

  let booking;
  try {
    booking = await createBooking({
      organizationId: departure.organizationId,
      departureId,
      customerId: customer.id,
      paxCount: parsed.data.paxCount,
      totalPrice,
      currency: departure.tour.currency,
      source: "ONLINE",
      specialRequests: parsed.data.specialRequests,
    });
  } catch (error) {
    if (error instanceof NotEnoughAvailabilityError) {
      return { error: "Sorry, not enough seats left on this departure." };
    }
    throw error;
  }

  redirect(`/bookings/${booking.lookupToken}`);
}
