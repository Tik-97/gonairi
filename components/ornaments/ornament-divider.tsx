/** A thin repeating Armenian rhombus-and-line motif, used as a horizontal divider. */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 16" preserveAspectRatio="xMinYMid meet" className={className} aria-hidden="true">
      <line x1="0" y1="8" x2="320" y2="8" stroke="currentColor" strokeWidth="1" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={i}
          x={i * 40 + 4}
          y="4"
          width="8"
          height="8"
          transform={`rotate(45 ${i * 40 + 8} 8)`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      ))}
    </svg>
  );
}
