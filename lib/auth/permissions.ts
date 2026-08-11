import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";
import { PERMISSIONS, ALL_PERMISSIONS, type Permission } from "@/lib/auth/permission-keys";

export { PERMISSIONS, ALL_PERMISSIONS, type Permission };

export const ROLES: UserRole[] = ["OWNER", "ADMIN", "OPERATOR", "DRIVER", "GUIDE"];

/** Grouped for the Super Admin permission-matrix UI. */
export const PERMISSION_GROUPS: { label: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    label: "Tours",
    permissions: [
      { key: PERMISSIONS.toursView, label: "View tours" },
      { key: PERMISSIONS.toursManage, label: "Create & edit tours" },
      { key: PERMISSIONS.toursDelete, label: "Delete tours" },
    ],
  },
  {
    label: "Departures",
    permissions: [{ key: PERMISSIONS.departuresManage, label: "Create, cancel & assign departures" }],
  },
  {
    label: "Bookings",
    permissions: [
      { key: PERMISSIONS.bookingsView, label: "View bookings" },
      { key: PERMISSIONS.bookingsManage, label: "Create & update bookings" },
    ],
  },
  {
    label: "Customers",
    permissions: [
      { key: PERMISSIONS.customersView, label: "View customers" },
      { key: PERMISSIONS.customersManage, label: "Create & edit customers" },
      { key: PERMISSIONS.customersDelete, label: "Delete customers" },
    ],
  },
  {
    label: "Fleet",
    permissions: [
      { key: PERMISSIONS.vehiclesView, label: "View vehicles" },
      { key: PERMISSIONS.vehiclesManage, label: "Create & edit vehicles" },
    ],
  },
  {
    label: "Team",
    permissions: [
      { key: PERMISSIONS.staffView, label: "View staff" },
      { key: PERMISSIONS.staffManage, label: "Create & edit staff" },
      { key: PERMISSIONS.attendanceManage, label: "Manage attendance" },
    ],
  },
  {
    label: "Schedule",
    permissions: [{ key: PERMISSIONS.scheduleViewOwn, label: "View own schedule" }],
  },
  {
    label: "Agency settings",
    permissions: [{ key: PERMISSIONS.orgSettingsManage, label: "Manage agency settings" }],
  },
];

/**
 * OWNER must always retain these — otherwise a mistake in the Super Admin
 * dashboard could lock every account in an agency out of fixing its own
 * settings/staff. Enforced in lib/actions/platform-admin.ts on save.
 */
export const OWNER_PERMISSION_FLOOR: Permission[] = [PERMISSIONS.orgSettingsManage, PERMISSIONS.staffManage];

function emptyRoleMap(): Record<UserRole, Set<Permission>> {
  return { OWNER: new Set(), ADMIN: new Set(), OPERATOR: new Set(), DRIVER: new Set(), GUIDE: new Set() };
}

// Memoized per server-render/request (React's cache()) so N calls to
// roleHasPermission()/getRolePermissions() in the same request cost one query.
const loadRolePermissionMap = cache(async (): Promise<Record<UserRole, Set<Permission>>> => {
  const rows = await prisma.rolePermission.findMany();
  const map = emptyRoleMap();
  const validPermissions = new Set<string>(ALL_PERMISSIONS);
  for (const row of rows) {
    if (validPermissions.has(row.permission)) {
      map[row.role].add(row.permission as Permission);
    }
  }
  return map;
});

export async function roleHasPermission(role: UserRole, permission: Permission): Promise<boolean> {
  const map = await loadRolePermissionMap();
  return map[role]?.has(permission) ?? false;
}

export async function getRolePermissions(role: UserRole): Promise<Permission[]> {
  const map = await loadRolePermissionMap();
  return Array.from(map[role] ?? []);
}

/** For the Super Admin roles page — every role's grants in one query. */
export async function getAllRolePermissions(): Promise<Record<UserRole, Permission[]>> {
  const map = await loadRolePermissionMap();
  return {
    OWNER: Array.from(map.OWNER),
    ADMIN: Array.from(map.ADMIN),
    OPERATOR: Array.from(map.OPERATOR),
    DRIVER: Array.from(map.DRIVER),
    GUIDE: Array.from(map.GUIDE),
  };
}

/** Roles that can see the full back office (as opposed to just "my schedule"). */
export function isBackOfficeRole(role: UserRole): boolean {
  return role !== "DRIVER" && role !== "GUIDE";
}
