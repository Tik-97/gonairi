"use client";

import { useActionState } from "react";
import { updateOrganization, type FormState } from "@/lib/actions/organization";
import { PhoneInput } from "@/components/phone-input";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

type OrgValues = {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  isPublished: boolean;
  slug: string;
};

export function OrganizationSettingsForm({
  defaultValues,
  locale,
  dict,
}: {
  defaultValues: OrgValues;
  locale: Locale;
  dict: Pick<Dictionary, "orgSettingsForm" | "phoneInput">;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateOrganization, undefined);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {dict.orgSettingsForm.agencyName}
        <input
          name="name"
          defaultValue={defaultValues.name}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.orgSettingsForm.descriptionLabel}
        <textarea
          name="description"
          defaultValue={defaultValues.description}
          rows={4}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.orgSettingsForm.contactEmail}
        <input
          name="contactEmail"
          type="email"
          defaultValue={defaultValues.contactEmail}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.orgSettingsForm.contactPhone}
        <PhoneInput name="contactPhone" defaultValue={defaultValues.contactPhone} locale={locale} dict={dict.phoneInput} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="isPublished" type="checkbox" defaultChecked={defaultValues.isPublished} className="h-4 w-4" />
        {dict.orgSettingsForm.publishedPrefix}{defaultValues.slug}{dict.orgSettingsForm.publishedSuffix}
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{dict.orgSettingsForm.saved}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? dict.orgSettingsForm.saving : dict.orgSettingsForm.saveSettings}
      </button>
    </form>
  );
}
