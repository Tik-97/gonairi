"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { paginationMeta } from "@/lib/pagination";

function pageNumbers(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const valid = Array.from(pages).filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (const value of valid) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && value - previous > 1) result.push("ellipsis");
    result.push(value);
  }
  return result;
}

export function PaginationControls({
  totalItems,
  page,
  perPage,
}: {
  totalItems: number;
  page: number;
  perPage: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalPages, from, to } = paginationMeta(totalItems, page, perPage);
  const options = Array.from(new Set([perPage, 15, 30, 60, 100])).sort((a, b) => a - b);

  function href(nextPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    if (perPage === 15) params.delete("per_page");
    else params.set("per_page", String(perPage));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function changePageSize(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "15") params.delete("per_page");
    else params.set("per_page", value);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  if (totalItems === 0) return null;

  return (
    <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <div className="flex items-center gap-2 text-sm text-espresso-muted">
        <span>Showing {from}–{to} of {totalItems}</span>
        <label className="flex items-center gap-1.5">
          <span>· Per page</span>
          <select
            value={perPage}
            onChange={(event) => changePageSize(event.target.value)}
            className="rounded-[8px] border border-border bg-white px-2 py-1 text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            aria-label="Items per page"
          >
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-white text-espresso hover:bg-cream-100" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : <span className="h-9 w-9" />}
          {pageNumbers(page, totalPages).map((value, index) => value === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center text-espresso-muted">…</span>
          ) : (
            <Link key={value} href={href(value)} aria-current={value === page ? "page" : undefined} className={value === page ? "flex h-9 min-w-9 items-center justify-center rounded-[9px] bg-terracotta px-2 text-sm font-medium text-white" : "flex h-9 min-w-9 items-center justify-center rounded-[9px] border border-border bg-white px-2 text-sm text-espresso hover:bg-cream-100"}>{value}</Link>
          ))}
          {page < totalPages ? (
            <Link href={href(page + 1)} className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-white text-espresso hover:bg-cream-100" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <span className="h-9 w-9" />}
        </div>
      )}
    </nav>
  );
}
