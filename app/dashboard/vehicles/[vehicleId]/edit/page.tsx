import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateVehicle } from "@/lib/actions/vehicles";
import { VehicleForm } from "@/components/vehicle-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const session = await requirePermission(PERMISSIONS.vehiclesManage);
  const db = scopedPrisma(session.user.organizationId);
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId } });

  if (!vehicle) {
    notFound();
  }

  const updateVehicleWithId = updateVehicle.bind(null, vehicle.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Your fleet" title={vehicle.name} subtitle="Refine the details of this vehicle." />
      <VehicleForm
        action={updateVehicleWithId}
        submitLabel="Save changes"
        defaultValues={{
          name: vehicle.name,
          type: vehicle.type ?? "",
          capacity: vehicle.capacity,
          licensePlate: vehicle.licensePlate ?? "",
          driverName: vehicle.driverName ?? "",
          driverPhone: vehicle.driverPhone ?? "",
        }}
      />
    </div>
  );
}
