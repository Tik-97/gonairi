import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { PLATFORM_AGENCY_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { LogoIcon } from "@/components/logo-icon";
import { Wordmark } from "@/components/wordmark";
import { InterlacePattern } from "@/components/ornaments/interlace-pattern";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { AmbientDecoration } from "@/components/dashboard/ambient-decoration";
import { HeroBackground } from "@/components/dashboard/hero-background";
import { Topbar } from "@/components/dashboard/topbar";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformAdmin();
  const [agencies, cookieStore, { locale, dict }] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    cookies(),
    getDictionary(),
  ]);
  const activeAgencyId = cookieStore.get(PLATFORM_AGENCY_COOKIE)?.value;

  return (
    <div className={`${playfair.variable} ${inter.variable} flex flex-1 bg-cream font-sans text-espresso`}>
      <MobileNav
        scheduleOnly={false}
        permissions={[]}
        isPlatformAdmin
        platformOnly
        dict={dict}
      />

      <aside className="relative hidden w-72 shrink-0 flex-col overflow-hidden bg-navy px-7 py-9 lg:flex">
        <InterlacePattern
          id="interlace-admin-sidebar"
          className="pointer-events-none absolute inset-0 h-full w-full text-terracotta opacity-[0.06]"
        />
        <Link href="/admin/agencies" className="relative mb-12 flex items-center gap-3">
          <LogoIcon className="h-14 w-14" />
          <div className="flex flex-col">
            <Wordmark className="font-serif text-xl leading-tight font-bold" />
            <span className="text-[10px] font-medium tracking-[0.16em] text-navy-muted uppercase">Super Admin</span>
          </div>
        </Link>
        <div className="relative flex flex-1 flex-col">
          <SidebarNav
            scheduleOnly={false}
            permissions={[]}
            isPlatformAdmin
            dict={dict.nav}
          />
        </div>
      </aside>

      <div className="relative min-w-0 flex-1 overflow-x-hidden px-4 pt-20 pb-8 sm:px-6 lg:px-12 lg:py-10">
        <AmbientDecoration />
        <HeroBackground />
        <div className="relative z-10">
          <Topbar
            userName={session.platformAdmin?.name ?? "Super Admin"}
            userRole="SUPER ADMIN"
            pendingBookingsCount={0}
            showBookingsBell={false}
            showSettingsLink={false}
            isPlatformAdmin
            agencies={agencies}
            activeAgencyId={activeAgencyId}
            locale={locale}
            dict={dict}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
