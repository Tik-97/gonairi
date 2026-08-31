/**
 * Shared defense-in-depth predicate for every unauthenticated tour read.
 * `isPublished` is the agency's intent; `isPrivate` is the hard boundary that
 * keeps an individual tour hidden even if malformed data marks it published.
 */
export const PUBLIC_TOUR_VISIBILITY = {
  isPublished: true,
  isPrivate: false,
  deletedAt: null,
} as const;
