"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useClickOutside } from "@/components/use-click-outside";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/config";

// Native <input type="time"> renders in the OS/browser's locale (AM/PM on
// most Windows/US setups) regardless of the `lang` attribute — Chromium
// stopped honoring per-element lang for form-control formatting some
// versions back. A plain text field we fully control is the only way to
// guarantee 24h everywhere.
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDatetimeLocal(date: Date, time: string): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;
}

function dateFnsLocale(locale: Locale): string {
  return locale === "ru" ? "ru-RU" : "en-GB";
}

function formatDisplay(date: Date, time: string, locale: Locale): string {
  const datePart = date.toLocaleDateString(dateFnsLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${datePart}, ${time}`;
}

function buildCalendarWeeks(
  viewYear: number,
  viewMonth: number,
): (Date | null)[][] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-start
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewYear, viewMonth, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Parses a "YYYY-MM-DDTHH:mm" value (the same shape this component submits)
 *  back into a Date + time string, for pre-filling an edit form. */
function parseDefaultValue(value: string | undefined): {
  date: Date | null;
  time: string;
} {
  if (!value) return { date: null, time: "12:00" };
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return { date: null, time: "12:00" };
  return {
    date: new Date(year, month - 1, day),
    time: timePart?.slice(0, 5) || "12:00",
  };
}

function combine(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(h || 0, m || 0, 0, 0);
  return combined;
}

export function DateTimePicker({
  name,
  required,
  defaultValue,
  clearable,
  placeholder,
  minDate,
  onChange,
  locale,
  dict,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  /** Shows a "Clear" action so an optional value can be unset once applied. */
  clearable?: boolean;
  placeholder?: string;
  /** "YYYY-MM-DDTHH:mm" — earlier days are unpickable, and on the boundary
   *  day the time input won't go earlier than this either. */
  minDate?: string;
  /** Fires with the applied "YYYY-MM-DDTHH:mm" value (or "" when cleared) —
   *  lets a parent form track this picker's value to constrain another one. */
  onChange?: (value: string) => void;
  locale: Locale;
  dict: Dictionary["dateTimePicker"];
}) {
  const initial = parseDefaultValue(defaultValue);
  const [open, setOpen] = useState(false);
  const [appliedDate, setAppliedDate] = useState<Date | null>(initial.date);
  const [appliedTime, setAppliedTime] = useState(initial.time);
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftTime, setDraftTime] = useState("12:00");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const minParsed = parseDefaultValue(minDate);
  const minDateTime = minParsed.date
    ? combine(minParsed.date, minParsed.time)
    : null;
  const draftViolatesMin = Boolean(
    minDateTime &&
    draftDate &&
    TIME_PATTERN.test(draftTime) &&
    combine(draftDate, draftTime) < minDateTime,
  );

  function openPicker() {
    const base = appliedDate ?? minParsed.date ?? new Date();
    setDraftDate(appliedDate);
    setDraftTime(appliedTime);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  }

  function confirm() {
    if (draftDate && !draftViolatesMin) {
      setAppliedDate(draftDate);
      setAppliedTime(draftTime);
      onChange?.(toDatetimeLocal(draftDate, draftTime));
    }
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  const weeks = buildCalendarWeeks(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    dateFnsLocale(locale),
    { month: "long", year: "numeric" },
  );

  return (
    <div ref={containerRef} className="relative">
      <input
        type="hidden"
        name={name}
        value={appliedDate ? toDatetimeLocal(appliedDate, appliedTime) : ""}
        required={required}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openPicker}
          className="flex w-full items-center gap-2.5 rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-left"
        >
          <Calendar
            className="h-4 w-4 shrink-0 text-terracotta-700"
            strokeWidth={1.75}
          />
          <span
            className={appliedDate ? "text-espresso" : "text-espresso-muted"}
          >
            {appliedDate
              ? formatDisplay(appliedDate, appliedTime, locale)
              : (placeholder ?? dict.selectDateTime)}
          </span>
        </button>
        {clearable && appliedDate && (
          <button
            type="button"
            onClick={() => {
              setAppliedDate(null);
              onChange?.("");
            }}
            className="shrink-0 text-xs text-espresso-muted underline transition-colors hover:text-espresso"
          >
            {dict.clear}
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-1.5 w-[min(18rem,calc(100vw-2rem))] max-w-[90vw] rounded-[18px] border border-border bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-espresso-muted transition-colors hover:bg-cream-100 hover:text-espresso"
              aria-label={dict.previousMonth}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <p className="text-sm font-medium text-espresso">{monthLabel}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-espresso-muted transition-colors hover:bg-cream-100 hover:text-espresso"
              aria-label={dict.nextMonth}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-xs text-espresso-muted">
            {dict.weekdays.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {weeks.flatMap((week, wi) =>
              week.map((day, di) => {
                if (!day) return <span key={`${wi}-${di}`} />;
                const isSelected = draftDate
                  ? isSameDay(day, draftDate)
                  : false;
                const isBeforeMin = minParsed.date
                  ? day < minParsed.date && !isSameDay(day, minParsed.date)
                  : false;
                return (
                  <button
                    key={`${wi}-${di}`}
                    type="button"
                    disabled={isBeforeMin}
                    onClick={() => setDraftDate(day)}
                    className={
                      isSelected
                        ? "mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-terracotta font-medium text-white"
                        : isBeforeMin
                          ? "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-espresso-muted/40"
                          : "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-espresso transition-colors hover:bg-cream-100"
                    }
                  >
                    {day.getDate()}
                  </button>
                );
              }),
            )}
          </div>

          <label className="mt-4 flex items-center justify-between gap-3 text-sm text-espresso-muted">
            {dict.time24h}
            <input
              type="text"
              inputMode="numeric"
              placeholder="HH:mm"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              className="w-20 rounded-[12px] border border-terracotta/25 bg-white px-3 py-1.5 text-center text-espresso"
            />
          </label>
          {!TIME_PATTERN.test(draftTime) && (
            <p className="mt-1.5 text-xs text-danger">
              {dict.timeFormatHint}
            </p>
          )}
          {draftViolatesMin && (
            <p className="mt-1.5 text-xs text-danger">
              {dict.mustBeAfter} {formatDisplay(minParsed.date!, minParsed.time, locale)}.
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-[12px] px-4 py-2 text-sm font-medium text-espresso-muted transition-colors hover:bg-cream-100"
            >
              {dict.cancel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={
                !draftDate || !TIME_PATTERN.test(draftTime) || draftViolatesMin
              }
              className="rounded-[12px] bg-terracotta px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-700 disabled:opacity-50"
            >
              {dict.ok}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
