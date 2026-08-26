import { createTour } from "@/lib/actions/tours";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listCountryOptions, listRegionOptions } from "@/lib/geography";
import { listCategoryOptions } from "@/lib/categories";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NewTourPage() {
  const [, countries, categories, { dict }] = await Promise.all([
    requirePermission(PERMISSIONS.toursManage),
    listCountryOptions(),
    listCategoryOptions(),
    getDictionary(),
  ]);
  const initialCountry = countries.find((country) => country.iso2 === "AM") ?? countries[0];
  const initialRegions = initialCountry ? await listRegionOptions(initialCountry.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.toursPage.eyebrow} title={dict.dashboardPage.newTour} subtitle={dict.newTourPage.subtitle} />
      <TourForm
        action={createTour}
        categories={categories}
        countries={countries}
        initialCountryId={initialCountry?.id ?? ""}
        initialRegions={initialRegions}
        submitLabel={dict.newTourPage.submitLabel}
        dict={dict}
      />
    </div>
  );
}
