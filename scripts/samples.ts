import { mkdir, writeFile } from "node:fs/promises";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { initialRecords } from "../lib/data";
import { COLUMNS, toImportRow } from "../lib/import";
await mkdir("public/samples", { recursive: true });
const correction = initialRecords.map((r) =>
  r.employeeId === "EMP002" && r.workDate === "2026-10-09"
    ? {
        ...r,
        revision: 2,
        status: "corrected" as const,
        cases: 3500,
        officialPercent: 110,
        earnedHours: Number((r.actualHours * 1.1).toFixed(4)),
        finalizedAt: "2026-10-12T06:00:00Z",
      }
    : r,
);
for (const [name, rows] of [
  ["baseline", initialRecords],
  ["sample-correction", correction],
] as const) {
  const values = rows.map(toImportRow);
  await writeFile(
    `public/samples/${name}.csv`,
    Papa.unparse(values, { columns: COLUMNS }),
  );
  const book = new ExcelJS.Workbook(),
    sheet = book.addWorksheet("Performance");
  sheet.addRow(COLUMNS);
  values.forEach((row) => sheet.addRow(COLUMNS.map((c) => row[c])));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c) => {
    c.width = 26;
  });
  await book.xlsx.writeFile(`public/samples/${name}.xlsx`);
}
await writeFile(
  "public/samples/invalid.csv",
  "employee_id,department\nEMP999,Unknown",
);
console.log("Created baseline, correction and invalid synthetic fixtures.");
