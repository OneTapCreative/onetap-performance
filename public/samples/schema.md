# OneTap Performance synthetic import schema

Use only the included synthetic roster EMP001–EMP030. CSV must have a header row; XLSX uses its first worksheet, a header row and plain cell values. Dates must be strings, not Excel date cells. No formulas, hyperlinks, rich text, macros or merged headers.

| Column                           | Format / validation                                                 |
| -------------------------------- | ------------------------------------------------------------------- |
| employee_id                      | Existing synthetic ID, EMP001–EMP030                                |
| department                       | Exact roster department: Outbound, Picking or Packing               |
| work_date                        | YYYY-MM-DD, Monday–Friday in the reporting week                     |
| reporting_week                   | Monday date: 2026-09-14, 2026-09-21, 2026-09-28 or 2026-10-05       |
| cases_completed                  | Integer, 0–100000                                                   |
| earned_standard_hours            | Numeric, 0–72                                                       |
| actual_eligible_productive_hours | Numeric, greater than 0 and at most 24                              |
| official_performance_percentage  | Numeric, 0–300; no % symbol                                         |
| finalization_status              | finalized, corrected or pending                                     |
| revision                         | Integer >= 1; corrections must exceed the existing revision         |
| finalized_at                     | YYYY-MM-DDTHH:mm:ssZ, on/after work date; blank allowed for pending |

All column headers are required. Decimal separator is a period. Maximum 5 MB and 10000 rows; XLSX maximum 50 columns. The schema represents one aggregated eligible shift record per employee/work date. Multiple tasks or multiple shifts per day must be consolidated by the source before using this demo.

The unique key is employee_id + work_date. Duplicate keys inside a file are blocking errors. Identical existing records are skipped even if the filename changes. Changed records require a higher revision. Unknown employee IDs, roster mismatches and invalid values block the whole publication. No partial publication of a report with errors.

Reports are patches: absent employees and dates retain existing records. Missing roster members are flagged in the preview. A missing/pending daily record makes its reporting period incomplete. Zero productive hours cannot supply a valid percentage in this demo; such records must be resolved in the source.

An official daily percentage differing from earned/actual by more than 0.2 percentage points produces a warning, not a silent rewrite. Daily official values remain as supplied; sample period calculations always use eligible earned hours / eligible actual hours × 100. No approved official period summary is included in this demo.

## Files to try

- baseline.csv / baseline.xlsx: all 598 original records, including missing and pending examples. Importing into the original snapshot reports 598 identical records and publishes nothing.
- sample-correction.csv / sample-correction.xlsx: all 598 records with one revision to EMP002 on 2026-10-09: 3500 cases, 110%, revision 2. Preview reports 597 identical records and one correction. Approving changes the kiosk's latest shift and aggregate calculations in the same tab.
- invalid.csv: missing columns and an unknown employee; rejected.

All processing and publication happen in this tab's memory. Refresh, a new tab, another device, or closing the page returns to the baseline. No file storage, external synchronization or production access control is implemented.
