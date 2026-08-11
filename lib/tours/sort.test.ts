import { describe, expect, it } from "vitest";
import { sortByNextDeparture } from "@/lib/tours/sort";

function tourWith(id: string, dates: Date[]) {
  return { id, departures: dates.map((date) => ({ date })) };
}

describe("sortByNextDeparture", () => {
  it("orders tours by their soonest upcoming departure, ascending", () => {
    const soon = tourWith("soon", [new Date("2026-01-05")]);
    const later = tourWith("later", [new Date("2026-03-01")]);
    const soonest = tourWith("soonest", [new Date("2026-01-01")]);

    const sorted = sortByNextDeparture([later, soonest, soon]);
    expect(sorted.map((t) => t.id)).toEqual(["soonest", "soon", "later"]);
  });

  it("sinks tours with no upcoming departures to the bottom", () => {
    const scheduled = tourWith("scheduled", [new Date("2026-01-01")]);
    const unscheduled = tourWith("unscheduled", []);

    expect(sortByNextDeparture([unscheduled, scheduled]).map((t) => t.id)).toEqual(["scheduled", "unscheduled"]);
  });

  it("leaves relative order of multiple unscheduled tours unaffected", () => {
    const a = tourWith("a", []);
    const b = tourWith("b", []);
    expect(sortByNextDeparture([a, b]).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input array", () => {
    const input = [tourWith("b", [new Date("2026-02-01")]), tourWith("a", [new Date("2026-01-01")])];
    const originalOrder = input.map((t) => t.id);
    sortByNextDeparture(input);
    expect(input.map((t) => t.id)).toEqual(originalOrder);
  });
});
