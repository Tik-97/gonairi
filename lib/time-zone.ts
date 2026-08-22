const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export const UTC_TIME_ZONE = "UTC";

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function getBrowserTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(timeZone) ? timeZone : UTC_TIME_ZONE;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function utcInstantToZonedInput(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValidTimeZone(timeZone) || Number.isNaN(date.getTime())) return "";
  const parts = partsAtInstant(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsAtInstant(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

export function dateKeyInTimeZone(date: Date, timeZone: string): string | null {
  if (!isValidTimeZone(timeZone) || Number.isNaN(date.getTime())) return null;
  const parts = partsAtInstant(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function partsAsUtc(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** Converts a wall-clock value in an explicit IANA zone to a UTC instant. */
export function zonedDateTimeToUtc(value: string, timeZone: string): Date | null {
  if (!isValidTimeZone(timeZone)) return null;
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const target: DateParts = { year, month, day, hour, minute, second: 0 };

  const calendarCheck = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    calendarCheck.getUTCHours() !== hour ||
    calendarCheck.getUTCMinutes() !== minute
  ) {
    return null;
  }

  let timestamp = partsAsUtc(target);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAtInstant(new Date(timestamp), timeZone);
    const delta = partsAsUtc(target) - partsAsUtc(actual);
    if (delta === 0) break;
    timestamp += delta;
  }

  const result = new Date(timestamp);
  const actual = partsAtInstant(result, timeZone);
  return partsAsUtc(actual) === partsAsUtc(target) ? result : null;
}

function nextCalendarDate(value: string): string | null {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** UTC bounds for one local calendar day, including 23/25-hour DST days. */
export function localDateUtcRange(value: string, timeZone: string): { start: Date; end: Date } | null {
  const next = nextCalendarDate(value);
  if (!next) return null;
  const start = zonedDateTimeToUtc(`${value}T00:00`, timeZone);
  const end = zonedDateTimeToUtc(`${next}T00:00`, timeZone);
  return start && end ? { start, end } : null;
}
