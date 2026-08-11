"use client";

import { useState } from "react";

const VEHICLE_TYPES = ["Bus", "Minivan", "Car", "Jeep", "SUV"];

export function VehicleTypePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const startsCustom = Boolean(defaultValue) && !VEHICLE_TYPES.includes(defaultValue ?? "");
  const [selected, setSelected] = useState(startsCustom ? "" : (defaultValue ?? ""));
  const [customMode, setCustomMode] = useState(startsCustom);
  const [customValue, setCustomValue] = useState(startsCustom ? (defaultValue ?? "") : "");
  // Tracked in JS rather than relying on CSS :hover — Chromium can mis-share
  // computed style between sibling buttons that have byte-identical class lists.
  const [hovered, setHovered] = useState<string | null>(null);

  const value = customMode ? customValue : selected;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {VEHICLE_TYPES.map((type) => {
          const active = !customMode && selected === type;
          const isHovered = hovered === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSelected(type);
                setCustomMode(false);
              }}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered((prev) => (prev === type ? null : prev))}
              className={
                active
                  ? "rounded-full bg-terracotta px-3.5 py-1.5 text-sm font-medium text-white"
                  : isHovered
                    ? "rounded-full border border-terracotta/25 bg-cream-100 px-3.5 py-1.5 text-sm text-espresso-muted"
                    : "rounded-full border border-terracotta/25 px-3.5 py-1.5 text-sm text-espresso-muted"
              }
            >
              {type}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          onMouseEnter={() => setHovered("__other__")}
          onMouseLeave={() => setHovered((prev) => (prev === "__other__" ? null : prev))}
          className={
            customMode
              ? "rounded-full bg-terracotta px-3.5 py-1.5 text-sm font-medium text-white"
              : hovered === "__other__"
                ? "rounded-full border border-dashed border-terracotta/30 bg-cream-100 px-3.5 py-1.5 text-sm text-espresso-muted"
                : "rounded-full border border-dashed border-terracotta/30 px-3.5 py-1.5 text-sm text-espresso-muted"
          }
        >
          Other…
        </button>
      </div>
      {customMode && (
        <input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Custom vehicle type"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
