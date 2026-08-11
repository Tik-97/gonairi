"use client";

import { useActionState } from "react";
import { updateOrganization, type FormState } from "@/lib/actions/organization";
import { PhoneInput } from "@/components/phone-input";

type OrgValues = {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  isPublished: boolean;
  slug: string;
};

export function OrganizationSettingsForm({ defaultValues }: { defaultValues: OrgValues }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateOrganization, undefined);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Agency name
        <input
          name="name"
          defaultValue={defaultValues.name}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description (shown on your public page)
        <textarea
          name="description"
          defaultValue={defaultValues.description}
          rows={4}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contact email
        <input
          name="contactEmail"
          type="email"
          defaultValue={defaultValues.contactEmail}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contact phone
        <PhoneInput name="contactPhone" defaultValue={defaultValues.contactPhone} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isPublished" type="checkbox" defaultChecked={defaultValues.isPublished} className="h-4 w-4" />
        Published (your agency and its published tours appear on the public marketplace at /agencies/{defaultValues.slug})
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
