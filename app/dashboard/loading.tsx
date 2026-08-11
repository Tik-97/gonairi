export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-24 animate-pulse rounded-[18px] bg-card/60" />
      <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse px-5 py-4">
            <div className="h-full rounded-[10px] bg-card/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
