"use client";

import { usePathname } from "next/navigation";

/**
 * Large Khor Virap / Ararat backdrop for the dashboard overview only.
 * Rendered as a z-0 sibling behind the shared Topbar + page content (which
 * sit in layout.tsx's z-10 wrapper), so it reads as one continuous
 * background layer rather than a boxed-in banner image.
 */
export function HeroBackground() {
  const pathname = usePathname();
  if (pathname !== "/dashboard") return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[300px] overflow-hidden sm:h-[380px] lg:left-72 lg:h-[440px]"
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/khor-virap.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[60%_38%]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(248,243,234,0.97) 0%, rgba(248,243,234,0.85) 26%, rgba(248,243,234,0.28) 52%, rgba(248,243,234,0.05) 75%, rgba(248,243,234,0) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: "linear-gradient(to bottom, rgba(248,243,234,0) 0%, rgba(248,243,234,0.9) 75%, rgba(248,243,234,1) 100%)",
        }}
      />
    </div>
  );
}
