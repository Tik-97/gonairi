"use client";

import { useState } from "react";
import { PillButton } from "@/components/pill-button";

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
  const [hovered, setHovered] = useState<string | null>(null);

  function toggle(region: string) {
    setTouched(true);
    setSelected((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  }

  function renderPill(region: string) {
    return (
      <PillButton
        key={region}
        active={selected.includes(region)}
        hovered={hovered === region}
        onClick={() => toggle(region)}
        onMouseEnter={() => setHovered(region)}
        onMouseLeave={() => setHovered((prev) => (prev === region ? null : prev))}
      >
        {region}
      </PillButton>
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
      {touched && selected.length === 0 && (
        <p className="text-xs text-danger">Select at least one region — this powers the marketplace filter later.</p>
      )}
    </div>
  );
}
