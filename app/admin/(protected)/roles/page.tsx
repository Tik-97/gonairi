import { ROLES, PERMISSION_GROUPS, OWNER_ONLY_PERMISSIONS, OWNER_PERMISSION_FLOOR, getAllRolePermissions } from "@/lib/auth/permissions";
import { updateRolePermissions } from "@/lib/actions/platform-admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ChevronDown } from "lucide-react";

const GROUP_KEY_BY_LABEL: Record<string, keyof import("@/lib/i18n/dictionaries/en").Dictionary["rolesPage"]["groups"]> = {
  Tours: "tours",
  Departures: "departures",
  Bookings: "bookings",
  Customers: "customers",
  Fleet: "fleet",
  Team: "team",
  Finances: "finances",
  Schedule: "schedule",
  "Agency settings": "agencySettings",
};

export default async function PlatformAdminRolesPage() {
  const [grants, { dict }] = await Promise.all([getAllRolePermissions(), getDictionary()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={dict.rolesPage.eyebrow}
        title={dict.rolesPage.title}
        subtitle={dict.rolesPage.subtitle}
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
                  <h2 className="font-serif text-xl font-semibold text-espresso">{dict.roles[role]}</h2>
                  <p className="mt-1 text-sm text-espresso-muted">
                    {roleGrants.size} {dict.rolesPage.permissionsEnabled}
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
                        {dict.rolesPage.groups[GROUP_KEY_BY_LABEL[group.label]] ?? group.label}
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
                              {dict.rolesPage.permissions[perm.key] ?? perm.label}
                              {isFloor && <span className="text-xs text-espresso-muted">{dict.rolesPage.alwaysOnForOwner}</span>}
                              {isOwnerOnly && <span className="text-xs text-espresso-muted">{dict.rolesPage.ownerOnly}</span>}
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
                  {dict.rolesPage.saveButtonPrefix} {dict.roles[role]} {dict.rolesPage.saveButtonSuffix}
                </button>
              </form>
            </details>
          );
        })}
      </div>
    </div>
  );
}
