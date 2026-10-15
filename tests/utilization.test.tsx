import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ExcelJS from "exceljs";
import {
  utilizationBand,
  utilizationPercent,
  latestUtilizationRecord,
} from "@/lib/utilization";
import { initialRecords, WEEK_STARTS } from "@/lib/data";
import { summarize, scopedOverview } from "@/lib/performance";
import {
  COLUMNS,
  toImportRow,
  validate,
  parseFile,
  publish,
} from "@/lib/import";
import { coachingRecords, coachingModule } from "@/lib/coaching";
import { UtilizationBadge } from "@/components/utilization";
import { DemoProvider } from "@/components/demo-provider";
import Manager from "@/app/manager/page";
import Kiosk from "@/app/kiosk/page";
const base = initialRecords.find(
  (r) => r.employeeId === "EMP002" && r.workDate === "2026-10-09",
)!;
const tr = (en: string) => en;
const productivity = (records: typeof initialRecords) => {
  const own = summarize(records, "EMP002");
  const scope = scopedOverview(records);
  return {
    standing: own.standing,
    one: own.one.percent,
    four: own.four.percent,
    cases: scope.cases,
    weighted: scope.percent,
    headcount: scope.ids.length,
    missing: scope.missing.length,
    pending: scope.pending.length,
  };
};
describe("informational utilization", () => {
  it.each([
    [0, "low"],
    [79, "low"],
    [80, "target"],
    [85, "target"],
    [86, "high"],
    [100, "high"],
    [79.5, "between"],
    [85.5, "between"],
    [79.999, "between"],
    [null, "unavailable"],
    [undefined, "unavailable"],
    [NaN, "unavailable"],
    [-1, "unavailable"],
    [101, "unavailable"],
  ])("classifies %s only for display", (value, band) => {
    expect(utilizationBand(value as number | null | undefined)).toBe(band);
  });
  it("does not round a value across a band boundary or show missing as zero", () => {
    expect(utilizationPercent(79.999)).toBe("79.999%");
    expect(utilizationPercent(null)).toBe("—");
  });
  it("cannot change accountability, cases, headcount or coaching", () => {
    const original = productivity(initialRecords);
    for (const value of [0, 79, 80, 85, 86, 100, null])
      expect(
        productivity(
          initialRecords.map((r) => ({ ...r, utilizationPercent: value })),
        ),
      ).toEqual(original);
    expect(coachingRecords).toHaveLength(0);
    expect(coachingModule.state).toBe("planned");
  });
  it("selects a finalized assignment inside shift, department and selected reporting period", () => {
    const scope = {
      shiftId: "SHIFT_2" as const,
      departmentId: "SHIPPING" as const,
    };
    const row = latestUtilizationRecord(initialRecords, "EMP002", scope, [
      WEEK_STARTS[3],
    ])!;
    expect(row.workDate).toBe("2026-10-09");
    expect(row.shiftId).toBe("SHIFT_2");
    expect(row.departmentId).toBe("SHIPPING");
    expect(
      latestUtilizationRecord(initialRecords, "EMP002", scope, [
        WEEK_STARTS[0],
      ]),
    ).toBeUndefined();
    const missing = initialRecords.map((r) =>
      r.assignmentId === base.assignmentId
        ? { ...r, utilizationPercent: null }
        : r,
    );
    expect(
      latestUtilizationRecord(missing, "EMP002")?.utilizationPercent,
    ).toBeNull();
    const pending = initialRecords.map((r) =>
      r.assignmentId === base.assignmentId
        ? { ...r, status: "pending" as const }
        : r,
    );
    expect(latestUtilizationRecord(pending, "EMP002")?.workDate).toBe(
      "2026-10-08",
    );
  });
  it("validates optional reported utilization without deriving it from hours", () => {
    for (const value of [-1, 101, "no", Infinity])
      expect(
        validate(
          [
            {
              ...toImportRow(base),
              revision: 2,
              utilization_percentage: value,
            },
          ],
          COLUMNS,
          "bad",
          initialRecords,
        ).errors[0],
      ).toContain("Utilization");
    const blank = validate(
      [{ ...toImportRow(base), revision: 2, utilization_percentage: "" }],
      COLUMNS,
      "blank",
      initialRecords,
    );
    expect(blank.errors).toEqual([]);
    expect(blank.rows[0].utilizationPercent).toBeNull();
    const old = { ...toImportRow(base) };
    delete old.utilization_percentage;
    const stage = validate(
      [old],
      COLUMNS.filter((c) => c !== "utilization_percentage"),
      "v2-compatible",
      initialRecords,
    );
    expect(stage.errors).toEqual([]);
    expect(stage.duplicates).toBe(1);
  });
  it("publishes a utilization correction without changing productivity", () => {
    const stage = validate(
      [{ ...toImportRow(base), revision: 2, utilization_percentage: 79 }],
      COLUMNS,
      "utilization-correction",
      initialRecords,
    );
    const after = publish(initialRecords, stage);
    expect(latestUtilizationRecord(after, "EMP002")?.utilizationPercent).toBe(
      79,
    );
    expect(productivity(after)).toEqual(productivity(initialRecords));
  });
  it("parses the separate percentage in a real XLSX workbook", async () => {
    const book = new ExcelJS.Workbook(),
      sheet = book.addWorksheet("Utilization");
    sheet.addRow(COLUMNS);
    sheet.addRow(
      COLUMNS.map(
        (c) =>
          ({ ...toImportRow(base), revision: 2, utilization_percentage: 86 })[
            c
          ],
      ),
    );
    const bytes = await book.xlsx.writeBuffer();
    const stage = await parseFile(
      {
        name: "utilization.xlsx",
        size: bytes.byteLength,
        arrayBuffer: async () => bytes,
      } as unknown as File,
      initialRecords,
    );
    expect(stage.errors).toEqual([]);
    expect(stage.rows[0].utilizationPercent).toBe(86);
  });
  it("shows text plus color in English and Spanish", () => {
    const result = render(<UtilizationBadge value={79} tr={tr} />);
    expect(screen.getByText("Low Utilization")).toBeTruthy();
    expect(screen.getByText("79%")).toBeTruthy();
    result.rerender(<UtilizationBadge value={86} tr={(_, es) => es} />);
    expect(screen.getByText("Utilización alta")).toBeTruthy();
  });
  it("shows the manager legend, verification notice and latest values", () => {
    render(
      <DemoProvider>
        <Manager />
      </DemoProvider>,
    );
    fireEvent.click(screen.getByText(/Enter manager demonstration/));
    expect(screen.getByLabelText("Utilization visual reference")).toBeTruthy();
    expect(
      screen.getByText(
        /Verify utilization, indirect functions, PF&D and downtime in Manhattan/,
      ),
    ).toBeTruthy();
    const row = screen.getByLabelText("View EMP002").closest("tr")!;
    expect(within(row).getByText("85%")).toBeTruthy();
    expect(within(row).getByText("Target Range")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("View EMP002"));
    expect(screen.getByText("Utilization reference")).toBeTruthy();
    expect(
      screen.getByText("Coaching & 1-on-1 history — planned"),
    ).toBeTruthy();
  });
  it("does not add utilization warnings or controls to the associate kiosk", () => {
    render(
      <DemoProvider>
        <Kiosk />
      </DemoProvider>,
    );
    fireEvent.click(screen.getByText("Fill demo credentials"));
    fireEvent.click(screen.getByText("View my performance"));
    expect(screen.queryByText("Low Utilization")).toBeNull();
    expect(screen.queryByText("Utilization reference")).toBeNull();
    expect(screen.queryByLabelText("Utilization visual reference")).toBeNull();
    expect(screen.getByText("You’re meeting the standard.")).toBeTruthy();
  });
});
