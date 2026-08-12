import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Compact promotional card anchoring the bottom of the sidebar — real
 *  Armenia photography (Tatev Monastery), not a stock/generic image. */
export function SidebarPromoCard() {
  return (
    <Link
      href="/dashboard/tours"
      className="group relative block h-32 shrink-0 overflow-hidden rounded-[14px] transition-transform hover:-translate-y-0.5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/Tatev.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(16,26,46,0.15) 0%, rgba(16,26,46,0.88) 100%)" }}
      />
      <div className="relative flex h-full flex-col justify-end gap-1 p-4">
        <p className="font-serif text-sm font-semibold text-white">Discover Armenia</p>
        <p className="flex items-center gap-1 text-xs font-medium text-terracotta">
          Explore your tours
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
        </p>
      </div>
    </Link>
  );
}
