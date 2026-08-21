"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { PillButton } from "@/components/pill-button";
import type { GeographyCountryOption, GeographyRegionOption } from "@/types/geography";

const COLLAPSED_REGION_LIMIT = 20;

export function RegionPicker({
  name,
  countries,
  initialCountryId,
  initialRegions,
  selectedRegions = [],
  defaultValue,
}: {
  name: string;
  countries: GeographyCountryOption[];
  initialCountryId: string;
  initialRegions: GeographyRegionOption[];
  selectedRegions?: GeographyRegionOption[];
  defaultValue?: string[];
}) {
  const [countryId, setCountryId] = useState(initialCountryId);
  const [regionsByCountry, setRegionsByCountry] = useState<Record<string, GeographyRegionOption[]>>(
    initialCountryId ? { [initialCountryId]: initialRegions } : {},
  );
  const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [touched, setTouched] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeCountry = countries.find((country) => country.id === countryId) ?? countries[0];
  const activeRegions = activeCountry ? regionsByCountry[activeCountry.id] : undefined;
  const loading = Boolean(activeCountry && !activeRegions && !loadError);

  useEffect(() => {
    if (!activeCountry || activeRegions) return;

    const controller = new AbortController();

    void fetch(`/api/geography/regions?country_id=${encodeURIComponent(activeCountry.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load regions.");
        return (await response.json()) as GeographyRegionOption[];
      })
      .then((regions) => {
        setRegionsByCountry((current) => ({ ...current, [activeCountry.id]: regions }));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError("Could not load regions. Please try another country and return.");
      });

    return () => controller.abort();
  }, [activeCountry, activeRegions]);

  const regionDetails = useMemo(
    () =>
      new Map(
        [...Object.values(regionsByCountry).flat(), ...selectedRegions].map((region) => [region.id, region]),
      ),
    [regionsByCountry, selectedRegions],
  );
  const matchingRegions = (activeRegions ?? []).filter((region) =>
    region.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const visibleRegions = showAll
    ? matchingRegions
    : matchingRegions.slice(0, COLLAPSED_REGION_LIMIT);

  function toggle(regionId: string) {
    setTouched(true);
    setSelected((current) =>
      current.includes(regionId) ? current.filter((id) => id !== regionId) : [...current, regionId],
    );
  }

  function renderPill(region: GeographyRegionOption) {
    return (
      <PillButton
        key={region.id}
        active={selected.includes(region.id)}
        hovered={hovered === region.id}
        onClick={() => toggle(region.id)}
        onMouseEnter={() => setHovered(region.id)}
        onMouseLeave={() => setHovered((current) => (current === region.id ? null : current))}
      >
        {region.name}
        {region.isoCode ? <span className="ml-1 opacity-65">{region.isoCode}</span> : null}
      </PillButton>
    );
  }

  if (countries.length === 0) {
    return (
      <p className="rounded-[12px] border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        Geography is not configured. Run <code>npm run seed:geography</code> before creating tours.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={activeCountry?.id}
          onChange={(event) => {
            setCountryId(event.target.value);
            setSearch("");
            setShowAll(false);
            setLoadError(null);
          }}
          aria-label="Country"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm"
        >
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name} ({country.iso2})
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setShowAll(false);
          }}
          placeholder={`Search ${activeCountry?.name ?? "regions"}…`}
          aria-label="Search regions"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm"
        />
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-terracotta-700" aria-label="Loading regions" /> : null}
        {!loading ? visibleRegions.map(renderPill) : null}
        {!loading && !loadError && matchingRegions.length === 0 ? (
          <p className="text-xs text-espresso-muted">No regions match this search.</p>
        ) : null}
        {loadError ? <p className="text-xs text-danger">{loadError}</p> : null}
      </div>

      {!loading && !loadError && matchingRegions.length > COLLAPSED_REGION_LIMIT ? (
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
          <p className="mb-2 text-xs font-medium text-espresso-muted">Selected destinations</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((regionId) => {
              const details = regionDetails.get(regionId);
              const country = details
                ? countries.find((countryOption) => countryOption.id === details.countryId)
                : undefined;
              if (!details || !country) return null;
              return (
                <span
                  key={regionId}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 text-xs text-espresso"
                >
                  {details.name}, {country.name}
                  {!details.isActive ? " (legacy)" : ""}
                  <button
                    type="button"
                    onClick={() => toggle(regionId)}
                    aria-label={`Remove ${details.name}, ${country.name}`}
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

      {selected.map((regionId) => (
        <input key={regionId} type="hidden" name={name} value={regionId} />
      ))}
      {touched && selected.length === 0 ? (
        <p className="text-xs text-danger">Select at least one region.</p>
      ) : null}
    </div>
  );
}
