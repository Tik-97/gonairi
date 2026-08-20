import Link from "next/link";
import { Bus, Car } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { toggleVehicleActive, deleteVehicle } from "@/lib/actions/vehicles";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function VehiclesPage() {
  const [session, { dict }] = await Promise.all([requirePermission(PERMISSIONS.vehiclesView), getDictionary()]);
  const [canManage, canDelete] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.vehiclesManage),
    roleHasPermission(session.user.role, PERMISSIONS.vehiclesDelete),
  ]);
  const db = scopedPrisma(session.user.organizationId);
  const vehiclesRaw = await db.vehicle.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const departureCountByVehicle = new Map<string, number>();
  if (canDelete && vehiclesRaw.length > 0) {
    const assignments = await db.departureVehicle.findMany({
      where: { vehicleId: { in: vehiclesRaw.map((v) => v.id) } },
      select: { vehicleId: true },
    });
    for (const assignment of assignments) {
      if (!assignment.vehicleId) continue;
      departureCountByVehicle.set(assignment.vehicleId, (departureCountByVehicle.get(assignment.vehicleId) ?? 0) + 1);
    }
  }
  const vehicles = vehiclesRaw.map((vehicle) => ({
    ...vehicle,
    departureCount: departureCountByVehicle.get(vehicle.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.vehiclesPage.eyebrow}
        title={dict.vehiclesPage.title}
        subtitle={dict.vehiclesPage.subtitle}
        action={
          canManage && (
            <Link
              href="/dashboard/vehicles/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              {dict.vehiclesPage.newVehicleButton}
            </Link>
          )
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          title={dict.vehiclesPage.emptyTitle}
          message={dict.vehiclesPage.emptyMessage}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 ${
                vehicle.isActive ? "" : "opacity-50"
              }`}
            >
              <Link href={`/dashboard/vehicles/${vehicle.id}`} className="-m-1 flex items-center gap-3 rounded-md p-1 transition-colors hover:bg-cream-100/70">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10">
                  {vehicle.type === "Bus" ? (
                    <Bus className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
                  ) : (
                    <Car className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
                  )}
                </span>
                <div>
                  <p className="font-medium text-espresso">
                    {vehicle.name}
                    {!vehicle.isActive && <span className="ml-2 text-xs text-espresso-muted">{dict.vehiclesPage.inactiveSuffix}</span>}
                  </p>
                  <p className="text-sm text-espresso-muted">
                    {[vehicle.type ? (dict.vehicleTypes[vehicle.type] ?? vehicle.type) : null, `${vehicle.capacity} ${dict.departureForm.seatsSuffix}`, vehicle.licensePlate].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
              {canManage && (
                <div className="flex items-center gap-4 text-sm">
                  <Link href={`/dashboard/vehicles/${vehicle.id}/edit`} className="text-terracotta-700 underline">
                    {dict.vehiclesPage.editLink}
                  </Link>
                  <form action={toggleVehicleActive.bind(null, vehicle.id)}>
                    <button type="submit" className={vehicle.isActive ? "text-danger underline" : "text-success underline"}>
                      {vehicle.isActive ? dict.vehiclesPage.deactivate : dict.vehiclesPage.activate}
                    </button>
                  </form>
                  {canDelete && vehicle.departureCount === 0 && (
                    <form action={deleteVehicle.bind(null, vehicle.id)}>
                      <button type="submit" className="text-danger underline">
                        {dict.vehiclesPage.deleteLink}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
