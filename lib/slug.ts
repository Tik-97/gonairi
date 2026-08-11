export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * Appends -2, -3, ... to `base` until `isTaken` reports false. Shared by every
 * slug-uniqueness check in the app (tour slugs, organization slugs) — each
 * caller only needs to say how to check a candidate against its own table.
 */
export async function uniqueSlug(base: string, isTaken: (candidate: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  let attempt = 1;
  while (await isTaken(candidate)) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}
