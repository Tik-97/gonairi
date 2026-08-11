import { isValidPhoneNumber } from "libphonenumber-js";

/**
 * Server-side safety net behind PhoneInput's client-side validation (which
 * normally blocks bad submissions already). Phone is optional everywhere in
 * this app, so an empty value always passes; a non-empty value must be a
 * valid E.164-formatted number (what PhoneInput submits when valid).
 */
export function isValidOptionalPhone(value: string | undefined): boolean {
  return !value || isValidPhoneNumber(value);
}
