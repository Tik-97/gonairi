import { createStaffMember } from "@/lib/actions/staff";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { StaffForm } from "@/components/staff-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewStaffPage() {
  await requirePermission(PERMISSIONS.staffManage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your team"
        title="New staff member"
        subtitle="Add an admin, operator, driver, or guide to your team."
      />
      <StaffForm action={createStaffMember} submitLabel="Add staff member" />
    </div>
  );
}
