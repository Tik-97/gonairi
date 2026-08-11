import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { updateCustomer } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const session = await requirePermission(PERMISSIONS.customersManage);
  const db = scopedPrisma(session.user.organizationId);
  const customer = await db.customer.findFirst({ where: { id: customerId } });

  if (!customer) {
    notFound();
  }

  const updateCustomerWithId = updateCustomer.bind(null, customer.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Your travelers" title={`Edit ${customer.fullName}`} />
      <CustomerForm
        action={updateCustomerWithId}
        submitLabel="Save changes"
        defaultValues={{
          fullName: customer.fullName,
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          nationality: customer.nationality ?? "",
          notes: customer.notes ?? "",
        }}
      />
    </div>
  );
}
