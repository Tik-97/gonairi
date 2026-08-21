"use client";

import { useEffect, useState } from "react";
import type { GeographyCountryOption, GeographyRegionOption } from "@/types/geography";
import type { CategoryOption } from "@/types/category";

export function PublicTourFilters({
  countries,
  categories,
  initialCountryId,
  initialRegions,
  initialRegionId,
  query,
  category,
}: {
  countries: GeographyCountryOption[];
  categories: CategoryOption[];
  initialCountryId: string;
  initialRegions: GeographyRegionOption[];
  initialRegionId?: string;
  query?: string;
  category?: string;
}) {
  const [countryId, setCountryId] = useState(initialCountryId);
  const [regions, setRegions] = useState(initialRegions);
  const [regionId, setRegionId] = useState(initialRegionId ?? "");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!countryId || countryId === initialCountryId) return;

    const controller = new AbortController();
    void fetch(`/api/geography/regions?country_id=${encodeURIComponent(countryId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load regions.");
        return (await response.json()) as GeographyRegionOption[];
      })
      .then(setRegions)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
        setRegions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [countryId, initialCountryId, initialRegions]);

  return (
    <form className="flex flex-wrap gap-3">
      <input
        name="q"
        defaultValue={query}
        placeholder="Search tours…"
        className="w-full max-w-sm rounded-full border border-terracotta/25 bg-white px-4 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-terracotta focus:outline-none"
      />
      <select
        value={countryId}
        onChange={(event) => {
          const nextCountryId = event.target.value;
          setCountryId(nextCountryId);
          setRegionId("");
          setLoadError(false);
          if (nextCountryId === initialCountryId) {
            setRegions(initialRegions);
            setLoading(false);
          } else {
            setRegions([]);
            setLoading(true);
          }
        }}
        aria-label="Filter country"
        className="rounded-full border border-terracotta/25 bg-white px-4 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
      >
        {countries.map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>
      <select
        name="region_id"
        value={regionId}
        onChange={(event) => setRegionId(event.target.value)}
        disabled={loading || loadError}
        aria-label="Filter by region"
        className="rounded-full border border-terracotta/25 bg-white px-4 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none disabled:opacity-60"
      >
        <option value="">{loading ? "Loading regions…" : loadError ? "Regions unavailable" : "All regions"}</option>
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>
      <select
        name="category"
        defaultValue={category ?? ""}
        aria-label="Filter by category hashtag"
        className="rounded-full border border-terracotta/25 bg-white px-4 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
      >
        <option value="">All hashtags</option>
        {categories.map((categoryOption) => (
          <option key={categoryOption.id} value={categoryOption.slug}>
            #{categoryOption.slug}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-700"
      >
        Search
      </button>
    </form>
  );
}
