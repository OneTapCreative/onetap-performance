import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import Papa from "papaparse";
import { DemoProvider } from "@/components/demo-provider";
import { ImportPanel } from "@/components/import-panel";
import Kiosk from "@/app/kiosk/page";
import { initialRecords } from "@/lib/data";
import { COLUMNS, toImportRow } from "@/lib/import";
function Flow() {
  const [kiosk, setKiosk] = useState(false);
  return (
    <DemoProvider>
      {kiosk ? (
        <Kiosk />
      ) : (
        <>
          <ImportPanel tr={(en) => en} />
          <button onClick={() => setKiosk(true)}>Go to kiosk</button>
        </>
      )}
    </DemoProvider>
  );
}
it("keeps the baseline until approval, then reflects published data in the same-tab kiosk", async () => {
  render(<Flow />);
  const base = initialRecords.find(
    (r) => r.employeeId === "EMP002" && r.workDate === "2026-10-09",
  )!;
  const changed = {
    ...base,
    cases: 3500,
    revision: 2,
    status: "corrected" as const,
  };
  const file = new File([""], "correction.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", {
    value: async () =>
      Papa.unparse([toImportRow(changed)], { columns: COLUMNS }),
  });
  fireEvent.change(screen.getByLabelText("Upload synthetic report"), {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(screen.getByText("Review before publishing")).toBeTruthy(),
  );
  expect(base.cases).not.toBe(3500);
  fireEvent.click(screen.getByText(/Approve & publish locally/));
  expect(screen.getByRole("status").textContent).toContain(
    "1 records published locally",
  );
  fireEvent.click(screen.getByText("Go to kiosk"));
  fireEvent.click(screen.getByText("Fill demo credentials"));
  fireEvent.click(screen.getByText("View my performance"));
  expect(screen.getByText("3,500")).toBeTruthy();
});
