"use client";

import { useEffect, useState } from "react";
import { Search, X, UserPlus } from "lucide-react";
import { searchCustomers, type CustomerSearchResult } from "@/lib/actions/customers";
import { useClickOutside } from "@/components/use-click-outside";

export function CustomerCombobox({
  selected,
  onSelect,
}: {
  selected: CustomerSearchResult | null;
  onSelect: (customer: CustomerSearchResult | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      setLoading(true);
      searchCustomers(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5">
        <div>
          <p className="text-sm font-medium text-espresso">{selected.fullName}</p>
          {(selected.email || selected.phone) && (
            <p className="text-xs text-espresso-muted">{[selected.email, selected.phone].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-espresso-muted transition-colors hover:bg-cream-100 hover:text-espresso"
          aria-label="Clear selected customer"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-espresso-muted" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search customers by name, email or phone…"
          className="w-full rounded-[12px] border border-terracotta/25 bg-white py-2.5 pr-3.5 pl-10"
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
              setQuery("");
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-terracotta-700 transition-colors hover:bg-cream-100"
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.75} />
            New customer
          </button>
          <div className="max-h-64 overflow-y-auto border-t border-border">
            {loading ? (
              <p className="px-4 py-3 text-sm text-espresso-muted">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-espresso-muted">No customers found.</p>
            ) : (
              results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(customer);
                    setOpen(false);
                    setQuery("");
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
  );
}
