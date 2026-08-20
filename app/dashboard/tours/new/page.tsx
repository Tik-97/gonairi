import { createTour } from "@/lib/actions/tours";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NewTourPage() {
  const [, { dict }] = await Promise.all([requirePermission(PERMISSIONS.toursManage), getDictionary()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.toursPage.eyebrow} title={dict.dashboardPage.newTour} subtitle={dict.newTourPage.subtitle} />
      <TourForm action={createTour} submitLabel={dict.newTourPage.submitLabel} dict={dict} />
    </div>
  );
}
