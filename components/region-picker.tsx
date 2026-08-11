"use client";

import { useState } from "react";

const ARMENIAN_REGIONS = [
  "Yerevan",
  "Aragatsotn",
  "Ararat",
  "Armavir",
  "Gegharkunik",
  "Kotayk",
  "Lori",
  "Shirak",
  "Syunik",
  "Tavush",
  "Vayots Dzor",
];

const OTHER_COUNTRIES = ["Georgia"];

export function RegionPicker({ name, defaultValue }: { name: string; defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
  const [touched, setTouched] = useState(false);
  // Tracked in JS rather than relying on CSS :hover — Chromium can mis-share
  // computed style between sibling buttons that have byte-identical class
  // lists (seen here: hovering any pill also lit up the first one).
  const [hovered, setHovered] = useState<string | null>(null);

  function toggle(region: string) {
    setTouched(true);
    setSelected((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  }

  function renderPill(region: string) {
    const active = selected.includes(region);
    const isHovered = hovered === region;
    return (
      <button
        key={region}
        type="button"
        onClick={() => toggle(region)}
        onMouseEnter={() => setHovered(region)}
        onMouseLeave={() => setHovered((prev) => (prev === region ? null : prev))}
        className={
          active
            ? "rounded-full bg-terracotta px-3.5 py-1.5 text-sm font-medium text-white"
            : isHovered
              ? "rounded-full border border-terracotta/25 bg-cream-100 px-3.5 py-1.5 text-sm text-espresso-muted"
              : "rounded-full border border-terracotta/25 px-3.5 py-1.5 text-sm text-espresso-muted"
        }
      >
        {region}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">{ARMENIAN_REGIONS.map(renderPill)}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <span className="text-xs text-espresso-muted">Cross-border:</span>
        {OTHER_COUNTRIES.map(renderPill)}
      </div>

      {selected.map((region) => (
        <input key={region} type="hidden" name={name} value={region} />
      ))}
      <div className="relative h-0 w-0 overflow-hidden">
        <input
          type="checkbox"
          required
          checked={selected.length > 0}
          onChange={() => {}}
          className="h-0 w-0 opacity-0"
          tabIndex={-1}
        />
      </div>
      {touched && selected.length === 0 && (
        <p className="text-xs text-danger">Select at least one region — this powers the marketplace filter later.</p>
      )}
    </div>
  );
}
