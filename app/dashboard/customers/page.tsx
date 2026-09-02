import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string } & PaginationParams>;
}) {
  const [params, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const { q } = params;
  const pagination = parsePagination(params);
  const session = await requirePermission(PERMISSIONS.customersView);
  const canManage = await roleHasPermission(
    session.user.role,
    PERMISSIONS.customersManage,
  );
  const db = scopedPrisma(session.user.organizationId);
  const where = q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined;
  const [customers, totalItems] = await Promise.all([
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
    db.customer.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.customersPage.eyebrow}
        title={dict.customersPage.title}
        subtitle={dict.customersPage.subtitle}
        action={
          canManage && (
            <Link
              href="/dashboard/customers/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              {dict.customersPage.newCustomerButton}
            </Link>
          )
        }
      />

      <SearchInput placeholder={dict.customersPage.searchPlaceholder} />

      {customers.length === 0 ? (
        <EmptyState
          title={q ? dict.customersPage.emptyNoMatchTitle : dict.customersPage.emptyDefaultTitle}
          message={
            q
              ? dict.customersPage.emptyNoMatchMessage
              : dict.customersPage.emptyDefaultMessage
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
                    .join(" · ") || dict.customersPage.noContactInfo}
                </p>
              </div>
              <span className="w-fit rounded-full bg-cream-100 px-3 py-1 text-xs font-medium text-terracotta-700">
                {dict.customerStatus[customer.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
