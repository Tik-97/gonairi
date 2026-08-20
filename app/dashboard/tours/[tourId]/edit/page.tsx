import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateTour } from "@/lib/actions/tours";
import { TourForm } from "@/components/tour-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const [session, { dict }] = await Promise.all([requirePermission(PERMISSIONS.toursManage), getDictionary()]);
  const db = scopedPrisma(session.user.organizationId);
  const tour = await db.tour.findFirst({ where: { id: tourId, deletedAt: null } });

  if (!tour) {
    notFound();
  }

  const updateTourWithId = updateTour.bind(null, tour.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.toursPage.eyebrow} title={tour.title} subtitle={dict.editTourPage.subtitle} />
      <TourForm
        action={updateTourWithId}
        submitLabel={dict.editTourPage.submitLabel}
        dict={dict}
        defaultValues={{
          title: tour.title,
          description: tour.description ?? "",
          category: tour.category ?? "",
          durationDays: tour.durationDays,
          basePrice: Number(tour.basePrice),
          isPublished: tour.isPublished,
          images: tour.images,
          regions: tour.regions,
        }}
      />
    </div>
  );
}
