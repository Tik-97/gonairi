import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateVehicle } from "@/lib/actions/vehicles";
import { VehicleForm } from "@/components/vehicle-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const [session, { locale, dict }] = await Promise.all([requirePermission(PERMISSIONS.vehiclesManage), getDictionary()]);
  const db = scopedPrisma(session.user.organizationId);
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId } });

  if (!vehicle) {
    notFound();
  }

  const updateVehicleWithId = updateVehicle.bind(null, vehicle.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.vehiclesPage.eyebrow} title={vehicle.name} subtitle={dict.editVehiclePage.subtitle} />
      <VehicleForm
        action={updateVehicleWithId}
        submitLabel={dict.editVehiclePage.submitLabel}
        locale={locale}
        dict={dict}
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
