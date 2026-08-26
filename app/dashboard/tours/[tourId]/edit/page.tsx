import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateTour } from "@/lib/actions/tours";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listCountryOptions, listRegionOptions } from "@/lib/geography";
import { listCategoryOptions } from "@/lib/categories";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const [session, { dict }] = await Promise.all([requirePermission(PERMISSIONS.toursManage), getDictionary()]);
  const db = scopedPrisma(session.user.organizationId);
  const [tour, countries] = await Promise.all([
    db.tour.findFirst({
      where: { id: tourId, deletedAt: null },
      include: {
        tourRegions: {
          orderBy: { position: "asc" },
          select: {
            region: {
              select: {
                id: true,
                countryId: true,
                isoCode: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
        tourCategories: {
          orderBy: { position: "asc" },
          select: { categoryId: true },
        },
      },
    }),
    listCountryOptions(),
  ]);

  if (!tour) {
    notFound();
  }

  const selectedRegions = tour.tourRegions.map(({ region }) => region);
  const selectedRegionIds = selectedRegions.map(({ id }) => id);
  const selectedCategoryIds = tour.tourCategories.map(({ categoryId }) => categoryId);
  const initialCountry =
    countries.find((country) => country.id === selectedRegions[0]?.countryId) ??
    countries.find((country) => country.iso2 === "AM") ??
    countries[0];
  const [initialRegions, categories] = await Promise.all([
    initialCountry ? listRegionOptions(initialCountry.id, selectedRegionIds) : Promise.resolve([]),
    listCategoryOptions(selectedCategoryIds),
  ]);
  const updateTourWithId = updateTour.bind(null, tour.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.toursPage.eyebrow} title={tour.title} subtitle={dict.editTourPage.subtitle} />
      <TourForm
        action={updateTourWithId}
        categories={categories}
        countries={countries}
        initialCountryId={initialCountry?.id ?? ""}
        initialRegions={initialRegions}
        selectedRegions={selectedRegions}
        submitLabel={dict.editTourPage.submitLabel}
        dict={dict}
        defaultValues={{
          title: tour.title,
          description: tour.description ?? "",
          categoryIds: selectedCategoryIds,
          durationDays: tour.durationDays,
          basePrice: Number(tour.basePrice),
          isPublished: tour.isPublished,
          images: tour.images,
          regionIds: selectedRegionIds,
        }}
      />
    </div>
  );
}
