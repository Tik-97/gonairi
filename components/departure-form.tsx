"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form-state";
import {
  DepartureFields,
  type DepartureFormValues,
  type DepartureStaffOption,
  type DepartureVehicleOption,
} from "@/components/departure-fields";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

export function DepartureForm({
  action,
  vehicles = [],
  drivers = [],
  guides = [],
  defaultValues,
  submitLabel,
  restrictPastDates = true,
  departureId,
  locale,
  dict,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles?: DepartureVehicleOption[];
  drivers?: DepartureStaffOption[];
  guides?: DepartureStaffOption[];
  defaultValues?: Partial<DepartureFormValues>;
  submitLabel?: string;
  restrictPastDates?: boolean;
  departureId?: string;
  locale: Locale;
  dict: Pick<Dictionary, "departureForm" | "dateTimePicker">;
}) {
  const resolvedSubmitLabel = submitLabel ?? dict.departureForm.addDepartureDefault;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [blocked, setBlocked] = useState(false);

  return (
    <form
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
    >
      <DepartureFields
        vehicles={vehicles}
        drivers={drivers}
        guides={guides}
        defaultValues={defaultValues}
        restrictPastDates={restrictPastDates}
        departureId={departureId}
        locale={locale}
        dict={dict}
        onBlockingChange={setBlocked}
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || blocked}
        className="w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? dict.departureForm.saving : resolvedSubmitLabel}
      </button>
    </form>
  );
}
