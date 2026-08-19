import { prisma } from "@/lib/db";
import { updatePlatformUserRoles } from "@/lib/actions/platform-users";
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import { PlatformUserForm } from "@/components/admin/platform-user-form";
import { PageHeader } from "@/components/dashboard/page-header";
import type { UserRole } from "@/generated/prisma/enums";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [UserRole, string][];

const ERROR_MESSAGES: Record<string, string> = {
  roles: "Every user must have at least one role.",
  "assigned-owner": "This user owns one or more agencies. Reassign those agencies before removing the Owner role.",
};

export default async function PlatformAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string } & PaginationParams>;
}) {
  const params = await searchParams;
  const { error } = params;
  const pagination = parsePagination(params);
  const [organizations, users, totalItems] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
      include: {
        organization: { select: { name: true } },
        ownedOrganizations: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Platform administration"
        title="All users"
        subtitle="Create standard agency users and assign one or more roles, including Owner."
      />

      <PlatformUserForm organizations={organizations} />

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {users.length === 0 ? (
          <p className="px-5 py-6 text-sm text-espresso-muted">No agency users yet.</p>
        ) : users.map((user) => (
          <div key={user.id} className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-medium text-espresso">{user.name}</p>
              <p className="text-sm text-espresso-muted">
                {user.email} · Primary agency: {user.organization?.name ?? "Unassigned"} · {user.status}
              </p>
              {user.ownedOrganizations.length > 0 && (
                <p className="mt-1 text-xs text-terracotta-700">
                  Owns: {user.ownedOrganizations.map((organization) => organization.name).join(", ")}
                </p>
              )}
            </div>
            <form action={updatePlatformUserRoles.bind(null, user.id)} className="flex flex-wrap items-center gap-2">
              {ROLE_OPTIONS.map(([role, label]) => (
                <label key={role} className="flex items-center gap-1.5 rounded-full border border-terracotta/20 px-2.5 py-1.5 text-xs has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5">
                  <input type="checkbox" name="roles" value={role} defaultChecked={user.roles.includes(role)} className="h-3.5 w-3.5" />
                  {label}
                </label>
              ))}
              <button type="submit" className="rounded-[9px] bg-terracotta px-3 py-1.5 text-xs font-medium text-white">Save roles</button>
            </form>
          </div>
        ))}
      </div>
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
