"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { DateTimePicker } from "@/components/date-time-picker";
import { TimeZoneInput } from "@/components/time-zone-input";
import { checkVehicleAvailability } from "@/lib/actions/departures";
import { dateKeyInTimeZone, utcInstantToZonedInput, zonedDateTimeToUtc } from "@/lib/time-zone";
import { useBrowserTimeZone } from "@/lib/use-browser-time-zone";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

export type DepartureVehicleOption = {
  id: string;
  name: string;
  type: string | null;
  capacity: number;
  licensePlate: string | null;
};

export type DepartureStaffOption = { id: string; name: string };
export type DepartureVehicleRowValues = { vehicleId?: string; driverId?: string; guideId?: string };
export type DepartureFormValues = {
  date: string;
  returnAt: string;
  vehicleRows: DepartureVehicleRowValues[];
  capacity: number;
  priceOverride: number | string;
  notes: string;
};

type VehicleRow = { key: string; vehicleId: string; driverId: string; guideId: string };

function emptyRow(): VehicleRow {
  return { key: crypto.randomUUID(), vehicleId: "", driverId: "", guideId: "" };
}

export function DepartureFields({
  vehicles = [],
  drivers = [],
  guides = [],
  defaultValues,
  restrictPastDates = true,
  departureId,
  locale,
  dict,
  onBlockingChange,
}: {
  vehicles?: DepartureVehicleOption[];
  drivers?: DepartureStaffOption[];
  guides?: DepartureStaffOption[];
  defaultValues?: Partial<DepartureFormValues>;
  restrictPastDates?: boolean;
  departureId?: string;
  locale: Locale;
  dict: Pick<Dictionary, "departureForm" | "dateTimePicker">;
  onBlockingChange?: (blocked: boolean) => void;
}) {
  const browserTimeZone = useBrowserTimeZone();
  // Keep an empty transient value while the user clears/retypes the field;
  // clamp only on blur so backspacing does not immediately restore a number.
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
    return initial?.length
      ? initial.map((row) => ({
          key: crypto.randomUUID(),
          vehicleId: row.vehicleId ?? "",
          driverId: row.driverId ?? "",
          guideId: row.guideId ?? "",
        }))
      : [emptyRow()];
  });
  const [vehicleWarnings, setVehicleWarnings] = useState<Record<string, string | null>>({});

  function suggestCapacityFrom(nextRows: VehicleRow[]) {
    if (capacityTouchedByUser.current) return;
    const sum = nextRows.reduce(
      (total, row) => total + (vehicles.find((vehicle) => vehicle.id === row.vehicleId)?.capacity ?? 0),
      0,
    );
    if (sum > 0) setCapacity(sum);
  }

  function updateRow(key: string, patch: Partial<Pick<VehicleRow, "vehicleId" | "driverId" | "guideId">>) {
    setRows((previous) => {
      const next = previous.map((row) => (row.key === key ? { ...row, ...patch } : row));
      if ("vehicleId" in patch) suggestCapacityFrom(next);
      return next;
    });
  }

  function removeRow(key: string) {
    setRows((previous) => {
      const next = previous.filter((row) => row.key !== key);
      const finalRows = next.length ? next : [emptyRow()];
      suggestCapacityFrom(finalRows);
      return finalRows;
    });
    setVehicleWarnings((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!effectiveDepartureDate) {
        setVehicleWarnings({});
        return;
      }
      startTransition(async () => {
        const next: Record<string, string | null> = {};
        const departureUtc = zonedDateTimeToUtc(effectiveDepartureDate, browserTimeZone)?.toISOString() ?? null;
        const returnUtc = effectiveReturnAt
          ? zonedDateTimeToUtc(effectiveReturnAt, browserTimeZone)?.toISOString() ?? null
          : null;
        if (!departureUtc || (effectiveReturnAt && !returnUtc)) return;
        for (const row of rows) {
          next[row.key] = row.vehicleId
            ? (await checkVehicleAvailability(row.vehicleId, departureUtc, returnUtc, browserTimeZone, departureId)).conflict
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
  }, [rows.map((row) => row.vehicleId).join(","), effectiveDepartureDate, effectiveReturnAt, browserTimeZone, departureId]);

  const hasAnyResource = vehicles.length > 0 || drivers.length > 0 || guides.length > 0;
  const hasWarning = Object.values(vehicleWarnings).some(Boolean);
  useEffect(() => onBlockingChange?.(hasWarning), [hasWarning, onBlockingChange]);

  const today = dateKeyInTimeZone(new Date(), browserTimeZone);
  const todayMidnight = today ? `${today}T00:00` : undefined;

  return (
    <>
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
        <span className="text-xs text-espresso-muted">{dict.departureForm.returnHint}</span>
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
                    onChange={(event) => updateRow(row.key, { vehicleId: event.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">{dict.departureForm.noVehicle}</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} {vehicle.type ? `(${vehicle.type})` : ""} · {vehicle.capacity} {dict.departureForm.seatsSuffix}
                        {vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ""}
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
                    onChange={(event) => updateRow(row.key, { driverId: event.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">{dict.departureForm.noDriver}</option>
                    {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                </label>
              )}

              {guides.length > 0 && (
                <label className="flex flex-col gap-1 text-sm">
                  {dict.departureForm.guideLabel}
                  <select
                    name={`vehicleRow_${index}_guideId`}
                    value={row.guideId}
                    onChange={(event) => updateRow(row.key, { guideId: event.target.value })}
                    className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5"
                  >
                    <option value="">{dict.departureForm.noGuide}</option>
                    {guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          ))}
          <input type="hidden" name="vehicleRowCount" value={rows.length} />
          <button
            type="button"
            onClick={() => setRows((previous) => [...previous, emptyRow()])}
            className="flex w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-terracotta/30 px-3 py-1.5 text-sm text-terracotta-700 transition-colors hover:bg-cream-100"
          >
            {dict.departureForm.addAnotherVehicle}
          </button>
          <span className="text-xs text-espresso-muted">{dict.departureForm.capacityHint}</span>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {dict.departureForm.capacityLabel}
        <input
          name="capacity"
          type="number"
          min={1}
          value={capacity}
          onChange={(event) => {
            capacityTouchedByUser.current = true;
            const raw = event.target.value;
            setCapacity(raw === "" ? "" : Number(raw));
          }}
          onBlur={() => setCapacity((previous) => Math.max(1, previous === "" ? 1 : previous))}
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
    </>
  );
}
