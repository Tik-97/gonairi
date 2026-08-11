"use client";

import { useActionState, useRef, useState } from "react";
import type { FormState } from "@/lib/actions/departures";
import { DateTimePicker } from "@/components/date-time-picker";

type VehicleOption = { id: string; name: string; type: string | null; capacity: number; licensePlate: string | null };
type StaffOption = { id: string; name: string };

export function DepartureForm({
  action,
  vehicles = [],
  drivers = [],
  guides = [],
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles?: VehicleOption[];
  drivers?: StaffOption[];
  guides?: StaffOption[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [capacity, setCapacity] = useState(10);
  const capacityTouchedByUser = useRef(false);

  function handleVehicleChange(vehicleId: string) {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    // Suggest the vehicle's seat count, but never force it — staff may already
    // have some seats spoken for before this departure goes live.
    if (vehicle && !capacityTouchedByUser.current) {
      setCapacity(vehicle.capacity);
    }
  }

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <label className="flex flex-col gap-1 text-sm">
        Date &amp; time
        <DateTimePicker name="date" required />
      </label>

      {vehicles.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          Vehicle (optional)
          <select
            name="vehicleId"
            onChange={(e) => handleVehicleChange(e.target.value)}
            defaultValue=""
            className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
          >
            <option value="">No vehicle assigned</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.type ? `(${v.type})` : ""} · {v.capacity} seats{v.licensePlate ? ` · ${v.licensePlate}` : ""}
              </option>
            ))}
          </select>
          <span className="text-xs text-espresso-muted">Selecting a vehicle suggests its seat count below — feel free to change it.</span>
        </label>
      )}

      {drivers.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          Driver (optional)
          <select name="driverId" defaultValue="" className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5">
            <option value="">No driver assigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {guides.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          Guide (optional)
          <select name="guideId" defaultValue="" className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5">
            <option value="">No guide assigned</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Capacity
        <input
          name="capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => {
            capacityTouchedByUser.current = true;
            setCapacity(Number(e.target.value) || 1);
          }}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Price override (optional)
        <input
          name="priceOverride"
          type="number"
          min={0}
          step="0.01"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes
        <input
          name="notes"
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? "Adding…" : "Add departure"}
      </button>
    </form>
  );
}
