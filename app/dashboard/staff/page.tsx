import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { toggleStaffStatus } from "@/lib/actions/staff";
import { PageHeader } from "@/components/dashboard/page-header";

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-terracotta/15 text-terracotta-700",
  ADMIN: "bg-terracotta/15 text-terracotta-700",
  OPERATOR: "bg-olive/12 text-olive",
  DRIVER: "bg-warning/15 text-[#8a5c00]",
  GUIDE: "bg-success/15 text-success",
};

export default async function StaffPage() {
  const session = await requirePermission(PERMISSIONS.staffView);
  const canManage = await roleHasPermission(session.user.role, PERMISSIONS.staffManage);

  const db = scopedPrisma(session.user.organizationId);
  const staff = await db.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your team"
        title="Staff"
        subtitle="Owners, admins, operators, drivers, and guides on your team."
        action={
          canManage && (
            <Link
              href="/dashboard/staff/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              + New staff member
            </Link>
          )
        }
      />

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
                {member.id === session.user.id && <span className="ml-2 text-xs text-espresso-muted">(you)</span>}
              </p>
              <p className="text-sm text-espresso-muted">
                {member.email}
                {member.phone ? ` · ${member.phone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_BADGE[member.role]}`}>{member.role}</span>
              {member.status === "DISABLED" && (
                <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">Disabled</span>
              )}
              {canManage && member.role !== "OWNER" && (
                <>
                  <Link href={`/dashboard/staff/${member.id}/attendance`} className="text-sm text-terracotta-700 underline">
                    Attendance
                  </Link>
                  <Link href={`/dashboard/staff/${member.id}/edit`} className="text-sm text-terracotta-700 underline">
                    Edit
                  </Link>
                  {member.id !== session.user.id && (
                    <form action={toggleStaffStatus.bind(null, member.id)}>
                      <button
                        type="submit"
                        className={member.status === "DISABLED" ? "text-sm text-success underline" : "text-sm text-danger underline"}
                      >
                        {member.status === "DISABLED" ? "Activate" : "Disable"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
