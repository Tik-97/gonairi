"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";

const METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CARD_ONLINE", label: "Card / online" },
  { value: "OTHER", label: "Other" },
];

export function PaymentForm({
  action,
  currency,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Amount ({currency})
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
        Method
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
        Date
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
        Reference (optional)
        <input
          name="reference"
          type="text"
          placeholder="e.g. receipt #"
          className="w-40 rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] bg-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Record payment"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
