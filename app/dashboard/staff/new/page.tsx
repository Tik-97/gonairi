import { createStaffMember } from "@/lib/actions/staff";
import { requireOwner } from "@/lib/auth/session";
import { StaffForm } from "@/components/staff-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewStaffPage() {
  await requireOwner();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your team"
        title="New staff member"
        subtitle="Add an operator, driver, guide, or driver-guide to your team."
      />
      <StaffForm action={createStaffMember} submitLabel="Add staff member" />
    </div>
  );
}
