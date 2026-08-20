import Link from "next/link";
import { notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { recordPayment, deletePayment } from "@/lib/actions/payments";
import { formatDate, formatMoney } from "@/lib/format";
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
        title={booking.departure.tour.title}
        subtitle={formatDate(booking.departure.date)}
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
          <div className="flex flex-wrap gap-3">
            {booking.status === "PENDING" && (
              <form
                action={updateBookingStatus.bind(null, booking.id, "CONFIRMED")}
              >
                <button
                  type="submit"
                  className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
                >
                  {dict.bookingDetailPage.confirmBooking}
                </button>
              </form>
            )}
            {booking.status === "CONFIRMED" && (
              <form
                action={updateBookingStatus.bind(null, booking.id, "COMPLETED")}
              >
                <button
                  type="submit"
                  className="rounded-[12px] border border-terracotta/25 px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:bg-cream-100"
                >
                  {dict.bookingDetailPage.markCompleted}
                </button>
              </form>
            )}
            {booking.status !== "CANCELLED" &&
              booking.status !== "COMPLETED" && (
                <form
                  action={updateBookingStatus.bind(
                    null,
                    booking.id,
                    "CANCELLED",
                  )}
                >
                  <button
                    type="submit"
                    className="rounded-[12px] border border-danger/30 px-5 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    {dict.bookingDetailPage.cancelBooking}
                  </button>
                </form>
              )}
          </div>
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
                      {formatDate(payment.paidAt)}
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
