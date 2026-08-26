import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterSelect, DateRangeFilterInput } from "@/components/dashboard/filter-select";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { isValidTimeZone, localDateUtcRange, UTC_TIME_ZONE } from "@/lib/time-zone";

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
    timeZone?: string;
  } & PaginationParams>;
}) {
  const [params, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const { status: statusParam, payment: paymentParam, tourId, departureId, dateFrom, dateTo } = params;
  const timeZone = isValidTimeZone(params.timeZone) ? params.timeZone : UTC_TIME_ZONE;
  const pagination = parsePagination(params);
  const status = statusParam ?? "ALL";
  const payment = paymentParam ?? "ALL";

  const STATUS_OPTIONS: { value: BookingStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: dict.bookingsPage.statusAll },
    { value: "PENDING", label: dict.bookingStatus.PENDING },
    { value: "CONFIRMED", label: dict.bookingStatus.CONFIRMED },
    { value: "COMPLETED", label: dict.bookingStatus.COMPLETED },
    { value: "CANCELLED", label: dict.bookingStatus.CANCELLED },
    { value: "NO_SHOW", label: dict.bookingStatus.NO_SHOW },
  ];

  const PAYMENT_OPTIONS: { value: PaymentStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: dict.bookingsPage.paymentAll },
    { value: "UNPAID", label: dict.paymentStatus.UNPAID },
    { value: "PARTIAL", label: dict.paymentStatus.PARTIAL },
    { value: "PAID", label: dict.paymentStatus.PAID },
    { value: "REFUNDED", label: dict.paymentStatus.REFUNDED },
  ];

  const session = await requirePermission(PERMISSIONS.bookingsView);
  const db = scopedPrisma(session.user.organizationId);

  // "From" alone filters a single day; adding "To" turns it into a range.
  let dayRange: { gte: Date; lt: Date } | null = null;
  const startRange = localDateUtcRange(dateFrom ?? dateTo ?? "", timeZone);
  const endRange = localDateUtcRange(dateTo ?? dateFrom ?? "", timeZone);
  if (startRange && endRange) {
    dayRange = { gte: startRange.start, lt: endRange.end };
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
    ? <>{dict.bookingsPage.scopeDepartureTemplate} &quot;{departure.tour.title}&quot; · <LocalDateTime value={departure.date.toISOString()} />.</>
    : tour
      ? `${dict.bookingsPage.scopeTourTemplate} "${tour.title}".`
      : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.bookingsPage.eyebrow}
        title={dict.bookingsPage.title}
        subtitle={scopeLabel ?? dict.bookingsPage.subtitle}
        action={
          (tour || departure) && (
            <Link href={filterHref(status, payment)} className="text-sm text-terracotta-700 underline">
              {dict.bookingsPage.clearFilter}
            </Link>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect paramName="status" options={STATUS_OPTIONS} ariaLabel={dict.bookingsPage.filterByStatus} />
        <FilterSelect paramName="payment" options={PAYMENT_OPTIONS} ariaLabel={dict.bookingsPage.filterByPayment} />
        <DateRangeFilterInput fromParam="dateFrom" toParam="dateTo" ariaLabel={dict.bookingsPage.filterByDepartureDate} />
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title={status !== "ALL" || payment !== "ALL" || scopeLabel || dayRange ? dict.bookingsPage.emptyFilteredTitle : dict.bookingsPage.emptyDefaultTitle}
          message={
            status !== "ALL" || payment !== "ALL" || scopeLabel || dayRange
              ? dict.bookingsPage.emptyFilteredMessage
              : dict.bookingsPage.emptyDefaultMessage
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
                    <LocalDateTime value={booking.departure.date.toISOString()} /> · {booking.paxCount} {dict.bookingsPage.paxSuffix} ·{" "}
                    {formatMoney(booking.totalPrice.toString(), booking.currency)}
                  </p>
                </div>
                <span className="text-sm text-espresso-muted">
                  {dict.bookingStatus[booking.status]} · {dict.paymentStatus[booking.paymentStatus]} · {dict.bookingSource[booking.source]}
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
