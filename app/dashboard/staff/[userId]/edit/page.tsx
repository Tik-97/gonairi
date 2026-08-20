import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth/session";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateStaffMember } from "@/lib/actions/staff";
import { StaffForm } from "@/components/staff-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [session, { locale, dict }] = await Promise.all([requireOwner(), getDictionary()]);
  const db = scopedPrisma(session.user.organizationId);
  const member = await db.user.findFirst({ where: { id: userId } });

  if (!member || member.roles.includes("OWNER")) {
    notFound();
  }

  const updateStaffWithId = updateStaffMember.bind(null, member.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.staffPage.eyebrow} title={member.name} subtitle={dict.editStaffPage.subtitle} />
      <StaffForm
        action={updateStaffWithId}
        submitLabel={dict.editStaffPage.submitLabel}
        showEmailAndPassword={false}
        locale={locale}
        dict={dict}
        defaultValues={{
          name: member.name,
          phone: member.phone ?? "",
          roles: member.roles,
        }}
      />
    </div>
  );
}
