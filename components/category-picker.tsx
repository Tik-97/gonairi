"use client";

import { PillPicker } from "@/components/pill-picker";

const CATEGORIES = [
  "cultural",
  "historical",
  "religious",
  "nature",
  "hiking",
  "adventure",
  "wine",
  "culinary",
  "city",
  "wildlife",
  "photography",
  "family",
  "day-trip",
  "multi-day",
];

export function CategoryPicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <PillPicker
      name={name}
      options={CATEGORIES}
      defaultValue={defaultValue}
      renderLabel={(cat) => `#${cat}`}
      customPlaceholder="Custom category"
    />
  );
}
