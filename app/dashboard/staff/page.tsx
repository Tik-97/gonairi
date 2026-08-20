import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { toggleStaffStatus } from "@/lib/actions/staff";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { UserRole } from "@/generated/prisma/enums";

const ROLE_BADGE: Record<UserRole, string> = {
  OWNER: "bg-terracotta/15 text-terracotta-700",
  OPERATOR: "bg-olive/12 text-olive",
  DRIVER: "bg-warning/15 text-[#8a5c00]",
  GUIDE: "bg-success/15 text-success",
  DRIVER_GUIDE: "bg-success/15 text-success",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const session = await requirePermission(PERMISSIONS.staffView);
  const canManage = Boolean(session.platformAdmin) || session.user.role === "OWNER";

  const db = scopedPrisma(session.user.organizationId);
  const staff = await db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.staffPage.eyebrow}
        title={dict.staffPage.title}
        subtitle={dict.staffPage.subtitle}
        action={
          canManage && (
            <Link
              href="/dashboard/staff/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              {dict.staffPage.newStaffButton}
            </Link>
          )
        }
      />

      <SearchInput placeholder={dict.staffPage.searchPlaceholder} />

      {staff.length === 0 ? (
        <EmptyState
          title={dict.staffPage.emptySearchTitle}
          message={dict.staffPage.emptySearchMessage}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {staff.map((member) => (
            <div
              key={member.id}
              className={`flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 ${
                member.status === "DISABLED" ? "opacity-50" : ""
              }`}
            >
              <div>
                <p className="font-medium text-espresso">
                  {member.name}
                  {member.id === session.user.id && (
                    <span className="ml-2 text-xs text-espresso-muted">
                      {dict.staffPage.youSuffix}
                    </span>
                  )}
                </p>
                <p className="text-sm text-espresso-muted">
                  {member.email}
                  {member.phone ? ` · ${member.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {member.roles.map((role) => (
                  <span
                    key={role}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE[role]}`}
                  >
                    {dict.roles[role]}
                  </span>
                ))}
                {member.status === "DISABLED" && (
                  <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
                    {dict.staffPage.disabledBadge}
                  </span>
                )}
                {canManage && !member.roles.includes("OWNER") && (
                  <>
                    <Link
                      href={`/dashboard/staff/${member.id}/attendance`}
                      className="text-sm text-terracotta-700 underline"
                    >
                      {dict.staffPage.attendanceLink}
                    </Link>
                    <Link
                      href={`/dashboard/staff/${member.id}/edit`}
                      className="text-sm text-terracotta-700 underline"
                    >
                      {dict.staffPage.editLink}
                    </Link>
                    {member.id !== session.user.id && (
                      <form action={toggleStaffStatus.bind(null, member.id)}>
                        <button
                          type="submit"
                          className={
                            member.status === "DISABLED"
                              ? "text-sm text-success underline"
                              : "text-sm text-danger underline"
                          }
                        >
                          {member.status === "DISABLED"
                            ? dict.staffPage.activate
                            : dict.staffPage.disable}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
