"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { optionalPhoneField } from "@/lib/phone";
import { formStateFromZodError, type FormState } from "@/lib/form-state";

const VehicleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  type: z.string().trim().optional(),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1."),
  licensePlate: z.string().trim().optional(),
  driverName: z.string().trim().optional(),
  driverPhone: optionalPhoneField,
});

function parseVehicleForm(formData: FormData) {
  return VehicleSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    capacity: formData.get("capacity"),
    licensePlate: formData.get("licensePlate"),
    driverName: formData.get("driverName"),
    driverPhone: formData.get("driverPhone"),
  });
}

export async function createVehicle(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.vehiclesManage);
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  await db.vehicle.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name,
      type: parsed.data.type || null,
      capacity: parsed.data.capacity,
      licensePlate: parsed.data.licensePlate || null,
      driverName: parsed.data.driverName || null,
      driverPhone: parsed.data.driverPhone || null,
    },
  });

  redirect("/dashboard/vehicles");
}

export async function updateVehicle(
  vehicleId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.vehiclesManage);
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  const existing = await db.vehicle.findFirst({ where: { id: vehicleId } });
  if (!existing) {
    return { error: "Vehicle not found." };
  }

  await db.vehicle.update({
    where: { id: vehicleId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type || null,
      capacity: parsed.data.capacity,
      licensePlate: parsed.data.licensePlate || null,
      driverName: parsed.data.driverName || null,
      driverPhone: parsed.data.driverPhone || null,
    },
  });

  redirect("/dashboard/vehicles");
}

export async function toggleVehicleActive(vehicleId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.vehiclesManage);
  const db = scopedPrisma(session.user.organizationId);
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId } });
  if (!vehicle) {
    return;
  }
  await db.vehicle.update({ where: { id: vehicleId }, data: { isActive: !vehicle.isActive } });
  redirect("/dashboard/vehicles");
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.vehiclesDelete);
  const db = scopedPrisma(session.user.organizationId);

  const existing = await db.vehicle.findFirst({ where: { id: vehicleId } });
  if (!existing) {
    return;
  }

  // The delete button is only shown when the vehicle isn't assigned to any
  // departure; this is a defense-in-depth check in case one slipped in
  // between page load and click. Deleting would otherwise silently clear
  // vehicleId (SetNull) on every DepartureVehicle row that used it, including
  // past ones — losing which vehicle actually ran a completed trip.
  const assignmentCount = await db.departureVehicle.count({ where: { vehicleId } });
  if (assignmentCount > 0) {
    return;
  }

  await db.vehicle.delete({ where: { id: vehicleId } });
  redirect("/dashboard/vehicles");
}
