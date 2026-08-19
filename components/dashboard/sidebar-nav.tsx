"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Users,
  Bus,
  IdCard,
  Wallet,
  Settings,
  CalendarClock,
  Building2,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/auth/permission-keys";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/tours",
    label: "Tours",
    icon: Map,
    permission: PERMISSIONS.toursView,
  },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: CalendarCheck,
    permission: PERMISSIONS.bookingsView,
  },
  {
    href: "/dashboard/customers",
    label: "Customers",
    icon: Users,
    permission: PERMISSIONS.customersView,
  },
  {
    href: "/dashboard/vehicles",
    label: "Vehicles",
    icon: Bus,
    permission: PERMISSIONS.vehiclesView,
  },
  {
    href: "/dashboard/staff",
    label: "Staff",
    icon: IdCard,
    permission: PERMISSIONS.staffView,
  },
  {
    href: "/dashboard/finances",
    label: "Finances",
    icon: Wallet,
    permission: PERMISSIONS.financesView,
  },
  {
    href: "/dashboard/settings/organization",
    label: "Settings",
    icon: Settings,
    permission: PERMISSIONS.orgSettingsManage,
  },
];

const SCHEDULE_ITEM = {
  href: "/dashboard/schedule",
  label: "My schedule",
  icon: CalendarClock,
};

const PLATFORM_ITEMS = [
  { href: "/admin/overview", label: "Platform overview", icon: LayoutDashboard },
  { href: "/admin/agencies", label: "Agencies", icon: Building2 },
  { href: "/admin/users", label: "All users", icon: UserCog },
  { href: "/admin/roles", label: "Role permissions", icon: ShieldCheck },
];

const PLATFORM_DATA_ITEMS = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/tours", label: "All tours", icon: Map },
  { href: "/admin/bookings", label: "All bookings", icon: CalendarCheck },
  { href: "/admin/customers", label: "All customers", icon: Users },
  { href: "/admin/vehicles", label: "All vehicles", icon: Bus },
  { href: "/admin/finances", label: "All finances", icon: Wallet },
];

export function SidebarNav({
  scheduleOnly,
  permissions,
  isPlatformAdmin = false,
  platformOnly = false,
}: {
  /** True for roles that only see "My schedule" (drivers, guides, driver-guides)
   *  — computed server-side via `!isBackOfficeRole(role)` so this component
   *  doesn't need its own copy of that role list (it's a client component and
   *  can't import the server-only lib/auth/permissions.ts directly). */
  scheduleOnly: boolean;
  permissions: Permission[];
  isPlatformAdmin?: boolean;
  platformOnly?: boolean;
}) {
  const pathname = usePathname();
  // Platform admins are not governed by an agency role's permission matrix.
  // The platform layout gets read-only global destinations; after selecting an
  // agency, the dashboard layout gets the normal CRM destinations for that scope.
  const agencyItems = isPlatformAdmin
    ? NAV_ITEMS
    : scheduleOnly
      ? [SCHEDULE_ITEM]
      : NAV_ITEMS.filter(
          (item) => !item.permission || permissions.includes(item.permission),
        );
  const sections = isPlatformAdmin
    ? platformOnly
      ? [
          { label: "Platform data", items: PLATFORM_DATA_ITEMS },
          { label: "Administration", items: PLATFORM_ITEMS.filter((item) => item.href !== "/admin/overview") },
        ]
      : [
          { label: "Agency CRM", items: agencyItems },
          { label: "Platform", items: PLATFORM_ITEMS },
        ]
    : [{ label: null, items: agencyItems }];

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1 text-sm">
      {sections.map((section, sectionIndex) => (
        <div key={section.label ?? sectionIndex} className="flex flex-col gap-1.5">
          {section.label && (
            <p className="px-4 pb-1 text-[10px] font-semibold tracking-[0.16em] text-navy-muted/70 uppercase">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const isActive =
              item.href === "/dashboard" || item.href === "/admin/overview"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "flex h-12 shrink-0 items-center gap-3 rounded-[12px] bg-gradient-to-r from-terracotta/25 to-terracotta/10 px-4 font-medium text-terracotta transition-colors"
                    : "flex h-12 shrink-0 items-center gap-3 rounded-[12px] px-4 text-navy-muted transition-colors hover:bg-white/8 hover:text-white"
                }
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  strokeWidth={1.75}
                  style={{
                    color: isActive ? "var(--color-terracotta)" : undefined,
                  }}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
