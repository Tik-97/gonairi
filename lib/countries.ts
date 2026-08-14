import { getCountries } from "libphonenumber-js";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Country names, Armenia pinned first — mirrors the ordering PhoneInput
 *  uses for its country picker so lists stay consistent across the app. */
export const COUNTRY_NAMES: string[] = (() => {
  const names = getCountries()
    .map((code) => regionNames.of(code) ?? code)
    .sort((a, b) => a.localeCompare(b));
  return ["Armenia", ...names.filter((name) => name !== "Armenia")];
})();
