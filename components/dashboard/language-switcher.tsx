"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const OPTIONS: { locale: Locale; flag: string; labelKey: keyof Dictionary["languageSwitcher"] }[] = [
  { locale: "en", flag: "gb", labelKey: "english" },
  { locale: "ru", flag: "ru", labelKey: "russian" },
];

function Flag({ code }: { code: string }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
      <span className={`fi fi-${code} !h-full !w-full !bg-cover`} aria-hidden="true" />
    </span>
  );
}

export function LanguageSwitcher({ locale, dict }: { locale: Locale; dict: Dictionary["languageSwitcher"] }) {
  const current = OPTIONS.find((option) => option.locale === locale) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-card py-1.5 pr-2.5 pl-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-colors hover:bg-cream-100"
          aria-label={dict[current.labelKey]}
        >
          <Flag code={current.flag} />
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-espresso-muted" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((option) => {
          const active = option.locale === locale;
          return (
            <DropdownMenuItem key={option.locale} asChild>
              <form action={setLocale.bind(null, option.locale)} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2">
                  <Check className={active ? "opacity-100" : "opacity-0"} />
                  <Flag code={option.flag} />
                  {dict[option.labelKey]}
                </button>
              </form>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
