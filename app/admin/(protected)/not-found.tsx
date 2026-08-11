import Link from "next/link";
import { Compass } from "lucide-react";

export default function PlatformAdminNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <Compass className="h-16 w-16 text-terracotta opacity-30" strokeWidth={1.25} />
      <p className="font-serif text-lg text-espresso">We couldn&apos;t find that</p>
      <p className="max-w-xs text-sm text-espresso-muted">
        The page you&apos;re looking for doesn&apos;t exist, or may have been removed.
      </p>
      <Link
        href="/admin/roles"
        className="mt-1 rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
      >
        Back to roles
      </Link>
    </div>
  );
}
