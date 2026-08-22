"use client";

import { useBrowserTimeZone } from "@/lib/use-browser-time-zone";

const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
};

function format(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-GB", { ...FORMAT_OPTIONS, timeZone }).format(date);
}

export function LocalDateTime({ value, className }: { value: string; className?: string }) {
  const timeZone = useBrowserTimeZone();
  const display = format(value, timeZone);

  return (
    <time dateTime={value} className={className} title={`Shown in ${timeZone}`}>
      {display}
    </time>
  );
}
