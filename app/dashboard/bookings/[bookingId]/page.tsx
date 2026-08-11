import Link from "next/link";
import { notFound } from "next/navigation";
import { Baby } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateBookingStatus, updateBookingPaymentStatus } from "@/lib/actions/bookings";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";

const TRAVELER_PRICE_LABEL: Record<string, string> = {
  FULL: "Full price",
  HALF: "Half price",
  FREE: "Free",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requirePermission(PERMISSIONS.bookingsView);
  const db = scopedPrisma(session.user.organizationId);

  const booking = await db.booking.findFirst({
    where: { id: bookingId },
    include: { departure: { include: { tour: true } }, customer: true, travelers: true },
  });
  if (!booking) {
    notFound();
  }

  const canManage = await roleHasPermission(session.user.role, PERMISSIONS.bookingsManage);

  const PAYMENT_BADGE: Record<string, string> = {
    UNPAID: "bg-danger/10 text-danger",
    PARTIAL: "bg-warning/15 text-[#8a5c00]",
    PAID: "bg-success/15 text-success",
    REFUNDED: "bg-olive/15 text-olive",
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Your ledger" title={booking.departure.tour.title} subtitle={formatDate(booking.departure.date)} />

      <div className="grid grid-cols-2 gap-6 rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6">
        <div>
          <p className="text-sm text-espresso/60">Customer</p>
          <Link href={`/dashboard/customers/${booking.customer.id}`} className="font-medium underline">
            {booking.customer.fullName}
          </Link>
        </div>
        <div>
          <p className="text-sm text-espresso/60">Pax</p>
          <p className="font-medium">{booking.paxCount}</p>
        </div>
        <div>
          <p className="text-sm text-espresso/60">Total price</p>
          <p className="font-medium">{formatMoney(booking.totalPrice.toString(), booking.currency)}</p>
          {booking.discountPercent > 0 && (
            <p className="mt-0.5 text-xs text-terracotta-700">{booking.discountPercent}% discount applied</p>
          )}
        </div>
        <div>
          <p className="text-sm text-espresso/60">Payment status</p>
          <p>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_BADGE[booking.paymentStatus]}`}>
              {booking.paymentStatus}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-espresso/60">Status</p>
          <p className="font-medium">{booking.status}</p>
        </div>
        <div>
          <p className="text-sm text-espresso/60">Source</p>
          <p className="font-medium">{booking.source}</p>
        </div>
        {booking.specialRequests && (
          <div className="col-span-2">
            <p className="text-sm text-espresso/60">Special requests</p>
            <p className="font-medium">{booking.specialRequests}</p>
          </div>
        )}
      </div>

      {booking.paxCount > 1 && (
        <div className="rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 font-serif text-lg font-medium text-espresso">Party ({booking.paxCount} pax)</h2>
          <div className="flex flex-col divide-y divide-border">
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium text-espresso">{booking.customer.fullName}</span>
              <span className="text-espresso-muted">Full price</span>
            </div>
            {booking.travelers.map((traveler) => (
              <div key={traveler.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2 text-espresso">
                  {traveler.fullName}
                  {traveler.isChild && (
                    <span className="flex items-center gap-1 rounded-full bg-olive/12 px-2 py-0.5 text-xs font-medium text-olive">
                      <Baby className="h-3 w-3" strokeWidth={2} />
                      Child
                    </span>
                  )}
                </span>
                <span className="text-espresso-muted">{TRAVELER_PRICE_LABEL[traveler.priceType]}</span>
              </div>
            ))}
            {booking.travelers.length < booking.paxCount - 1 && (
              <p className="py-2.5 text-sm text-espresso-muted">
                {booking.paxCount - 1 - booking.travelers.length} more traveler(s), name not recorded.
              </p>
            )}
          </div>
        </div>
      )}

      {canManage && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {booking.status === "PENDING" && (
              <form action={updateBookingStatus.bind(null, booking.id, "CONFIRMED")}>
                <button type="submit" className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700">
                  Confirm booking
                </button>
              </form>
            )}
            {booking.status === "CONFIRMED" && (
              <form action={updateBookingStatus.bind(null, booking.id, "COMPLETED")}>
                <button type="submit" className="rounded-[12px] border border-terracotta/25 px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:bg-cream-100">
                  Mark completed
                </button>
              </form>
            )}
            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <form action={updateBookingStatus.bind(null, booking.id, "CANCELLED")}>
                <button type="submit" className="rounded-[12px] border border-danger/30 px-5 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10">
                  Cancel booking
                </button>
              </form>
            )}
          </div>

          {booking.status !== "CANCELLED" && (
            <div className="flex flex-wrap gap-3">
              {booking.paymentStatus !== "PAID" && (
                <form action={updateBookingPaymentStatus.bind(null, booking.id, "PAID")}>
                  <button type="submit" className="rounded-[12px] bg-success px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90">
                    Mark as paid
                  </button>
                </form>
              )}
              {booking.paymentStatus !== "PARTIAL" && booking.paymentStatus !== "PAID" && (
                <form action={updateBookingPaymentStatus.bind(null, booking.id, "PARTIAL")}>
                  <button type="submit" className="rounded-[12px] border border-terracotta/25 px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:bg-cream-100">
                    Mark as partially paid
                  </button>
                </form>
              )}
              {booking.paymentStatus !== "UNPAID" && (
                <form action={updateBookingPaymentStatus.bind(null, booking.id, "UNPAID")}>
                  <button type="submit" className="rounded-[12px] border border-border px-5 py-2.5 text-sm font-medium text-espresso-muted transition-colors hover:bg-cream-100">
                    Mark as unpaid
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
