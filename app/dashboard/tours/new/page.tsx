import { createTour } from "@/lib/actions/tours";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listCountryOptions, listRegionOptions } from "@/lib/geography";
import { listCategoryOptions } from "@/lib/categories";

export default async function NewTourPage() {
  await requirePermission(PERMISSIONS.toursManage);
  const [countries, categories] = await Promise.all([listCountryOptions(), listCategoryOptions()]);
  const initialCountry = countries.find((country) => country.iso2 === "AM") ?? countries[0];
  const initialRegions = initialCountry ? await listRegionOptions(initialCountry.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Your catalogue" title="New tour" subtitle="Describe the journey — the details become the listing your travelers see." />
      <TourForm
        action={createTour}
        categories={categories}
        countries={countries}
        initialCountryId={initialCountry?.id ?? ""}
        initialRegions={initialRegions}
        submitLabel="Create tour"
      />
    </div>
  );
}
