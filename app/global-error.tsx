"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log";
import { getClientDictionary } from "@/lib/i18n/get-client-dictionary";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logError("global", error);
  }, [error]);
  const dict = getClientDictionary();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-6 text-center text-espresso antialiased">
        <p className="text-xl font-semibold">{dict.errorBoundary.title}</p>
        <p className="max-w-xs text-sm text-espresso-muted">
          {error.digest
            ? `${dict.errorBoundary.globalWithRefPrefix} ${error.digest}${dict.errorBoundary.globalWithRefSuffix}`
            : dict.errorBoundary.globalNoRef}
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-1 rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
        >
          {dict.errorBoundary.tryAgain}
        </button>
      </body>
    </html>
  );
}
