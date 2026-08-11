"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";

const DepartureSchema = z.object({
  date: z.string().min(1, "Date is required."),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1."),
  priceOverride: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
  vehicleId: z.string().trim().optional(),
  driverId: z.string().trim().optional(),
  guideId: z.string().trim().optional(),
});

export type FormState = { error?: string } | undefined;

/** A vehicle/driver/guide can only be on one departure at a time — this finds
 *  any other non-cancelled departure that already has the same resource booked
 *  on the same calendar day. */
async function findResourceConflict(
  db: ReturnType<typeof scopedPrisma>,
  field: "assignedVehicleId" | "assignedDriverId" | "assignedGuideId",
  resourceId: string,
  date: Date,
) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return db.departure.findFirst({
    where: {
      [field]: resourceId,
      date: { gte: dayStart, lt: dayEnd },
      status: { not: "CANCELLED" },
    },
    include: { tour: true },
  });
}

export async function createDeparture(
  tourId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.departuresManage);

  const priceOverrideRaw = formData.get("priceOverride");
  const parsed = DepartureSchema.safeParse({
    date: formData.get("date"),
    capacity: formData.get("capacity"),
    priceOverride: priceOverrideRaw ? priceOverrideRaw : undefined,
    notes: formData.get("notes"),
    vehicleId: formData.get("vehicleId") || undefined,
    driverId: formData.get("driverId") || undefined,
    guideId: formData.get("guideId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const db = scopedPrisma(session.user.organizationId);
  const tour = await db.tour.findFirst({ where: { id: tourId } });
  if (!tour) {
    return { error: "Tour not found." };
  }

  const departureDate = new Date(parsed.data.date);

  if (parsed.data.vehicleId) {
    const vehicle = await db.vehicle.findFirst({ where: { id: parsed.data.vehicleId } });
    if (!vehicle) {
      return { error: "Selected vehicle not found." };
    }
    const conflict = await findResourceConflict(db, "assignedVehicleId", parsed.data.vehicleId, departureDate);
    if (conflict) {
      return { error: `${vehicle.name} is already assigned to "${conflict.tour.title}" that same day.` };
    }
  }

  if (parsed.data.driverId) {
    const driver = await db.user.findFirst({ where: { id: parsed.data.driverId, role: "DRIVER" } });
    if (!driver) {
      return { error: "Selected driver not found." };
    }
    const conflict = await findResourceConflict(db, "assignedDriverId", parsed.data.driverId, departureDate);
    if (conflict) {
      return { error: `${driver.name} is already driving "${conflict.tour.title}" that same day.` };
    }
  }

  if (parsed.data.guideId) {
    const guide = await db.user.findFirst({ where: { id: parsed.data.guideId, role: "GUIDE" } });
    if (!guide) {
      return { error: "Selected guide not found." };
    }
    const conflict = await findResourceConflict(db, "assignedGuideId", parsed.data.guideId, departureDate);
    if (conflict) {
      return { error: `${guide.name} is already guiding "${conflict.tour.title}" that same day.` };
    }
  }

  await db.departure.create({
    data: {
      organizationId: session.user.organizationId,
      tourId,
      date: departureDate,
      capacity: parsed.data.capacity,
      priceOverride: parsed.data.priceOverride ?? null,
      notes: parsed.data.notes || null,
      assignedVehicleId: parsed.data.vehicleId || null,
      assignedDriverId: parsed.data.driverId || null,
      assignedGuideId: parsed.data.guideId || null,
    },
  });

  redirect(`/dashboard/tours/${tourId}/departures`);
}

export async function cancelDeparture(departureId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.departuresManage);
  const db = scopedPrisma(session.user.organizationId);
  const departure = await db.departure.findFirst({ where: { id: departureId } });
  if (!departure) {
    return;
  }
  await db.departure.update({ where: { id: departureId }, data: { status: "CANCELLED" } });
  redirect(`/dashboard/tours/${departure.tourId}/departures`);
}
