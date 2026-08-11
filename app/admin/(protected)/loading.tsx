export default function PlatformAdminLoading() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-[18px] bg-card/60" />
      ))}
    </div>
  );
}
