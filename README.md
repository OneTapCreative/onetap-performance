# OneTap Performance

Functional synthetic warehouse performance demo by OneTap Creative. Next.js 16 App Router, TypeScript, React 19 and Tailwind CSS 4. Existing green/white/charcoal branding, bilingual kiosk, keypad, timeout, manager navigation and imports are preserved.

## Run and test

Node.js 22.12+ or Node.js 24 LTS; no API keys, database, environment variables or paid services are needed.

```bash
npm ci
npm run typecheck
npm test
npm run build
npm start
```

`npm run dev` starts development. `npm run samples` regenerates only the v2 synthetic fixtures. The lockfile pins installed dependencies.

## Use

- `/`: product entry.
- `/kiosk`: employee ID EMP002 (numeric suffix 002), PIN 1234. Touchscreen keypad, English/Spanish, 60-second inactivity expiry and manual Finish & Sign Out. The signed-in kiosk has no employee selector, search or manager link. Current assignment: Shipping, 2nd Shift, 2:00 PM–10:30 PM. Historical work uses the assignment in effect when performed.
- `/manager`: separately enter the clearly labeled manager demo. Combine Shift, Department and Reporting period filters. KPIs distinguish unique associates from work assignments, missing and pending reports. Open employee profiles to view dated primary assignments, supervisor, temporary work/overtime, daily work records and four-week history.
- Report imports: download a v2 CSV/XLSX, review 599 duplicate skips and one correction, approve and open the kiosk in the **same tab** to see 3500 latest-shift cases. Refresh restores the baseline. CSV uses Papa Parse; ExcelJS loads only when XLSX is selected.

## Warehouse configuration

| Shift     | Warehouse-local schedule  |
| --------- | ------------------------- |
| 1st Shift | 6:00 AM–2:30 PM           |
| 2nd Shift | 2:00 PM–10:30 PM          |
| 3rd Shift | 10:00 PM–6:30 AM next day |

Four direct-labor departments: Receiving, Equipment, Order Selector, Shipping. IDs and the configurable 95% performance standard live in `lib/warehouse.ts`. Scheduled minutes are separate from eligible productive hours. Overnight dates are resolved with an explicit assigned shift; overlaps return multiple candidates, and overtime outside a schedule requires an explicit source work date.

`lib/data.ts` contains 30 stable synthetic employee IDs, dated primary assignments and 602 expected work assignments over four weeks (Sep 14–Oct 9, 2026), with 600 performance records, two missing and one pending. Examples include EMP002 transferring on Sep 28, EMP005 splitting work across departments, EMP006 temporarily changing shifts and EMP009 performing overtime.

See [warehouse model and migration](docs/WAREHOUSE_CONFIGURATION.md) for exact scope, completeness and operational-date semantics; [import schema](public/samples/schema.md) for CSV/XLSX fields; and [SQL architecture](docs/warehouse-schema.sql) for the future persistent model. SQL is a reference only, not an executed migration.

## Performance rules

An associate meets standard if finalized 1-week **OR** finalized 4-week result is >=95. Both complete and below standard means Manager Review. If an available complete result does not establish compliance and another required result is incomplete/unavailable, show Insufficient Data. Comparisons use unrounded values. Missing/pending assignments never receive invented percentages. No review flag initiates discipline.

Sample aggregates use summed finalized eligible earned hours / summed finalized eligible productive hours ×100. No arithmetic averaging of percentages and no use of scheduled 8.5-hour shift time. Official assignment percentages are preserved; multiple-work-assignment daily results are explicitly weighted. No approved official consolidated period summaries are included; a future validated official-summary ingestion path must take precedence when supplied.

Manager headcount is distinct employees expected/reported in the selected work scope and period. Work-assignment count is separate. Search/status narrow roster display, not scope totals. Accountability uses the scoped 1-week/4-week window ending at the selected period, with no future records included. The productivity band is a partial weighted summary of finalized scope records, not an employee accountability decision. Expected work assignments govern completeness.

## Legacy preservation

Old labels were not mapped without confirmation. `lib/archive/v1-data.ts` retains the original 598-record model. Original CSV/XLSX baseline/correction files remain under `public/samples/legacy-v1/` and the manager page offers the original archive download. Current v2 reports are a separate synthetic dataset using the same stable IDs; historical records were not deleted or silently relabeled. Old-schema imports need reviewed mappings and are explicitly rejected in v2.

## Coaching status and security

Coaching is **planned, not implemented**. Profiles and `lib/coaching.ts` preserve the architecture for notes, meeting date/type, employee response, performance/source revision snapshot, agreed actions, follow-up, manager access scope and audit events. Records reference stable employee IDs, independent of transfers. No coaching storage, authorized access enforcement or live audit trail is claimed.

The demo uses simulated access. Credentials and synthetic data are intentionally in client JavaScript. The manager gate is not production authorization. No localStorage, sessionStorage, cookies or IndexedDB store credentials or personal records. Imports stay only in React memory in the current tab and are not uploaded to a server.

Before real data: implement server sessions and per-record employee/manager/tenant authorization; secure PIN enrollment, adaptive hashing, verification and rate limits; secure cookies/CSRF protection; employer IT approval; managed iPad kiosk configuration; approved work-calendar/eligibility/official-summary rules; durable audited import/publication/rollback; secure coaching storage and audit retention; accessible iPad Safari testing and reviewed Spanish copy. The demo does not include a roster editor or persistent transfer workflow.

## Repository and deployment

Repository: https://github.com/OneTapCreative/onetap-performance

Live application: https://onetap-performance.vercel.app

Only this repository/project is used. Git-connected Vercel builds the Next.js project from repository root. No changes to the main agency or client websites. See `QA.md` for verification limits.

## Manager utilization reference

The manager roster and employee detail show source-reported utilization separately from productivity: ≤79% Low Utilization (orange/red), 80–85% Target Range (green, proposed), ≥86% High Utilization (amber). Missing values stay unavailable. It is a visual reference only: verify utilization, indirect functions, PF&D and downtime in Manhattan before conclusions. It never changes the 95% productivity OR rule, review counts or coaching. The roster value is the latest finalized work assignment in the selected scope, not a weekly/department average. The kiosk is unchanged. Optional CSV/XLSX column utilization_percentage supports 0–100 or blank. See [utilization details](docs/UTILIZATION.md).
