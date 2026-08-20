import { createCustomer } from "@/lib/actions/customers";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { countryOptions } from "@/lib/countries";

export default async function NewCustomerPage() {
  const [, { locale, dict }] = await Promise.all([requirePermission(PERMISSIONS.customersManage), getDictionary()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={dict.customersPage.eyebrow} title={dict.customerCombobox.newCustomer} subtitle={dict.newCustomerPage.subtitle} />
      <CustomerForm action={createCustomer} submitLabel={dict.newCustomerPage.submitLabel} locale={locale} dict={dict} countries={countryOptions(locale)} />
    </div>
  );
}
