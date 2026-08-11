import Link from "next/link";
import { Compass } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-cream px-6 py-24 text-center text-espresso">
      <Compass className="h-16 w-16 text-terracotta opacity-30" strokeWidth={1.25} />
      <p className="font-serif text-xl text-espresso">Page not found</p>
      <p className="max-w-xs text-sm text-espresso-muted">
        The page you&apos;re looking for doesn&apos;t exist, or may have been removed.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
      >
        Go home
      </Link>
    </div>
  );
}
