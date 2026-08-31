const HOUR_MS = 60 * 60 * 1000;
// No return time given -> assume the vehicle is held for a full day rather
// than silently treating it as free for the rest of the day.
export const DEFAULT_VEHICLE_HOLD_MS = 24 * HOUR_MS;

export type TimeWindow = { start: Date; end: Date };

export function vehicleWindow(date: Date, returnAt: Date | null): TimeWindow {
  const effectiveReturn =
    returnAt ?? new Date(date.getTime() + DEFAULT_VEHICLE_HOLD_MS);
  return {
    start: date,
    end: effectiveReturn,
  };
}

export function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.start < b.end && b.start < a.end;
}
