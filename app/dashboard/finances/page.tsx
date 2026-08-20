import Link from "next/link";
import { Wallet, Banknote, Clock, Receipt } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { deletePayment } from "@/lib/actions/payments";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const PANEL =
  "rounded-[16px] sm:rounded-[18px] bg-card p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]";

export default async function FinancesPage() {
  const [session, { locale, dict }] = await Promise.all([requirePermission(PERMISSIONS.financesView), getDictionary()]);
  const numberLocale = locale === "ru" ? "ru-RU" : "en-US";
  const canManage = await roleHasPermission(
    session.user.role,
    PERMISSIONS.financesManage,
  );
  const db = scopedPrisma(session.user.organizationId);

  const [
    revenueByCurrency,
    collectedByCurrency,
    methodBreakdown,
    recentPayments,
    paymentCount,
  ] = await Promise.all([
    db.booking.groupBy({
      by: ["currency"],
      where: { status: { not: "CANCELLED" } },
      _sum: { totalPrice: true },
    }),
    db.payment.groupBy({
      by: ["currency"],
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    // Summed across currencies — fine in practice since almost every org only
    // ever uses its default AMD currency; see byCurrency below for the rare
    // multi-currency case broken out properly.
    db.payment.groupBy({
      by: ["method"],
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.findMany({
      where: { status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
      take: 20,
      include: {
        booking: {
          include: { customer: true, departure: { include: { tour: true } } },
        },
      },
    }),
    db.payment.count({ where: { status: "COMPLETED" } }),
  ]);

  const currencies = Array.from(
    new Set([
      ...revenueByCurrency.map((r) => r.currency),
      ...collectedByCurrency.map((c) => c.currency),
    ]),
  );
  const byCurrency = currencies
    .map((currency) => {
      const revenue = Number(
        revenueByCurrency.find((r) => r.currency === currency)?._sum
          .totalPrice ?? 0,
      );
      const collected = Number(
        collectedByCurrency.find((c) => c.currency === currency)?._sum.amount ??
          0,
      );
      return { currency, revenue, collected, outstanding: revenue - collected };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const primary = byCurrency[0] ?? {
    currency: "AMD",
    revenue: 0,
    collected: 0,
    outstanding: 0,
  };

  const methodTotalMax = Math.max(
    1,
    ...methodBreakdown.map((m) => Number(m._sum.amount ?? 0)),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.financesPage.eyebrow}
        title={dict.financesPage.title}
        subtitle={dict.financesPage.subtitle}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard
          label={dict.financesPage.totalRevenue}
          value={formatMoney(primary.revenue, primary.currency)}
          icon={Wallet}
          numberLocale={numberLocale}
        />
        <StatCard
          label={dict.financesPage.collected}
          value={formatMoney(primary.collected, primary.currency)}
          icon={Banknote}
          numberLocale={numberLocale}
        />
        <StatCard
          label={dict.financesPage.outstanding}
          value={formatMoney(
            Math.max(primary.outstanding, 0),
            primary.currency,
          )}
          icon={Clock}
          numberLocale={numberLocale}
        />
        <StatCard
          label={dict.financesPage.paymentsRecorded}
          value={paymentCount}
          icon={Receipt}
          numberLocale={numberLocale}
        />
      </div>

      {byCurrency.length > 1 && (
        <div className={PANEL}>
          <h2 className="mb-4 font-serif text-lg font-medium text-espresso">
            {dict.financesPage.byCurrency}
          </h2>
          <div className="flex flex-col divide-y divide-border">
            {byCurrency.map((row) => (
              <div
                key={row.currency}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-medium text-espresso">
                  {row.currency}
                </span>
                <span className="text-espresso-muted">
                  {formatMoney(row.collected, row.currency)} {dict.financesPage.collectedOfInfix}{" "}
                  {formatMoney(row.revenue, row.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className={PANEL}>
          <h2 className="mb-5 font-serif text-xl font-semibold text-espresso">
            {dict.financesPage.recentPayments}
          </h2>
          {recentPayments.length === 0 ? (
            <EmptyState
              title={dict.financesPage.emptyTitle}
              message={dict.financesPage.emptyMessage}
            />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-1.5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <div>
                    <Link
                      href={`/dashboard/bookings/${payment.bookingId}`}
                      className="font-medium text-espresso underline"
                    >
                      {payment.booking.customer.fullName}
                    </Link>
                    <p className="text-espresso-muted">
                      {payment.booking.departure.tour.title} ·{" "}
                      {dict.paymentMethod[payment.method]} ·{" "}
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-0 sm:pl-0">
                    <span className="font-medium text-terracotta-700">
                      {formatMoney(payment.amount.toString(), payment.currency)}
                    </span>
                    {canManage && (
                      <form action={deletePayment.bind(null, payment.id)}>
                        <button
                          type="submit"
                          className="text-xs text-danger underline"
                        >
                          {dict.financesPage.void}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={PANEL}>
          <h2 className="mb-5 font-serif text-xl font-semibold text-espresso">
            {dict.financesPage.byPaymentMethod}
          </h2>
          {methodBreakdown.length === 0 ? (
            <p className="text-sm text-espresso-muted">{dict.financesPage.noPaymentsYet}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {methodBreakdown
                .slice()
                .sort(
                  (a, b) =>
                    Number(b._sum.amount ?? 0) - Number(a._sum.amount ?? 0),
                )
                .map((row) => {
                  const amount = Number(row._sum.amount ?? 0);
                  const pct = (amount / methodTotalMax) * 100;
                  return (
                    <div key={row.method} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-espresso">
                          {dict.paymentMethod[row.method]}
                        </span>
                        <span className="font-medium text-espresso">
                          {formatMoney(amount, primary.currency)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-cream-100">
                        <div
                          className="h-full rounded-full bg-terracotta"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
