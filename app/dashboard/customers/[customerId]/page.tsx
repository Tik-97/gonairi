import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, XCircle, UserX, Wallet } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { deleteCustomer } from "@/lib/actions/customers";
import { calculateCustomerBookingStats } from "@/lib/customers/stats";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<PaginationParams>;
}) {
  const [{ customerId }, paginationParams, { locale, dict }] = await Promise.all([params, searchParams, getDictionary()]);
  const pagination = parsePagination(paginationParams);
  const numberLocale = locale === "ru" ? "ru-RU" : "en-US";
  const session = await requirePermission(PERMISSIONS.customersView);
  const [canManage, canDelete, canManageBookings] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.customersManage),
    roleHasPermission(session.user.role, PERMISSIONS.customersDelete),
    roleHasPermission(session.user.role, PERMISSIONS.bookingsManage),
  ]);
  const db = scopedPrisma(session.user.organizationId);

  const customer = await db.customer.findFirst({
    where: { id: customerId },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      statusHistory: { include: { changedByUser: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) {
    notFound();
  }

  const [bookings, bookingStatsRows, totalItems, assignedTourCount] = await Promise.all([
    db.booking.findMany({
      where: { customerId },
      include: { departure: { include: { tour: true } } },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.booking.findMany({
      where: { customerId },
      select: { status: true, totalPrice: true, currency: true },
    }),
    db.booking.count({ where: { customerId } }),
    db.tourCustomer.count({ where: { customerId } }),
  ]);

  const { totalBookings, confirmedCount, cancelledCount, noShowCount, totalSpent, currency, cancellationRate } =
    calculateCustomerBookingStats(
      bookingStatsRows.map((b) => ({ status: b.status, totalPrice: Number(b.totalPrice), currency: b.currency })),
    );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={dict.customersPage.eyebrow}
        title={customer.fullName}
        subtitle={[dict.customerStatus[customer.status], customer.email, customer.phone, customer.nationality].filter(Boolean).join(" · ")}
        action={
          <div className="flex items-center gap-4">
            {canManage && (
              <Link href={`/dashboard/customers/${customer.id}/edit`} className="text-sm text-terracotta-700 underline">
                {dict.customerDetailPage.editLink}
              </Link>
            )}
            {canManageBookings && (
              <Link
                href={`/dashboard/bookings/new?customerId=${customer.id}`}
                className="text-sm text-terracotta-700 underline"
              >
                {dict.customerDetailPage.createBooking}
              </Link>
            )}
            {canDelete && totalItems === 0 && assignedTourCount === 0 && (
              <form action={deleteCustomer.bind(null, customer.id)}>
                <button type="submit" className="text-sm text-danger underline">
                  {dict.customerDetailPage.deleteLink}
                </button>
              </form>
            )}
          </div>
        }
      />

      {customer.notes && (
        <p className="rounded-lg border border-terracotta/15 bg-white p-4 text-sm text-espresso-muted">
          {customer.notes}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={dict.customerDetailPage.profileHeading}>
          <InfoRow label="Email" value={customer.email} />
          <InfoRow label={dict.customerForm.phone} value={customer.phone} />
          <InfoRow label="WhatsApp" value={customer.whatsapp} />
          <InfoRow label="Telegram" value={customer.telegram} />
        </InfoCard>
        <InfoCard title={dict.customerDetailPage.passportHeading}>
          <InfoRow label={dict.customerForm.passportNumber} value={customer.passportNumber} />
          <InfoRow label={dict.customerDetailPage.issuedBy} value={customer.passportIssuedBy} />
          <InfoRow label={dict.customerDetailPage.expires} value={formatDate(customer.passportExpiryDate, numberLocale)} />
        </InfoCard>
        <InfoCard title={dict.customerDetailPage.visaHeading}>
          <InfoRow label={dict.customerForm.visaStatus} value={dict.visaStatus[customer.visaStatus]} />
          <InfoRow label={dict.customerForm.visaCountry} value={customer.visaCountry} />
          <InfoRow label={dict.customerDetailPage.expires} value={formatDate(customer.visaExpiryDate, numberLocale)} />
        </InfoCard>
      </div>

      <div>
        <h2 className="mb-4 font-serif text-lg font-medium text-espresso">{dict.customerDetailPage.documentsHeading}</h2>
        {customer.documents.length === 0 ? <p className="text-sm text-espresso-muted">{dict.customerDetailPage.noDocuments}</p> : (
          <div className="grid gap-2 sm:grid-cols-2">
            {customer.documents.map((document) => (
              <a key={document.id} href={`/api/customers/documents/${document.id}`} className="rounded-[12px] border border-border bg-white px-4 py-3 text-sm text-terracotta-700 underline">
                {document.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-serif text-lg font-medium text-espresso">{dict.customerDetailPage.historyHeading}</h2>
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {customer.statusHistory.map((event) => (
            <div key={event.id} className="px-4 py-3.5 sm:px-5">
              <p className="text-sm font-medium text-espresso">
                {event.fromStatus ? `${dict.customerStatus[event.fromStatus]} → ` : ""}{dict.customerStatus[event.toStatus]}
              </p>
              <p className="text-xs text-espresso-muted">
                <LocalDateTime value={event.createdAt.toISOString()} />
                {event.changedByUser && ` · ${dict.customerDetailPage.changedBy} ${event.changedByUser.name}`}
                {event.note && ` · ${event.note}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {totalBookings > 0 && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label={dict.customerDetailPage.totalBookings} value={totalBookings} icon={CalendarCheck} numberLocale={numberLocale} />
          <StatCard
            label={dict.customerDetailPage.cancelled}
            value={cancelledCount}
            hint={`${cancellationRate}${dict.customerDetailPage.cancellationRateSuffix}`}
            icon={XCircle}
            numberLocale={numberLocale}
          />
          <StatCard label={dict.customerDetailPage.noShows} value={noShowCount} icon={UserX} numberLocale={numberLocale} />
          <StatCard
            label={dict.customerDetailPage.totalSpent}
            value={formatMoney(totalSpent, currency)}
            hint={`${confirmedCount} ${dict.customerDetailPage.honoredBookingsSuffix}`}
            icon={Wallet}
            numberLocale={numberLocale}
          />
        </div>
      )}

      <div>
        <h2 className="mb-4 font-serif text-lg font-medium text-espresso">{dict.customerDetailPage.bookingsHeading}</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-espresso-muted">{dict.dashboardPage.noBookingsYet}</p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 transition-colors hover:bg-cream-100/70"
              >
                <div>
                  <p className="font-medium text-espresso">{booking.departure?.tour.title ?? booking.individualTitle}</p>
                  <p className="text-sm text-espresso-muted">
                    {booking.departure
                      ? <LocalDateTime value={booking.departure.date.toISOString()} />
                      : booking.travelStartDate?.toLocaleDateString(numberLocale, { timeZone: "UTC" })} · {booking.paxCount} {dict.bookingsPage.paxSuffix} ·{" "}
                    {formatMoney(booking.totalPrice.toString(), booking.currency)}
                  </p>
                </div>
                <span className="text-sm text-espresso-muted">
                  {dict.bookingStatus[booking.status]} · {dict.paymentStatus[booking.paymentStatus]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}

function formatDate(value: Date | null, locale: string): string | null {
  return value?.toLocaleDateString(locale, { timeZone: "UTC" }) ?? null;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[18px] border border-terracotta/15 bg-card p-5">
    <h2 className="mb-3 font-serif text-lg text-espresso">{title}</h2>
    <dl className="flex flex-col gap-2">{children}</dl>
  </section>;
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div className="flex justify-between gap-4 text-sm"><dt className="text-espresso-muted">{label}</dt><dd className="text-right text-espresso">{value}</dd></div>;
}
