"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { PhoneInput } from "@/components/phone-input";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  roles: string[];
};

export function StaffForm({
  action,
  defaultValues,
  submitLabel,
  showEmailAndPassword = true,
  locale,
  dict,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<StaffFormValues>;
  submitLabel: string;
  showEmailAndPassword?: boolean;
  locale: Locale;
  dict: Pick<Dictionary, "staffForm" | "roles" | "phoneInput">;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ROLE_OPTIONS = [
    { value: "OPERATOR", label: dict.roles.OPERATOR, hint: dict.staffForm.operatorHint },
    { value: "DRIVER", label: dict.roles.DRIVER, hint: dict.staffForm.driverHint },
    { value: "GUIDE", label: dict.roles.GUIDE, hint: dict.staffForm.guideHint },
    {
      value: "DRIVER_GUIDE",
      label: dict.roles.DRIVER_GUIDE,
      hint: dict.staffForm.driverGuideHint,
    },
  ] as const;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {dict.staffForm.name}
        <input
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>

      {showEmailAndPassword && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            {dict.staffForm.email}
            <input
              name="email"
              type="email"
              defaultValue={defaultValues?.email}
              required
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {dict.staffForm.password}
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {dict.staffForm.phone}
        <PhoneInput name="phone" defaultValue={defaultValues?.phone} locale={locale} dict={dict.phoneInput} />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span>{dict.staffForm.rolesLabel}</span>
        <span className="text-xs text-espresso-muted">{dict.staffForm.rolesHint}</span>
        <div className="flex flex-col gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5"
            >
              <input
                type="checkbox"
                name="roles"
                value={opt.value}
                defaultChecked={defaultValues?.roles ? defaultValues.roles.includes(opt.value) : opt.value === "OPERATOR"}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <span className="block font-medium text-espresso">{opt.label}</span>
                <span className="block text-xs text-espresso-muted">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? dict.staffForm.saving : submitLabel}
      </button>
    </form>
  );
}
