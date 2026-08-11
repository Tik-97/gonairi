/**
 * Ararat's twin peaks with Khor Virap's walls and chapel dome at the base —
 * a soft line-art silhouette, not a photograph. Meant to sit at low opacity
 * (5-10%) as background texture, never as foreground content.
 */
export function MountainSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 280" fill="none" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <path
        d="M0 280 L120 210 L180 250 L260 150 L300 190 L360 60 L430 190 L470 150 L560 240 L620 200 L700 260 L800 190 L800 280 Z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7">
        <path d="M330 250 h140 v-14 h10 v-18 h-160 v18 h10 Z" />
        <rect x="345" y="205" width="16" height="31" />
        <circle cx="400" cy="196" r="10" />
        <path d="M400 186 v-16" />
        <path d="M393 174 h14" />
      </g>
    </svg>
  );
}
