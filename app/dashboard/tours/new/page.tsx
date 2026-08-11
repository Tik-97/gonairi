import { createTour } from "@/lib/actions/tours";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewTourPage() {
  await requirePermission(PERMISSIONS.toursManage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Your catalogue" title="New tour" subtitle="Describe the journey — the details become the listing your travelers see." />
      <TourForm action={createTour} submitLabel="Create tour" />
    </div>
  );
}
