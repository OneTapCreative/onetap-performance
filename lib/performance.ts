import {
  PerformanceRecord,
  WEEK_STARTS,
  isFinal,
  workAssignments,
} from "./data";
import { matchesScope, Scope, warehouseConfig } from "./warehouse";
export type Standing = "meets" | "review" | "insufficient";
export function weighted(records: PerformanceRecord[]): number | null {
  const eligible = records.filter((r) => isFinal(r) && r.actualHours > 0),
    actual = eligible.reduce((s, r) => s + r.actualHours, 0);
  return actual
    ? (eligible.reduce((s, r) => s + r.earnedHours, 0) / actual) * 100
    : null;
}
export function period(
  records: PerformanceRecord[],
  weeks: string[],
  employeeId?: string,
  scope: Scope = {},
) {
  const ids = employeeId
    ? [employeeId]
    : [...new Set(records.map((r) => r.employeeId))];
  const expected = workAssignments.filter(
    (a) =>
      ids.includes(a.employeeId) &&
      weeks.includes(a.reportingWeek) &&
      matchesScope(a, scope),
  );
  const rows = records.filter(
    (r) =>
      ids.includes(r.employeeId) &&
      weeks.includes(r.reportingWeek) &&
      matchesScope(r, scope),
  );
  const missing = expected.filter(
      (a) => !rows.some((r) => r.assignmentId === a.id),
    ),
    pending = expected.filter((a) =>
      rows.some((r) => r.assignmentId === a.id && !isFinal(r)),
    );
  const complete =
    expected.length > 0 && missing.length === 0 && pending.length === 0;
  return {
    rows,
    expected,
    missing,
    pending,
    complete,
    percent: complete ? weighted(rows) : null,
    cases: rows.filter(isFinal).reduce((s, r) => s + r.cases, 0),
  };
}
export function standing(
  one: number | null,
  four: number | null,
  standard = warehouseConfig.performanceStandard,
): Standing {
  if ((one !== null && one >= standard) || (four !== null && four >= standard))
    return "meets";
  if (one === null || four === null) return "insufficient";
  return "review";
}
export function summarize(
  records: PerformanceRecord[],
  id: string,
  scope: Scope = {},
  anchor = WEEK_STARTS[3],
) {
  const weeks = WEEK_STARTS.filter((w) => w <= anchor).slice(-4),
    own = records.filter(
      (r) =>
        r.employeeId === id &&
        weeks.includes(r.reportingWeek) &&
        matchesScope(r, scope),
    );
  const one = period(records, [anchor], id, scope),
    four = period(records, weeks, id, scope);
  // Earlier anchors do not pretend that fewer than four weeks is a finalized four-week result.
  if (weeks.length < 4) {
    four.percent = null;
    four.complete = false;
  }
  const latestDate = [...new Set(own.map((r) => r.workDate))]
      .sort()
      .reverse()
      .find((date) => {
        const expected = workAssignments.filter(
          (a) =>
            a.employeeId === id &&
            a.workDate === date &&
            matchesScope(a, scope),
        );
        return (
          expected.length > 0 &&
          expected.every((a) =>
            own.some((r) => r.assignmentId === a.id && isFinal(r)),
          )
        );
      }),
    latestRows = own.filter((r) => r.workDate === latestDate && isFinal(r));
  const latest = latestRows.length
    ? {
        ...latestRows[0],
        cases: latestRows.reduce((s, r) => s + r.cases, 0),
        actualHours: latestRows.reduce((s, r) => s + r.actualHours, 0),
        earnedHours: latestRows.reduce((s, r) => s + r.earnedHours, 0),
        officialPercent:
          latestRows.length === 1
            ? latestRows[0].officialPercent
            : weighted(latestRows)!,
      }
    : undefined;
  return {
    own,
    one,
    four,
    latest,
    standing: standing(one.percent, four.percent),
  };
}
export function scopedOverview(
  records: PerformanceRecord[],
  scope: Scope = {},
  selectedWeeks = WEEK_STARTS,
) {
  const expected = workAssignments.filter(
    (a) => selectedWeeks.includes(a.reportingWeek) && matchesScope(a, scope),
  );
  const rows = records.filter(
    (r) => selectedWeeks.includes(r.reportingWeek) && matchesScope(r, scope),
  );
  const ids = [
    ...new Set([
      ...expected.map((a) => a.employeeId),
      ...rows.map((r) => r.employeeId),
    ]),
  ];
  const missing = expected.filter(
    (a) => !rows.some((r) => r.assignmentId === a.id),
  );
  const pending = rows.filter((r) => !isFinal(r));
  return {
    ids,
    rows,
    expected,
    missing,
    pending,
    workAssignmentCount: expected.length,
    percent: weighted(rows),
    cases: rows.filter(isFinal).reduce((s, r) => s + r.cases, 0),
    latestReport: rows
      .filter(isFinal)
      .map((r) => r.finalizedAt)
      .sort()
      .at(-1),
  };
}
export const percent = (n: number | null) =>
  n === null ? "—" : `${n.toFixed(1)}%`;
