"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { logError } from "@/lib/log";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logError("root", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-cream px-6 py-24 text-center text-espresso">
      <TriangleAlert className="h-16 w-16 text-danger opacity-40" strokeWidth={1.25} />
      <p className="font-serif text-xl text-espresso">Something went wrong</p>
      <p className="max-w-xs text-sm text-espresso-muted">
        {error.digest ? `We hit a snag loading this page (ref: ${error.digest}).` : "We hit a snag loading this page."}
      </p>
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-espresso/70 underline hover:text-espresso">
          Go home
        </Link>
      </div>
    </div>
  );
}
