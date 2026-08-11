import { Compass } from "lucide-react";
import { InterlacePattern } from "@/components/ornaments/interlace-pattern";

/**
 * Ambient artwork for the back-office content pane — present behind every
 * screen (fixed to the viewport, confined to the content region right of the
 * sidebar) so empty space always reads as "considered", never "unfinished".
 * Opaque cards sit on top of it; it only shows through the cream gaps.
 */
export function AmbientDecoration() {
  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 left-0 z-0 overflow-hidden lg:left-72" aria-hidden="true">
      <InterlacePattern className="absolute inset-0 h-full w-full text-terracotta opacity-[0.03]" />

      <Compass className="absolute bottom-0 -left-10 hidden h-80 w-80 text-terracotta opacity-[0.12] sm:block" strokeWidth={0.75} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/khachkar.png"
        alt=""
        className="absolute -right-6 bottom-0 hidden h-80 w-auto object-contain opacity-[0.22] sm:block"
        style={{
          maskImage: "linear-gradient(200deg, black 35%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(200deg, black 35%, transparent 85%)",
        }}
      />
    </div>
  );
}
