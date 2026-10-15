import Papa from "papaparse";
import { departmentLabel } from "./warehouse";
import {
  associates,
  assignmentById,
  dateAt,
  PerformanceRecord,
  recordKey,
  WEEK_STARTS,
} from "./data";
export const COLUMNS = [
  "employee_id",
  "assignment_id",
  "shift_id",
  "department_id",
  "department",
  "work_date",
  "reporting_week",
  "cases_completed",
  "earned_standard_hours",
  "actual_eligible_productive_hours",
  "official_performance_percentage",
  "finalization_status",
  "revision",
  "finalized_at",
];
export type ImportStage = {
  name: string;
  rows: PerformanceRecord[];
  errors: string[];
  warnings: string[];
  duplicates: number;
  corrections: number;
  missing: string[];
  preview: PerformanceRecord[];
};
const canonical = (r: PerformanceRecord) =>
  JSON.stringify([
    r.employeeId,
    r.assignmentId,
    r.shiftId,
    r.departmentId,
    r.department,
    r.workDate,
    r.reportingWeek,
    r.cases,
    r.earnedHours,
    r.actualHours,
    r.officialPercent,
    r.status,
    r.revision,
    r.finalizedAt,
  ]);
export function toImportRow(
  r: PerformanceRecord,
): Record<string, string | number> {
  return {
    employee_id: r.employeeId,
    assignment_id: r.assignmentId,
    shift_id: r.shiftId,
    department_id: r.departmentId,
    department: r.department,
    work_date: r.workDate,
    reporting_week: r.reportingWeek,
    cases_completed: r.cases,
    earned_standard_hours: r.earnedHours,
    actual_eligible_productive_hours: r.actualHours,
    official_performance_percentage: r.officialPercent,
    finalization_status: r.status,
    revision: r.revision,
    finalized_at: r.finalizedAt,
  };
}
export function validate(
  input: Record<string, unknown>[],
  headers: string[],
  name: string,
  current: PerformanceRecord[],
): ImportStage {
  const stage: ImportStage = {
    name,
    rows: [],
    errors: [],
    warnings: [],
    duplicates: 0,
    corrections: 0,
    missing: [],
    preview: [],
  };
  const missingColumns = COLUMNS.filter((c) => !headers.includes(c));
  if (new Set(headers).size !== headers.length) {
    stage.errors.push("Duplicate column headers.");
    return stage;
  }
  if (missingColumns.length) {
    stage.errors.push(
      `Missing columns: ${missingColumns.join(", ")}. Legacy v1 reports require a reviewed assignment mapping; no automatic department mapping is applied.`,
    );
    return stage;
  }
  if (!input.length) stage.errors.push("The report is empty.");
  if (input.length > 10000) {
    stage.errors.push("Maximum 10,000 records.");
    return stage;
  }
  const existing = new Map(current.map((r) => [recordKey(r), r])),
    seen = new Set<string>(),
    employees = new Set<string>();
  input.forEach((row, i) => {
    const text = (key: string) => String(row[key] ?? "").trim();
    const number = (key: string) =>
      text(key) === "" ? NaN : Number(text(key));
    const r: PerformanceRecord = {
      employeeId: text("employee_id"),
      assignmentId: text("assignment_id"),
      shiftId: text("shift_id") as PerformanceRecord["shiftId"],
      departmentId: text("department_id") as PerformanceRecord["departmentId"],
      department: text("department"),
      workDate: text("work_date"),
      reportingWeek: text("reporting_week"),
      cases: number("cases_completed"),
      earnedHours: number("earned_standard_hours"),
      actualHours: number("actual_eligible_productive_hours"),
      officialPercent: number("official_performance_percentage"),
      status: text("finalization_status") as PerformanceRecord["status"],
      revision: number("revision"),
      finalizedAt: text("finalized_at"),
    };
    const error = (message: string) =>
      stage.errors.push(`Row ${i + 2}: ${message}`);
    const person = associates.find((a) => a.id === r.employeeId);
    if (!person) {
      error(`Unknown synthetic employee ID ${r.employeeId || "(blank)"}.`);
      return;
    }
    employees.add(r.employeeId);
    const assignment = assignmentById(r.assignmentId);
    if (
      !assignment ||
      assignment.employeeId !== r.employeeId ||
      assignment.workDate !== r.workDate ||
      assignment.reportingWeek !== r.reportingWeek ||
      assignment.shiftId !== r.shiftId ||
      assignment.departmentId !== r.departmentId ||
      r.department !== departmentLabel(r.departmentId)
    ) {
      error(
        "Work assignment, operational date, shift or department does not match the registered synthetic work assignment. Primary assignment is not used to relabel historical work.",
      );
      return;
    }
    if (
      !WEEK_STARTS.includes(r.reportingWeek) ||
      !Array.from({ length: 5 }, (_, d) => dateAt(r.reportingWeek, d)).includes(
        r.workDate,
      )
    ) {
      error(
        "Work date must be Monday–Friday within the declared demo reporting week.",
      );
      return;
    }
    if (
      !Number.isSafeInteger(r.cases) ||
      r.cases < 0 ||
      r.cases > 100000 ||
      !Number.isInteger(r.revision) ||
      r.revision < 1 ||
      ![r.earnedHours, r.actualHours, r.officialPercent].every(
        Number.isFinite,
      ) ||
      r.earnedHours < 0 ||
      r.earnedHours > 72 ||
      r.actualHours <= 0 ||
      r.actualHours > 24 ||
      r.officialPercent < 0 ||
      r.officialPercent > 300
    ) {
      error("Invalid cases, hours, official percentage, or revision.");
      return;
    }
    if (!["pending", "finalized", "corrected"].includes(r.status)) {
      error("Invalid finalization status.");
      return;
    }
    if (
      r.status !== "pending" &&
      (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(r.finalizedAt) ||
        !Number.isFinite(Date.parse(r.finalizedAt)) ||
        new Date(r.finalizedAt).toISOString().replace(".000Z", "Z") !==
          r.finalizedAt ||
        r.finalizedAt.slice(0, 10) < r.workDate)
    ) {
      error(
        "Finalized records require an ISO UTC finalization timestamp on or after work date.",
      );
      return;
    }
    const key = recordKey(r);
    if (seen.has(key)) {
      error(`Duplicate employee/work-assignment key ${key} within this file.`);
      return;
    }
    seen.add(key);
    if (
      Math.abs((r.earnedHours / r.actualHours) * 100 - r.officialPercent) > 0.2
    )
      stage.warnings.push(
        `Row ${i + 2}: official daily percentage differs from hours; official daily value is preserved, aggregates use weighted hours.`,
      );
    const prior = existing.get(key);
    if (prior && canonical(prior) === canonical(r)) {
      stage.duplicates++;
      return;
    }
    if (prior && r.revision <= prior.revision) {
      error(`Changed ${key} requires revision greater than ${prior.revision}.`);
      return;
    }
    if (prior) stage.corrections++;
    stage.rows.push(r);
  });
  stage.missing = associates
    .filter((a) => !employees.has(a.id))
    .map((a) => a.id);
  if (stage.missing.length)
    stage.warnings.push(
      `${stage.missing.length} associates absent from this patch; their existing records will remain unchanged.`,
    );
  stage.preview = stage.rows.slice(0, 8);
  return stage;
}
export function parseCSV(
  text: string,
  name: string,
  current: PerformanceRecord[],
) {
  const rawHeaders = (
    Papa.parse<string[]>(text, { preview: 1 }).data[0] ?? []
  ).map((h) => h.replace(/^\uFEFF/, "").trim());
  if (new Set(rawHeaders).size !== rawHeaders.length) {
    return validate([], rawHeaders, name, current);
  }
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
  });
  const stage = validate(result.data, result.meta.fields ?? [], name, current);
  stage.errors.push(...result.errors.map((e) => `CSV: ${e.message}`));
  return stage;
}
export async function parseFile(file: File, current: PerformanceRecord[]) {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Maximum file size is 5 MB.");
  if (file.name.toLowerCase().endsWith(".csv"))
    return parseCSV(await file.text(), file.name, current);
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    throw new Error("Choose a CSV or XLSX report.");
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await file.arrayBuffer());
  const sheet = book.worksheets[0];
  if (!sheet) throw new Error("Workbook has no worksheet.");
  if (sheet.rowCount > 10001 || sheet.columnCount > 50)
    throw new Error("Workbook exceeds demo dimensions.");
  const values = (n: number) =>
    Array.from({ length: sheet.columnCount }, (_, i) => {
      const value = sheet.getRow(n).getCell(i + 1).value;
      if (value !== null && typeof value === "object")
        throw new Error(
          "Use plain values only; formulas, dates, hyperlinks and rich text are unsupported.",
        );
      return value ?? "";
    });
  const headers = values(1).map((v) => String(v).trim());
  if (new Set(headers).size !== headers.length)
    throw new Error("Duplicate column headers.");
  const input = Array.from(
    { length: Math.max(0, sheet.rowCount - 1) },
    (_, i) => values(i + 2),
  )
    .filter((r) => r.some((v) => v !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  return validate(input, headers, file.name, current);
}
export function publish(current: PerformanceRecord[], stage: ImportStage) {
  if (stage.errors.length || !stage.rows.length)
    throw new Error(
      "Resolve errors and include at least one new or corrected record.",
    );
  // Revalidate against current snapshot at approval to prevent stale preview overwrites.
  const checked = validate(
    stage.rows.map(toImportRow),
    COLUMNS,
    stage.name,
    current,
  );
  if (checked.errors.length)
    throw new Error(
      "Snapshot changed. Please select and preview the report again.",
    );
  const map = new Map(current.map((r) => [recordKey(r), r]));
  checked.rows.forEach((r) => map.set(recordKey(r), r));
  return [...map.values()];
}
