export type ShiftId = "SHIFT_1" | "SHIFT_2" | "SHIFT_3";
export type DepartmentId =
  "RECEIVING" | "EQUIPMENT" | "ORDER_SELECTOR" | "SHIPPING";
export const warehouseConfig = {
  id: "DEMO_WAREHOUSE",
  name: "Synthetic warehouse",
  timeZone: "America/Los_Angeles",
  performanceStandard: 95,
};
export const shifts = [
  {
    id: "SHIFT_1",
    name: "1st Shift",
    es: "1.er turno",
    start: "06:00",
    end: "14:30",
    endDayOffset: 0,
    schedule: "6:00 AM–2:30 PM",
    scheduleEs: "6:00 a. m.–2:30 p. m.",
  },
  {
    id: "SHIFT_2",
    name: "2nd Shift",
    es: "2.º turno",
    start: "14:00",
    end: "22:30",
    endDayOffset: 0,
    schedule: "2:00 PM–10:30 PM",
    scheduleEs: "2:00 p. m.–10:30 p. m.",
  },
  {
    id: "SHIFT_3",
    name: "3rd Shift",
    es: "3.er turno",
    start: "22:00",
    end: "06:30",
    endDayOffset: 1,
    schedule: "10:00 PM–6:30 AM (next day)",
    scheduleEs: "10:00 p. m.–6:30 a. m. (día siguiente)",
  },
] as const;
export const departments = [
  { id: "RECEIVING", name: "Receiving", es: "Recepción" },
  { id: "EQUIPMENT", name: "Equipment", es: "Equipo" },
  { id: "ORDER_SELECTOR", name: "Order Selector", es: "Selección de pedidos" },
  { id: "SHIPPING", name: "Shipping", es: "Envíos" },
] as const;
export const shiftById = (id: string) => shifts.find((s) => s.id === id);
export const departmentById = (id: string) =>
  departments.find((d) => d.id === id);
export const departmentLabel = (id: string, es = false) => {
  const d = departmentById(id);
  return d ? (es ? d.es : d.name) : id;
};
export const shiftLabel = (id: string, es = false) => {
  const s = shiftById(id);
  return s ? (es ? s.es : s.name) : id;
};
export function addDays(date: string, offset: number) {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
const minutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
export function scheduledMinutes(id: ShiftId) {
  const s = shiftById(id)!;
  return minutes(s.end) + s.endDayOffset * 1440 - minutes(s.start);
}
/** Civil date/time in the configured warehouse timezone; source assignment is required.
 * Overlap intentionally returns multiple candidates rather than guessing an employee's shift. */
export function shiftCandidates(localDateTime: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateTime))
    throw new Error("Use warehouse-local YYYY-MM-DDTHH:mm.");
  const date = localDateTime.slice(0, 10),
    time = minutes(localDateTime.slice(11));
  if (
    !Number.isFinite(Date.parse(date)) ||
    addDays(date, 0) !== date ||
    time < 0 ||
    time >= 1440 ||
    Number(localDateTime.slice(-2)) > 59
  )
    throw new Error("Invalid local date/time.");
  return shifts.flatMap<{ shiftId: ShiftId; workDate: string }>((s) =>
    s.endDayOffset
      ? time >= minutes(s.start)
        ? [{ shiftId: s.id, workDate: date }]
        : time < minutes(s.end)
          ? [{ shiftId: s.id, workDate: addDays(date, -1) }]
          : []
      : time >= minutes(s.start) && time < minutes(s.end)
        ? [{ shiftId: s.id, workDate: date }]
        : [],
  );
}
export function resolveOperationalWorkday(
  localDateTime: string,
  shiftId: ShiftId,
  explicitWorkDate?: string,
) {
  if (explicitWorkDate) {
    // Explicit source work date allows overtime beyond schedule; still reject impossible civil dates.
    const date = localDateTime.slice(0, 10);
    if (
      addDays(explicitWorkDate, 0) !== explicitWorkDate ||
      date < explicitWorkDate ||
      date > addDays(explicitWorkDate, 1)
    )
      throw new Error("Invalid source operational work date.");
    return explicitWorkDate;
  }
  const candidate = shiftCandidates(localDateTime).find(
    (c) => c.shiftId === shiftId,
  );
  if (!candidate)
    throw new Error(
      "Overtime outside the schedule requires an explicit source operational work date.",
    );
  return candidate.workDate;
}
export type PrimaryAssignment = {
  id: string;
  shiftId: ShiftId;
  departmentId: DepartmentId;
  managerId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};
export type Employee = {
  id: string;
  name: string;
  assignments: PrimaryAssignment[];
};
export function assignmentOn(employee: Employee, date: string) {
  return employee.assignments.find(
    (a) => a.effectiveFrom <= date && (!a.effectiveTo || date < a.effectiveTo),
  );
}
export const supervisors = [
  { id: "MGR001", name: "Demo Supervisor 001" },
  { id: "MGR002", name: "Demo Supervisor 002" },
  { id: "MGR003", name: "Demo Supervisor 003" },
];
export const supervisorLabel = (id: string) =>
  supervisors.find((s) => s.id === id)?.name ?? id;
export type WorkAssignment = {
  id: string;
  employeeId: string;
  workDate: string;
  reportingWeek: string;
  shiftId: ShiftId;
  departmentId: DepartmentId;
  managerId: string;
  kind: "primary" | "temporary" | "overtime";
  primaryAssignmentId: string;
  scheduledMinutes: number;
};
export type Scope = { shiftId?: ShiftId; departmentId?: DepartmentId };
export const matchesScope = (
  row: { shiftId: string; departmentId: string },
  scope: Scope,
) =>
  (!scope.shiftId || row.shiftId === scope.shiftId) &&
  (!scope.departmentId || row.departmentId === scope.departmentId);
