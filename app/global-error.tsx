"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log";
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

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-6 text-center text-espresso antialiased">
        <p className="text-xl font-semibold">Something went wrong</p>
        <p className="max-w-xs text-sm text-espresso-muted">
          {error.digest ? `The app hit an unexpected error (ref: ${error.digest}).` : "The app hit an unexpected error."}
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-1 rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
