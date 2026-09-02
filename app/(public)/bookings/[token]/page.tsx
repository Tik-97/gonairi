import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function GuestBookingStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [{ token }, { dict }] = await Promise.all([params, getDictionary()]);

  const booking = await prisma.booking.findUnique({
    where: { lookupToken: token },
    include: { departure: { include: { tour: { include: { organization: true } } } }, organization: true, customer: true },
  });
  if (!booking) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-espresso">{dict.guestBookingStatusPage.title}</h1>
      <div className="rounded-2xl border border-terracotta/15 bg-white/70 p-6">
        <p className="font-serif text-lg font-medium text-espresso">{booking.departure?.tour.title ?? booking.individualTitle}</p>
        <p className="text-sm text-espresso/60">{booking.departure?.tour.organization.name ?? booking.organization.name}</p>
        <p className="mt-4 text-sm text-espresso/80">
          {booking.departure ? <LocalDateTime value={booking.departure.date.toISOString()} /> : booking.travelStartDate?.toLocaleDateString("en-US", { timeZone: "UTC" })} · {booking.paxCount} {dict.guestBookingStatusPage.paxSuffix}
        </p>
        <p className="text-sm font-medium text-terracotta-700">
          {formatMoney(booking.totalPrice.toString(), booking.currency)}
        </p>
        <p className="mt-4 text-sm text-espresso/80">
          {dict.guestBookingStatusPage.statusPrefix} <span className="font-medium text-espresso">{dict.bookingStatus[booking.status]}</span> · {dict.guestBookingStatusPage.paymentPrefix}{" "}
          <span className="font-medium text-espresso">{dict.paymentStatus[booking.paymentStatus]}</span>
        </p>
      </div>
      <p className="text-sm text-espresso/60">
        {(booking.departure?.tour.organization.name ?? booking.organization.name)} {dict.guestBookingStatusPage.contactMessagePrefix} {booking.customer.email} {dict.guestBookingStatusPage.contactMessageSuffix}
      </p>
    </div>
  );
}
