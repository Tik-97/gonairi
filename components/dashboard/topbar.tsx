"use client";

import Link from "next/link";
import { Bell, Check, ChevronDown, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoIcon } from "@/components/logo-icon";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { logout, selectActiveRole, switchOwnedOrganization } from "@/lib/actions/auth";
import { logoutPlatformAdmin, switchOrganizationCrm } from "@/lib/actions/platform-admin";
import type { UserRole } from "@/generated/prisma/enums";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function Topbar({
  userName,
  userRole,
  pendingBookingsCount,
  showBookingsBell,
  showSettingsLink,
  isPlatformAdmin = false,
  availableRoles = [],
  agencies = [],
  activeAgencyId,
  locale,
  dict,
}: {
  userName: string;
  userRole: string;
  pendingBookingsCount: number;
  showBookingsBell: boolean;
  showSettingsLink: boolean;
  isPlatformAdmin?: boolean;
  availableRoles?: UserRole[];
  agencies?: { id: string; name: string }[];
  activeAgencyId?: string;
  locale: Locale;
  dict: Pick<Dictionary, "topbar" | "languageSwitcher" | "roles" | "mobileNav">;
}) {
  const userRoleLabel = isPlatformAdmin ? dict.mobileNav.superAdmin : dict.roles[userRole as UserRole];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-end gap-3 lg:mb-8 lg:flex-nowrap lg:gap-4">
      <LanguageSwitcher locale={locale} dict={dict.languageSwitcher} />
      {agencies.length > 0 && (isPlatformAdmin || agencies.length > 1) && (
        <form action={isPlatformAdmin ? switchOrganizationCrm : switchOwnedOrganization} className="flex items-center gap-2 rounded-[12px] border border-terracotta/25 bg-card px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <label htmlFor="platform-agency" className="hidden text-xs font-medium text-espresso-muted sm:block">
            {isPlatformAdmin ? dict.topbar.crmAgency : dict.topbar.myAgency}
          </label>
          <select
            id="platform-agency"
            name="organizationId"
            required={!isPlatformAdmin}
            value={activeAgencyId ?? ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="max-w-28 truncate bg-transparent text-sm font-medium text-espresso outline-none sm:max-w-44"
          >
            <option value="" disabled={!isPlatformAdmin}>{isPlatformAdmin ? dict.topbar.allAgencies : dict.topbar.selectAgency}</option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>{agency.name}</option>
            ))}
          </select>
        </form>
      )}
      {showBookingsBell && (
        <Link
          href="/dashboard/bookings"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-colors hover:bg-cream-100 lg:h-11 lg:w-11"
          aria-label={`${pendingBookingsCount} ${dict.topbar.pendingBookings}`}
        >
          <Bell className="h-[18px] w-[18px] text-terracotta-700" strokeWidth={1.75} />
          {pendingBookingsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {pendingBookingsCount > 9 ? "9+" : pendingBookingsCount}
            </span>
          )}
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-2.5 pl-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-colors hover:bg-cream-100 lg:gap-3 lg:py-2 lg:pr-4 lg:pl-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/12">
              <LogoIcon className="h-6 w-6" />
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-espresso">{userName}</span>
              <span className="block text-xs text-espresso-muted">{userRoleLabel}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-espresso-muted" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isPlatformAdmin && availableRoles.length > 1 && (
            <>
              <DropdownMenuLabel>{dict.topbar.switchRole}</DropdownMenuLabel>
              {availableRoles.map((role) => (
                <DropdownMenuItem key={role} asChild>
                  <form action={selectActiveRole.bind(null, role)} className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <Check className={role === userRole ? "opacity-100" : "opacity-0"} />
                      {dict.roles[role]}
                    </button>
                  </form>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          {showSettingsLink && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings/organization" className="cursor-pointer">
                  <Settings className="h-4 w-4" strokeWidth={1.75} />
                  {dict.topbar.settings}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild variant="destructive">
            <form action={isPlatformAdmin ? logoutPlatformAdmin : logout} className="w-full">
              <button type="submit" className="flex w-full cursor-pointer items-center gap-2">
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                {dict.topbar.logOut}
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
