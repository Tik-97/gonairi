import { createVehicle } from "@/lib/actions/vehicles";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { VehicleForm } from "@/components/vehicle-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NewVehiclePage() {
  const [, { locale, dict }] = await Promise.all([requirePermission(PERMISSIONS.vehiclesManage), getDictionary()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.vehiclesPage.eyebrow}
        title={dict.newVehiclePage.title}
        subtitle={dict.newVehiclePage.subtitle}
      />
      <VehicleForm action={createVehicle} submitLabel={dict.newVehiclePage.submitLabel} locale={locale} dict={dict} />
    </div>
  );
}
