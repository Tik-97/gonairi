"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { formStateFromZodError, type FormState } from "@/lib/form-state";

const DepartureSchema = z.object({
  date: z.string().min(1, "Date is required."),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1."),
  priceOverride: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
  vehicleId: z.string().trim().optional(),
  driverId: z.string().trim().optional(),
  guideId: z.string().trim().optional(),
});

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

type DepartureResourceSelections = { vehicleId?: string; driverId?: string; guideId?: string };

/** The vehicle/driver/guide assignment check was three near-identical blocks
 *  (look up the resource, error if missing, error if already booked that day) —
 *  same shape, different field names and wording. Table-driven so a 4th
 *  assignable resource type would mean one new row here, not a fourth copy. */
const ASSIGNABLE_RESOURCES: {
  formField: keyof DepartureResourceSelections;
  conflictField: "assignedVehicleId" | "assignedDriverId" | "assignedGuideId";
  verb: string;
  notFoundError: string;
  findResource: (db: ReturnType<typeof scopedPrisma>, id: string) => Promise<{ name: string } | null>;
}[] = [
  {
    formField: "vehicleId",
    conflictField: "assignedVehicleId",
    verb: "assigned to",
    notFoundError: "Selected vehicle not found.",
    findResource: (db, id) => db.vehicle.findFirst({ where: { id } }),
  },
  {
    formField: "driverId",
    conflictField: "assignedDriverId",
    verb: "driving",
    notFoundError: "Selected driver not found.",
    findResource: (db, id) => db.user.findFirst({ where: { id, role: "DRIVER" } }),
  },
  {
    formField: "guideId",
    conflictField: "assignedGuideId",
    verb: "guiding",
    notFoundError: "Selected guide not found.",
    findResource: (db, id) => db.user.findFirst({ where: { id, role: "GUIDE" } }),
  },
];

/** Checks each selected vehicle/driver/guide, in order — returns the first
 *  problem found (missing or already booked that day), or null if every
 *  selection is clear to assign. */
async function checkResourceAssignments(
  db: ReturnType<typeof scopedPrisma>,
  date: Date,
  selections: DepartureResourceSelections,
): Promise<string | null> {
  for (const resource of ASSIGNABLE_RESOURCES) {
    const id = selections[resource.formField];
    if (!id) continue;
    const found = await resource.findResource(db, id);
    if (!found) return resource.notFoundError;
    const conflict = await findResourceConflict(db, resource.conflictField, id, date);
    if (conflict) return `${found.name} is already ${resource.verb} "${conflict.tour.title}" that same day.`;
  }
  return null;
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
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  const tour = await db.tour.findFirst({ where: { id: tourId } });
  if (!tour) {
    return { error: "Tour not found." };
  }

  const departureDate = new Date(parsed.data.date);

  const conflictError = await checkResourceAssignments(db, departureDate, parsed.data);
  if (conflictError) {
    return { error: conflictError };
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
