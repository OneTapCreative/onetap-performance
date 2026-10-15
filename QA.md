# Verification record

## Verified locally

- Dependency installation completed; package-lock.json included.
- Production `next build` with Next.js 16.4.1 completed, including TypeScript checking and static generation of `/`, `/kiosk`, `/manager` and the not-found route.
- 34 automated tests passed in 4 files using Vitest and React Testing Library/jsdom.
- The 95% OR rule passes all supplied examples, exact boundary values, unrounded near-boundary values and incomplete-period cases.
- An unequal-duration test confirms earned/actual weighting, not arithmetic averaging.
- The dataset contains 30 fictional associates and 598 unique employee/date records; missing, pending and corrected records are exercised.
- Simulated sign-in, rejected credentials, numeric keypad, clear/backspace, private PIN clearing, manual logout, Spanish, language reset, week/day drill-down and unavailable daily records passed DOM interaction tests.
- 60-second inactivity logout, interaction reset, and wall-clock expiry after a suspended/hidden tab passed fake-clock tests. The production hook uses real user event listeners and Date.now deadlines.
- No other-employee search, employee dropdown or manager link is rendered in the signed-in kiosk. Manager records require a separate explicit demo entry. These are presentation checks, not production access control.
- CSV and real generated XLSX parsing passed. Invalid schema, unknown IDs, invalid dates/hours, duplicate record keys/files, changed revisions, stale approval, XLSX formulas and oversized input are covered.
- A UI test uploads a synthetic correction, reviews it, approves publication, switches to the kiosk within the same provider and verifies the updated latest-shift cases.
- Source scan of app, components, lib and public found no employer name, proprietary source-system branding or browser persistence APIs.
- Calculated contrast samples: muted text on paper 5.57:1; deep green on white and white on green 6.66:1; supporting white-green text 5.61:1; selected-card supporting text 9.22:1. These selected pairs pass WCAG AA for normal text; this is not a full accessibility audit.
- Responsive CSS includes landscape controls for 1024×768, portrait layouts for 768×1024, mobile layouts for 390/375px, horizontally scrollable manager tables, reduced-motion support and 44px+ interactive control targets.

## Outstanding acceptance checks

No supported browser-control skill was available in this managed environment. Browser preview, screenshots, computed layout/overflow checks, real Safari/iPad touch interaction, assistive-technology testing and a real-time 60-second deployed-session test were **not performed**. Responsive CSS/source review and jsdom do not prove visual layout correctness. Test at 1024×768, 768×1024, 390px and 375px before calling visual QA complete.

Pre-deployment verification record: the user has now created the separate GitHub repository and approved upload/deployment; Vercel preview verification is pending. Connected account inspection found no existing OneTap Performance target; main and client repositories were left untouched. The GitHub integration exposes repository reads/edits but not repository creation. The user supplied the empty repository and approved Phase 5. No live URL or remote repository URL is claimed.

## Preview acceptance checklist after approval

1. Create the separate `OneTapCreative/onetap-performance` repository and new Vercel project.
2. Deploy the committed source to a preview and verify READY state plus HTTP loads of all three routes and downloads.
3. On iPad Safari (both orientations), enter 002 + 1234 via the keypad; confirm incorrect PIN, English/Spanish, week/day details and Finish & Sign Out.
4. Wait 60 seconds without interaction; confirm reset. Repeat with interaction at 45 seconds and with background/resume after expiry.
5. Confirm the kiosk never displays another employee and manager demo requires separate entry.
6. Import the sample CSV, review 597 skips + 1 correction, approve, open kiosk in the same tab and verify 3500 latest-shift cases and 110% official daily efficiency. Re-import and verify no new changes. Repeat from refresh using XLSX.
7. Confirm missing/pending examples remain Insufficient Data and all views match the synthetic dataset.
8. Inspect overflow, text, focus, contrast, input zoom and touch targets at each required viewport. Fix observed issues before promoting a public release.
