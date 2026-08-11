"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string): string {
  return regionNames.of(code) ?? code;
}

function Flag({ code, className }: { code: string; className?: string }) {
  return <span className={`fi fi-${code.toLowerCase()} ${className ?? ""}`} aria-hidden="true" />;
}

const COUNTRY_OPTIONS = (() => {
  const all = getCountries()
    .map((code) => ({ code, name: countryName(code), dialCode: getCountryCallingCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const armenia = all.filter((c) => c.code === "AM");
  const rest = all.filter((c) => c.code !== "AM");
  return [...armenia, ...rest];
})();

function guessInitialCountry(defaultValue?: string): CountryCode {
  if (defaultValue?.trim().startsWith("+")) {
    const parsed = parsePhoneNumberFromString(defaultValue);
    if (parsed?.country) return parsed.country;
  }
  return "AM";
}

function guessInitialRaw(defaultValue: string | undefined, country: CountryCode): string {
  if (!defaultValue) return "";
  const parsed = parsePhoneNumberFromString(defaultValue, country);
  return parsed ? parsed.formatNational() : defaultValue;
}

function CountryPicker({
  country,
  onSelect,
}: {
  country: CountryCode;
  onSelect: (code: CountryCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_OPTIONS.find((c) => c.code === country);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = COUNTRY_OPTIONS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-full w-[92px] shrink-0 items-center gap-1.5 rounded-[12px] border border-terracotta/25 bg-white px-2.5 py-2.5 text-sm"
      >
        {selected && <Flag code={selected.code} className="!h-4 !w-5 rounded-[2px]" />}
        <span className="text-espresso-muted">+{selected?.dialCode}</span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-espresso-muted" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-72 overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code…"
              className="w-full rounded-[10px] border border-terracotta/20 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-espresso-muted">No matches.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(c.code as CountryCode);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-cream-100"
                >
                  <Flag code={c.code} className="!h-4 !w-5 shrink-0 rounded-[2px]" />
                  <span className="flex-1 truncate text-espresso">{c.name}</span>
                  <span className="text-espresso-muted">+{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Country-code + flag phone input. Formats as-you-type and validates against
 * the selected country's numbering rules (e.g. Armenian numbers: an entered
 * leading trunk 0 is stripped automatically, and a number one digit short is
 * flagged rather than silently accepted). The hidden field submitted with
 * the form carries the normalized E.164 value (e.g. +37477447377); the raw
 * typed value is submitted as a fallback only if it never became valid.
 *
 * Country flags are rendered from the flag-icons SVG set rather than emoji —
 * Windows browsers don't render flag emoji (regional indicator sequences
 * fall back to plain letters), so a real icon is needed for it to look right
 * on any OS.
 *
 * Validation only blocks submission once the user has actually edited the
 * field, so legacy freeform phone values already in the database don't
 * block unrelated edits to the same record.
 */
export function PhoneInput({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [country, setCountry] = useState<CountryCode>(() => guessInitialCountry(defaultValue));
  const [raw, setRaw] = useState(() => guessInitialRaw(defaultValue, guessInitialCountry(defaultValue)));
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatted = new AsYouType(country).input(raw);
  const parsed = raw.trim() ? parsePhoneNumberFromString(raw, country) : null;
  const isValid = raw.trim() === "" || Boolean(parsed?.isValid());
  const e164 = parsed?.isValid() ? parsed.number : "";
  const currentCountryName = countryName(country);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.setCustomValidity(touched && !isValid ? `Enter a valid ${currentCountryName} phone number.` : "");
  }, [touched, isValid, currentCountryName]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <CountryPicker
          country={country}
          onSelect={(code) => {
            setCountry(code);
            setTouched(true);
          }}
        />
        <input
          ref={inputRef}
          value={formatted}
          onChange={(e) => {
            setRaw(e.target.value);
            setTouched(true);
          }}
          placeholder={placeholder ?? ""}
          className="min-w-0 flex-1 rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </div>
      <input type="hidden" name={name} value={e164 || raw} />
      {touched && raw.trim() !== "" && !isValid && (
        <p className="text-xs text-danger">
          That doesn&apos;t look like a complete {currentCountryName} number — check the digit count.
        </p>
      )}
    </div>
  );
}
