import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";
import en, { type Dictionary } from "./dictionaries/en";
import ru from "./dictionaries/ru";

const dictionaries: Record<string, Dictionary> = { en, ru };

/** For client components that can't call the server-only getDictionary() —
 *  namely error.tsx/global-error.tsx boundaries, which Next.js always mounts
 *  as client components. The locale cookie isn't httpOnly specifically so
 *  this read is possible. */
export function getClientDictionary(): Dictionary {
  if (typeof document === "undefined") return en;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return dictionaries[isLocale(value) ? value : DEFAULT_LOCALE];
}
