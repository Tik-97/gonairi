import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

export default async function PlatformCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; organizationId?: string } & PaginationParams> }) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const { q, organizationId } = params;
  const pagination = parsePagination(params);
  const where = {
      ...(organizationId ? { organizationId } : {}),
      ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q, mode: "insensitive" as const } }, { organization: { name: { contains: q, mode: "insensitive" as const } } }] } : {}),
  } as const;
  const [organizations, totalItems, customers] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.customer.count({ where }),
    prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    include: { organization: { select: { name: true } }, _count: { select: { bookings: true } } },
    }),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform-wide data" title="All customers" subtitle="Every traveler record across all agencies." />
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect paramName="organizationId" ariaLabel="Filter by agency" options={[{ value: "ALL", label: "All agencies" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
        <SearchInput placeholder="Search customer or agency…" />
      </div>
      {customers.length === 0 ? <EmptyState title="No customers match these filters" message="Try another agency or search term." /> : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {customers.map((customer) => (
            <div key={customer.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div><p className="font-medium text-espresso">{customer.fullName}</p><p className="text-sm text-espresso-muted">{customer.organization.name} · {[customer.email, customer.phone].filter(Boolean).join(" · ") || "No contact info"}</p></div>
              <span className="text-sm text-espresso-muted">{customer._count.bookings} bookings · {customer.source}</span>
            </div>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
