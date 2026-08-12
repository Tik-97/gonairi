import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await requirePermission(PERMISSIONS.customersView);
  const canManage = await roleHasPermission(
    session.user.role,
    PERMISSIONS.customersManage,
  );
  const db = scopedPrisma(session.user.organizationId);
  const customers = await db.customer.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your travelers"
        title="Customers"
        subtitle="The people you've welcomed on tour, and the ones about to be."
        action={
          canManage && (
            <Link
              href="/dashboard/customers/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              + New customer
            </Link>
          )
        }
      />

      <SearchInput placeholder="Search by name, email, or phone…" />

      {customers.length === 0 ? (
        <EmptyState
          title={q ? "No customers match your search" : "No travelers yet"}
          message={
            q
              ? "Try a different name, email, or phone number."
              : "Add a customer by hand, or they'll appear here the moment they book a tour."
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 transition-colors hover:bg-cream-100/70"
            >
              <div>
                <p className="font-medium text-espresso">{customer.fullName}</p>
                <p className="text-sm text-espresso-muted">
                  {[customer.email, customer.phone]
                    .filter(Boolean)
                    .join(" · ") || "No contact info"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
