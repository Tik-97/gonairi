"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { getBrowserTimeZone } from "@/lib/time-zone";

export function FilterSelect({
  paramName,
  options,
  ariaLabel,
}: {
  paramName: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (e.target.value === "ALL") {
      params.delete(paramName);
    } else {
      params.set(paramName, e.target.value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      value={searchParams.get(paramName) ?? "ALL"}
      onChange={handleChange}
      aria-label={ariaLabel}
      className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso transition-colors hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Date range filter: "From" alone acts as a single-day filter; adding "To"
 * turns it into a range. Two searchParams (fromParam/toParam) so the range
 * is shareable/bookmarkable via URL like every other filter in the app.
 */
export function DateRangeFilterInput({
  fromParam,
  toParam,
  ariaLabel,
  clearLabel = "Clear date filter",
}: {
  fromParam: string;
  toParam: string;
  ariaLabel: string;
  clearLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get(fromParam) ?? "";
  const to = searchParams.get(toParam) ?? "";

  function navigate(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("timeZone", getBrowserTimeZone());
    if (nextFrom) params.set(fromParam, nextFrom);
    else params.delete(fromParam);
    if (nextTo) params.set(toParam, nextTo);
    else params.delete(toParam);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={from}
        onChange={(e) => navigate(e.target.value, to)}
        aria-label={`${ariaLabel} — from`}
        className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso transition-colors hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
      />
      <span className="text-sm text-espresso-muted">–</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => navigate(from, e.target.value)}
        aria-label={`${ariaLabel} — to (optional, leave blank for a single day)`}
        className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso transition-colors hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
      />
      {(from || to) && (
        <button
          type="button"
          onClick={() => navigate("", "")}
          className="rounded-[10px] px-2 py-2 text-sm text-espresso-muted transition-colors hover:bg-cream-100 hover:text-espresso"
          aria-label={clearLabel}
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
