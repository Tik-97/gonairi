export type DepartureCrewRow = {
  vehicle: { name: string } | null;
  driver: { name: string } | null;
  guide: { name: string } | null;
};

export type DepartureCrewLabels = {
  driver: string;
  guide: string;
  crewAssigned: string;
};

/** Renders a departure's vehicle+crew rows as a compact summary, e.g.
 *  "Bus 1 (Driver: John, Guide: Mary) · Jeep 2 (Driver: Anna)" — shared by
 *  the departures list and (filtered to the viewer's own rows) the schedule
 *  page, so a departure with several vehicles doesn't get its display logic
 *  duplicated across both. */
export function formatDepartureCrew(rows: DepartureCrewRow[], labels: DepartureCrewLabels): string {
  return rows
    .map((row) => {
      const crew = [row.driver && `${labels.driver}: ${row.driver.name}`, row.guide && `${labels.guide}: ${row.guide.name}`]
        .filter(Boolean)
        .join(", ");
      if (row.vehicle && crew) return `${row.vehicle.name} (${crew})`;
      if (row.vehicle) return row.vehicle.name;
      return crew || labels.crewAssigned;
    })
    .join(" · ");
}
