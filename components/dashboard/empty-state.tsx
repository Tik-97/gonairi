import { Compass } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <Compass className="h-16 w-16 text-terracotta opacity-30" strokeWidth={1.25} />
      <p className="font-serif text-lg text-espresso">{title}</p>
      <p className="max-w-xs text-sm text-espresso-muted">{message}</p>
    </div>
  );
}
