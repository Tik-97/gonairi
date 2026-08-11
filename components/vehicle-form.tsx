"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { VehicleTypePicker } from "@/components/vehicle-type-picker";
import { PhoneInput } from "@/components/phone-input";

type VehicleFormValues = {
  name: string;
  type: string;
  capacity: number;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
};

export function VehicleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<VehicleFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="e.g. Bus 1, Mercedes Sprinter"
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Type
        <VehicleTypePicker name="type" defaultValue={defaultValues?.type} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Capacity (seats)
        <input
          name="capacity"
          type="number"
          min={1}
          defaultValue={defaultValues?.capacity ?? 10}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        License plate
        <input
          name="licensePlate"
          defaultValue={defaultValues?.licensePlate}
          placeholder="00AA000"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Driver name
        <input
          name="driverName"
          defaultValue={defaultValues?.driverName}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Driver phone
        <PhoneInput name="driverPhone" defaultValue={defaultValues?.driverPhone} />
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
