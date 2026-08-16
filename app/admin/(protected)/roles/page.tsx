import { ROLES, PERMISSION_GROUPS, OWNER_ONLY_PERMISSIONS, OWNER_PERMISSION_FLOOR, getAllRolePermissions } from "@/lib/auth/permissions";
import { updateRolePermissions } from "@/lib/actions/platform-admin";
import { PageHeader } from "@/components/dashboard/page-header";
import type { UserRole } from "@/generated/prisma/enums";
import { ChevronDown } from "lucide-react";

const ROLE_LABEL: Record<UserRole, string> = {
  OWNER: "Owner",
  OPERATOR: "Operator",
  DRIVER: "Driver",
  GUIDE: "Guide",
  DRIVER_GUIDE: "Driver-Guide",
};

export default async function PlatformAdminRolesPage() {
  const grants = await getAllRolePermissions();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Access control"
        title="Roles & permissions"
        subtitle="Changes here apply platform-wide, to every agency's staff, immediately."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {ROLES.map((role) => {
          const roleGrants = new Set(grants[role]);
          return (
            <details
              key={role}
              open={role === "OWNER"}
              className="group self-start overflow-hidden rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 marker:hidden">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-espresso">{ROLE_LABEL[role] ?? role}</h2>
                  <p className="mt-1 text-sm text-espresso-muted">
                    {roleGrants.size} permissions enabled
                  </p>
                </div>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-espresso-muted transition-transform group-open:rotate-180"
                  strokeWidth={1.75}
                />
              </summary>

              <form
                action={updateRolePermissions.bind(null, role)}
                className="flex flex-col gap-5 border-t border-border px-6 py-5"
              >
                <div className="flex flex-col gap-4">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="mb-1.5 text-xs font-medium tracking-[0.1em] text-espresso-muted uppercase">
                        {group.label}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {group.permissions.map((perm) => {
                          const isFloor = role === "OWNER" && (OWNER_PERMISSION_FLOOR as string[]).includes(perm.key);
                          const isOwnerOnly = role !== "OWNER" && OWNER_ONLY_PERMISSIONS.has(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className="flex items-center gap-2.5 text-sm text-espresso"
                            >
                              <input
                                type="checkbox"
                                name="permission"
                                value={perm.key}
                                defaultChecked={roleGrants.has(perm.key)}
                                disabled={isFloor || isOwnerOnly}
                                className="h-4 w-4 rounded border-border accent-terracotta"
                              />
                              {perm.label}
                              {isFloor && <span className="text-xs text-espresso-muted">(always on for Owner)</span>}
                              {isOwnerOnly && <span className="text-xs text-espresso-muted">(Owner only)</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="self-start rounded-[10px] bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
                >
                  Save {ROLE_LABEL[role]} permissions
                </button>
              </form>
            </details>
          );
        })}
      </div>
    </div>
  );
}
