import { isFinal, PerformanceRecord } from "./data";
import { matchesScope, Scope } from "./warehouse";
// Display classifications only. These values must never feed productivity standing,
// coaching creation, review queues, discipline or other accountability decisions.
export type UtilizationBand =
  "low" | "target" | "high" | "between" | "unavailable";
export function utilizationBand(
  value: number | null | undefined,
): UtilizationBand {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 100)
    return "unavailable";
  if (value <= 79) return "low";
  if (value >= 80 && value <= 85) return "target";
  if (value >= 86) return "high";
  // The requested whole-number bands do not specify 79–80 and 85–86 fractions.
  // Keep those values neutral rather than silently moving a threshold or rounding.
  return "between";
}
export function utilizationPercent(value: number | null | undefined) {
  return utilizationBand(value) === "unavailable" ? "—" : `${value}%`;
}
export function latestUtilizationRecord(
  records: PerformanceRecord[],
  employeeId: string,
  scope: Scope = {},
  weeks?: string[],
) {
  return records
    .filter(
      (r) =>
        r.employeeId === employeeId &&
        isFinal(r) &&
        matchesScope(r, scope) &&
        (!weeks || weeks.includes(r.reportingWeek)),
    )
    .sort(
      (a, b) =>
        b.workDate.localeCompare(a.workDate) ||
        b.finalizedAt.localeCompare(a.finalizedAt) ||
        b.assignmentId.localeCompare(a.assignmentId),
    )[0];
}
