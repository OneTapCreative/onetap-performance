import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Manager from "@/app/manager/page";
import Kiosk from "@/app/kiosk/page";
import { DemoProvider } from "@/components/demo-provider";
import { initialRecords, WEEK_STARTS } from "@/lib/data";
import { scopedOverview } from "@/lib/performance";
function manager() {
  render(
    <DemoProvider>
      <Manager />
    </DemoProvider>,
  );
  fireEvent.click(screen.getByText(/Enter manager demonstration/));
}
function metric(name: string) {
  return screen.getByText(name, { exact: true }).closest("article")!;
}
function filter() {
  fireEvent.change(screen.getByLabelText("Shift filter"), {
    target: { value: "SHIFT_2" },
  });
  fireEvent.change(screen.getByLabelText("Department filter"), {
    target: { value: "SHIPPING" },
  });
  fireEvent.change(screen.getByLabelText("Reporting period"), {
    target: { value: WEEK_STARTS[3] },
  });
}
describe("warehouse scope and profiles", () => {
  it("updates scope totals and work-assignment rows with combined filters", () => {
    manager();
    filter();
    const expected = scopedOverview(
      initialRecords,
      { shiftId: "SHIFT_2", departmentId: "SHIPPING" },
      [WEEK_STARTS[3]],
    );
    expect(
      metric("Total associates").querySelector("strong")?.textContent,
    ).toBe(String(expected.ids.length));
    expect(
      metric("Work assignments").querySelector("strong")?.textContent,
    ).toBe(String(expected.workAssignmentCount));
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(expected.ids.length);
    rows.forEach((row) => {
      expect(row.textContent).toContain("2nd Shift");
      expect(row.textContent).toContain("Shipping");
      expect(row.textContent).not.toContain("Receiving");
    });
  });
  it("shows current assignment separately from transferred historical work", () => {
    manager();
    fireEvent.click(screen.getByLabelText("View EMP002"));
    const current = screen.getByLabelText("Current primary assignment");
    expect(current.textContent).toContain("Shipping");
    expect(current.textContent).toContain("2nd Shift");
    fireEvent.click(screen.getByText("Shift & department assignment history"));
    expect(
      screen
        .getByText("Shift & department assignment history")
        .closest("details")?.textContent,
    ).toContain("2026-09-28");
    expect(
      screen.getByText("Coaching & 1-on-1 history — planned"),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Coaching & 1-on-1 history — planned"));
    expect(
      screen.getByText(/The coaching module is not implemented/),
    ).toBeTruthy();
  });
  it("keeps individual work records in the selected reporting scope", () => {
    manager();
    filter();
    fireEvent.click(screen.getByLabelText("View EMP002"));
    const table = screen
      .getByText("Work assignment records")
      .closest("section")!;
    expect(table.textContent).not.toContain("2026-09-18");
    expect(table.textContent).toContain("2026-10-09");
    fireEvent.change(screen.getByLabelText("Filter work date"), {
      target: { value: "2026-10-09" },
    });
    expect(within(table).getAllByRole("row")).toHaveLength(2);
  });
  it("shows only the signed-in employee current assignment in the kiosk", () => {
    render(
      <DemoProvider>
        <Kiosk />
      </DemoProvider>,
    );
    fireEvent.click(screen.getByText("Fill demo credentials"));
    fireEvent.click(screen.getByText("View my performance"));
    const card = screen.getByLabelText("Current primary assignment");
    expect(card.textContent).toContain("Shipping");
    expect(card.textContent).toContain("2nd Shift");
    expect(card.textContent).toContain("2:00 PM–10:30 PM");
    expect(screen.queryByLabelText("Shift filter")).toBeNull();
    expect(screen.queryByLabelText("Department filter")).toBeNull();
  });
});
