"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";
import { Wordmark } from "@/components/wordmark";
import { InterlacePattern } from "@/components/ornaments/interlace-pattern";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarPromoCard } from "@/components/dashboard/sidebar-promo-card";
import type { Permission } from "@/lib/auth/permission-keys";

/**
 * Mobile-only navigation: a fixed top bar with a hamburger trigger, plus an
 * off-canvas drawer duplicating the desktop sidebar's content. Everything
 * here is `lg:hidden` — the desktop <aside> in the layout handles large
 * screens and is untouched by this component.
 */
export function MobileNav({ scheduleOnly, permissions }: { scheduleOnly: boolean; permissions: Permission[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border bg-cream px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoIcon className="h-10 w-10" />
          <Wordmark className="font-serif text-lg font-bold" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-espresso transition-colors hover:bg-cream-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-espresso/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden bg-navy px-6 py-7 transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <InterlacePattern
          id="interlace-mobile-sidebar"
          className="pointer-events-none absolute inset-0 h-full w-full text-terracotta opacity-[0.06]"
        />
        <div className="relative mb-10 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoIcon className="h-10 w-10" />
            <div className="flex flex-col">
              <Wordmark className="font-serif text-lg leading-tight font-bold" />
              <span className="text-[10px] font-medium tracking-[0.16em] text-navy-muted uppercase">Travel Agency</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy-muted transition-colors hover:bg-white/8 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex flex-1 flex-col">
          <SidebarNav scheduleOnly={scheduleOnly} permissions={permissions} />
        </div>
        <SidebarPromoCard />
      </aside>
    </>
  );
}
