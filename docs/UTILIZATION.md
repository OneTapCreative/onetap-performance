# Utilization — informational manager display

`PerformanceRecord.utilizationPercent` is a nullable, source-reported percentage independent of official productivity percentage, earned hours, eligible productive hours and scheduled duration. The synthetic demo includes low, target, high and unavailable examples. It does not derive utilization from shift length or attempt to reproduce source-system eligibility rules.

| Reported value  | Visual label     | Color        |
| --------------- | ---------------- | ------------ |
| ≤79%            | Low Utilization  | Orange/red   |
| 80–85%          | Target Range     | Green        |
| ≥86%            | High Utilization | Amber/yellow |
| Missing/invalid | Unavailable      | Neutral      |

The target display band is **proposed**, based on an 85% benchmark. Higher utilization is not automatically better. Low may reflect increased indirect time; high may reflect work interruptions/delays without the appropriate indirect-function coding. These are hypotheses only. The manager notice explicitly requires verification of utilization, indirect functions, PF&D and downtime in Manhattan before conclusions.

Raw percentages are not rounded across boundaries. Because the supplied whole-number ranges do not define 79<x<80 or 85<x<86, those fractional gaps are labeled Between display bands in neutral styling. Invalid/out-of-range values are rejected on import, not shown as low or high. Missing utilization is never 0%.

## Views and scope

The manager roster includes Latest utilization for each employee: the latest **finalized work assignment** within the selected shift, department and reporting period. It shows the assignment's operational date and ID for traceability. A deterministic tie-break uses finalization timestamp then assignment ID; it does not claim one of several same-day assignments represents the whole shift. A newer finalized record with no utilization remains Unavailable; the display does not silently substitute an older populated value.

Employee manager detail includes the same reference and a percentage/visual label for each finalized work-assignment record. Pending records show Unavailable. The associate kiosk is unchanged and does not display utilization warnings or controls.

No weekly, four-week, department or warehouse utilization average is manufactured. A defensible aggregate needs the source's approved utilization numerator/denominator and eligibility methodology; those are not supplied in this demo. Weighted productivity still uses earned/eligible hours, which is a different calculation.

## Import compatibility

CSV/XLSX optionally include `utilization_percentage`. Plain numeric 0–100 values are accepted; a blank cell explicitly represents unavailable. This column is exported by the sample fixtures and included in duplicate/revision comparisons. Existing v2 reports without the column remain accepted: an existing row's utilization remains unchanged, and a new row with no known value uses null. Changing an existing value requires the same higher-revision approval workflow as other fields. Preview explicitly shows utilization alongside each change. Legacy v1 department/assignment mapping restrictions remain.

## No automatic decisions

The utilization module contains display formatting, visual band classification and scoped record selection only. It is not referenced by productivity standing, missing-data accountability, review counts, coaching generation, mandatory tasks or disciplinary workflows. Tests vary utilization from 0 to 100 and null while asserting identical productivity results, headcounts and review inputs. Coaching remains planned; no notes/actions/audit events are generated from utilization.

The SQL file adds a nullable percentage column as an unexecuted architecture reference only. Access remains a clearly labeled synthetic manager demonstration; no secure storage or real workforce authorization is claimed.
