"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PillButton } from "@/components/pill-button";
import type { CategoryOption } from "@/types/category";

const COLLAPSED_CATEGORY_LIMIT = 20;
const MAX_TOUR_CATEGORIES = 10;

export function CategoryPicker({
  name,
  categories,
  defaultValue,
}: {
  name: string;
  categories: CategoryOption[];
  defaultValue?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchingCategories = categories.filter(
    (category) =>
      category.slug.includes(normalizedSearch) ||
      category.label.toLocaleLowerCase().includes(normalizedSearch),
  );
  const visibleCategories = showAll
    ? matchingCategories
    : matchingCategories.slice(0, COLLAPSED_CATEGORY_LIMIT);

  function toggle(categoryId: string) {
    if (selected.includes(categoryId)) {
      setSelected((current) => current.filter((id) => id !== categoryId));
      setSelectionError(null);
      return;
    }
    if (selected.length >= MAX_TOUR_CATEGORIES) {
      setSelectionError(`Select up to ${MAX_TOUR_CATEGORIES} hashtags.`);
      return;
    }
    setSelected((current) => [...current, categoryId]);
    setSelectionError(null);
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-[12px] border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        Categories are not configured. Run <code>npm run seed:categories</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setShowAll(false);
        }}
        placeholder="Search hashtags…"
        aria-label="Search category hashtags"
        className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {visibleCategories.map((category) => (
          <PillButton
            key={category.id}
            active={selected.includes(category.id)}
            hovered={hovered === category.id}
            onClick={() => toggle(category.id)}
            onMouseEnter={() => setHovered(category.id)}
            onMouseLeave={() => setHovered((current) => (current === category.id ? null : current))}
          >
            #{category.slug}
          </PillButton>
        ))}
        {matchingCategories.length === 0 ? (
          <p className="text-xs text-espresso-muted">No hashtags match this search.</p>
        ) : null}
      </div>

      {matchingCategories.length > COLLAPSED_CATEGORY_LIMIT ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="w-fit text-xs font-medium text-terracotta-700 underline"
          aria-expanded={showAll}
        >
          {showAll ? "Show less" : "Show all"}
        </button>
      ) : null}

      {selected.length > 0 ? (
        <div className="border-t border-border pt-2">
          <p className="mb-2 text-xs font-medium text-espresso-muted">
            Selected hashtags ({selected.length}/{MAX_TOUR_CATEGORIES})
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((categoryId) => {
              const category = categories.find((option) => option.id === categoryId);
              if (!category) return null;
              return (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 text-xs text-espresso"
                >
                  #{category.slug}{!category.isActive ? " (legacy)" : ""}
                  <button
                    type="button"
                    onClick={() => toggle(category.id)}
                    aria-label={`Remove ${category.label}`}
                    className="text-espresso-muted hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {selected.map((categoryId) => (
        <input key={categoryId} type="hidden" name={name} value={categoryId} />
      ))}
      {selectionError ? <p className="text-xs text-danger">{selectionError}</p> : null}
    </div>
  );
}
