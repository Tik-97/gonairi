import { createCustomer } from "@/lib/actions/customers";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function NewCustomerPage() {
  await requirePermission(PERMISSIONS.customersManage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Your travelers" title="New customer" subtitle="A few details now save you a search later." />
      <CustomerForm action={createCustomer} submitLabel="Create customer" />
    </div>
  );
}
