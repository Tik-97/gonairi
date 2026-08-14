import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, Car } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const session = await requirePermission(PERMISSIONS.vehiclesView);
  const canManage = await roleHasPermission(session.user.role, PERMISSIONS.vehiclesManage);
  const db = scopedPrisma(session.user.organizationId);

  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId } });
  if (!vehicle) {
    notFound();
  }

  const upcomingAssignments = await db.departureVehicle.findMany({
    where: { vehicleId, departure: { date: { gte: new Date() }, status: { not: "CANCELLED" } } },
    include: { departure: { include: { tour: true } }, driver: true, guide: true },
    orderBy: { departure: { date: "asc" } },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Your fleet"
        title={vehicle.name}
        subtitle={[vehicle.type, `${vehicle.capacity} seats`, vehicle.licensePlate].filter(Boolean).join(" · ")}
        action={
          canManage && (
            <Link href={`/dashboard/vehicles/${vehicle.id}/edit`} className="text-sm text-terracotta-700 underline">
              Edit
            </Link>
          )
        }
      />

      {!vehicle.isActive && (
        <p className="rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm text-[#8a5c00]">
          This vehicle is deactivated — it won&apos;t show up as an option when scheduling new departures.
        </p>
      )}

      <div>
        <h2 className="mb-4 font-serif text-lg font-medium text-espresso">Upcoming departures</h2>
        {upcomingAssignments.length === 0 ? (
          <EmptyState
            title="No upcoming departures"
            message="Departures this vehicle is assigned to will show up here."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            {upcomingAssignments.map(({ departure, driver, guide }) => (
              <Link
                key={departure.id}
                href={`/dashboard/tours/${departure.tourId}/departures`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream-100/70 sm:px-5 sm:py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10">
                  {vehicle.type === "Bus" ? (
                    <Bus className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
                  ) : (
                    <Car className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
                  )}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-espresso">{departure.tour.title}</p>
                  <p className="text-sm text-espresso-muted">
                    {formatDate(departure.date)}
                    {departure.returnAt && ` – back ${formatDate(departure.returnAt)}`} · {departure.bookedCount}/
                    {departure.capacity} booked · {departure.status}
                    {driver && ` · Driver: ${driver.name}`}
                    {guide && ` · Guide: ${guide.name}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
