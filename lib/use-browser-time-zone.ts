"use client";

import { useSyncExternalStore } from "react";
import { getBrowserTimeZone, UTC_TIME_ZONE } from "@/lib/time-zone";

const subscribe = () => () => {};

/** Hydration-safe access to the browser's IANA timezone. */
export function useBrowserTimeZone(): string {
  return useSyncExternalStore(subscribe, getBrowserTimeZone, () => UTC_TIME_ZONE);
}
