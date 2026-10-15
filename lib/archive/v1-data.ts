export type PerformanceRecord = {
  employeeId: string;
  department: string;
  workDate: string;
  reportingWeek: string;
  cases: number;
  earnedHours: number;
  actualHours: number;
  officialPercent: number;
  status: "finalized" | "corrected" | "pending";
  revision: number;
  finalizedAt: string;
};
export const WEEK_STARTS = [
  "2026-09-14",
  "2026-09-21",
  "2026-09-28",
  "2026-10-05",
];
export const associates = Array.from({ length: 30 }, (_, i) => ({
  id: `EMP${String(i + 1).padStart(3, "0")}`,
  name: `Associate ${String(i + 1).padStart(3, "0")}`,
  department: ["Outbound", "Picking", "Packing"][i % 3],
}));
export function dateAt(week: string, offset: number) {
  const date = new Date(`${week}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export const initialRecords: PerformanceRecord[] = associates.flatMap((a, i) =>
  WEEK_STARTS.flatMap((week, w) =>
    Array.from({ length: 5 }, (_, d): PerformanceRecord | null => {
      if ((i === 6 && w === 3 && d === 2) || (i === 19 && w === 1 && d === 0))
        return null;
      const patterns = [
        [92, 93, 94, 92],
        [94, 90, 100, 103],
        [99, 99, 98, 91],
        [98, 99, 97, 96],
        [90, 91, 92, 95],
      ];
      const base = patterns[i % 5][w];
      const pct = base + [-2, 1, 0, 2, -1][d];
      const actual = [7.25, 7.5, 7.75, 7, 7.5][(i + d) % 5];
      const corrected = i === 1 && w === 1 && d === 1;
      const pending = i === 13 && w === 3 && d === 4;
      const workDate = dateAt(week, d);
      return {
        employeeId: a.id,
        department: a.department,
        workDate,
        reportingWeek: week,
        cases: 2300 + ((i * 97 + w * 53 + d * 113) % 1150),
        earnedHours: Number(((actual * pct) / 100).toFixed(4)),
        actualHours: actual,
        officialPercent: pct,
        status: pending ? "pending" : corrected ? "corrected" : "finalized",
        revision: corrected ? 2 : 1,
        finalizedAt: pending ? "" : `${dateAt(week, d + 1)}T06:00:00Z`,
      };
    }).filter((r): r is PerformanceRecord => r !== null),
  ),
);
export const recordKey = (r: PerformanceRecord) =>
  `${r.employeeId}|${r.workDate}`;
export const isFinal = (r: PerformanceRecord) => r.status !== "pending";
