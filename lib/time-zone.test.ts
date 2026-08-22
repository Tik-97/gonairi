import { describe, expect, it } from "vitest";
import { isValidTimeZone, localDateUtcRange, utcInstantToZonedInput, zonedDateTimeToUtc } from "@/lib/time-zone";

describe("time-zone boundaries", () => {
  it("converts an Armenian wall time to UTC", () => {
    expect(zonedDateTimeToUtc("2026-08-21T14:30", "Asia/Yerevan")?.toISOString()).toBe(
      "2026-08-21T10:30:00.000Z",
    );
  });

  it("uses the offset at the selected date rather than today's offset", () => {
    expect(zonedDateTimeToUtc("2026-01-15T10:00", "America/New_York")?.toISOString()).toBe(
      "2026-01-15T15:00:00.000Z",
    );
    expect(zonedDateTimeToUtc("2026-07-15T10:00", "America/New_York")?.toISOString()).toBe(
      "2026-07-15T14:00:00.000Z",
    );
  });

  it("round-trips a stored instant for an edit form", () => {
    const instant = "2026-08-21T10:30:00.000Z";
    const local = utcInstantToZonedInput(instant, "Asia/Yerevan");
    expect(local).toBe("2026-08-21T14:30");
    expect(zonedDateTimeToUtc(local, "Asia/Yerevan")?.toISOString()).toBe(instant);
  });

  it("rejects nonexistent wall times during the spring DST jump", () => {
    expect(zonedDateTimeToUtc("2026-03-08T02:30", "America/New_York")).toBeNull();
  });

  it("returns DST-aware local-day boundaries", () => {
    const range = localDateUtcRange("2026-03-08", "America/New_York");
    expect(range?.start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(range?.end.toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });

  it("rejects unknown time zones", () => {
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});
