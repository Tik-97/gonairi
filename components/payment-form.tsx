"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function PaymentForm({
  action,
  currency,
  dict,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  currency: string;
  dict: Pick<Dictionary, "paymentForm" | "paymentMethod">;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = new Date().toISOString().slice(0, 10);
  const METHOD_OPTIONS: { value: string; label: string }[] = [
    { value: "CASH", label: dict.paymentMethod.CASH },
    { value: "BANK_TRANSFER", label: dict.paymentMethod.BANK_TRANSFER },
    { value: "CARD_ONLINE", label: dict.paymentMethod.CARD_ONLINE },
    { value: "OTHER", label: dict.paymentMethod.OTHER },
  ];

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {dict.paymentForm.amountPrefix} ({currency})
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          className="w-32 rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.paymentForm.method}
        <select
          name="method"
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.paymentForm.date}
        <input
          name="paidAt"
          type="date"
          defaultValue={today}
          max={today}
          required
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.paymentForm.referenceOptional}
        <input
          name="reference"
          type="text"
          placeholder={dict.paymentForm.referencePlaceholder}
          className="w-40 rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-700 disabled:opacity-50"
      >
        {pending ? dict.paymentForm.saving : dict.paymentForm.recordPayment}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
