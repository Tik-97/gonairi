import type * as z from "zod";

/**
 * Shared return type for Server Actions wired through useActionState: a simple
 * error message to show under the form, or undefined for the pristine/success
 * case. Was previously redefined verbatim in 9 separate lib/actions/*.ts files —
 * re-export it from each so existing `import type { FormState } from
 * "@/lib/actions/<domain>"` call sites in components don't need to change.
 */
export type FormState = { error?: string } | undefined;

/**
 * The standard mapping from a failed Zod safeParse() to FormState, used at the
 * top of nearly every Server Action in this app: show the first validation
 * issue's message, or a generic fallback.
 */
export function formStateFromZodError(error: z.ZodError): FormState {
  return { error: error.issues[0]?.message ?? "Invalid input." };
}
