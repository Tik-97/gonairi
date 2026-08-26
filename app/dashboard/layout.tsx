import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import { requireSession } from "@/lib/auth/session";
import { ALL_PERMISSIONS, PERMISSIONS, roleHasPermission, getRolePermissions, isBackOfficeRole } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { prisma } from "@/lib/db";
import { LogoIcon } from "@/components/logo-icon";
import { Wordmark } from "@/components/wordmark";
import { InterlacePattern } from "@/components/ornaments/interlace-pattern";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarPromoCard } from "@/components/dashboard/sidebar-promo-card";
import { AmbientDecoration } from "@/components/dashboard/ambient-decoration";
import { HeroBackground } from "@/components/dashboard/hero-background";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Dynamic-rendering opt-in for this whole subtree lives in requireSession()
// (lib/auth/session.ts) via connection() — not here — so it can never be
// forgotten on a page that calls it. See that file's doc comment for why.

// Scoped to the dashboard subtree only — the (public) marketplace keeps its
// own Cormorant/Manrope pairing. Redefining the same CSS custom properties
// here overrides them for everything under this layout, nothing else.
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, { locale, dict }] = await Promise.all([requireSession(), getDictionary()]);
  const [permissions, canViewBookings, canManageOrgSettings] = session.platformAdmin
    ? [ALL_PERMISSIONS, true, true] as const
    : await Promise.all([
        getRolePermissions(session.user.role),
        roleHasPermission(session.user.role, PERMISSIONS.bookingsView),
        Promise.resolve(session.user.role === "OWNER"),
      ]);
  const db = scopedPrisma(session.user.organizationId);
  const [pendingBookingsCount, availableAgencies] = await Promise.all([
    canViewBookings ? db.booking.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    session.platformAdmin
      ? prisma.organization.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : session.user.role === "OWNER"
        ? prisma.organization.findMany({
            where: { ownerId: session.user.id },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
  ]);
  const activeOrganization = availableAgencies.find(
    (organization) => organization.id === session.user.organizationId,
  );
  const scheduleOnly = !isBackOfficeRole(session.user.role);

  return (
    <div className={`${playfair.variable} ${inter.variable} flex flex-1 bg-cream font-sans text-espresso`}>
      <MobileNav
        scheduleOnly={scheduleOnly}
        permissions={permissions}
        isPlatformAdmin={Boolean(session.platformAdmin)}
        dict={dict}
      />

      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden bg-navy px-7 py-9 lg:flex">
        <InterlacePattern
          id="interlace-sidebar"
          className="pointer-events-none absolute inset-0 h-full w-full text-terracotta opacity-[0.06]"
        />
        <Link href="/dashboard" className="relative mb-12 flex items-center gap-3">
          <LogoIcon className="h-14 w-14" />
          <div className="flex flex-col">
            <Wordmark className="font-serif text-xl leading-tight font-bold" />
            <span className="text-[10px] font-medium tracking-[0.16em] text-navy-muted uppercase">
              {session.platformAdmin ? "Super Admin" : "Travel Agency"}
            </span>
          </div>
        </Link>
        <div className="relative flex flex-1 flex-col">
          <SidebarNav
            scheduleOnly={scheduleOnly}
            permissions={permissions}
            isPlatformAdmin={Boolean(session.platformAdmin)}
            dict={dict.nav}
          />
        </div>
        <SidebarPromoCard />
      </aside>

      <div className="relative min-w-0 flex-1 overflow-x-hidden px-4 pt-20 pb-8 sm:px-6 lg:px-12 lg:py-10">
        <AmbientDecoration />
        <HeroBackground />
        <div className="relative z-10">
          {session.platformAdmin && (
            <div className="mb-4 flex items-center justify-between rounded-[12px] border border-terracotta/25 bg-terracotta/10 px-4 py-2 text-sm">
              <span>
                Managing <strong>{activeOrganization?.name ?? "this agency"}</strong> as Super Admin.
              </span>
              <Link href="/admin/agencies" className="font-medium text-terracotta-700 underline">
                Back to agencies
              </Link>
            </div>
          )}
          <Topbar
            userName={session.user.name ?? "there"}
            userRole={session.user.role}
            pendingBookingsCount={pendingBookingsCount}
            showBookingsBell={canViewBookings}
            showSettingsLink={canManageOrgSettings}
            isPlatformAdmin={Boolean(session.platformAdmin)}
            availableRoles={session.user.availableRoles}
            agencies={availableAgencies}
            activeAgencyId={session.user.organizationId}
            locale={locale}
            dict={dict}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
