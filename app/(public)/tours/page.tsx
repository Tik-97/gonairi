import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { PublicTourFilters } from "@/components/public-tour-filters";
import {
  getRegionOptionById,
  getRegionOptionByIsoCode,
  listCountryOptions,
  listRegionOptions,
} from "@/lib/geography";
import { listCategoryOptions } from "@/lib/categories";

export default async function ToursSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    region_id?: string;
    region?: string;
  } & PaginationParams>;
}) {
  const params = await searchParams;
  const { q, category, region_id: regionId, region: legacyRegionCode } = params;
  const pagination = parsePagination(params);
  const [countries, categories, selectedRegion] = await Promise.all([
    listCountryOptions(),
    listCategoryOptions(),
    regionId ? getRegionOptionById(regionId) : getRegionOptionByIsoCode(legacyRegionCode),
  ]);
  const selectedCategory = categories.find((categoryOption) => categoryOption.slug === category);
  const initialCountry =
    countries.find((country) => country.id === selectedRegion?.countryId) ??
    countries.find((country) => country.iso2 === "AM") ??
    countries[0];

  const where = {
    isPublished: true,
    deletedAt: null,
    organization: { isPublished: true },
    ...(selectedCategory
      ? { tourCategories: { some: { categoryId: selectedCategory.id } } }
      : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(selectedRegion
      ? {
          tourRegions: {
            some: { regionId: selectedRegion.id },
          },
        }
      : {}),
  } as const;
  const [tours, totalItems, initialRegions] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: {
        organization: true,
        tourRegions: {
          orderBy: { position: "asc" },
          select: { region: { select: { name: true, country: { select: { name: true } } } } },
        },
        tourCategories: {
          orderBy: { position: "asc" },
          select: { category: { select: { id: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.tour.count({ where }),
    initialCountry ? listRegionOptions(initialCountry.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-espresso">Tours</h1>
      <PublicTourFilters
        key={`${initialCountry?.id ?? "none"}:${selectedRegion?.id ?? "all"}:${selectedCategory?.id ?? "all"}`}
        countries={countries}
        categories={categories}
        initialCountryId={initialCountry?.id ?? ""}
        initialRegions={initialRegions}
        initialRegionId={selectedRegion?.id}
        query={q}
        category={selectedCategory?.slug}
      />

      {tours.length === 0 ? (
        <p className="text-sm text-espresso/60">No tours found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/tours/${tour.id}`}
              className="group rounded-2xl border border-terracotta/15 bg-white/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="font-serif text-lg font-medium text-espresso group-hover:text-brick">
                {tour.title}
              </p>
              <p className="text-sm text-espresso/60">{tour.organization.name}</p>
              <p className="mt-1 text-xs text-espresso/50">
                {tour.tourRegions
                  .map(({ region: destination }) => `${destination.name}, ${destination.country.name}`)
                  .join(" · ")}
              </p>
              <p className="mt-3 text-sm font-medium text-terracotta-700">
                {formatMoney(tour.basePrice.toString(), tour.currency)}
                <span className="font-normal text-espresso/50"> · {tour.durationDays}d</span>
                {tour.tourCategories.map(({ category: tourCategory }) => (
                  <span key={tourCategory.id} className="font-normal text-espresso/50">
                    {" "}· #{tourCategory.slug}
                  </span>
                ))}
              </p>
            </Link>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
