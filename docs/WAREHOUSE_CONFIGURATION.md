# Warehouse configuration update

The existing demo now has three stable shift IDs and four stable department IDs. `lib/warehouse.ts` owns the default warehouse timezone (America/Los_Angeles), 95% threshold and lookup helpers.

| Shift ID | Name      | Warehouse-local schedule |
| -------- | --------- | ------------------------ |
| SHIFT_1  | 1st Shift | 06:00–14:30              |
| SHIFT_2  | 2nd Shift | 14:00–22:30              |
| SHIFT_3  | 3rd Shift | 22:00–06:30 next day     |

| Department ID  | Name           |
| -------------- | -------------- |
| RECEIVING      | Receiving      |
| EQUIPMENT      | Equipment      |
| ORDER_SELECTOR | Order Selector |
| SHIPPING       | Shipping       |

## Assignment and work models

Employee IDs are unchanged. Primary assignment history stores a stable assignment ID, shift ID, department ID, manager ID and half-open effective dates: from is inclusive; until is exclusive. A transfer closes the old interval and appends another assignment. EMP002 demonstrates a change from 1st Shift / Receiving / MGR001 to 2nd Shift / Shipping / MGR002 on Sep 28. Its current primary schedule is 2:00 PM–10:30 PM. Current assignment is displayed separately from historical work.

Work assignments have their own immutable IDs and identify where/when the work occurred. Temporary work and overtime reference the primary assignment but retain their actual shift and department. EMP005 works in two departments on Oct 6; EMP006 demonstrates a temporary shift change on Oct 7; EMP009 has a separate overtime work assignment on Oct 8. None rewrites a primary assignment or duplicates employee identity.

The demonstration has 602 expected assignments, 600 performance records, two missing reports and one pending report. Scheduled minutes are separate from earned/eligible productive hours. All three regular schedules are 510 wall-clock minutes; those minutes are never used as the productivity denominator. Actual eligible hours come from the synthetic report.

`shiftCandidates` explicitly returns multiple possible shifts during overlaps: 06:00–06:30, 14:00–14:30, and 22:00–22:30. `resolveOperationalWorkday` uses the assigned shift to resolve after-midnight dates; third-shift work at 02:15 Saturday belongs to Friday's operational date. Overtime outside schedule requires an explicit source operational work date. Inputs are warehouse-local civil timestamps; do not pass a UTC date string and treat it as local. In production convert source instants using the configured IANA timezone before resolving and preserve authoritative source work dates. Schedule duration is not actual duration on daylight-saving transitions and is never a performance input.

The current demo does not provide a roster editor, persistent transfer workflow or arbitrary new work-assignment creation. Seeded assignment histories demonstrate the model. Imports must refer to registered work-assignment IDs. Production needs transactional assignment changes and approved scheduling/eligibility rules.

## Scope and accountability

Manager shift, department and reporting-period filters combine against work assignments, not current primary department. Headcount is distinct employee IDs expected or reported in that selected scope, including employees with missing reports. Work-assignment count is a separate metric and may exceed headcount. Search and status filters narrow roster display; scope totals do not change with search/status.

Cases, latest finalization timestamp and weighted productivity use selected-period records. Pending records are excluded from weighted totals; missing/pending coverage is shown explicitly. This partial aggregate must not be presented as a finalized employee accountability result.

Each employee's 1-week and 4-week status uses that work scope and a reporting window ending at the selected period. Earlier anchors never include future results or pretend that one to three weeks is four finalized weeks. Completeness is checked against every expected work assignment, including split-department work. A period with no expected work returns no result. A complete available result >=95 meets standard; otherwise both complete below-standard results are needed for Manager Review. In all other cases, Insufficient Data. Raw values determine threshold comparisons, not rounded display values.

Sample aggregates remain summed earned hours / summed eligible productive hours ×100. Official assignment percentages are preserved. A daily view with one work assignment uses its reported percentage; multiple assignments use weighted hours with a visible explanation. No official consolidated day or period summary is included. A future approved official summary ingestion path must take precedence when supplied and validated.

## Legacy preservation

No meanings of Outbound, Picking or Packing were confirmed. There is **no automatic mapping** to the new departments. `lib/archive/v1-data.ts` retains the original v1 generator and 598 original records. Original CSV/XLSX baseline and correction files remain under `/samples/legacy-v1/`; the manager page exposes the archive download. They are not merged into active configured reporting. New synthetic records are a separate v2 demonstration using the same stable employee IDs, not a relabeling of v1 facts. Legacy imports are rejected with an explicit reviewed-mapping message. A production migration must retain raw source rows, obtain mapping approval and reconcile before making them active.

## Coaching and production limits

The profile identifies coaching as **planned**. `lib/coaching.ts` defines manager notes, meeting dates/types, employee response, source revision snapshot, action plan, follow-up, stable employee ID and audit events. `docs/warehouse-schema.sql` is an unexecuted PostgreSQL architecture reference for persistent tables. No coaching meetings were fabricated, no notes are stored, no audit service is running, and authorized manager access is not implemented.

Existing kiosk simulated PIN sign-in, keypad, English/Spanish, 60-second timeout and sign-out are preserved. Manager entry remains a separate clearly labeled simulation. Production still needs server sessions, secure PIN verification, rate limiting, per-employee/manager and tenant authorization, managed kiosk configuration and employer IT approval before any real workforce data.
