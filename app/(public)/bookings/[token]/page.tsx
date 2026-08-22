import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";

export default async function GuestBookingStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { lookupToken: token },
    include: { departure: { include: { tour: { include: { organization: true } } } }, customer: true },
  });
  if (!booking) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-espresso">Booking confirmation</h1>
      <div className="rounded-2xl border border-terracotta/15 bg-white/70 p-6">
        <p className="font-serif text-lg font-medium text-espresso">{booking.departure.tour.title}</p>
        <p className="text-sm text-espresso/60">{booking.departure.tour.organization.name}</p>
        <p className="mt-4 text-sm text-espresso/80">
          <LocalDateTime value={booking.departure.date.toISOString()} /> · {booking.paxCount} pax
        </p>
        <p className="text-sm font-medium text-terracotta-700">
          {formatMoney(booking.totalPrice.toString(), booking.currency)}
        </p>
        <p className="mt-4 text-sm text-espresso/80">
          Status: <span className="font-medium text-espresso">{booking.status}</span> · Payment:{" "}
          <span className="font-medium text-espresso">{booking.paymentStatus}</span>
        </p>
      </div>
      <p className="text-sm text-espresso/60">
        {booking.departure.tour.organization.name} will contact you at {booking.customer.email} to confirm payment
        and details. Keep this link to check your booking status later.
      </p>
    </div>
  );
}
