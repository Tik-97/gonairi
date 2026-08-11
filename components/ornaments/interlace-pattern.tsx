/** A tileable Armenian interlace (endless-knot) motif for subtle full-bleed background texture. */
export function InterlacePattern({ className, id = "interlace" }: { className?: string; id?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <g stroke="currentColor" strokeWidth="1.4" fill="none">
            <path d="M0 28 Q14 14 28 28 Q42 42 56 28" />
            <path d="M28 0 Q14 14 28 28 Q42 42 28 56" />
            <circle cx="28" cy="28" r="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
