"use client";

import { PillPicker } from "@/components/pill-picker";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

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

export function CategoryPicker({
  name,
  defaultValue,
  dict,
}: {
  name: string;
  defaultValue?: string;
  dict: Pick<Dictionary, "tourCategories" | "tourForm" | "common">;
}) {
  return (
    <PillPicker
      name={name}
      options={CATEGORIES}
      defaultValue={defaultValue}
      renderLabel={(cat) => `#${dict.tourCategories[cat] ?? cat}`}
      customPlaceholder={dict.tourForm.customCategoryPlaceholder}
      otherLabel={dict.common.other}
    />
  );
}
