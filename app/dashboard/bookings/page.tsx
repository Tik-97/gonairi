import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterSelect, DateRangeFilterInput } from "@/components/dashboard/filter-select";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

const STATUS_OPTIONS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No-show" },
];

const PAYMENT_OPTIONS: { value: PaymentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All payments" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "REFUNDED", label: "Refunded" },
];

const STATUS_BAR_COLOR: Record<string, string> = {
  PENDING: "var(--color-warning)",
  CONFIRMED: "var(--color-success)",
  COMPLETED: "var(--color-success)",
  CANCELLED: "var(--color-danger)",
  NO_SHOW: "var(--color-danger)",
};

function filterHref(status: string, payment: string): string {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (payment !== "ALL") params.set("payment", payment);
  const qs = params.toString();
  return qs ? `/dashboard/bookings?${qs}` : "/dashboard/bookings";
}

function parseDateOnly(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    tourId?: string;
    departureId?: string;
    dateFrom?: string;
    dateTo?: string;
  } & PaginationParams>;
}) {
  const params = await searchParams;
  const { status: statusParam, payment: paymentParam, tourId, departureId, dateFrom, dateTo } = params;
  const pagination = parsePagination(params);
  const status = statusParam ?? "ALL";
  const payment = paymentParam ?? "ALL";

  const session = await requirePermission(PERMISSIONS.bookingsView);
  const db = scopedPrisma(session.user.organizationId);

  // "From" alone filters a single day; adding "To" turns it into a range.
  const fromDate = parseDateOnly(dateFrom);
  const toDate = parseDateOnly(dateTo);
  let dayRange: { gte: Date; lt: Date } | null = null;
  if (fromDate || toDate) {
    const start = fromDate ?? toDate!;
    const end = new Date(toDate ?? fromDate!);
    end.setDate(end.getDate() + 1);
    dayRange = { gte: start, lt: end };
  }

  const bookingWhere = {
    ...(status !== "ALL" ? { status: status as BookingStatus } : {}),
    ...(payment !== "ALL" ? { paymentStatus: payment as PaymentStatus } : {}),
    ...(departureId ? { departureId } : {}),
    ...(tourId || dayRange
      ? { departure: { ...(tourId ? { tourId } : {}), ...(dayRange ? { date: dayRange } : {}) } }
      : {}),
  };
  const [bookings, totalItems, tour, departure] = await Promise.all([
    db.booking.findMany({
      where: bookingWhere,
      include: { departure: { include: { tour: true } }, customer: true },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.booking.count({ where: bookingWhere }),
    tourId
      ? db.tour.findFirst({ where: { id: tourId, deletedAt: null } })
      : Promise.resolve(null),
    departureId ? db.departure.findFirst({ where: { id: departureId }, include: { tour: true } }) : Promise.resolve(null),
  ]);

  const scopeLabel = departure
    ? `Everyone who booked "${departure.tour.title}" · ${formatDate(departure.date)}.`
    : tour
      ? `Everyone who has booked "${tour.title}".`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your ledger"
        title="Bookings"
        subtitle={scopeLabel ?? "Every traveler who has reserved a place on one of your tours."}
        action={
          (tour || departure) && (
            <Link href={filterHref(status, payment)} className="text-sm text-terracotta-700 underline">
              Clear filter
            </Link>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect paramName="status" options={STATUS_OPTIONS} ariaLabel="Filter by status" />
        <FilterSelect paramName="payment" options={PAYMENT_OPTIONS} ariaLabel="Filter by payment status" />
        <DateRangeFilterInput fromParam="dateFrom" toParam="dateTo" ariaLabel="Filter by departure date" />
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title={status !== "ALL" || payment !== "ALL" || scopeLabel || dayRange ? "No bookings match these filters" : "Your ledger is empty, for now"}
          message={
            status !== "ALL" || payment !== "ALL" || scopeLabel || dayRange
              ? "Try a different combination of filters."
              : "Bookings appear here the moment a traveler reserves a seat — or you add one yourself from a departure."
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/dashboard/bookings/${booking.id}`}
              className="flex items-stretch transition-colors hover:bg-cream-100/70"
            >
              <span
                className="w-[3px] shrink-0"
                style={{ backgroundColor: STATUS_BAR_COLOR[booking.status] }}
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                <div>
                  <p className="font-medium text-espresso">
                    {booking.customer.fullName} · {booking.departure.tour.title}
                  </p>
                  <p className="text-sm text-espresso-muted">
                    {formatDate(booking.departure.date)} · {booking.paxCount} pax ·{" "}
                    {formatMoney(booking.totalPrice.toString(), booking.currency)}
                  </p>
                </div>
                <span className="text-sm text-espresso-muted">
                  {booking.status} · {booking.paymentStatus} · {booking.source}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
