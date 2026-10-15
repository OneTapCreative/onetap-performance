# OneTap Performance v2 synthetic import schema

Use only the registered synthetic roster EMP001–EMP030 and work assignments in the current demo. All core column headers are required, including stable work, shift and department IDs. The utilization_percentage extension is optional. CSV has a header row; XLSX uses its first sheet and plain values only. Dates are text, not Excel date objects. Maximum 5 MB, 10000 rows and 50 XLSX columns. Formulas, hyperlinks and rich text are rejected.

| Column                           | Format / validation                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| employee_id                      | Stable synthetic ID EMP001–EMP030                                                       |
| assignment_id                    | Registered unique work assignment, e.g. EMP002-2026-10-09-A                             |
| shift_id                         | SHIFT_1, SHIFT_2 or SHIFT_3; work shift, not current primary shift                      |
| department_id                    | RECEIVING, EQUIPMENT, ORDER_SELECTOR or SHIPPING; where the work occurred               |
| department                       | Matching canonical display name: Receiving, Equipment, Order Selector or Shipping       |
| work_date                        | YYYY-MM-DD operational workday; matches the work assignment, including overnight shifts |
| reporting_week                   | Monday date: 2026-09-14, 2026-09-21, 2026-09-28 or 2026-10-05                           |
| cases_completed                  | Integer 0–100000                                                                        |
| earned_standard_hours            | Numeric 0–72                                                                            |
| actual_eligible_productive_hours | Numeric greater than 0, at most 24; never scheduled shift hours                         |
| official_performance_percentage  | Numeric 0–300, no % symbol                                                              |
| finalization_status              | finalized, corrected or pending                                                         |
| revision                         | Integer >=1; changed records require a higher revision                                  |
| finalized_at                     | Valid YYYY-MM-DDTHH:mm:ssZ on/after work date; blank allowed for pending                |
| utilization_percentage           | Optional reported percentage 0–100; blank = unavailable; informational only             |

Unique key: employee_id + assignment_id. Multiple departments, temporary shifts and overtime on one operational date are separate assignments. Duplicate keys inside a file block publication. Identical existing rows are skipped across filenames and file formats. Changed rows require a higher revision. The registered work assignment must match the employee, shift, department, work date and reporting week; a current primary assignment does not overwrite historical work.

Operational dates come from the source and explicit shift/work assignment. Third-shift activity after midnight stays on the preceding operational workday. Clock time alone cannot distinguish overlapping shifts. Unscheduled overtime needs an explicit source date and a registered overtime assignment. The demo does not create new roster/work assignments through imports.

Reports are patches, not roster replacements. Missing employees retain existing records and are flagged in preview. A missing or pending expected work assignment makes its scoped reporting period incomplete. Unknown IDs, conflicting assignments, legacy labels, invalid values and schema errors block the entire publication. Approval revalidates against the latest in-memory snapshot.

Daily official assignment percentages are preserved. Differences from earned/eligible above 0.2 percentage points create a warning. Aggregates use summed eligible earned hours / summed eligible productive hours ×100. No approved official period summary is included. Scheduled 510-minute shift duration never enters productivity calculations.

## Files

- baseline.csv / baseline.xlsx: 600 current records across 602 expected assignments, including two missing and one pending record. Importing into the initial snapshot detects 600 identical rows.
- sample-correction.csv / sample-correction.xlsx: one correction to EMP002-2026-10-09-A: 3500 cases, 110%, revision 2. Expect 599 skips and one correction, with refreshed kiosk results after approval in the same tab.
- invalid.csv: intentionally invalid structure.
- legacy-v1/: original 598-record reports preserved unchanged. These lack confirmed shift/department mapping and cannot be published into v2. Obtain a reviewed mapping and reconciliation before a real migration; no automatic relabeling is applied.

All processing and publication occur only in this tab's memory. Refresh/new tab/device restores the baseline. No secure storage, cross-device sync or production access control is implemented.

Utilization is independent of productivity. No indirect hours or utilization percentage is inferred from scheduled hours. If the optional column is absent, existing rows retain their utilization; new records without a known value use null. A present blank clears the value (higher revision required for changed existing rows). Utilization changes never alter productivity status or create accountability/coaching actions. See docs/UTILIZATION.md for visual bands and scope.
