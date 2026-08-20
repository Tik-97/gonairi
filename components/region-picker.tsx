"use client";

import { useState } from "react";
import { PillButton } from "@/components/pill-button";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

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

export function RegionPicker({
  name,
  defaultValue,
  dict,
}: {
  name: string;
  defaultValue?: string[];
  dict: Pick<Dictionary, "armenianRegions" | "tourForm">;
}) {
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
        {dict.armenianRegions[region] ?? region}
      </PillButton>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">{ARMENIAN_REGIONS.map(renderPill)}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <span className="text-xs text-espresso-muted">{dict.tourForm.crossBorder}</span>
        {OTHER_COUNTRIES.map(renderPill)}
      </div>

      {selected.map((region) => (
        <input key={region} type="hidden" name={name} value={region} />
      ))}
      {touched && selected.length === 0 && (
        <p className="text-xs text-danger">{dict.tourForm.selectRegionWarning}</p>
      )}
    </div>
  );
}
