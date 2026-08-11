import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, XCircle, UserX, Wallet } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { deleteCustomer } from "@/lib/actions/customers";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const session = await requirePermission(PERMISSIONS.customersView);
  const [canManage, canDelete] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.customersManage),
    roleHasPermission(session.user.role, PERMISSIONS.customersDelete),
  ]);
  const db = scopedPrisma(session.user.organizationId);

  const customer = await db.customer.findFirst({ where: { id: customerId } });
  if (!customer) {
    notFound();
  }

  const bookings = await db.booking.findMany({
    where: { customerId },
    include: { departure: { include: { tour: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;
  const noShowCount = bookings.filter((b) => b.status === "NO_SHOW").length;
  const totalSpent = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const currency = bookings[0]?.currency ?? "AMD";
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Your travelers"
        title={customer.fullName}
        subtitle={[customer.email, customer.phone, customer.nationality].filter(Boolean).join(" · ") || "No contact info"}
        action={
          <div className="flex items-center gap-4">
            {canManage && (
              <Link href={`/dashboard/customers/${customer.id}/edit`} className="text-sm text-terracotta-700 underline">
                Edit
              </Link>
            )}
            {canDelete && bookings.length === 0 && (
              <form action={deleteCustomer.bind(null, customer.id)}>
                <button type="submit" className="text-sm text-danger underline">
                  Delete
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

      {totalBookings > 0 && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard label="Total bookings" value={totalBookings} icon={CalendarCheck} />
          <StatCard
            label="Cancelled"
            value={cancelledCount}
            hint={`${cancellationRate}% of bookings`}
            icon={XCircle}
          />
          <StatCard label="No-shows" value={noShowCount} icon={UserX} />
          <StatCard
            label="Total spent"
            value={formatMoney(totalSpent, currency)}
            hint={`${confirmedCount} honored booking${confirmedCount === 1 ? "" : "s"}`}
            icon={Wallet}
          />
        </div>
      )}

      <div>
        <h2 className="mb-4 font-serif text-lg font-medium text-espresso">Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-espresso-muted">No bookings yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 transition-colors hover:bg-cream-100/70"
              >
                <div>
                  <p className="font-medium text-espresso">{booking.departure.tour.title}</p>
                  <p className="text-sm text-espresso-muted">
                    {formatDate(booking.departure.date)} · {booking.paxCount} pax ·{" "}
                    {formatMoney(booking.totalPrice.toString(), booking.currency)}
                  </p>
                </div>
                <span className="text-sm text-espresso-muted">
                  {booking.status} · {booking.paymentStatus}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
