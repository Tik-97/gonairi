"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { PhoneInput } from "@/components/phone-input";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

type CustomerFormValues = {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  notes: string;
};

export function CustomerForm({
  action,
  defaultValues,
  submitLabel,
  locale,
  dict,
  countries,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<CustomerFormValues>;
  submitLabel: string;
  locale: Locale;
  dict: Pick<Dictionary, "customerForm" | "phoneInput">;
  /** Computed server-side (not client-side) and passed down as a plain prop —
   *  Intl.DisplayNames can disagree between Node's and the browser's bundled
   *  ICU data for a handful of regions (seen: Hong Kong in ru-RU), so
   *  recomputing it client-side risked a hydration mismatch. Passing the
   *  exact SSR-rendered list through as a prop guarantees they match. */
  countries: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {dict.customerForm.fullName}
        <input
          name="fullName"
          defaultValue={defaultValues?.fullName}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.customerForm.email}
        <input
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.customerForm.phone}
        <PhoneInput name="phone" defaultValue={defaultValues?.phone} locale={locale} dict={dict.phoneInput} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.customerForm.nationality}
        <select
          name="nationality"
          defaultValue={defaultValues?.nationality ?? ""}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        >
          <option value="">{dict.customerForm.selectNationality}</option>
          {countries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.customerForm.notes}
        <textarea
          name="notes"
          defaultValue={defaultValues?.notes}
          rows={3}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? dict.customerForm.saving : submitLabel}
      </button>
    </form>
  );
}
