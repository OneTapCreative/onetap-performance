import { PerformanceRecord, WEEK_STARTS, dateAt, isFinal } from "./data";
export type Standing = "meets" | "review" | "insufficient";
export function weighted(records: PerformanceRecord[]): number | null {
  const eligible = records.filter((r) => isFinal(r) && r.actualHours > 0);
  const actual = eligible.reduce((s, r) => s + r.actualHours, 0);
  return actual
    ? (eligible.reduce((s, r) => s + r.earnedHours, 0) / actual) * 100
    : null;
}
// Completeness is checked against the demo's explicit Monday–Friday reporting calendar.
export function period(records: PerformanceRecord[], weeks: string[]) {
  const rows = records.filter((r) => weeks.includes(r.reportingWeek));
  const complete = weeks.every((w) =>
    Array.from({ length: 5 }, (_, d) => dateAt(w, d)).every((date) =>
      rows.some((r) => r.workDate === date && isFinal(r)),
    ),
  );
  return {
    rows,
    complete,
    percent: complete ? weighted(rows) : null,
    cases: rows.filter(isFinal).reduce((s, r) => s + r.cases, 0),
  };
}
export function standing(one: number | null, four: number | null): Standing {
  if ((one !== null && one >= 95) || (four !== null && four >= 95))
    return "meets";
  if (one === null || four === null) return "insufficient";
  return "review";
}
export function summarize(records: PerformanceRecord[], id: string) {
  const own = records.filter((r) => r.employeeId === id);
  const one = period(own, [WEEK_STARTS[3]]),
    four = period(own, WEEK_STARTS);
  const latest = own
    .filter(isFinal)
    .sort((a, b) => b.workDate.localeCompare(a.workDate))[0];
  return {
    own,
    one,
    four,
    latest,
    standing: standing(one.percent, four.percent),
  };
}
export const percent = (n: number | null) =>
  n === null ? "—" : `${n.toFixed(1)}%`;
