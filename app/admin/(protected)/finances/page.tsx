import { Banknote, Clock, Receipt, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

export default async function PlatformFinancesPage({ searchParams }: { searchParams: Promise<{ organizationId?: string } & PaginationParams> }) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const { organizationId } = params;
  const pagination = parsePagination(params);
  const organizations = await prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const scope = organizationId ? { organizationId } : {};
  const [revenueGroups, collectedGroups, paymentCount, payments] = await Promise.all([
    prisma.booking.groupBy({ by: ["currency"], where: { ...scope, status: { not: "CANCELLED" } }, _sum: { totalPrice: true } }),
    prisma.payment.groupBy({ by: ["currency"], where: { ...scope, status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.payment.count({ where: { ...scope, status: "COMPLETED" } }),
    prisma.payment.findMany({ where: { ...scope, status: "COMPLETED" }, orderBy: { paidAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { organization: { select: { name: true } }, booking: { select: { customer: { select: { fullName: true } }, departure: { select: { tour: { select: { title: true } } } } } } } }),
  ]);
  const currencies = Array.from(new Set([...revenueGroups.map((r) => r.currency), ...collectedGroups.map((r) => r.currency)]));
  const totals = currencies.map((currency) => {
    const revenue = Number(revenueGroups.find((r) => r.currency === currency)?._sum.totalPrice ?? 0);
    const collected = Number(collectedGroups.find((r) => r.currency === currency)?._sum.amount ?? 0);
    return { currency, revenue, collected, outstanding: Math.max(revenue - collected, 0) };
  }).sort((a, b) => b.revenue - a.revenue);
  const primary = totals[0] ?? { currency: "AMD", revenue: 0, collected: 0, outstanding: 0 };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform-wide data" title="All finances" subtitle="Booked revenue and completed payments across the platform, grouped safely by currency." />
      <FilterSelect paramName="organizationId" ariaLabel="Filter by agency" options={[{ value: "ALL", label: "All agencies" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <StatCard label="Booked revenue" value={formatMoney(primary.revenue, primary.currency)} icon={Wallet} />
        <StatCard label="Collected" value={formatMoney(primary.collected, primary.currency)} icon={Banknote} />
        <StatCard label="Outstanding" value={formatMoney(primary.outstanding, primary.currency)} icon={Clock} />
        <StatCard label="Payments" value={paymentCount} icon={Receipt} />
      </div>
      {totals.length > 1 && <div className="rounded-[18px] bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"><h2 className="mb-3 font-serif text-lg font-semibold text-espresso">By currency</h2>{totals.map((row) => <div key={row.currency} className="flex items-center justify-between border-t border-border py-2.5 text-sm first:border-0"><span className="font-medium">{row.currency}</span><span className="text-espresso-muted">{formatMoney(row.collected, row.currency)} collected of {formatMoney(row.revenue, row.currency)}</span></div>)}</div>}
      <section className="rounded-[18px] bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <h2 className="mb-4 font-serif text-xl font-semibold text-espresso">Recent payments</h2>
        {payments.length === 0 ? <EmptyState title="No payments recorded" message="Completed payments will appear here." /> : <div className="flex flex-col divide-y divide-border">{payments.map((payment) => <div key={payment.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-espresso">{payment.booking.customer.fullName} · {payment.booking.departure.tour.title}</p><p className="text-espresso-muted">{payment.organization.name} · {payment.method} · <LocalDateTime value={payment.paidAt.toISOString()} /></p></div><span className="font-medium text-terracotta-700">{formatMoney(payment.amount.toString(), payment.currency)}</span></div>)}</div>}
      </section>
      <PaginationControls totalItems={paymentCount} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
