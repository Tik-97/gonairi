"use client";

import { useState } from "react";
import { PillButton } from "@/components/pill-button";

const OTHER_KEY = "__other__";

/**
 * Single-select pill list with an optional free-text "Other…" fallback.
 * Shared by CategoryPicker and VehicleTypePicker — they were ~95% identical
 * copies of this exact state machine, differing only in their option list,
 * label rendering, and custom-input placeholder.
 */
export function PillPicker({
  name,
  options,
  defaultValue,
  renderLabel = (option) => option,
  customPlaceholder,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  renderLabel?: (option: string) => React.ReactNode;
  customPlaceholder: string;
}) {
  const startsCustom = Boolean(defaultValue) && !options.includes(defaultValue ?? "");
  const [selected, setSelected] = useState(startsCustom ? "" : (defaultValue ?? ""));
  const [customMode, setCustomMode] = useState(startsCustom);
  const [customValue, setCustomValue] = useState(startsCustom ? (defaultValue ?? "") : "");
  const [hovered, setHovered] = useState<string | null>(null);

  const value = customMode ? customValue : selected;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <PillButton
            key={option}
            active={!customMode && selected === option}
            hovered={hovered === option}
            onClick={() => {
              setSelected(option);
              setCustomMode(false);
            }}
            onMouseEnter={() => setHovered(option)}
            onMouseLeave={() => setHovered((prev) => (prev === option ? null : prev))}
          >
            {renderLabel(option)}
          </PillButton>
        ))}
        <PillButton
          dashed
          active={customMode}
          hovered={hovered === OTHER_KEY}
          onClick={() => setCustomMode(true)}
          onMouseEnter={() => setHovered(OTHER_KEY)}
          onMouseLeave={() => setHovered((prev) => (prev === OTHER_KEY ? null : prev))}
        >
          Other…
        </PillButton>
      </div>
      {customMode && (
        <input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder={customPlaceholder}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
