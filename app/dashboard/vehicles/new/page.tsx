import { createVehicle } from "@/lib/actions/vehicles";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { VehicleForm } from "@/components/vehicle-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewVehiclePage() {
  await requirePermission(PERMISSIONS.vehiclesManage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your fleet"
        title="New vehicle"
        subtitle="Add a bus, car, or jeep to assign to departures."
      />
      <VehicleForm action={createVehicle} submitLabel="Add vehicle" />
    </div>
  );
}
