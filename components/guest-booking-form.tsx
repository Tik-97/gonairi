"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";

export function GuestBookingForm({
  action,
  maxPax,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  maxPax: number;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const inputClass =
    "rounded-lg border border-terracotta/25 bg-white px-3 py-2.5 text-espresso placeholder:text-espresso/40 focus:border-terracotta focus:outline-none";

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-terracotta/15 bg-white/70 p-6">
      <label className="flex flex-col gap-1 text-sm text-espresso/80">
        Full name
        <input name="fullName" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-espresso/80">
        Email
        <input name="email" type="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-espresso/80">
        Phone
        <input name="phone" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-espresso/80">
        Pax count (max {maxPax})
        <input name="paxCount" type="number" min={1} max={maxPax} defaultValue={1} required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-espresso/80">
        Special requests
        <textarea name="specialRequests" rows={3} className={inputClass} />
      </label>
      {state?.error && <p className="text-sm text-brick">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-full bg-terracotta px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700 disabled:opacity-50"
      >
        {pending ? "Booking…" : "Request booking"}
      </button>
    </form>
  );
}
