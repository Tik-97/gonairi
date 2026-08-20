import { prisma } from "@/lib/db";
import { updatePlatformUserRoles } from "@/lib/actions/platform-users";
import { PlatformUserForm } from "@/components/admin/platform-user-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { UserRole } from "@/generated/prisma/enums";

export default async function PlatformAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const ROLE_OPTIONS = Object.entries(dict.roles) as [UserRole, string][];
  const ERROR_MESSAGES: Record<string, string> = {
    roles: dict.usersPage.errorRoles,
    "assigned-owner": dict.usersPage.errorAssignedOwner,
  };
  const [organizations, users] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
      include: {
        organization: { select: { name: true } },
        ownedOrganizations: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={dict.usersPage.eyebrow}
        title={dict.usersPage.title}
        subtitle={dict.usersPage.subtitle}
      />

      <PlatformUserForm organizations={organizations} dict={{ ...dict.platformUserForm, roles: dict.roles }} />

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {users.length === 0 ? (
          <p className="px-5 py-6 text-sm text-espresso-muted">{dict.usersPage.noUsers}</p>
        ) : users.map((user) => (
          <div key={user.id} className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-medium text-espresso">{user.name}</p>
              <p className="text-sm text-espresso-muted">
                {user.email} · {dict.usersPage.primaryAgency}: {user.organization?.name ?? dict.usersPage.unassigned} · {dict.userStatus[user.status]}
              </p>
              {user.ownedOrganizations.length > 0 && (
                <p className="mt-1 text-xs text-terracotta-700">
                  {dict.usersPage.owns}: {user.ownedOrganizations.map((organization) => organization.name).join(", ")}
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
              <button type="submit" className="rounded-[9px] bg-terracotta px-3 py-1.5 text-xs font-medium text-white">{dict.usersPage.saveRoles}</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
