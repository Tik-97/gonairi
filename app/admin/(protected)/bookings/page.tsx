import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma/enums";

const BOOKING_STATUSES = new Set(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]);
const PAYMENT_STATUSES = new Set(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]);

export default async function PlatformBookingsPage({ searchParams }: { searchParams: Promise<{ q?: string; organizationId?: string; status?: string; payment?: string } & PaginationParams> }) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const { q, organizationId, status, payment } = params;
  const pagination = parsePagination(params);
  const where = {
      ...(organizationId ? { organizationId } : {}),
      ...(status && BOOKING_STATUSES.has(status) ? { status: status as BookingStatus } : {}),
      ...(payment && PAYMENT_STATUSES.has(payment) ? { paymentStatus: payment as PaymentStatus } : {}),
      ...(q ? { OR: [{ customer: { fullName: { contains: q, mode: "insensitive" as const } } }, { individualTitle: { contains: q, mode: "insensitive" as const } }, { departure: { tour: { title: { contains: q, mode: "insensitive" as const } } } }, { organization: { name: { contains: q, mode: "insensitive" as const } } }] } : {}),
  } as const;
  const [organizations, totalItems, bookings] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.booking.count({ where }),
    prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    include: { organization: { select: { name: true } }, customer: { select: { fullName: true } }, departure: { select: { date: true, tour: { select: { title: true } } } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform-wide data" title="All bookings" subtitle="Every reservation across every agency, shown read-only." />
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect paramName="organizationId" ariaLabel="Filter by agency" options={[{ value: "ALL", label: "All agencies" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
        <FilterSelect paramName="status" ariaLabel="Filter by booking status" options={[{ value: "ALL", label: "All statuses" }, ...Array.from(BOOKING_STATUSES).map((value) => ({ value, label: value }))]} />
        <FilterSelect paramName="payment" ariaLabel="Filter by payment status" options={[{ value: "ALL", label: "All payments" }, ...Array.from(PAYMENT_STATUSES).map((value) => ({ value, label: value }))]} />
        <SearchInput placeholder="Search traveler, tour, or agency…" />
      </div>
      {bookings.length === 0 ? <EmptyState title="No bookings match these filters" message="Try another agency, status, or search term." /> : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="font-medium text-espresso">{booking.customer.fullName} · {booking.departure?.tour.title ?? booking.individualTitle}</p>
                <p className="text-sm text-espresso-muted">{booking.organization.name} · {booking.departure ? <LocalDateTime value={booking.departure.date.toISOString()} /> : booking.travelStartDate?.toLocaleDateString("en-US", { timeZone: "UTC" })} · {booking.paxCount} pax · {formatMoney(booking.totalPrice.toString(), booking.currency)}</p>
              </div>
              <span className="text-sm text-espresso-muted">{booking.status} · {booking.paymentStatus} · {booking.source}</span>
            </div>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
