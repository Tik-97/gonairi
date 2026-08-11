"use client";

/**
 * Shared rendering for every pill-shaped toggle button in the app (category,
 * vehicle-type, and region pickers). Hover is tracked by the caller and
 * passed in rather than relying on CSS :hover — Chromium can mis-share
 * computed style between sibling buttons that have byte-identical class
 * lists (hovering any pill was lighting up the first one).
 */
export function PillButton({
  active,
  hovered,
  dashed,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  active: boolean;
  hovered: boolean;
  dashed?: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: React.ReactNode;
}) {
  const border = dashed ? "border-dashed border-terracotta/30" : "border-terracotta/25";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={
        active
          ? "rounded-full bg-terracotta px-3.5 py-1.5 text-sm font-medium text-white"
          : hovered
            ? `rounded-full border ${border} bg-cream-100 px-3.5 py-1.5 text-sm text-espresso-muted`
            : `rounded-full border ${border} px-3.5 py-1.5 text-sm text-espresso-muted`
      }
    >
      {children}
    </button>
  );
}
