import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { createManualBooking } from "@/lib/actions/bookings";
import { BookingForm } from "@/components/booking-form";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ departureId?: string }>;
}) {
  const [{ departureId }, { locale, dict }] = await Promise.all([searchParams, getDictionary()]);
  if (!departureId) {
    notFound();
  }

  const session = await requirePermission(PERMISSIONS.bookingsManage);
  const db = scopedPrisma(session.user.organizationId);

  const departure = await db.departure.findFirst({
    where: { id: departureId, tour: { deletedAt: null } },
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
        eyebrow={dict.newBookingPage.eyebrow}
        title={departure.tour.title}
        subtitle={<><LocalDateTime value={departure.date.toISOString()} /> · {remaining} {dict.newBookingPage.seatsLeftInfix} {departure.capacity} {dict.newBookingPage.seatsLeftSuffix} · {formatMoney(unitPrice.toString(), departure.tour.currency)} {dict.newBookingPage.perPaxSuffix}</>}
      />
      {remaining <= 0 ? (
        <p className="text-sm text-danger">{dict.newBookingPage.fullyBooked}</p>
      ) : (
        <BookingForm
          action={createBookingForDeparture}
          maxPax={remaining}
          unitPrice={Number(unitPrice)}
          currency={departure.tour.currency}
          locale={locale}
          dict={dict}
        />
      )}
    </div>
  );
}
