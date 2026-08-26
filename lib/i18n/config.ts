export type Locale = "en" | "ru";

export const LOCALES: Locale[] = ["en", "ru"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "gonairi-locale";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}
