/**
 * Soonest-upcoming-departure first, so it's obvious at a glance which tour is
 * next — tours with nothing scheduled sink to the bottom. Used by the tours
 * list page; pulled out of the page component since it's a display/business
 * rule, not presentation.
 */
export function sortByNextDeparture<T extends { departures: { date: Date }[] }>(tours: T[]): T[] {
  return [...tours].sort((a, b) => {
    const dateA = a.departures[0]?.date;
    const dateB = b.departures[0]?.date;
    if (dateA && dateB) return dateA.getTime() - dateB.getTime();
    if (dateA) return -1;
    if (dateB) return 1;
    return 0;
  });
}
