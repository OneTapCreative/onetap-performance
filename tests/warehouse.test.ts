import { describe, it, expect } from "vitest";
import {
  AS_OF_DATE,
  associates,
  initialRecords,
  WEEK_STARTS,
  workAssignments,
  recordKey,
} from "@/lib/data";
import { initialRecords as legacyRecords } from "@/lib/archive/v1-data";
import {
  assignmentOn,
  departments,
  resolveOperationalWorkday,
  scheduledMinutes,
  shiftCandidates,
  shifts,
  warehouseConfig,
} from "@/lib/warehouse";
import {
  period,
  scopedOverview,
  standing,
  summarize,
  weighted,
} from "@/lib/performance";
import { COLUMNS, toImportRow, validate } from "@/lib/import";
import { coachingModule } from "@/lib/coaching";
describe("warehouse configuration and operational dates", () => {
  it("defines stable IDs for the exact three shifts and four departments", () => {
    expect(shifts.map((s) => [s.id, s.start, s.end, s.endDayOffset])).toEqual([
      ["SHIFT_1", "06:00", "14:30", 0],
      ["SHIFT_2", "14:00", "22:30", 0],
      ["SHIFT_3", "22:00", "06:30", 1],
    ]);
    expect(departments.map((d) => d.name)).toEqual([
      "Receiving",
      "Equipment",
      "Order Selector",
      "Shipping",
    ]);
    expect(new Set(departments.map((d) => d.id)).size).toBe(4);
    shifts.forEach((s) => expect(scheduledMinutes(s.id)).toBe(510));
  });
  it("associates after-midnight work with the preceding third-shift workday", () => {
    expect(resolveOperationalWorkday("2026-10-10T02:15", "SHIFT_3")).toBe(
      "2026-10-09",
    );
    expect(resolveOperationalWorkday("2026-10-09T22:00", "SHIFT_3")).toBe(
      "2026-10-09",
    );
    expect(resolveOperationalWorkday("2026-10-10T06:29", "SHIFT_3")).toBe(
      "2026-10-09",
    );
  });
  it("keeps overlapping shifts ambiguous until the assignment identifies the shift", () => {
    expect(shiftCandidates("2026-10-09T06:15")).toEqual([
      { shiftId: "SHIFT_1", workDate: "2026-10-09" },
      { shiftId: "SHIFT_3", workDate: "2026-10-08" },
    ]);
    expect(shiftCandidates("2026-10-09T14:15").map((c) => c.shiftId)).toEqual([
      "SHIFT_1",
      "SHIFT_2",
    ]);
    expect(shiftCandidates("2026-10-09T22:15").map((c) => c.shiftId)).toEqual([
      "SHIFT_2",
      "SHIFT_3",
    ]);
  });
  it("requires a source work date for overtime outside scheduled times", () => {
    expect(() =>
      resolveOperationalWorkday("2026-10-10T07:00", "SHIFT_3"),
    ).toThrow("explicit");
    expect(
      resolveOperationalWorkday("2026-10-10T07:00", "SHIFT_3", "2026-10-09"),
    ).toBe("2026-10-09");
    expect(() => shiftCandidates("2026-02-30T06:15")).toThrow();
  });
});
describe("assignment history and scoped calculations", () => {
  it("preserves transfers and stable identities with nonoverlapping effective dates", () => {
    const employee = associates.find((a) => a.id === "EMP002")!;
    expect(assignmentOn(employee, "2026-09-27")?.departmentId).toBe(
      "RECEIVING",
    );
    expect(assignmentOn(employee, "2026-09-28")?.departmentId).toBe("SHIPPING");
    expect(assignmentOn(employee, AS_OF_DATE)?.shiftId).toBe("SHIFT_2");
    expect(
      initialRecords.find(
        (r) => r.employeeId === employee.id && r.workDate === "2026-09-18",
      )?.shiftId,
    ).toBe("SHIFT_1");
  });
  it("combines shift + department + reporting week against performed assignments", () => {
    const view = scopedOverview(
      initialRecords,
      { shiftId: "SHIFT_2", departmentId: "SHIPPING" },
      [WEEK_STARTS[3]],
    );
    expect(view.rows.length).toBeGreaterThan(0);
    expect(
      view.rows.every(
        (r) =>
          r.shiftId === "SHIFT_2" &&
          r.departmentId === "SHIPPING" &&
          r.reportingWeek === WEEK_STARTS[3],
      ),
    ).toBe(true);
    expect(view.ids).toContain("EMP002");
    expect(view.ids).toContain("EMP005");
    expect(view.percent).toBe(weighted(view.rows));
  });
  it("counts employees once when they work multiple departments or overtime", () => {
    const all = scopedOverview(initialRecords);
    expect(all.ids).toHaveLength(30);
    expect(all.workAssignmentCount).toBe(602);
    expect(all.missing).toHaveLength(2);
    expect(all.pending).toHaveLength(1);
    const split = initialRecords.filter(
      (r) => r.employeeId === "EMP005" && r.workDate === "2026-10-06",
    );
    expect(split).toHaveLength(2);
    expect(new Set(split.map(recordKey)).size).toBe(2);
    expect(workAssignments.filter((a) => a.kind === "overtime")).toHaveLength(
      1,
    );
  });
  it("never uses the scheduled 8.5-hour duration as eligible productive hours", () => {
    const own = initialRecords.filter((r) => r.employeeId === "EMP002");
    const result = period(own, [WEEK_STARTS[3]], "EMP002");
    expect(result.percent).toBeCloseTo(
      (result.rows.reduce((s, r) => s + r.earnedHours, 0) /
        result.rows.reduce((s, r) => s + r.actualHours, 0)) *
        100,
      10,
    );
    expect(result.percent).not.toBeCloseTo(
      (result.rows.reduce((s, r) => s + r.earnedHours, 0) / (5 * 8.5)) * 100,
      2,
    );
  });
  it("checks completeness by every expected assignment, including split-department work", () => {
    const without = initialRecords.filter(
      (r) => r.assignmentId !== "EMP005-2026-10-06-B",
    );
    expect(period(without, [WEEK_STARTS[3]], "EMP005").percent).toBeNull();
    expect(
      period(without, [WEEK_STARTS[3]], "EMP005", { departmentId: "RECEIVING" })
        .complete,
    ).toBe(true);
  });
  it("does not leak future periods into an earlier reporting anchor", () => {
    const early = summarize(initialRecords, "EMP002", {}, WEEK_STARTS[0]);
    expect(early.own.every((r) => r.reportingWeek === WEEK_STARTS[0])).toBe(
      true,
    );
    expect(early.four.percent).toBeNull();
  });
  it("keeps legacy data intact with unresolved labels outside active reports", () => {
    expect(legacyRecords).toHaveLength(598);
    expect(legacyRecords.some((r) => r.department === "Outbound")).toBe(true);
    expect(
      initialRecords.every((r) =>
        departments.some(
          (d) => d.id === r.departmentId && d.name === r.department,
        ),
      ),
    ).toBe(true);
  });
  it("allows a configurable threshold while preserving incomplete-period accountability", () => {
    expect(warehouseConfig.performanceStandard).toBe(95);
    expect(standing(97, 92, 98)).toBe("review");
    expect(standing(95, null)).toBe("meets");
    expect(standing(94, null)).toBe("insufficient");
  });
  it("accepts registered historical and temporary assignments, rejects relabeling", () => {
    const source = initialRecords.find(
      (r) => r.assignmentId === "EMP005-2026-10-06-B",
    )!;
    expect(
      validate([toImportRow(source)], COLUMNS, "temporary", initialRecords)
        .errors,
    ).toEqual([]);
    expect(
      validate(
        [
          {
            ...toImportRow(source),
            department_id: "RECEIVING",
            department: "Receiving",
          },
        ],
        COLUMNS,
        "bad",
        initialRecords,
      ).errors[0],
    ).toContain("assignment");
    const history = initialRecords.find(
      (r) => r.employeeId === "EMP002" && r.workDate === "2026-09-18",
    )!;
    expect(
      validate([toImportRow(history)], COLUMNS, "history", initialRecords)
        .errors,
    ).toEqual([]);
  });
  it("reserves coaching architecture without claiming a functioning secure module", () => {
    expect(coachingModule.state).toBe("planned");
    expect(coachingModule.secureStorageImplemented).toBe(false);
    expect(coachingModule.authorizationImplemented).toBe(false);
  });
});
