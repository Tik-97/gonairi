import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createGuestBooking } from "@/lib/actions/guest-bookings";
import { GuestBookingForm } from "@/components/guest-booking-form";
import { formatDate, formatMoney } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function BookDeparturePage({
  params,
}: {
  params: Promise<{ departureId: string }>;
}) {
  const [{ departureId }, { dict }] = await Promise.all([params, getDictionary()]);

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
          {departure.tour.organization.name} · {formatDate(departure.date)} ·{" "}
          <span className="font-medium text-terracotta-700">
            {formatMoney(unitPrice.toString(), departure.tour.currency)} {dict.bookDeparturePage.perPaxSuffix}
          </span>
        </p>
      </div>
      {remaining <= 0 ? (
        <p className="text-sm text-brick">{dict.bookDeparturePage.fullyBookedMessage}</p>
      ) : (
        <GuestBookingForm action={createBookingForDeparture} maxPax={remaining} dict={dict.guestBookingForm} />
      )}
    </div>
  );
}
