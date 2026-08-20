import { getCountries } from "libphonenumber-js";
import type { Locale } from "@/lib/i18n/config";

// The stored `nationality` value is always the English country name — stable
// regardless of UI locale, so existing records keep matching an option after
// a language switch. Only the displayed label is translated (Intl.DisplayNames
// has built-in ICU translations for every country, no manual dictionary needed).
const enRegionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Country {value, label} pairs, Armenia pinned first — mirrors the ordering
 *  PhoneInput uses for its country picker so lists stay consistent across the app. */
export function countryOptions(locale: Locale): { value: string; label: string }[] {
  const displayNames = new Intl.DisplayNames([locale === "ru" ? "ru" : "en"], { type: "region" });
  const options = getCountries()
    .map((code) => ({ value: enRegionNames.of(code) ?? code, label: displayNames.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label, locale === "ru" ? "ru" : "en"));
  const armenia = options.find((o) => o.value === "Armenia");
  const rest = options.filter((o) => o.value !== "Armenia");
  return armenia ? [armenia, ...rest] : options;
}
