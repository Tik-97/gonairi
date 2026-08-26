import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrganizationSettingsForm } from "@/components/organization-settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function OrganizationSettingsPage() {
  const [session, { locale, dict }] = await Promise.all([requireOwner(), getDictionary()]);
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.settingsPage.eyebrow}
        title={dict.settingsPage.title}
        subtitle={dict.settingsPage.subtitle}
      />
      <OrganizationSettingsForm
        locale={locale}
        dict={dict}
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
