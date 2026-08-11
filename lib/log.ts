/**
 * Minimal server-side error logging convention: a consistent, greppable
 * console.error shape. Not a full observability platform — just enough to
 * turn "silently swallowed" into "visible in server/Vercel logs."
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
