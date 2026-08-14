const HOUR_MS = 60 * 60 * 1000;
// Padding applied to both ends of a vehicle's occupied window: time to get to
// the departure point, and slack on the way back since a trip doesn't always
// return exactly on schedule. A raw gap of just 1h between one trip's return
// and the next one's departure still counts as a conflict — 2h clears it.
export const VEHICLE_BUFFER_MS = HOUR_MS;
// No return time given -> assume the vehicle is held for a full day rather
// than silently treating it as free for the rest of the day.
export const DEFAULT_VEHICLE_HOLD_MS = 24 * HOUR_MS;

export type TimeWindow = { start: Date; end: Date };

export function vehicleWindow(date: Date, returnAt: Date | null): TimeWindow {
  const effectiveReturn =
    returnAt ?? new Date(date.getTime() + DEFAULT_VEHICLE_HOLD_MS);
  return {
    start: new Date(date.getTime() - VEHICLE_BUFFER_MS),
    end: new Date(effectiveReturn.getTime() + VEHICLE_BUFFER_MS),
  };
}

export function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.start < b.end && b.start < a.end;
}
