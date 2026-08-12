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
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/auth/permission-keys";
import type { UserRole } from "@/generated/prisma/enums";

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

export function SidebarNav({
  role,
  permissions,
}: {
  role: UserRole;
  permissions: Permission[];
}) {
  const pathname = usePathname();
  const items =
    role === "DRIVER" || role === "GUIDE"
      ? [SCHEDULE_ITEM]
      : NAV_ITEMS.filter(
          (item) => !item.permission || permissions.includes(item.permission),
        );

  return (
    <nav className="flex flex-1 flex-col gap-1.5 text-sm">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "flex h-12 items-center gap-3 rounded-[12px] bg-gradient-to-r from-terracotta/25 to-terracotta/10 px-4 font-medium text-terracotta transition-colors"
                : "flex h-12 items-center gap-3 rounded-[12px] px-4 text-navy-muted transition-colors hover:bg-white/8 hover:text-white"
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
    </nav>
  );
}
