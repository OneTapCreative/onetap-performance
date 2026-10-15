import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Performance } from "@/components/performance";
import { initialRecords } from "@/lib/data";
import { latestUtilizationRecord } from "@/lib/utilization";
import { summarize } from "@/lib/performance";
const source = latestUtilizationRecord(initialRecords, "EMP002")!;
const corrected = (value: number | null) =>
  initialRecords.map((r) =>
    r.assignmentId === source.assignmentId
      ? { ...r, utilizationPercent: value }
      : r,
  );

describe("associate utilization reference", () => {
  it.each([
    [79, "Low Utilization", "low"],
    [80, "Target Range", "target"],
    [85, "Target Range", "target"],
    [86, "High Utilization", "high"],
    [92, "High Utilization", "high"],
    [null, "Not Available", "unavailable"],
  ] as const)(
    "shows reported %s without changing productivity",
    (value, label, band) => {
      const rows = corrected(value);
      render(<Performance records={rows} id="EMP002" />);
      const card = screen.getByRole("region", { name: "My Utilization" });
      const badge = card.querySelector(".utilization-badge")! as HTMLElement;
      expect(
        within(badge).getByText(value === null ? "Not Available" : `${value}%`),
      ).toBeTruthy();
      expect(within(badge).getByText(label)).toBeTruthy();
      expect(badge.classList.contains(`util-${band}`)).toBe(true);
      expect(card.querySelectorAll('[data-active="true"]').length).toBe(
        value === null ? 0 : 1,
      );
      expect(
        within(card).getByText(source.assignmentId, { exact: false }),
      ).toBeTruthy();
      expect(within(card).getByText(source.finalizedAt)).toBeTruthy();
      expect(within(card).getByText(source.workDate)).toBeTruthy();
      expect(card.textContent).not.toContain("EMP001");
      expect(summarize(rows, "EMP002").standing).toBe(
        summarize(initialRecords, "EMP002").standing,
      );
      expect(screen.getByText("You’re meeting the standard.")).toBeTruthy();
      expect(card.querySelector("button, input, select")).toBeNull();
      expect(
        screen
          .getByLabelText("Performance status")
          .compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );
  it("uses the manager source record and metadata for the same reporting period", () => {
    const view = render(<Performance records={corrected(92)} id="EMP002" />);
    const card = screen.getByLabelText("My Utilization");
    const sourceText = card.querySelector(".utilization-source")!.textContent;
    const value = card.querySelector(".utilization-badge")!.textContent;
    view.rerender(<Performance records={corrected(92)} id="EMP002" manager />);
    const manager = screen
      .getByText("Utilization reference")
      .closest("section")!;
    expect(manager.querySelector(".utilization-source")!.textContent).toBe(
      sourceText,
    );
    expect(manager.querySelector(".utilization-badge")!.textContent).toBe(
      value,
    );
  });
  it("translates the card, indicator, missing state and reference note", () => {
    render(<Performance records={corrected(null)} id="EMP002" spanish />);
    const card = screen.getByLabelText("Mi utilización");
    for (const text of [
      "No disponible",
      "Utilización baja",
      "Rango objetivo",
      "Utilización alta",
    ])
      expect(within(card).getByText(text)).toBeTruthy();
    expect(
      within(card).getByText(
        /Las clasificaciones oficiales del tiempo se verifican en Manhattan/,
      ),
    ).toBeTruthy();
    expect(
      within(card).getByText(/Última actualización del origen/),
    ).toBeTruthy();
  });
  it("shows the selected day's actual assignment without a separate utilization section", () => {
    render(<Performance records={corrected(79)} id="EMP002" />);
    fireEvent.click(screen.getByText("Explore your 4-week history"));
    fireEvent.click(screen.getByRole("button", { name: /Friday/ }));
    const daily = screen.getByLabelText("Daily utilization");
    expect(within(daily).getByText("79%")).toBeTruthy();
    expect(within(daily).getByText(source.workDate)).toBeTruthy();
    expect(
      within(daily).getByText(source.assignmentId, { exact: false }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Monday/ }));
    const monday = initialRecords.find(
      (r) => r.employeeId === "EMP002" && r.workDate === "2026-10-05",
    )!;
    expect(
      within(screen.getByLabelText("Daily utilization")).getByText(
        `${monday.utilizationPercent}%`,
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Daily utilization").textContent,
    ).not.toContain(source.assignmentId);
  });
  it.each([
    ["EMP007", "Wednesday"],
    ["EMP014", "Friday"],
  ])("keeps %s missing or pending days unavailable", (id, day) => {
    render(<Performance records={initialRecords} id={id} />);
    fireEvent.click(screen.getByText("Explore your 4-week history"));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(day) }));
    expect(
      within(screen.getByLabelText("Daily utilization")).getByText(
        "Not Available",
      ),
    ).toBeTruthy();
  });
  it("never substitutes another employee's utilization when own reports are absent", () => {
    render(
      <Performance
        records={initialRecords.filter((r) => r.employeeId !== "EMP002")}
        id="EMP002"
      />,
    );
    const card = screen.getByLabelText("My Utilization");
    expect(within(card).getByText("Not Available")).toBeTruthy();
    expect(
      within(card).getByText("No finalized source report is available."),
    ).toBeTruthy();
    expect(card.querySelector("time")).toBeNull();
    expect(card.querySelectorAll('[data-active="true"]')).toHaveLength(0);
  });
  it("keeps multiple assignments separate rather than manufacturing a daily average", () => {
    render(<Performance records={initialRecords} id="EMP005" />);
    fireEvent.click(screen.getByText("Explore your 4-week history"));
    fireEvent.click(screen.getByRole("button", { name: /Tuesday/ }));
    expect(
      screen
        .getByLabelText("Daily utilization")
        .querySelectorAll(".daily-utilization-record"),
    ).toHaveLength(2);
  });
});
