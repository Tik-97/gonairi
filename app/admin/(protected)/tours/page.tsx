import { Map as MapIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

export default async function PlatformToursPage({ searchParams }: { searchParams: Promise<{ q?: string; organizationId?: string; state?: string } & PaginationParams> }) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const { q, organizationId, state } = params;
  const pagination = parsePagination(params);
  const where = {
      ...(organizationId ? { organizationId } : {}),
      deletedAt: state === "DELETED" ? { not: null } : state === "ALL" ? undefined : null,
      ...(state === "PUBLISHED" ? { isPublished: true } : state === "DRAFT" ? { isPublished: false } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }, { organization: { name: { contains: q, mode: "insensitive" as const } } }] } : {}),
  } as const;
  const [organizations, totalItems, tours] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tour.count({ where }),
    prisma.tour.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    include: {
      organization: { select: { name: true } },
      departures: { where: { status: { not: "CANCELLED" }, date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 1 },
      _count: { select: { departures: true } },
    },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform-wide data" title="All tours" subtitle="Every agency tour in one read-only catalogue." />
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect paramName="organizationId" ariaLabel="Filter by agency" options={[{ value: "ALL", label: "All agencies" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
        <FilterSelect paramName="state" ariaLabel="Filter by state" options={[{ value: "ALL", label: "All active tours" }, { value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "DELETED", label: "Deleted" }]} />
        <SearchInput placeholder="Search tours or agencies…" />
      </div>
      {tours.length === 0 ? <EmptyState title="No tours match these filters" message="Try another agency, state, or search term." /> : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {tours.map((tour) => (
            <div key={tour.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10"><MapIcon className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} /></span>
                <div>
                  <p className="font-medium text-espresso">{tour.title}</p>
                  <p className="text-sm text-espresso-muted">{tour.organization.name} · {formatMoney(tour.basePrice.toString(), tour.currency)} · {tour.durationDays}d · {tour._count.departures} departures</p>
                  <p className="text-sm text-terracotta-700">{tour.departures[0] ? `Next: ${formatDate(tour.departures[0].date)}` : "No upcoming departure"}</p>
                </div>
              </div>
              <span className={tour.deletedAt ? "text-sm text-danger" : tour.isPublished ? "text-sm text-success" : "text-sm text-espresso-muted"}>{tour.deletedAt ? "Deleted" : tour.isPublished ? "Published" : "Draft"}</span>
            </div>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
