import {
  addDays,
  assignmentOn,
  departmentLabel,
  Employee,
  scheduledMinutes,
  ShiftId,
  DepartmentId,
  WorkAssignment,
} from "./warehouse";
export const WEEK_STARTS = [
  "2026-09-14",
  "2026-09-21",
  "2026-09-28",
  "2026-10-05",
];
export const AS_OF_DATE = "2026-10-15";
export const dateAt = addDays;
const departmentIds: DepartmentId[] = [
  "RECEIVING",
  "SHIPPING",
  "ORDER_SELECTOR",
  "EQUIPMENT",
];
export const associates: Employee[] = Array.from({ length: 30 }, (_, i) => {
  const id = `EMP${String(i + 1).padStart(3, "0")}`,
    shiftId = `SHIFT_${(i % 3) + 1}` as ShiftId,
    departmentId = departmentIds[i % 4],
    managerId = `MGR00${(i % 3) + 1}`;
  const current = {
    id: `${id}-PRIMARY-2`,
    shiftId,
    departmentId,
    managerId,
    effectiveFrom: "2026-09-28",
    effectiveTo: null,
  };
  return {
    id,
    name: `Associate ${String(i + 1).padStart(3, "0")}`,
    assignments:
      i === 1
        ? [
            {
              id: `${id}-PRIMARY-1`,
              shiftId: "SHIFT_1",
              departmentId: "RECEIVING",
              managerId: "MGR001",
              effectiveFrom: "2026-09-14",
              effectiveTo: "2026-09-28",
            },
            current,
          ]
        : [{ ...current, id: `${id}-PRIMARY-1`, effectiveFrom: "2026-09-14" }],
  };
});
export const workAssignments: WorkAssignment[] = associates.flatMap(
  (employee) =>
    WEEK_STARTS.flatMap((reportingWeek) =>
      Array.from({ length: 5 }, (_, d) => {
        const workDate = dateAt(reportingWeek, d),
          primary = assignmentOn(employee, workDate)!;
        const regular: WorkAssignment = {
          id: `${employee.id}-${workDate}-A`,
          employeeId: employee.id,
          workDate,
          reportingWeek,
          shiftId: primary.shiftId,
          departmentId: primary.departmentId,
          managerId: primary.managerId,
          kind: "primary",
          primaryAssignmentId: primary.id,
          scheduledMinutes: scheduledMinutes(primary.shiftId),
        };
        if (employee.id === "EMP005" && workDate === "2026-10-06")
          return [
            { ...regular, scheduledMinutes: 270 },
            {
              ...regular,
              id: `${employee.id}-${workDate}-B`,
              departmentId: "SHIPPING" as const,
              kind: "temporary" as const,
              scheduledMinutes: 240,
            },
          ];
        if (employee.id === "EMP006" && workDate === "2026-10-07")
          return [
            {
              ...regular,
              shiftId: "SHIFT_1" as const,
              departmentId: "EQUIPMENT" as const,
              managerId: "MGR001",
              kind: "temporary" as const,
              scheduledMinutes: scheduledMinutes("SHIFT_1"),
            },
          ];
        if (employee.id === "EMP009" && workDate === "2026-10-08")
          return [
            regular,
            {
              ...regular,
              id: `${employee.id}-${workDate}-OT`,
              shiftId: "SHIFT_3" as const,
              departmentId: "SHIPPING" as const,
              kind: "overtime" as const,
              scheduledMinutes: 120,
            },
          ];
        return [regular];
      }).flat(),
    ),
);
export type PerformanceRecord = {
  employeeId: string;
  assignmentId: string;
  shiftId: ShiftId;
  departmentId: DepartmentId;
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
export const initialRecords: PerformanceRecord[] = workAssignments.flatMap(
  (a) => {
    const i = associates.findIndex((e) => e.id === a.employeeId),
      w = WEEK_STARTS.indexOf(a.reportingWeek),
      d = Math.round(
        (Date.parse(a.workDate) - Date.parse(a.reportingWeek)) / 86400000,
      );
    if ((i === 6 && w === 3 && d === 2) || (i === 19 && w === 1 && d === 0))
      return [];
    const patterns = [
        [92, 93, 94, 92],
        [94, 90, 100, 103],
        [99, 99, 98, 91],
        [98, 99, 97, 96],
        [90, 91, 92, 95],
      ],
      pct = patterns[i % 5][w] + [-2, 1, 0, 2, -1][d];
    let actual = [7.25, 7.5, 7.75, 7, 7.5][(i + d) % 5];
    if (a.employeeId === "EMP005" && a.workDate === "2026-10-06")
      actual = a.id.endsWith("-A") ? 4 : 3.5;
    if (a.kind === "overtime") actual = 1.75;
    const corrected = i === 1 && w === 1 && d === 1,
      pending = i === 13 && w === 3 && d === 4;
    return [
      {
        employeeId: a.employeeId,
        assignmentId: a.id,
        shiftId: a.shiftId,
        departmentId: a.departmentId,
        department: departmentLabel(a.departmentId),
        workDate: a.workDate,
        reportingWeek: a.reportingWeek,
        cases: Math.round(
          (2300 + ((i * 97 + w * 53 + d * 113) % 1150)) * (actual / 7.5),
        ),
        earnedHours: Number(((actual * pct) / 100).toFixed(4)),
        actualHours: actual,
        officialPercent: pct,
        status: pending ? "pending" : corrected ? "corrected" : "finalized",
        revision: corrected ? 2 : 1,
        finalizedAt: pending ? "" : `${dateAt(a.workDate, 2)}T15:00:00Z`,
      },
    ];
  },
);
export const recordKey = (
  r: Pick<PerformanceRecord, "employeeId" | "assignmentId">,
) => `${r.employeeId}|${r.assignmentId}`;
export const isFinal = (r: PerformanceRecord) => r.status !== "pending";
export const assignmentById = (id: string) =>
  workAssignments.find((a) => a.id === id);
