import { describe, it, expect } from "vitest";
import { initialRecords, associates, recordKey, WEEK_STARTS } from "@/lib/data";
import { weighted, standing, summarize, period } from "@/lib/performance";
describe("accountability", () => {
  it.each([
    [97, 92, "meets"],
    [91, 98, "meets"],
    [96, 97, "meets"],
    [92, 93, "review"],
    [95, 90, "meets"],
    [94.999, 90, "review"],
    [null, 93, "insufficient"],
    [95, null, "meets"],
    [null, null, "insufficient"],
  ])("applies OR rule to %s and %s", (one, four, status) => {
    expect(standing(one as number | null, four as number | null)).toBe(status);
  });
  it("weights unequal durations instead of averaging percentages", () => {
    const a = {
      ...initialRecords[0],
      earnedHours: 1,
      actualHours: 1,
      officialPercent: 100,
    };
    const b = {
      ...initialRecords[1],
      earnedHours: 4,
      actualHours: 8,
      officialPercent: 50,
    };
    expect(weighted([a, b])).toBeCloseTo((5 / 9) * 100, 8);
    expect(weighted([a, b])).not.toBe(75);
  });
  it("has exactly 30 fictional employees and unique daily record keys", () => {
    expect(associates).toHaveLength(30);
    expect(new Set(initialRecords.map(recordKey)).size).toBe(
      initialRecords.length,
    );
    expect(initialRecords).toHaveLength(598);
  });
  it("does not classify missing and pending periods as failures", () => {
    expect(summarize(initialRecords, "EMP007").standing).toBe("insufficient");
    expect(summarize(initialRecords, "EMP014").standing).toBe("insufficient");
    expect(summarize(initialRecords, "EMP007").one.percent).toBeNull();
  });
  it("preserves corrected daily values and finalization metadata", () => {
    const fixed = initialRecords.find((r) => r.status === "corrected")!;
    expect(fixed.revision).toBe(2);
    expect(fixed.finalizedAt).toBeTruthy();
    expect(summarize(initialRecords, "EMP002").standing).toBe("meets");
  });
  it("requires all 20 finalized records for a four-week result", () => {
    const rows = initialRecords.filter((r) => r.employeeId === "EMP002");
    expect(period(rows, WEEK_STARTS).complete).toBe(true);
    expect(period(rows.slice(1), WEEK_STARTS).percent).toBeNull();
  });
});
