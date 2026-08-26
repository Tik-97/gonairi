import { createStaffMember } from "@/lib/actions/staff";
import { requireOwner } from "@/lib/auth/session";
import { StaffForm } from "@/components/staff-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NewStaffPage() {
  const [, { locale, dict }] = await Promise.all([requireOwner(), getDictionary()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.staffPage.eyebrow}
        title={dict.newStaffPage.title}
        subtitle={dict.newStaffPage.subtitle}
      />
      <StaffForm action={createStaffMember} submitLabel={dict.newStaffPage.submitLabel} locale={locale} dict={dict} />
    </div>
  );
}
