"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { PhoneInput } from "@/components/phone-input";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin", hint: "Full access, including deleting tours and customers." },
  { value: "OPERATOR", label: "Operator", hint: "Day-to-day bookings, customers, tours — can't delete." },
  { value: "DRIVER", label: "Driver", hint: "Can be assigned to departures as the driver." },
  { value: "GUIDE", label: "Guide", hint: "Can be assigned to departures as the guide." },
] as const;

type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

export function StaffForm({
  action,
  defaultValues,
  submitLabel,
  showEmailAndPassword = true,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<StaffFormValues>;
  submitLabel: string;
  showEmailAndPassword?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
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
            Email
            <input
              name="email"
              type="email"
              defaultValue={defaultValues?.email}
              required
              className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
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
        Phone
        <PhoneInput name="phone" defaultValue={defaultValues?.phone} />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span>Role</span>
        <div className="flex flex-col gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5"
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                defaultChecked={defaultValues?.role ? defaultValues.role === opt.value : opt.value === "OPERATOR"}
                required
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
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
