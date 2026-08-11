"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { PhoneInput } from "@/components/phone-input";

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
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<CustomerFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Full name
        <input
          name="fullName"
          defaultValue={defaultValues?.fullName}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Phone
        <PhoneInput name="phone" defaultValue={defaultValues?.phone} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nationality
        <input
          name="nationality"
          defaultValue={defaultValues?.nationality}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes
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
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
