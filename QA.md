# OneTap Performance verification

## Passed locally

- Production `next build` with Next.js 16.4.1 completed, including TypeScript checking and static route generation for `/`, `/kiosk`, `/manager` and the not-found route.
- 88 automated tests passed in eight files using Vitest and React Testing Library/jsdom.
- Existing correct/incorrect kiosk sign-in, keypad/clear/backspace, manual logout, 60-second idle deadline, user-interaction reset, hidden-tab expiry, Spanish, privacy, daily/week details, manager entry and approved import-to-kiosk refresh tests remain passing.
- Existing 95% OR boundary/incomplete cases, unequal-duration weighting, corrected revisions, CSV/XLSX parsing, duplicate prevention, stale approvals, invalid values/formulas/file sizes remain passing against the new schema.
- New tests verify exact shift schedules/IDs, department names/IDs, overnight work dates, overlapping shift candidates, overtime source dates, stable employee IDs, effective-dated transfers, combined shift/department/week filters, distinct headcount, separate work assignment count, correct denominator, expected-assignment completeness, earlier reporting anchors, legacy preservation, configurable threshold and historical/temporary import validation.
- UI tests verify combined-scope KPIs and rows, current primary assignment vs transferred history, scoped employee work records/date filtering, coaching planned-state labeling and kiosk assignment display without employee/manager search controls.
- 30 distinct employees, 602 expected assignments, 600 current records, two missing and one pending. The 598 original v1 records and CSV/XLSX reports are archived without automatic department mapping.
- New schema samples regenerate successfully; primary and historical work remain separate from scheduled shift minutes.

## Boundaries

These are automated DOM and domain checks, not real-browser/iPad visual acceptance. The earlier browser verification service timed out; no new visual verification is claimed. Existing responsive CSS is retained with adaptive assignment/profile/filter layouts, 44px+ controls and scrollable tables. iPad Safari at 1024×768 and 768×1024 and 390/375px layouts, real touch, assistive technology and a real-time deployed 60-second idle test still require acceptance testing.

The existing repository is OneTapCreative/onetap-performance, linked to its own Vercel project. Push/deployment state must be verified for the new commit; READY and HTTP route responses do not prove visual correctness or interaction behavior. The main agency and client websites are outside this update.

Coaching is architecture only: no stored notes, secure coaching authorization or operational audit trail. `docs/warehouse-schema.sql` is an unexecuted future-schema reference, not a deployed database. The current app still uses simulated access and tab-local imports. No real employee data may be used without the documented production controls.

## Useful acceptance examples

1. Manager → 2nd Shift → Shipping → Week 4: rows and totals use performed work in that scope, including temporary Shipping work; associates count once.
2. Open EMP002: current Shipping / 2nd Shift / MGR002; assignment history preserves Receiving / 1st Shift / MGR001 through Sep 27. Earlier reporting periods do not include later results.
3. EMP005 has two department assignments on Oct 6, EMP006 a temporary shift on Oct 7 and EMP009 separate overtime on Oct 8. Incomplete constituent assignments cannot produce a complete period.
4. Kiosk EMP002 / 1234: Shipping, 2nd Shift, 2:00 PM–10:30 PM; historical results, timeout and sign-out remain available.
5. Import sample v2 CSV/XLSX: 599 identical rows and one correction. Approve then use kiosk in the same tab for 3500 latest-shift cases / 110% official result. Refresh restores baseline.
6. Legacy archive download retains original data; v1 imports explicitly require reviewed mapping rather than silently mapping labels.

## Utilization enhancement

23 additional test cases cover exact visual boundaries, neutral fractional gaps, missing/invalid values, no rounding across boundaries, unchanged productivity/accountability metrics for 0–100/null utilization, no coaching generation, finalized assignment/shift/department/period selection, optional backwards-compatible imports, utilization-only corrections, real XLSX parsing, bilingual text labels, manager verification notice and kiosk reference isolation. Utilization remains source-reported and is not averaged or calculated from shift hours. Import preview exposes its value separately from productivity. Coaching remains planned. Browser/iPad visual acceptance is still outstanding; no new browser verification is claimed.

## Associate kiosk utilization update — awaiting deployment approval

- Boundary rendering covers 79%, 80%, 85%, 86%, 92% and null, with exact source values, text labels and a read-only segmented indicator. Missing records never become 0% or borrow another employee’s utilization.
- Automated checks verify English/Spanish card labels, source dates/timestamps/IDs, current-range text, manager/kiosk source consistency, approved CSV correction reflected in the same-tab kiosk, actual historical day selection, pending/missing daily data and separate records for split assignments.
- Existing sign-in, incorrect PIN, keypad, manual logout, inactivity expiry, interaction reset, storage/privacy and 95% OR/weighted-calculation tests remain passing. Expiry/manual logout remove utilization from the UI.
- `npm run typecheck`, `npm test` (88 tests) and `npm run build` pass. No dependencies, sample data or productivity/accountability calculations changed.
- Responsive CSS uses three `minmax(0, 1fr)` indicator segments above 420px, wrapping source IDs/timestamps, flexible headings, a smaller utilization score than the main productivity score, and stacked segments on narrow screens. This is a source review, not measured browser layout testing.
- **Still required:** visual/interaction acceptance in iPad Safari at 1024×768 and 768×1024 and at 375/390px, with English/Spanish and a real 60-second session. Browser preview is unavailable in this managed environment; do not mark these checks passed. No new deployment has been made. The branch is local to avoid triggering Git-connected Vercel deployment before approval.
