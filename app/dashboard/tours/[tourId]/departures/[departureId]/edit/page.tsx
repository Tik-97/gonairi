import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateDeparture } from "@/lib/actions/departures";
import { DepartureForm } from "@/components/departure-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function EditDeparturePage({
  params,
}: {
  params: Promise<{ tourId: string; departureId: string }>;
}) {
  const { tourId, departureId } = await params;
  const session = await requirePermission(PERMISSIONS.departuresManage);
  const db = scopedPrisma(session.user.organizationId);

  const [departure, activeVehicles, activeDrivers, activeGuides] = await Promise.all([
    db.departure.findFirst({
      where: { id: departureId, tourId, tour: { deletedAt: null } },
      include: {
        tour: true,
        vehicles: { include: { vehicle: true, driver: true, guide: true } },
      },
    }),
    db.vehicle.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { roles: { hasSome: ["DRIVER", "DRIVER_GUIDE"] }, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { roles: { hasSome: ["GUIDE", "DRIVER_GUIDE"] }, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  if (!departure) {
    notFound();
  }

  // Any vehicle/driver/guide currently assigned to one of this departure's
  // rows might since have been deactivated — still show it as an option so
  // the form reflects the true assignment instead of silently blanking it
  // out. Checked across *every* row, not just one.
  const assignedVehicleIds = new Set(departure.vehicles.map((v) => v.vehicleId).filter((id) => id !== null));
  const assignedDriverIds = new Set(departure.vehicles.map((v) => v.driverId).filter((id) => id !== null));
  const assignedGuideIds = new Set(departure.vehicles.map((v) => v.guideId).filter((id) => id !== null));

  const vehicles = [
    ...activeVehicles,
    ...departure.vehicles
      .map((v) => v.vehicle)
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .filter((v) => assignedVehicleIds.has(v.id) && !activeVehicles.some((av) => av.id === v.id)),
  ];
  const drivers = [
    ...activeDrivers,
    ...departure.vehicles
      .map((v) => v.driver)
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .filter((d) => assignedDriverIds.has(d.id) && !activeDrivers.some((ad) => ad.id === d.id)),
  ];
  const guides = [
    ...activeGuides,
    ...departure.vehicles
      .map((v) => v.guide)
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .filter((g) => assignedGuideIds.has(g.id) && !activeGuides.some((ag) => ag.id === g.id)),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Your catalogue" title={`Edit departure — ${departure.tour.title}`} />
      <DepartureForm
        action={updateDeparture.bind(null, departure.id)}
        vehicles={vehicles}
        drivers={drivers}
        guides={guides}
        submitLabel="Save changes"
        restrictPastDates={false}
        departureId={departure.id}
        defaultValues={{
          date: departure.date.toISOString(),
          returnAt: departure.returnAt?.toISOString(),
          vehicleRows: departure.vehicles.map((v) => ({
            vehicleId: v.vehicleId ?? undefined,
            driverId: v.driverId ?? undefined,
            guideId: v.guideId ?? undefined,
          })),
          capacity: departure.capacity,
          priceOverride: departure.priceOverride?.toString(),
          notes: departure.notes ?? undefined,
        }}
      />
    </div>
  );
}
