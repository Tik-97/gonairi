import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { OrganizationSettingsForm } from "@/components/organization-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function OrganizationSettingsPage() {
  const session = await requirePermission(PERMISSIONS.orgSettingsManage);
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your agency"
        title="Settings"
        subtitle="How your agency presents itself to travelers on the marketplace."
      />
      <OrganizationSettingsForm
        defaultValues={{
          name: organization.name,
          description: organization.description ?? "",
          contactEmail: organization.contactEmail ?? "",
          contactPhone: organization.contactPhone ?? "",
          isPublished: organization.isPublished,
          slug: organization.slug,
        }}
      />
    </div>
  );
}
