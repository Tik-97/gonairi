"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { DateTimePicker } from "@/components/date-time-picker";
import { checkVehicleAvailability } from "@/lib/actions/departures";

type VehicleOption = {
  id: string;
  name: string;
  type: string | null;
  capacity: number;
  licensePlate: string | null;
};
type StaffOption = { id: string; name: string };

type VehicleRowValues = { vehicleId?: string; driverId?: string; guideId?: string };
type VehicleRow = { key: string; vehicleId: string; driverId: string; guideId: string };

function emptyRow(): VehicleRow {
  return { key: crypto.randomUUID(), vehicleId: "", driverId: "", guideId: "" };
}

type DepartureFormValues = {
  date: string;
  returnAt: string;
  vehicleRows: VehicleRowValues[];
  capacity: number;
  priceOverride: number | string;
  notes: string;
};

export function DepartureForm({
  action,
  vehicles = [],
  drivers = [],
  guides = [],
  defaultValues,
  submitLabel = "Add departure",
  restrictPastDates = true,
  departureId,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  vehicles?: VehicleOption[];
  drivers?: StaffOption[];
  guides?: StaffOption[];
  defaultValues?: Partial<DepartureFormValues>;
  submitLabel?: string;
  /** New departures can't be dated before today. Editing an existing (maybe
   *  already-past) departure should never be blocked by this, so the edit
   *  page passes false. */
  restrictPastDates?: boolean;
  /** Excludes this departure from its own vehicle-availability check — set
   *  when editing. */
  departureId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [capacity, setCapacity] = useState(defaultValues?.capacity ?? 10);
  const capacityTouchedByUser = useRef(defaultValues?.capacity !== undefined);
  const [departureDateValue, setDepartureDateValue] = useState(defaultValues?.date ?? "");
  const [returnAtValue, setReturnAtValue] = useState(defaultValues?.returnAt ?? "");
  const [rows, setRows] = useState<VehicleRow[]>(() => {
    const initial = defaultValues?.vehicleRows;
    if (initial && initial.length > 0) {
      return initial.map((r) => ({
        key: crypto.randomUUID(),
        vehicleId: r.vehicleId ?? "",
        driverId: r.driverId ?? "",
        guideId: r.guideId ?? "",
      }));
    }
    return [emptyRow()];
  });
  const [vehicleWarnings, setVehicleWarnings] = useState<Record<string, string | null>>({});

  function suggestCapacityFrom(nextRows: VehicleRow[]) {
    if (capacityTouchedByUser.current) return;
    const sum = nextRows.reduce((total, r) => total + (vehicles.find((v) => v.id === r.vehicleId)?.capacity ?? 0), 0);
    // Suggest, never force — and never overwrite with 0 just because every
    // row is currently vehicle-less, matching the previous single-select
    // behavior (clearing "vehicle" never used to reset capacity either).
    if (sum > 0) setCapacity(sum);
  }

  function updateRow(key: string, patch: Partial<Pick<VehicleRow, "vehicleId" | "driverId" | "guideId">>) {
    setRows((prev) => {
      const next = prev.map((r) => (r.key === key ? { ...r, ...patch } : r));
      if ("vehicleId" in patch) suggestCapacityFrom(next);
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key);
      const finalRows = next.length ? next : [emptyRow()];
      suggestCapacityFrom(finalRows);
      return finalRows;
    });
    setVehicleWarnings((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Live per-row vehicle-availability check as the user fills in
  // date/return/vehicle — surfaces a conflict while they're still editing
  // instead of only failing (or, previously, sometimes crashing) at submit.
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!departureDateValue) {
        setVehicleWarnings({});
        return;
      }
      // Server Functions called outside a <form action> or useActionState
      // dispatch (e.g. here, from an effect) must be wrapped in
      // startTransition — see node_modules/next/dist/docs/01-app/02-guides/server-actions.md.
      // Checked sequentially (not Promise.all) since Next dispatches Server
      // Functions from the client one at a time per client anyway.
      startTransition(async () => {
        const next: Record<string, string | null> = {};
        for (const row of rows) {
          next[row.key] = row.vehicleId
            ? (await checkVehicleAvailability(row.vehicleId, departureDateValue, returnAtValue || null, departureId))
                .conflict
            : null;
        }
        if (!cancelled) setVehicleWarnings(next);
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.vehicleId).join(","), departureDateValue, returnAtValue, departureId]);

  const hasAnyResource = vehicles.length > 0 || drivers.length > 0 || guides.length > 0;
  const hasWarning = Object.values(vehicleWarnings).some(Boolean);
  const today = new Date();
  const todayMidnight = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T00:00`;

  return (
    <form
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-col gap-1 text-sm">
        <span>Departure (leaving)</span>
        <DateTimePicker
          name="date"
          ariaLabel="Departure (leaving)"
          required
          defaultValue={defaultValues?.date}
          onChange={setDepartureDateValue}
          minDate={restrictPastDates ? todayMidnight : undefined}
        />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span>Estimated return (optional)</span>
        <DateTimePicker
          name="returnAt"
          ariaLabel="Estimated return (optional)"
          defaultValue={defaultValues?.returnAt}
          clearable
          placeholder="Select return date & time"
          minDate={departureDateValue || undefined}
          onChange={setReturnAtValue}
        />
        <span className="text-xs text-espresso-muted">
          Used to check vehicles are free for other departures. Left blank, a vehicle is assumed booked for a full
          24h.
        </span>
      </div>

      {hasAnyResource && (
        <div className="flex flex-col gap-3">
          <span className="text-sm">Vehicles &amp; crew (optional)</span>
          {rows.map((row, index) => (
            <div key={row.key} className="flex flex-col gap-2 rounded-[12px] border border-terracotta/20 bg-cream-100/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-espresso-muted">Vehicle #{index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-espresso-muted transition-colors hover:bg-cream-100 hover:text-danger"
                    aria-label={`Remove vehicle #${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {vehicles.length > 0 && (
                <label className="flex flex-col gap-1 text-sm">
                  Vehicle
                  <select
                    name={`vehicleRow_${index}_vehicleId`}
                    value={row.vehicleId}
                    onChange={(e) => updateRow(row.key, { vehicleId: e.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">No vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.type ? `(${v.type})` : ""} · {v.capacity} seats
                        {v.licensePlate ? ` · ${v.licensePlate}` : ""}
                      </option>
                    ))}
                  </select>
                  {vehicleWarnings[row.key] && <span className="text-xs text-danger">{vehicleWarnings[row.key]}</span>}
                </label>
              )}

              {drivers.length > 0 && (
                <label className="flex flex-col gap-1 text-sm">
                  Driver
                  <select
                    name={`vehicleRow_${index}_driverId`}
                    value={row.driverId}
                    onChange={(e) => updateRow(row.key, { driverId: e.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">No driver</option>
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
                  Guide
                  <select
                    name={`vehicleRow_${index}_guideId`}
                    value={row.guideId}
                    onChange={(e) => updateRow(row.key, { guideId: e.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">No guide</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
          <input type="hidden" name="vehicleRowCount" value={rows.length} />
          <button
            type="button"
            onClick={addRow}
            className="flex w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-terracotta/30 px-3 py-1.5 text-sm text-terracotta-700 transition-colors hover:bg-cream-100"
          >
            + Add another vehicle
          </button>
          <span className="text-xs text-espresso-muted">
            Selecting vehicles suggests a total seat count below — feel free to change it. Add more than one for
            tours that run several vehicles at once (e.g. a jeeping tour).
          </span>
        </div>
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
          defaultValue={defaultValues?.priceOverride}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes
        <input
          name="notes"
          defaultValue={defaultValues?.notes}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || hasWarning}
        className="w-fit rounded-[12px] bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-terracotta-700"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
