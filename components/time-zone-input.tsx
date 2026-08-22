"use client";

import { useBrowserTimeZone } from "@/lib/use-browser-time-zone";

export function TimeZoneInput() {
  const timeZone = useBrowserTimeZone();
  return <input type="hidden" name="timeZone" value={timeZone} />;
}
