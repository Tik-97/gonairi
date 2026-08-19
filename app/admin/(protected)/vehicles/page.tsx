import { Bus, Car } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

export default async function PlatformVehiclesPage({ searchParams }: { searchParams: Promise<{ q?: string; organizationId?: string; state?: string } & PaginationParams> }) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const { q, organizationId, state } = params;
  const pagination = parsePagination(params);
  const where = {
      ...(organizationId ? { organizationId } : {}),
      ...(state === "ACTIVE" ? { isActive: true } : state === "INACTIVE" ? { isActive: false } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { type: { contains: q, mode: "insensitive" as const } }, { licensePlate: { contains: q, mode: "insensitive" as const } }, { organization: { name: { contains: q, mode: "insensitive" as const } } }] } : {}),
  } as const;
  const [organizations, totalItems, vehicles] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
    include: { organization: { select: { name: true } }, _count: { select: { departureVehicles: true } } },
    }),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform-wide data" title="All vehicles" subtitle="Every agency vehicle and its assignment count." />
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect paramName="organizationId" ariaLabel="Filter by agency" options={[{ value: "ALL", label: "All agencies" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
        <FilterSelect paramName="state" ariaLabel="Filter by state" options={[{ value: "ALL", label: "All vehicles" }, { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }]} />
        <SearchInput placeholder="Search vehicle or agency…" />
      </div>
      {vehicles.length === 0 ? <EmptyState title="No vehicles match these filters" message="Try another agency, state, or search term." /> : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className={`flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${vehicle.isActive ? "" : "opacity-55"}`}>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-terracotta/10">{vehicle.type === "Bus" ? <Bus className="h-5 w-5 text-terracotta-700" /> : <Car className="h-5 w-5 text-terracotta-700" />}</span><div><p className="font-medium text-espresso">{vehicle.name}</p><p className="text-sm text-espresso-muted">{vehicle.organization.name} · {[vehicle.type, `${vehicle.capacity} seats`, vehicle.licensePlate].filter(Boolean).join(" · ")}</p></div></div>
              <span className="text-sm text-espresso-muted">{vehicle._count.departureVehicles} assignments · {vehicle.isActive ? "Active" : "Inactive"}</span>
            </div>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
