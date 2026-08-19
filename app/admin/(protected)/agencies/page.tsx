import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { openOrganizationCrm } from "@/lib/actions/platform-admin";
import { PLATFORM_AGENCY_COOKIE } from "@/lib/auth/session";
import { AgencyForm } from "@/components/admin/agency-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

export default async function PlatformAdminAgenciesPage({ searchParams }: { searchParams: Promise<PaginationParams> }) {
  const pagination = parsePagination(await searchParams);
  const connectedOrganizationId = (await cookies()).get(PLATFORM_AGENCY_COOKIE)?.value;
  const [organizations, ownerUsers, totalItems] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { users: true, tours: true, bookings: true } },
      },
    }),
    prisma.user.findMany({
      where: { roles: { has: "OWNER" }, status: "ACTIVE" },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { ownedOrganizations: true } },
      },
    }),
    prisma.organization.count(),
  ]);
  const ownerOptions = ownerUsers.map((owner) => ({
    id: owner.id,
    name: owner.name,
    email: owner.email,
    agencyCount: owner._count.ownedOrganizations,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Platform administration"
        title="Travel agencies"
        subtitle="Create agencies, provision their owner, or enter an agency CRM as Super Admin."
      />

      <AgencyForm owners={ownerOptions} />

      <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {organizations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-espresso-muted">No agencies created yet.</p>
        ) : organizations.map((organization) => {
          const owner = organization.owner;
          return (
            <div key={organization.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-espresso">{organization.name}</p>
                <p className="text-sm text-espresso-muted">
                  {owner ? `${owner.name} · ${owner.email}` : "No owner"} · {organization._count.users} users · {organization._count.tours} tours · {organization._count.bookings} bookings
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {connectedOrganizationId === organization.id && (
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Connected</span>
                )}
                <form action={openOrganizationCrm.bind(null, organization.id, "staff")}>
                  <button type="submit" className="rounded-[10px] border border-terracotta/30 px-4 py-2 text-sm font-medium text-terracotta-700">
                    Manage users
                  </button>
                </form>
                <form action={openOrganizationCrm.bind(null, organization.id, "dashboard")}>
                  <button type="submit" className="rounded-[10px] bg-terracotta px-4 py-2 text-sm font-medium text-white">
                    Open CRM
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
