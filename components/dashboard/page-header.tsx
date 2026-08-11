export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-medium tracking-[0.2em] text-terracotta-700 uppercase">{eyebrow}</p>
        )}
        <h1 className="font-serif text-3xl font-semibold text-espresso">{title}</h1>
        {subtitle && <p className="mt-1.5 text-espresso-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
