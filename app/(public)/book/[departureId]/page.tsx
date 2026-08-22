import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createGuestBooking } from "@/lib/actions/guest-bookings";
import { GuestBookingForm } from "@/components/guest-booking-form";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";

export default async function BookDeparturePage({
  params,
}: {
  params: Promise<{ departureId: string }>;
}) {
  const { departureId } = await params;

  const departure = await prisma.departure.findFirst({
    where: {
      id: departureId,
      organization: { isPublished: true },
      tour: { isPublished: true, deletedAt: null },
    },
    include: { tour: { include: { organization: true } } },
  });
  if (!departure) {
    notFound();
  }

  const remaining = departure.capacity - departure.bookedCount;
  const unitPrice = departure.priceOverride ?? departure.tour.basePrice;
  const createBookingForDeparture = createGuestBooking.bind(null, departureId);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-espresso">{departure.tour.title}</h1>
        <p className="mt-1 text-sm text-espresso/60">
          {departure.tour.organization.name} · <LocalDateTime value={departure.date.toISOString()} /> ·{" "}
          <span className="font-medium text-terracotta-700">
            {formatMoney(unitPrice.toString(), departure.tour.currency)} / pax
          </span>
        </p>
      </div>
      {remaining <= 0 ? (
        <p className="text-sm text-brick">Sorry, this departure is fully booked.</p>
      ) : (
        <GuestBookingForm action={createBookingForDeparture} maxPax={remaining} />
      )}
    </div>
  );
}
