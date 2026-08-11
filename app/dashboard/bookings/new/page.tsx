import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { createManualBooking } from "@/lib/actions/bookings";
import { BookingForm } from "@/components/booking-form";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ departureId?: string }>;
}) {
  const { departureId } = await searchParams;
  if (!departureId) {
    notFound();
  }

  const session = await requirePermission(PERMISSIONS.bookingsManage);
  const db = scopedPrisma(session.user.organizationId);

  const departure = await db.departure.findFirst({
    where: { id: departureId },
    include: { tour: true },
  });
  if (!departure) {
    notFound();
  }

  const remaining = departure.capacity - departure.bookedCount;
  const unitPrice = departure.priceOverride ?? departure.tour.basePrice;
  const createBookingForDeparture = createManualBooking.bind(null, departureId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your ledger"
        title={departure.tour.title}
        subtitle={`${formatDate(departure.date)} · ${remaining} of ${departure.capacity} seats left · ${formatMoney(unitPrice.toString(), departure.tour.currency)} / pax`}
      />
      {remaining <= 0 ? (
        <p className="text-sm text-danger">This departure is fully booked.</p>
      ) : (
        <BookingForm
          action={createBookingForDeparture}
          maxPax={remaining}
          unitPrice={Number(unitPrice)}
          currency={departure.tour.currency}
        />
      )}
    </div>
  );
}
