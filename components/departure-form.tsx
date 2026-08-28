"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { DateTimePicker } from "@/components/date-time-picker";
import { TimeZoneInput } from "@/components/time-zone-input";
import { checkVehicleAvailability } from "@/lib/actions/departures";
import { dateKeyInTimeZone, utcInstantToZonedInput, zonedDateTimeToUtc } from "@/lib/time-zone";
import { useBrowserTimeZone } from "@/lib/use-browser-time-zone";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

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
  submitLabel,
  restrictPastDates = true,
  departureId,
  locale,
  dict,
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
  locale: Locale;
  dict: Pick<Dictionary, "departureForm" | "dateTimePicker">;
}) {
  const resolvedSubmitLabel = submitLabel ?? dict.departureForm.addDepartureDefault;
  const [state, formAction, pending] = useActionState(action, undefined);
  const browserTimeZone = useBrowserTimeZone();
  // "" is a transient state while the user is clearing/retyping the field —
  // clamping on every keystroke used to snap the value back to a default
  // the instant it went empty, blocking backspacing it out entirely.
  const [capacity, setCapacity] = useState<number | "">(defaultValues?.capacity ?? 10);
  const capacityTouchedByUser = useRef(defaultValues?.capacity !== undefined);
  const [departureDateValue, setDepartureDateValue] = useState<string>();
  const [returnAtValue, setReturnAtValue] = useState<string>();
  const effectiveDepartureDate = departureDateValue ?? (defaultValues?.date
    ? utcInstantToZonedInput(defaultValues.date, browserTimeZone)
    : "");
  const effectiveReturnAt = returnAtValue ?? (defaultValues?.returnAt
    ? utcInstantToZonedInput(defaultValues.returnAt, browserTimeZone)
    : "");
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
      if (!effectiveDepartureDate) {
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
        const departureUtc = zonedDateTimeToUtc(effectiveDepartureDate, browserTimeZone)?.toISOString() ?? null;
        const returnUtc = effectiveReturnAt
          ? zonedDateTimeToUtc(effectiveReturnAt, browserTimeZone)?.toISOString() ?? null
          : null;
        if (!departureUtc || (effectiveReturnAt && !returnUtc)) return;
        for (const row of rows) {
          next[row.key] = row.vehicleId
            ? (await checkVehicleAvailability(row.vehicleId, departureUtc, returnUtc, browserTimeZone, departureId))
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
  }, [rows.map((r) => r.vehicleId).join(","), effectiveDepartureDate, effectiveReturnAt, browserTimeZone, departureId]);

  const hasAnyResource = vehicles.length > 0 || drivers.length > 0 || guides.length > 0;
  const hasWarning = Object.values(vehicleWarnings).some(Boolean);
  const today = dateKeyInTimeZone(new Date(), browserTimeZone);
  const todayMidnight = today ? `${today}T00:00` : undefined;

  return (
    <form
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
    >
      <TimeZoneInput />
      <p className="text-xs text-espresso-muted">Times are entered in {browserTimeZone}.</p>
      <div className="flex flex-col gap-1 text-sm">
       <span>{dict.departureForm.departureLabel}</span>
        <DateTimePicker
          name="date"
          ariaLabel={dict.departureForm.departureLabel}
          required
          defaultValue={defaultValues?.date}
          onChange={setDepartureDateValue}
          minDate={restrictPastDates ? todayMidnight : undefined}
          locale={locale}
          dict={dict.dateTimePicker}
        />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span>{dict.departureForm.estimatedReturn}</span>
        <DateTimePicker
          name="returnAt"
          ariaLabel={dict.departureForm.estimatedReturn}
          defaultValue={defaultValues?.returnAt}
          clearable
          placeholder={dict.departureForm.selectReturnPlaceholder}
          minDate={effectiveDepartureDate || undefined}
          onChange={setReturnAtValue}
          locale={locale}
          dict={dict.dateTimePicker}
        />
        <span className="text-xs text-espresso-muted">
          {dict.departureForm.returnHint}
        </span>
      </div>

      {hasAnyResource && (
        <div className="flex flex-col gap-3">
          <span className="text-sm">{dict.departureForm.vehiclesCrew}</span>
          {rows.map((row, index) => (
            <div key={row.key} className="flex flex-col gap-2 rounded-[12px] border border-terracotta/20 bg-cream-100/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-espresso-muted">{dict.departureForm.vehicleNumberPrefix}{index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-espresso-muted transition-colors hover:bg-cream-100 hover:text-danger"
                    aria-label={`${dict.departureForm.removeVehiclePrefix}${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {vehicles.length > 0 && (
                <label className="flex flex-col gap-1 text-sm">
                  {dict.departureForm.vehicleLabel}
                  <select
                    name={`vehicleRow_${index}_vehicleId`}
                    value={row.vehicleId}
                    onChange={(e) => updateRow(row.key, { vehicleId: e.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">{dict.departureForm.noVehicle}</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.type ? `(${v.type})` : ""} · {v.capacity} {dict.departureForm.seatsSuffix}
                        {v.licensePlate ? ` · ${v.licensePlate}` : ""}
                      </option>
                    ))}
                  </select>
                  {vehicleWarnings[row.key] && <span className="text-xs text-danger">{vehicleWarnings[row.key]}</span>}
                </label>
              )}

              {drivers.length > 0 && (
                <label className="flex flex-col gap-1 text-sm">
                  {dict.departureForm.driverLabel}
                  <select
                    name={`vehicleRow_${index}_driverId`}
                    value={row.driverId}
                    onChange={(e) => updateRow(row.key, { driverId: e.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">{dict.departureForm.noDriver}</option>
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
                  {dict.departureForm.guideLabel}
                  <select
                    name={`vehicleRow_${index}_guideId`}
                    value={row.guideId}
                    onChange={(e) => updateRow(row.key, { guideId: e.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">{dict.departureForm.noGuide}</option>
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
            {dict.departureForm.addAnotherVehicle}
          </button>
          <span className="text-xs text-espresso-muted">
            {dict.departureForm.capacityHint}
          </span>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {dict.departureForm.capacityLabel}
        <input
          name="capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => {
            capacityTouchedByUser.current = true;
            const raw = e.target.value;
            setCapacity(raw === "" ? "" : Number(raw));
          }}
          onBlur={() => setCapacity((prev) => Math.max(1, prev === "" ? 1 : prev))}
          required
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.departureForm.priceOverrideLabel}
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
        {dict.departureForm.notesLabel}
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
        {pending ? dict.departureForm.saving : resolvedSubmitLabel}
      </button>
    </form>
  );
}
