/** A single-stroke flying bird, for quiet corner accents. */
export function FlyingBird({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 16 Q12 2 30 12 Q48 2 58 16"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
