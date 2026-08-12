export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  delta?: number | null;
  hint?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="rounded-[16px] bg-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] duration-500 animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-0.5 transition-transform sm:rounded-[18px] sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-espresso-muted sm:text-sm">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-navy sm:h-9 sm:w-9">
          <Icon className="h-4 w-4 text-terracotta sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-espresso sm:mt-3 sm:text-3xl">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      {delta !== undefined && delta !== null && (
        <p className={delta >= 0 ? "mt-1 text-xs font-medium text-success" : "mt-1 text-xs font-medium text-danger"}>
          {delta >= 0 ? "+" : ""}
          {delta}% this month
        </p>
      )}
      {hint && !delta && <p className="mt-1 text-xs text-espresso-muted">{hint}</p>}
    </div>
  );
}
