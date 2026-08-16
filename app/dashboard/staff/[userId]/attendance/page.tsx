import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X as XIcon } from "lucide-react";
import { requireOwner } from "@/lib/auth/session";
import { scopedPrisma } from "@/lib/db/scoped";
import { setAttendance, clearAttendance } from "@/lib/actions/attendance";
import { PageHeader } from "@/components/dashboard/page-header";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function buildMonthWeeks(year: number, month: number): (number | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-start
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default async function StaffAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { userId } = await params;
  const { month: monthParam } = await searchParams;
  const session = await requireOwner();
  const db = scopedPrisma(session.user.organizationId);

  const member = await db.user.findFirst({ where: { id: userId } });
  if (!member) {
    notFound();
  }

  const now = new Date();
  const isValidMonth = monthParam && /^\d{4}-\d{2}$/.test(monthParam);
  const year = isValidMonth ? Number(monthParam.slice(0, 4)) : now.getFullYear();
  const month = isValidMonth ? Number(monthParam.slice(5, 7)) - 1 : now.getMonth();

  const rangeStart = new Date(Date.UTC(year, month, 1));
  const rangeEnd = new Date(Date.UTC(year, month + 1, 1));

  const records = await db.attendance.findMany({
    where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
  });
  const byDay = new Map(records.map((r) => [r.date.toISOString().slice(0, 10), r.status]));

  const weeks = buildMonthWeeks(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const prevHref = `/dashboard/staff/${userId}/attendance?month=${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}`;
  const nextHref = `/dashboard/staff/${userId}/attendance?month=${nextMonth.getFullYear()}-${pad(nextMonth.getMonth() + 1)}`;

  const workedCount = [...byDay.values()].filter((s) => s === "WORKED").length;
  const absentCount = [...byDay.values()].filter((s) => s === "ABSENT").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your team"
        title={`${member.name} — attendance`}
        subtitle={`${workedCount} day(s) worked, ${absentCount} absent in ${monthLabel}.`}
        action={
          <Link href="/dashboard/staff" className="text-sm text-terracotta-700 underline">
            Back to staff
          </Link>
        }
      />

      <div className="rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <Link href={prevHref} className="rounded-full px-3 py-1.5 text-sm text-espresso-muted transition-colors hover:bg-cream-100">
            ← Prev
          </Link>
          <p className="font-serif text-lg font-medium text-espresso">{monthLabel}</p>
          <Link href={nextHref} className="rounded-full px-3 py-1.5 text-sm text-espresso-muted transition-colors hover:bg-cream-100">
            Next →
          </Link>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-xs text-espresso-muted">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const dateKey = toDateKey(year, month, day);
                const status = byDay.get(dateKey);
                return (
                  <div
                    key={di}
                    className={`flex flex-col items-center gap-1 rounded-[10px] border p-1.5 text-center ${
                      status === "WORKED"
                        ? "border-success/30 bg-success/10"
                        : status === "ABSENT"
                          ? "border-danger/30 bg-danger/10"
                          : "border-border"
                    }`}
                  >
                    <span className="text-xs text-espresso">{day}</span>
                    <div className="flex gap-1">
                      <form action={setAttendance.bind(null, userId, dateKey, "WORKED")}>
                        <button
                          type="submit"
                          aria-label={`Mark ${dateKey} worked`}
                          className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                            status === "WORKED" ? "bg-success text-white" : "text-espresso-muted hover:bg-success/20"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                      </form>
                      <form action={setAttendance.bind(null, userId, dateKey, "ABSENT")}>
                        <button
                          type="submit"
                          aria-label={`Mark ${dateKey} absent`}
                          className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                            status === "ABSENT" ? "bg-danger text-white" : "text-espresso-muted hover:bg-danger/20"
                          }`}
                        >
                          <XIcon className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                      </form>
                    </div>
                    {status && (
                      <form action={clearAttendance.bind(null, userId, dateKey)}>
                        <button type="submit" className="text-[10px] text-espresso-muted underline">
                          clear
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
