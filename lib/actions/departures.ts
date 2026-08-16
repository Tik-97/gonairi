"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { formStateFromZodError, type FormState } from "@/lib/form-state";
import { logError } from "@/lib/log";
import { vehicleWindow, windowsOverlap } from "@/lib/departures/vehicle-availability";

const DepartureSchema = z.object({
  date: z.string().min(1, "Date is required."),
  returnAt: z.string().trim().optional(),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1."),
  priceOverride: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
});

type VehicleAssignmentRow = { vehicleId?: string; driverId?: string; guideId?: string };

/** Reads vehicleRow_{i}_vehicleId/driverId/guideId for i in 0..rowCount-1 —
 *  mirrors parseTravelers in lib/actions/bookings.ts. A row with nothing
 *  filled in is dropped rather than erroring, since the UI lets staff add a
 *  row and decide not to use it. A row doesn't require a vehicle — a
 *  driver/guide with no vehicle (e.g. a walking tour) is a real, pre-existing
 *  case. */
function parseVehicleAssignments(formData: FormData, rowCount: number): VehicleAssignmentRow[] {
  const rows: VehicleAssignmentRow[] = [];
  for (let i = 0; i < rowCount; i++) {
    const vehicleId = formData.get(`vehicleRow_${i}_vehicleId`)?.toString().trim();
    const driverId = formData.get(`vehicleRow_${i}_driverId`)?.toString().trim();
    const guideId = formData.get(`vehicleRow_${i}_guideId`)?.toString().trim();
    if (!vehicleId && !driverId && !guideId) continue;
    rows.push({ vehicleId: vehicleId || undefined, driverId: driverId || undefined, guideId: guideId || undefined });
  }
  return rows;
}

/** Catches conflicts *within one submission* — the same vehicle added twice,
 *  or the same person crewing two different rows — that the DB-side checks
 *  below can't see, since none of these rows exist yet to conflict against
 *  each other. Being driver AND guide on the *same* row (a driver-guide
 *  covering both jobs solo) is fine and not flagged. */
function findIntraSubmissionConflict(rows: VehicleAssignmentRow[]): string | null {
  const seenVehicles = new Set<string>();
  const personFirstRow = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.vehicleId) {
      if (seenVehicles.has(row.vehicleId)) {
        return `Vehicle #${i + 1}: this vehicle is already used on another row of this departure.`;
      }
      seenVehicles.add(row.vehicleId);
    }
    for (const personId of [row.driverId, row.guideId]) {
      if (!personId) continue;
      const firstRow = personFirstRow.get(personId);
      if (firstRow !== undefined && firstRow !== i) {
        return `Vehicle #${i + 1}: this person is already crewing another row of this departure.`;
      }
      personFirstRow.set(personId, i);
    }
  }
  return null;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Yerevan" }).format(
    date,
  );
}

/** A vehicle can cover two short departures the same day as long as there's
 *  real turnaround time between them — see vehicleWindow's buffer/default
 *  above. Unlike drivers/guides this is time-windowed, not whole-day, since a
 *  vehicle (unlike a person) can reasonably shuttle between two trips. */
async function findVehicleConflict(
  db: ReturnType<typeof scopedPrisma>,
  vehicleId: string,
  date: Date,
  returnAt: Date | null,
  excludeDepartureId?: string,
) {
  const candidate = vehicleWindow(date, returnAt);
  const others = await db.departureVehicle.findMany({
    where: {
      vehicleId,
      departure: { status: { not: "CANCELLED" }, ...(excludeDepartureId ? { id: { not: excludeDepartureId } } : {}) },
    },
    include: { departure: { include: { tour: true } } },
  });
  for (const other of others) {
    if (windowsOverlap(candidate, vehicleWindow(other.departure.date, other.departure.returnAt))) {
      return other.departure;
    }
  }
  return null;
}

/** A person can only crew one departure at a time — checked across both the
 *  driver and guide slot, since a DRIVER_GUIDE could legitimately be driving
 *  one departure's jeep and guiding a different departure's jeep, and that
 *  still needs to count as a double-booking. Whole-day rather than
 *  time-windowed like vehicles: a person can't split a work day the way a
 *  vehicle can shuttle between two short trips. */
async function findStaffConflict(
  db: ReturnType<typeof scopedPrisma>,
  personId: string,
  date: Date,
  excludeDepartureId?: string,
) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return db.departureVehicle.findFirst({
    where: {
      OR: [{ driverId: personId }, { guideId: personId }],
      departure: {
        date: { gte: dayStart, lt: dayEnd },
        status: { not: "CANCELLED" },
        ...(excludeDepartureId ? { id: { not: excludeDepartureId } } : {}),
      },
    },
    include: { departure: { include: { tour: true } } },
  });
}

/** Validates one vehicle-assignment row: the vehicle (if any) isn't already
 *  tied up elsewhere, and the driver/guide (if any) aren't already crewing
 *  something else that day. Returns an error message prefixed with the row
 *  number (there can be several rows on one departure), or null if clear. */
async function checkVehicleRow(
  db: ReturnType<typeof scopedPrisma>,
  rowIndex: number,
  row: VehicleAssignmentRow,
  date: Date,
  returnAt: Date | null,
  excludeDepartureId?: string,
): Promise<string | null> {
  const label = `Vehicle #${rowIndex + 1}`;

  if (row.vehicleId) {
    const vehicle = await db.vehicle.findFirst({ where: { id: row.vehicleId } });
    if (!vehicle) return `${label}: selected vehicle not found.`;
    const conflict = await findVehicleConflict(db, row.vehicleId, date, returnAt, excludeDepartureId);
    if (conflict) {
      const conflictEnd = vehicleWindow(conflict.date, conflict.returnAt).end;
      return `${label}: ${vehicle.name} is still tied up with "${conflict.tour.title}" until ~${formatTime(conflictEnd)} (return time + 1h buffer) — pick a later departure or a different vehicle.`;
    }
  }

  if (row.driverId) {
    const driver = await db.user.findFirst({ where: { id: row.driverId, roles: { hasSome: ["DRIVER", "DRIVER_GUIDE"] } } });
    if (!driver) return `${label}: selected driver not found.`;
    const conflict = await findStaffConflict(db, row.driverId, date, excludeDepartureId);
    if (conflict) return `${label}: ${driver.name} is already crewing "${conflict.departure.tour.title}" that same day.`;
  }

  if (row.guideId) {
    const guide = await db.user.findFirst({ where: { id: row.guideId, roles: { hasSome: ["GUIDE", "DRIVER_GUIDE"] } } });
    if (!guide) return `${label}: selected guide not found.`;
    const conflict = await findStaffConflict(db, row.guideId, date, excludeDepartureId);
    if (conflict) return `${label}: ${guide.name} is already crewing "${conflict.departure.tour.title}" that same day.`;
  }

  return null;
}

async function checkAllRows(
  db: ReturnType<typeof scopedPrisma>,
  rows: VehicleAssignmentRow[],
  date: Date,
  returnAt: Date | null,
  excludeDepartureId?: string,
): Promise<string | null> {
  for (let i = 0; i < rows.length; i++) {
    const error = await checkVehicleRow(db, i, rows[i], date, returnAt, excludeDepartureId);
    if (error) return error;
  }
  return null;
}

/** Live vehicle-availability check called directly from DepartureForm (one
 *  row's vehicle-select onChange) as the user fills in date/return/vehicle —
 *  so a conflict shows up while they're still editing instead of only
 *  failing (or, previously, sometimes crashing) once they hit submit. Never
 *  throws: an unparseable/incomplete date just means "nothing to check yet,"
 *  not an error to surface. */
export async function checkVehicleAvailability(
  vehicleId: string,
  dateStr: string,
  returnAtStr: string | null,
  excludeDepartureId?: string,
): Promise<{ conflict: string | null }> {
  const session = await requirePermission(PERMISSIONS.departuresManage);
  if (!vehicleId || !dateStr) {
    return { conflict: null };
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { conflict: null };
  }
  const returnAt = returnAtStr ? new Date(returnAtStr) : null;
  if (returnAt && Number.isNaN(returnAt.getTime())) {
    return { conflict: null };
  }

  const db = scopedPrisma(session.user.organizationId);
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId } });
  if (!vehicle) {
    return { conflict: null };
  }

  const conflict = await findVehicleConflict(db, vehicleId, date, returnAt, excludeDepartureId);
  if (!conflict) {
    return { conflict: null };
  }
  const conflictEnd = vehicleWindow(conflict.date, conflict.returnAt).end;
  return {
    conflict: `${vehicle.name} is tied up with "${conflict.tour.title}" until ~${formatTime(conflictEnd)} (return time + 1h buffer).`,
  };
}

/** Shared date/returnAt sanity check for create and update. */
function validateDepartureTimes(date: Date, returnAt: Date | null): string | null {
  if (returnAt && returnAt <= date) {
    return "Estimated return must be after the departure time.";
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
    returnAt: formData.get("returnAt") || undefined,
    capacity: formData.get("capacity"),
    priceOverride: priceOverrideRaw ? priceOverrideRaw : undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const rowCount = Number(formData.get("vehicleRowCount") ?? 0);
  const rows = parseVehicleAssignments(formData, rowCount);
  const intraError = findIntraSubmissionConflict(rows);
  if (intraError) {
    return { error: intraError };
  }

  const db = scopedPrisma(session.user.organizationId);
  const departureDate = new Date(parsed.data.date);
  const returnAt = parsed.data.returnAt ? new Date(parsed.data.returnAt) : null;

  const timeError = validateDepartureTimes(departureDate, returnAt);
  if (timeError) {
    return { error: timeError };
  }

  // redirect() throws internally to signal navigation, so it must stay
  // outside this try/catch — swallowing it here would turn every successful
  // save into a silent no-op instead of a redirect.
  let redirectTo: string;
  try {
    const tour = await db.tour.findFirst({ where: { id: tourId, deletedAt: null } });
    if (!tour) {
      return { error: "Tour not found." };
    }

    const rowsError = await checkAllRows(db, rows, departureDate, returnAt);
    if (rowsError) {
      return { error: rowsError };
    }

    await db.$transaction(async (tx) => {
      const departure = await tx.departure.create({
        data: {
          organizationId: session.user.organizationId,
          tourId,
          date: departureDate,
          returnAt,
          capacity: parsed.data.capacity,
          priceOverride: parsed.data.priceOverride ?? null,
          notes: parsed.data.notes || null,
        },
      });
      if (rows.length > 0) {
        await tx.departureVehicle.createMany({
          data: rows.map((row) => ({
            organizationId: session.user.organizationId,
            departureId: departure.id,
            vehicleId: row.vehicleId ?? null,
            driverId: row.driverId ?? null,
            guideId: row.guideId ?? null,
          })),
        });
      }
    });
    redirectTo = `/dashboard/tours/${tourId}/departures`;
  } catch (error) {
    logError("createDeparture", error);
    return { error: "Something went wrong saving this departure. Please try again." };
  }

  redirect(redirectTo);
}

export async function updateDeparture(
  departureId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.departuresManage);

  const priceOverrideRaw = formData.get("priceOverride");
  const parsed = DepartureSchema.safeParse({
    date: formData.get("date"),
    returnAt: formData.get("returnAt") || undefined,
    capacity: formData.get("capacity"),
    priceOverride: priceOverrideRaw ? priceOverrideRaw : undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const rowCount = Number(formData.get("vehicleRowCount") ?? 0);
  const rows = parseVehicleAssignments(formData, rowCount);
  const intraError = findIntraSubmissionConflict(rows);
  if (intraError) {
    return { error: intraError };
  }

  const db = scopedPrisma(session.user.organizationId);
  const departureDate = new Date(parsed.data.date);
  const returnAt = parsed.data.returnAt ? new Date(parsed.data.returnAt) : null;

  const timeError = validateDepartureTimes(departureDate, returnAt);
  if (timeError) {
    return { error: timeError };
  }

  // See the matching comment in createDeparture — redirect() must stay
  // outside this try/catch.
  let redirectTo: string;
  try {
    const existing = await db.departure.findFirst({
      where: { id: departureId, tour: { deletedAt: null } },
    });
    if (!existing) {
      return { error: "Departure not found." };
    }

    if (parsed.data.capacity < existing.bookedCount) {
      return { error: `Capacity can't be less than the ${existing.bookedCount} seat(s) already booked.` };
    }

    const rowsError = await checkAllRows(db, rows, departureDate, returnAt, departureId);
    if (rowsError) {
      return { error: rowsError };
    }

    await db.$transaction(async (tx) => {
      await tx.departure.update({
        where: { id: departureId },
        data: {
          date: departureDate,
          returnAt,
          capacity: parsed.data.capacity,
          priceOverride: parsed.data.priceOverride ?? null,
          notes: parsed.data.notes || null,
        },
      });
      await tx.departureVehicle.deleteMany({ where: { departureId } });
      if (rows.length > 0) {
        await tx.departureVehicle.createMany({
          data: rows.map((row) => ({
            organizationId: session.user.organizationId,
            departureId,
            vehicleId: row.vehicleId ?? null,
            driverId: row.driverId ?? null,
            guideId: row.guideId ?? null,
          })),
        });
      }
    });
    redirectTo = `/dashboard/tours/${existing.tourId}/departures`;
  } catch (error) {
    logError("updateDeparture", error);
    return { error: "Something went wrong saving this departure. Please try again." };
  }

  redirect(redirectTo);
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

export async function deleteDeparture(departureId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.departuresDelete);
  const db = scopedPrisma(session.user.organizationId);

  const existing = await db.departure.findFirst({ where: { id: departureId } });
  if (!existing) {
    return;
  }

  // The delete button is only shown when there are zero bookings; this is a
  // defense-in-depth check in case one slipped in between page load and click.
  const bookingCount = await db.booking.count({ where: { departureId } });
  if (bookingCount > 0) {
    return;
  }

  // DepartureVehicle rows cascade-delete with the Departure (onDelete: Cascade).
  await db.departure.delete({ where: { id: departureId } });
  redirect(`/dashboard/tours/${existing.tourId}/departures`);
}
