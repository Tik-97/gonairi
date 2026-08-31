"use client";

import { useEffect, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import { searchCustomers, type CustomerSearchResult } from "@/lib/actions/customers";
import { useClickOutside } from "@/components/use-click-outside";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function CustomerMultiSelect({
  selected,
  onChange,
  dict,
}: {
  selected: CustomerSearchResult[];
  onChange: (customers: CustomerSearchResult[]) => void;
  dict: Dictionary["customTour"];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      setLoading(true);
      searchCustomers(query)
        .then((customers) => {
          if (!cancelled) setResults(customers);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  const selectedIds = new Set(selected.map(({ id }) => id));
  const availableResults = results.filter(({ id }) => !selectedIds.has(id));

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((customer) => (
            <span
              key={customer.id}
              className="inline-flex items-center gap-2 rounded-full border border-terracotta/20 bg-cream-100 px-3 py-1.5 text-sm text-espresso"
            >
              <UserRound className="h-3.5 w-3.5 text-terracotta-700" strokeWidth={1.75} />
              {customer.fullName}
              <button
                type="button"
                onClick={() => onChange(selected.filter(({ id }) => id !== customer.id))}
                className="text-espresso-muted transition-colors hover:text-danger"
                aria-label={`${dict.removeCustomer}: ${customer.fullName}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <input type="hidden" name="customerIds" value={customer.id} />
            </span>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-espresso-muted" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-[12px] border border-terracotta/25 bg-white py-2.5 pr-3.5 pl-10"
        />

        {open && (
          <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-3 text-sm text-espresso-muted">{dict.searching}</p>
              ) : availableResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-espresso-muted">{dict.noCustomersFound}</p>
              ) : (
                availableResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onChange([...selected, customer]);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex w-full flex-col items-start px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream-100"
                  >
                    <span className="font-medium text-espresso">{customer.fullName}</span>
                    {(customer.email || customer.phone) && (
                      <span className="text-xs text-espresso-muted">
                        {[customer.email, customer.phone].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
