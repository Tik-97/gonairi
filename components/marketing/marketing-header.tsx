"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { TryDemoDialog } from "@/components/marketing/try-demo-dialog";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const CRM_LOGIN_URL = "https://crm.gonairi.com/login";

export function MarketingHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const t = dict.marketing.header;

  const navLinks = [
    { href: "/how-it-works", label: t.howItWorks },
    { href: "/#solutions", label: t.solutions },
    { href: "/#pricing", label: t.pricing },
    { href: "/contact-us", label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-terracotta/15 bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Wordmark className="font-serif text-xl font-semibold tracking-tight" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-espresso/70 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-espresso">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher locale={locale} dict={dict.languageSwitcher} />
          <a href={CRM_LOGIN_URL} className="text-sm font-medium text-espresso/70 transition-colors hover:text-espresso">
            {t.login}
          </a>
          <TryDemoDialog
            dict={dict.marketing.tryDemoDialog}
            trigger={
              <button className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700">
                {t.tryDemo}
              </button>
            }
          />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher locale={locale} dict={dict.languageSwitcher} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-espresso"
            aria-label={open ? t.closeMenu : t.openMenu}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-terracotta/15 px-6 py-5 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-espresso/80"
            >
              {link.label}
            </Link>
          ))}
          <a href={CRM_LOGIN_URL} className="text-sm font-medium text-espresso/80">
            {t.login}
          </a>
          <TryDemoDialog
            dict={dict.marketing.tryDemoDialog}
            trigger={
              <button className="w-full rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700">
                {t.tryDemo}
              </button>
            }
          />
        </div>
      )}
    </header>
  );
}
