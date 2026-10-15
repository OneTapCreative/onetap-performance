import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { initialRecords, recordKey } from "@/lib/data";
import {
  COLUMNS,
  parseCSV,
  parseFile,
  publish,
  toImportRow,
  validate,
} from "@/lib/import";
const base = initialRecords.find(
  (r) => r.employeeId === "EMP002" && r.workDate === "2026-10-09",
)!;
const changed = {
  ...base,
  revision: 2,
  cases: 3500,
  status: "corrected" as const,
  officialPercent: 110,
  earnedHours: base.actualHours * 1.1,
  finalizedAt: "2026-10-12T06:00:00Z",
};
const csv = (rows: Record<string, unknown>[]) =>
  Papa.unparse(rows, { columns: COLUMNS });
describe("report import", () => {
  it("detects an identical all-associate report without duplication", () => {
    const stage = parseCSV(
      csv(initialRecords.map(toImportRow)),
      "full.csv",
      initialRecords,
    );
    expect(stage.errors).toEqual([]);
    expect(stage.duplicates).toBe(initialRecords.length);
    expect(stage.rows).toHaveLength(0);
    expect(() => publish(initialRecords, stage)).toThrow();
  });
  it("previews and publishes a correction, retaining other associates", () => {
    const stage = parseCSV(
      csv([toImportRow(changed)]),
      "fix.csv",
      initialRecords,
    );
    expect(stage.errors).toEqual([]);
    expect(stage.corrections).toBe(1);
    expect(stage.missing).toHaveLength(29);
    expect(
      initialRecords.find((r) => recordKey(r) === recordKey(base))?.cases,
    ).toBe(base.cases);
    const next = publish(initialRecords, stage);
    expect(next).toHaveLength(initialRecords.length);
    expect(next.find((r) => recordKey(r) === recordKey(base))?.cases).toBe(
      3500,
    );
    const duplicate = parseCSV(csv([toImportRow(changed)]), "again.csv", next);
    expect(duplicate.duplicates).toBe(1);
  });
  it("rejects unknown IDs, invalid dates, invalid hours and missing columns", () => {
    for (const override of [
      { employee_id: "EMP999" },
      { work_date: "2026-02-30" },
      { actual_eligible_productive_hours: 0 },
      { official_performance_percentage: "" },
      { cases_completed: -1 },
      { revision: 1 },
    ]) {
      expect(
        validate(
          [{ ...toImportRow(changed), ...override }],
          COLUMNS,
          "bad.csv",
          initialRecords,
        ).errors.length,
      ).toBeGreaterThan(0);
    }
    expect(
      parseCSV("bad,header\n1,2", "bad.csv", initialRecords).errors[0],
    ).toContain("Missing columns");
  });
  it("rejects duplicate keys within one file", () => {
    expect(
      parseCSV(
        csv([toImportRow(changed), toImportRow(changed)]),
        "dup.csv",
        initialRecords,
      ).errors[0],
    ).toContain("Duplicate");
  });
  it("rechecks stale approvals", () => {
    const stage = validate(
      [toImportRow(changed)],
      COLUMNS,
      "fix",
      initialRecords,
    );
    const newer = initialRecords.map((r) =>
      recordKey(r) === recordKey(base) ? { ...r, revision: 3 } : r,
    );
    expect(() => publish(newer, stage)).toThrow("Snapshot changed");
  });
  it("parses a real XLSX workbook with synthetic values", async () => {
    const book = new ExcelJS.Workbook(),
      sheet = book.addWorksheet("Performance");
    sheet.addRow(COLUMNS);
    sheet.addRow(Object.values(toImportRow(changed)));
    const bytes = await book.xlsx.writeBuffer();
    const file = {
      name: "test.xlsx",
      size: bytes.byteLength,
      arrayBuffer: async () => bytes,
    } as unknown as File;
    const stage = await parseFile(file, initialRecords);
    expect(stage.errors).toEqual([]);
    expect(stage.rows[0].cases).toBe(3500);
  });
  it("rejects spreadsheet formulas and oversized files", async () => {
    const book = new ExcelJS.Workbook(),
      sheet = book.addWorksheet("Performance");
    sheet.addRow(COLUMNS);
    sheet.addRow(Object.values(toImportRow(changed)));
    sheet.getCell("E2").value = { formula: "1000+2000", result: 3000 };
    const bytes = await book.xlsx.writeBuffer();
    await expect(
      parseFile(
        {
          name: "formula.xlsx",
          size: 100,
          arrayBuffer: async () => bytes,
        } as unknown as File,
        initialRecords,
      ),
    ).rejects.toThrow("plain values");
    await expect(
      parseFile(
        { name: "huge.csv", size: 6 * 1024 * 1024 } as File,
        initialRecords,
      ),
    ).rejects.toThrow("5 MB");
  });
  it("flags reconciliation differences without replacing official daily values", () => {
    const stage = validate(
      [{ ...toImportRow(changed), official_performance_percentage: 125 }],
      COLUMNS,
      "different",
      initialRecords,
    );
    expect(stage.warnings[0]).toContain("official");
    expect(stage.rows[0].officialPercent).toBe(125);
  });
});
