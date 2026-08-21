import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type SeedCategory = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
};

const require = createRequire(import.meta.url);
const { CATEGORIES } = require("../scripts/category-data.cjs") as {
  CATEGORIES: SeedCategory[];
};

describe("category hashtag seed source", () => {
  it("contains the complete curated hashtag catalogue", () => {
    expect(CATEGORIES).toHaveLength(67);
    expect(CATEGORIES.map(({ slug }) => slug)).toEqual(
      expect.arrayContaining([
        "cultural",
        "hiking",
        "wine",
        "wellness",
        "rafting",
        "family",
        "accessible",
        "multi-day",
      ]),
    );
  });

  it("uses unique stable slugs, ids, and display positions", () => {
    const slugs = CATEGORIES.map(({ slug }) => slug);
    const ids = CATEGORIES.map(({ id }) => id);
    const positions = CATEGORIES.map(({ sortOrder }) => sortOrder);

    expect(new Set(slugs).size).toBe(CATEGORIES.length);
    expect(new Set(ids).size).toBe(CATEGORIES.length);
    expect(new Set(positions).size).toBe(CATEGORIES.length);
    expect(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true);
    expect(CATEGORIES.every(({ id, slug }) => id === `category-${slug}`)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });
});
