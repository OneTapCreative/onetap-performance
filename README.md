# OneTap Performance

A functional synthetic warehouse performance demonstration by OneTap Creative. Built with Next.js 16 App Router, TypeScript, React 19 and Tailwind CSS 4. Independent green, white and charcoal product identity. Adapted from the accessible v10 prototype: retains its kiosk-first layout, keypad, bilingual experience and privacy controls, replacing disconnected datasets with one consistent model and adding a dedicated manager route.

## Run

Use Node.js 22.12+ or Node.js 24 LTS and npm.

```bash
npm ci
npm run typecheck
npm test
npm run build
npm start
```

For development: `npm run dev`. Regenerate synthetic fixtures: `npm run samples`. No environment variables, API keys, database or paid services are needed. The lockfile pins installed dependencies.

## Routes and demonstration

- `/`: product entry with separate associate and manager experiences.
- `/kiosk`: numeric ID suffix `002` (the field supplies EMP), private PIN `1234`; complete credential is EMP002. Use on-screen keypad or keyboard, or Fill demo credentials. Only this fictional associate can sign in.
- `/manager`: explicitly enter the separately labeled manager demonstration. Search/filter 30 fictional associates, inspect individual four-week/daily histories, and select Report imports.

Try a sample CSV or XLSX from the import panel, review 597 identical records and one correction, then Approve & publish locally. Open kiosk using the in-app link in the **same tab**, sign in, and see the updated latest shift. A full reload resets to the baseline. Try the same file again to see duplicate prevention.

### Kiosk sessions

The session exists only in React memory. Pointer movement/presses, touch, wheel and keyboard activity renew the 60-second deadline. A wall-clock check on timers, tab visibility changes and focus handles suspended tabs; interactions arriving after the deadline expire the session rather than renewing it. Manual Finish & Sign Out is present on all signed-in views. Logout removes the personal view, credentials, history selection and language; returning to the kiosk route starts a new sign-in. No localStorage, sessionStorage, cookies or IndexedDB hold personal data or credentials. No other-employee selector/search or manager link appears while signed in.

This is simulated access, **not production authentication**. Synthetic source data and demo PIN are intentionally available in client JavaScript. The manager entry button is a demonstration gate, not a security boundary. A user who knows `/manager` must explicitly enter that separate demo; no associate session grants manager access.

## Data and calculations

`lib/data.ts` is the single seeded data source: 30 fictional IDs, four Monday–Friday weeks from Sep 14 to Oct 9, 2026, 598 records across Outbound/Picking/Packing, two missing days, one pending report and one corrected report. `EMP007` and `EMP014` illustrate insufficient latest-period data; EMP002 illustrates improvement and a corrected daily record. All department labels and records are fictional.

`lib/performance.ts` calculates period percentages as the sum of finalized eligible earned hours divided by the sum of finalized eligible actual productive hours × 100. It does not average daily or weekly percentages. Official daily percentages are preserved and displayed from each record. No approved official period summary is available in this dataset; the period percentages are explicitly sample calculations, not an attempt to reproduce a source system's engineered labor standards.

Meets standard if **1-week >=95 OR 4-week >=95**, using unrounded values. Manager review only if both complete periods are below 95. Otherwise Insufficient Data. A qualifying complete week can meet the standard even when the four-week period is incomplete. Missing or pending days never receive invented percentages. Completeness uses the explicit five-day weekly calendar, suitable for this demo only; production must use the approved work schedule, eligibility policy and approved official period summaries when supplied. Review flags never initiate disciplinary actions.

The manager productivity band is a **partial team summary** of finalized latest-week rows; it is not a team accountability result. Corrected records replace the same employee/date at higher revisions, never add duplicate work.

## Imports

See [schema guide](public/samples/schema.md). CSV parsing uses Papa Parse. XLSX parsing uses ExcelJS loaded only when an Excel file is selected. Files are processed in the browser and retained only in tab memory. Publication merges validated rows by unique ID/date after an explicit approval; validation is repeated against the current snapshot. No network upload, secure server storage, employer-system integration, persistent history or cross-device synchronization exists.

## Production work required

Before any real workforce data is used:

1. Employer IT/security approval, authorized data handling and retention policies, source schema/eligibility review and approved official summary methodology.
2. Server-side employee/manager sessions; per-user authorization on every data endpoint; manager roles and tenant isolation. Never ship all employee records to kiosks.
3. Secure PIN enrollment, salted adaptive PIN hashing and server verification, login rate limiting and lockout policy. HTTPS and Secure/HttpOnly/SameSite session cookies with CSRF protection; server-enforced idle and absolute expiration.
4. Managed iPad configuration with supervised Single App Mode or approved kiosk policy, disabled autofill/password saving, appropriate screen privacy and logout handling for device lock, browser navigation and suspended sessions.
5. Durable validated import storage, audit log, official-source reconciliation, revision/rollback controls and deliberate publication. Appropriate file/parser isolation, size controls and dependency security review.
6. Real iPad Safari acceptance testing, accessibility audit, employer-approved Spanish copy and employee support process.

## Testing

`npm test` runs domain/import checks and React DOM interaction tests in jsdom: OR boundaries, weighted durations, incomplete periods, corrected records, CSV/XLSX parsing, duplicate files/keys, stale approvals, invalid schemas, unknown IDs, formulas and file limits, keypad/backspace/clear, correct and incorrect sign-in, privacy, timeout and real interaction resets, suspended-tab expiry, manual sign-out, Spanish and daily history. See `QA.md` for verified results and outstanding checks.

## Deployment target

Intended new repository: `OneTapCreative/onetap-performance`; intended new Vercel project: `onetap-performance`. No existing main website or client repository is used. The user created the separate repository and approved Phase 5. Source upload and Vercel preview verification are in progress.

Use this separate repository, including package-lock.json, with a new Vercel project. Framework: Next.js; root: repository root; install: npm ci; build: npm run build. Use a preview first, verify `/`, `/kiosk`, `/manager`, the sample downloads, Safari interaction and all required viewports before treating it as deployment-complete. Never promote to an existing client/main website project.

## File map

`app/` routes and responsive styling; `components/` reusable presentation, keypad kiosk page, history, import panel and in-memory provider; `lib/` shared data, calculation, import and session logic; `tests/` automated checks; `public/samples/` downloadable CSV/XLSX and schema; `scripts/samples.ts` fixture generation.
