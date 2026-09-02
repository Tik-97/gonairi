import Link from "next/link";
import { notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateBookingStatusFromForm } from "@/lib/actions/bookings";
import { recordPayment, deletePayment } from "@/lib/actions/payments";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { PaymentForm } from "@/components/payment-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const [{ bookingId }, { dict }] = await Promise.all([params, getDictionary()]);
  const session = await requirePermission(PERMISSIONS.bookingsView);
  const db = scopedPrisma(session.user.organizationId);

  const booking = await db.booking.findFirst({
    where: { id: bookingId },
    include: {
      departure: { include: { tour: true } },
      customer: true,
      travelers: true,
      payments: { where: { status: "COMPLETED" }, orderBy: { paidAt: "desc" } },
    },
  });
  if (!booking) {
    notFound();
  }
  const bookingTitle = booking.departure?.tour.title ?? booking.individualTitle ?? dict.newBookingPage.individualBooking;
  const priceBreakdown = Array.isArray(booking.priceBreakdown)
    ? booking.priceBreakdown as { category: keyof typeof dict.tourPriceCategory; description?: string; amount: number }[]
    : [];
  const hotels = Array.isArray(booking.hotels)
    ? booking.hotels as { name: string; checkIn: string; checkOut: string; address?: string; roomType?: string }[]
    : [];

  const [canManage, canManageFinances] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.bookingsManage),
    roleHasPermission(session.user.role, PERMISSIONS.financesManage),
  ]);
  const totalPaid = booking.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const PAYMENT_BADGE: Record<string, string> = {
    UNPAID: "bg-danger/10 text-danger",
    PARTIAL: "bg-warning/15 text-[#8a5c00]",
    PAID: "bg-success/15 text-success",
    REFUNDED: "bg-olive/15 text-olive",
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={dict.bookingDetailPage.eyebrow}
        title={bookingTitle}
        subtitle={booking.departure
          ? <LocalDateTime value={booking.departure.date.toISOString()} />
          : `${booking.travelStartDate?.toLocaleDateString("ru-RU", { timeZone: "UTC" })} – ${booking.travelEndDate?.toLocaleDateString("ru-RU", { timeZone: "UTC" })}`}
      />

      <div className="grid grid-cols-2 gap-6 rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6">
        <div>
          <p className="text-sm text-espresso/60">{dict.bookingDetailPage.customer}</p>
          <Link
            href={`/dashboard/customers/${booking.customer.id}`}
            className="font-medium underline"
          >
            {booking.customer.fullName}
          </Link>
        </div>
        <div>
          <p className="text-sm text-espresso/60">{dict.bookingDetailPage.pax}</p>
          <p className="font-medium">{booking.paxCount}</p>
        </div>
        <div>
          <p className="text-sm text-espresso/60">{dict.bookingDetailPage.totalPrice}</p>
          <p className="font-medium">
            {formatMoney(booking.totalPrice.toString(), booking.currency)}
          </p>
          {booking.discountPercent > 0 && (
            <p className="mt-0.5 text-xs text-terracotta-700">
              {booking.discountPercent}{dict.bookingDetailPage.discountAppliedSuffix}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-espresso/60">{dict.bookingDetailPage.paymentStatus}</p>
          <p>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_BADGE[booking.paymentStatus]}`}
            >
              {dict.paymentStatus[booking.paymentStatus]}
            </span>
          </p>
          <p className="mt-1 text-xs text-espresso-muted">
            {formatMoney(totalPaid, booking.currency)} {dict.bookingDetailPage.paidOfInfix}{" "}
            {formatMoney(booking.totalPrice.toString(), booking.currency)}
          </p>
        </div>
        <div>
          <p className="text-sm text-espresso/60">{dict.bookingDetailPage.status}</p>
          <p className="font-medium">{dict.bookingStatus[booking.status]}</p>
        </div>
        <div>
          <p className="text-sm text-espresso/60">{dict.bookingDetailPage.source}</p>
          <p className="font-medium">{dict.bookingSource[booking.source]}</p>
        </div>
        {booking.specialRequests && (
          <div className="col-span-2">
            <p className="text-sm text-espresso/60">{dict.bookingDetailPage.specialRequests}</p>
            <p className="font-medium">{booking.specialRequests}</p>
          </div>
        )}
      </div>

      {!booking.departure && (priceBreakdown.length > 0 || hotels.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {priceBreakdown.length > 0 && <section className="rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h2 className="mb-3 font-serif text-lg text-espresso">{dict.tourForm.priceBreakdown}</h2>
            {priceBreakdown.map((line, index) => <div key={index} className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
              <span className="text-espresso-muted">{dict.tourPriceCategory[line.category] ?? line.category}{line.description && ` · ${line.description}`}</span>
              <span className="font-medium">{formatMoney(line.amount, booking.currency)}</span>
            </div>)}
          </section>}
          {hotels.length > 0 && <section className="rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h2 className="mb-3 font-serif text-lg text-espresso">{dict.tourForm.hotels}</h2>
            {hotels.map((hotel, index) => <div key={index} className="border-b border-border py-2 text-sm last:border-0">
              <p className="font-medium text-espresso">{hotel.name}</p>
              <p className="text-espresso-muted">{hotel.checkIn} – {hotel.checkOut}{hotel.roomType && ` · ${hotel.roomType}`}</p>
            </div>)}
          </section>}
        </div>
      )}

      {booking.paxCount > 1 && (
        <div className="rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 font-serif text-lg font-medium text-espresso">
            {dict.bookingDetailPage.partyPrefix}{booking.paxCount} {dict.bookingDetailPage.partySuffix}
          </h2>
          <div className="flex flex-col divide-y divide-border">
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium text-espresso">
                {booking.customer.fullName}
              </span>
              <span className="text-espresso-muted">{dict.travelerPriceType.FULL}</span>
            </div>
            {booking.travelers.map((traveler) => (
              <div
                key={traveler.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 text-espresso">
                  {traveler.fullName}
                  {traveler.isChild && (
                    <span className="flex items-center gap-1 rounded-full bg-olive/12 px-2 py-0.5 text-xs font-medium text-olive">
                      <Baby className="h-3 w-3" strokeWidth={2} />
                      {dict.bookingForm.child}
                    </span>
                  )}
                </span>
                <span className="text-espresso-muted">
                  {dict.travelerPriceType[traveler.priceType]}
                </span>
              </div>
            ))}
            {booking.travelers.length < booking.paxCount - 1 && (
              <p className="py-2.5 text-sm text-espresso-muted">
                {booking.paxCount - 1 - booking.travelers.length} {dict.bookingDetailPage.moreTravelersSuffix}
              </p>
            )}
          </div>
        </div>
      )}

      {canManage && (
        <div className="flex flex-col gap-4">
          <form action={updateBookingStatusFromForm.bind(null, booking.id)} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {dict.bookingDetailPage.changeStatus}
              <select name="status" defaultValue={booking.status} disabled={booking.status === "CANCELLED"} className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5">
                {Object.entries(dict.bookingStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="submit" disabled={booking.status === "CANCELLED"} className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {dict.bookingDetailPage.saveStatus}
            </button>
          </form>
        </div>
      )}

      {(canManageFinances || booking.payments.length > 0) && (
        <div className="rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 font-serif text-lg font-medium text-espresso">
            {dict.bookingDetailPage.payments}
          </h2>

          {booking.payments.length === 0 ? (
            <p className="mb-4 text-sm text-espresso-muted">
              {dict.bookingDetailPage.noPaymentsYet}
            </p>
          ) : (
            <div className="mb-5 flex flex-col divide-y divide-border">
              {booking.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium text-espresso">
                      {formatMoney(payment.amount.toString(), payment.currency)}
                    </span>{" "}
                    <span className="text-espresso-muted">
                      · {dict.paymentMethod[payment.method]} ·{" "}
                      <LocalDateTime value={payment.paidAt.toISOString()} />
                      {payment.externalReference
                        ? ` · ${payment.externalReference}`
                        : ""}
                    </span>
                  </div>
                  {canManageFinances && (
                    <form action={deletePayment.bind(null, payment.id)}>
                      <button type="submit" className="text-danger underline">
                        {dict.bookingDetailPage.void}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {canManageFinances && booking.status !== "CANCELLED" && (
            <PaymentForm
              action={recordPayment.bind(null, booking.id)}
              currency={booking.currency}
              dict={dict}
            />
          )}
        </div>
      )}
    </div>
  );
}
