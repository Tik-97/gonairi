import { describe, expect, it } from "vitest";
import { vehicleWindow, windowsOverlap } from "./vehicle-availability";

function conflicts(
  a: { date: string; returnAt?: string },
  b: { date: string; returnAt?: string },
): boolean {
  const windowA = vehicleWindow(
    new Date(a.date),
    a.returnAt ? new Date(a.returnAt) : null,
  );
  const windowB = vehicleWindow(
    new Date(b.date),
    b.returnAt ? new Date(b.returnAt) : null,
  );
  return windowsOverlap(windowA, windowB);
}

describe("vehicle availability (overlap)", () => {
  it("clears once trip B departs exactly when trip A returns (back-to-back, no overlap)", () => {
    // Trip A: 10:00-12:00. Trip B departs 12:00 — no gap needed, no overlap.
    expect(
      conflicts(
        { date: "2026-09-01T10:00", returnAt: "2026-09-01T12:00" },
        { date: "2026-09-01T12:00" },
      ),
    ).toBe(false);
  });

  it("still conflicts 1 minute before trip A returns", () => {
    expect(
      conflicts(
        { date: "2026-09-01T10:00", returnAt: "2026-09-01T12:00" },
        { date: "2026-09-01T11:59" },
      ),
    ).toBe(true);
  });

  it("treats a missing return time as a full 24h hold", () => {
    // No returnAt on trip A — even a departure the next morning should conflict.
    expect(
      conflicts({ date: "2026-09-01T10:00" }, { date: "2026-09-02T09:00" }),
    ).toBe(true);
    // But two days later is well clear of the 24h hold.
    expect(
      conflicts({ date: "2026-09-01T10:00" }, { date: "2026-09-03T10:00" }),
    ).toBe(false);
  });

  it("flags a conflict when one trip's window fully contains another's", () => {
    expect(
      conflicts(
        { date: "2026-09-01T08:00", returnAt: "2026-09-01T20:00" },
        { date: "2026-09-01T12:00", returnAt: "2026-09-01T13:00" },
      ),
    ).toBe(true);
  });

  it("does not conflict across unrelated days", () => {
    expect(
      conflicts(
        { date: "2026-09-01T10:00", returnAt: "2026-09-01T12:00" },
        { date: "2026-09-05T10:00", returnAt: "2026-09-05T12:00" },
      ),
    ).toBe(false);
  });
});
