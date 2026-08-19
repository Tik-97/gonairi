"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Free-text search box that writes to a `q` (or custom) URL searchParam,
 * debounced so the server-rendered page doesn't re-fetch on every keystroke.
 * Mirrors FilterSelect's URL-driven-state pattern so search composes with
 * the other filters on a page (both live in the same searchParams bag).
 */
export function SearchInput({
  paramName = "q",
  placeholder,
}: {
  paramName?: string;
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(urlValue);

  // Re-sync local state when the URL changes from elsewhere (e.g. a "Clear
  // filters" link, or browser back/forward) — adjusted during render rather
  // than in an effect, per React's guidance for state derived from props.
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  useEffect(() => {
    if (value === urlValue) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (value) params.set(paramName, value);
      else params.delete(paramName);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-espresso-muted"
        strokeWidth={1.75}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-[10px] border border-border bg-white py-2 pr-9 pl-9 text-sm text-espresso transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/30 sm:w-64"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-espresso-muted transition-colors hover:text-espresso"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
