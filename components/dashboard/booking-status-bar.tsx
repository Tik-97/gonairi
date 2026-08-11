import { Clock, CheckCircle2, XCircle, UserX } from "lucide-react";

const SEGMENTS = [
  { key: "pending", label: "Pending", color: "#D8A33A", icon: Clock },
  { key: "confirmed", label: "Confirmed", color: "#5E9E62", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelled", color: "#C95C4D", icon: XCircle },
  { key: "noShow", label: "No-show", color: "#6B7A4F", icon: UserX },
] as const;

export function BookingStatusBar({
  counts,
}: {
  counts: { pending: number; confirmed: number; cancelled: number; noShow: number };
}) {
  const total = counts.pending + counts.confirmed + counts.cancelled + counts.noShow;

  if (total === 0) {
    return <p className="text-sm text-espresso-muted">No bookings yet.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-cream-100">
        {SEGMENTS.map((segment, i) => {
          const value = counts[segment.key];
          if (value === 0) return null;
          const pct = (value / total) * 100;
          return (
            <div
              key={segment.key}
              style={{ width: `${pct}%`, backgroundColor: segment.color }}
              className={i > 0 ? "ml-[2px]" : undefined}
              title={`${segment.label}: ${value}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {SEGMENTS.map((segment) => {
          const Icon = segment.icon;
          return (
            <div key={segment.key} className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden="true"
              >
                <Icon className="h-3 w-3 text-white" strokeWidth={2.25} />
              </span>
              <span className="text-espresso-muted">{segment.label}</span>
              <span className="font-medium text-espresso">{counts[segment.key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
