import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, Car } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<PaginationParams>;
}) {
  const [{ vehicleId }, paginationParams, { dict }] = await Promise.all([params, searchParams, getDictionary()]);
  const pagination = parsePagination(paginationParams);
  const session = await requirePermission(PERMISSIONS.vehiclesView);
  const canManage = await roleHasPermission(session.user.role, PERMISSIONS.vehiclesManage);
  const db = scopedPrisma(session.user.organizationId);

  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId } });
  if (!vehicle) {
    notFound();
  }

  const assignmentWhere = { vehicleId, departure: { date: { gte: new Date() }, status: { not: "CANCELLED" as const } } };
  const [upcomingAssignments, totalItems] = await Promise.all([
    db.departureVehicle.findMany({
      where: assignmentWhere,
      include: { departure: { include: { tour: true } }, driver: true, guide: true },
      orderBy: { departure: { date: "asc" } },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.departureVehicle.count({ where: assignmentWhere }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={dict.vehiclesPage.eyebrow}
        title={vehicle.name}
        subtitle={[vehicle.type ? (dict.vehicleTypes[vehicle.type] ?? vehicle.type) : null, `${vehicle.capacity} ${dict.departureForm.seatsSuffix}`, vehicle.licensePlate].filter(Boolean).join(" · ")}
        action={
          canManage && (
            <Link href={`/dashboard/vehicles/${vehicle.id}/edit`} className="text-sm text-terracotta-700 underline">
              {dict.vehicleDetailPage.editLink}
            </Link>
          )
        }
      />

      {!vehicle.isActive && (
        <p className="rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm text-[#8a5c00]">
          {dict.vehicleDetailPage.deactivatedWarning}
        </p>
      )}

      <div>
        <h2 className="mb-4 font-serif text-lg font-medium text-espresso">{dict.vehicleDetailPage.upcomingDeparturesHeading}</h2>
        {upcomingAssignments.length === 0 ? (
          <EmptyState
            title={dict.vehicleDetailPage.emptyTitle}
            message={dict.vehicleDetailPage.emptyMessage}
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
                    <LocalDateTime value={departure.date.toISOString()} />
                    {departure.returnAt && <> – {dict.departuresPage.backPrefix} <LocalDateTime value={departure.returnAt.toISOString()} /></>} · {departure.bookedCount}/
                    {departure.capacity} {dict.departuresPage.bookedSuffix} · {dict.departureStatus[departure.status]}
                    {driver && ` · ${dict.departureCrew.driver}: ${driver.name}`}
                    {guide && ` · ${dict.departureCrew.guide}: ${guide.name}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
