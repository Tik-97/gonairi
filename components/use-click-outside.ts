"use client";

import { useEffect, useRef } from "react";

/**
 * Shared "close this popover/dropdown when you click elsewhere" pattern —
 * was copy-pasted verbatim across DateTimePicker, PhoneInput's CountryPicker,
 * and CustomerCombobox. Returns a ref to attach to the popover's container.
 *
 * `onOutside` is read via a ref rather than listed as an effect dependency,
 * so the listener is attached once (matching the original callers' `[]` deps)
 * instead of re-subscribing whenever the caller passes a fresh inline callback.
 */
export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  const onOutsideRef = useRef(onOutside);

  useEffect(() => {
    onOutsideRef.current = onOutside;
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutsideRef.current();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return ref;
}
