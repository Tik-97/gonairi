import { createTour } from "@/lib/actions/tours";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listCountryOptions, listRegionOptions } from "@/lib/geography";
import { listCategoryOptions } from "@/lib/categories";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { scopedPrisma } from "@/lib/db/scoped";

export default async function NewTourPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; customerId?: string }>;
}) {
  const [query, session, countries, categories, { dict }] = await Promise.all([
    searchParams,
    requirePermission(PERMISSIONS.toursManage),
    listCountryOptions(),
    listCategoryOptions(),
    getDictionary(),
  ]);
  const isPrivate = query.type === "individual";
  const initialCustomer = isPrivate && query.customerId
    ? await scopedPrisma(session.user.organizationId).customer.findFirst({
        where: { id: query.customerId },
        select: { id: true, fullName: true, email: true, phone: true },
      })
    : null;
  const initialCountry = countries.find((country) => country.iso2 === "AM") ?? countries[0];
  const initialRegions = initialCountry ? await listRegionOptions(initialCountry.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.toursPage.eyebrow}
        title={isPrivate ? dict.newTourPage.individualTitle : dict.dashboardPage.newTour}
        subtitle={isPrivate ? dict.newTourPage.individualSubtitle : dict.newTourPage.subtitle}
      />
      <TourForm
        action={createTour}
        categories={categories}
        countries={countries}
        initialCountryId={initialCountry?.id ?? ""}
        initialRegions={initialRegions}
        initialCustomers={initialCustomer ? [initialCustomer] : []}
        defaultValues={{ isPrivate }}
        submitLabel={isPrivate ? dict.newTourPage.individualSubmitLabel : dict.newTourPage.submitLabel}
        dict={dict}
      />
    </div>
  );
}
