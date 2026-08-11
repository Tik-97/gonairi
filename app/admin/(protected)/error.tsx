"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { logError } from "@/lib/log";

export default function PlatformAdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logError("platform-admin", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-danger/30 bg-card/60 px-6 py-14 text-center">
      <TriangleAlert className="h-16 w-16 text-danger opacity-40" strokeWidth={1.25} />
      <p className="font-serif text-lg text-espresso">Something went wrong</p>
      <p className="max-w-xs text-sm text-espresso-muted">
        {error.digest ? `We hit a snag loading this page (ref: ${error.digest}).` : "We hit a snag loading this page."}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-1 rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
      >
        Try again
      </button>
    </div>
  );
}
