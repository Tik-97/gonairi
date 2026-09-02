import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateCustomer } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { countryOptions } from "@/lib/countries";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const [session, { locale, dict }] = await Promise.all([requirePermission(PERMISSIONS.customersManage), getDictionary()]);
  const db = scopedPrisma(session.user.organizationId);
  const customer = await db.customer.findFirst({ where: { id: customerId }, include: { documents: true } });

  if (!customer) {
    notFound();
  }

  const updateCustomerWithId = updateCustomer.bind(null, customer.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.customersPage.eyebrow} title={`${dict.editCustomerPage.editPrefix} ${customer.fullName}`} />
      <CustomerForm
        action={updateCustomerWithId}
        submitLabel={dict.editCustomerPage.submitLabel}
        locale={locale}
        dict={dict}
        countries={countryOptions(locale)}
        defaultValues={{
          fullName: customer.fullName,
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          nationality: customer.nationality ?? "",
          notes: customer.notes ?? "",
          birthDate: customer.birthDate?.toISOString().slice(0, 10) ?? "",
          passportNumber: customer.passportNumber ?? "",
          passportIssuedBy: customer.passportIssuedBy ?? "",
          passportIssueDate: customer.passportIssueDate?.toISOString().slice(0, 10) ?? "",
          passportExpiryDate: customer.passportExpiryDate?.toISOString().slice(0, 10) ?? "",
          whatsapp: customer.whatsapp ?? "",
          telegram: customer.telegram ?? "",
          visaStatus: customer.visaStatus,
          visaCountry: customer.visaCountry ?? "",
          visaType: customer.visaType ?? "",
          visaApplicationDate: customer.visaApplicationDate?.toISOString().slice(0, 10) ?? "",
          visaDecisionDate: customer.visaDecisionDate?.toISOString().slice(0, 10) ?? "",
          visaExpiryDate: customer.visaExpiryDate?.toISOString().slice(0, 10) ?? "",
          status: customer.status,
          documents: customer.documents.map(({ id, url, name, mimeType, size }) => ({
            url,
            name,
            mimeType: mimeType ?? undefined,
            size: size ?? undefined,
            downloadUrl: `/api/customers/documents/${id}`,
          })),
        }}
      />
    </div>
  );
}
