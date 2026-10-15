import { isFinal, PerformanceRecord } from "@/lib/data";
import { departmentLabel, shiftLabel } from "@/lib/warehouse";
import { utilizationBand } from "@/lib/utilization";
import { UtilizationBadge } from "./utilization";
import { Translate } from "./ui";

/** Source metadata stays attached to the exact published assignment, never an inferred average. */
export function UtilizationSource({
  record,
  tr,
  spanish = false,
}: {
  record?: PerformanceRecord;
  tr: Translate;
  spanish?: boolean;
}) {
  return record ? (
    <div className="utilization-source">
      <p>
        {tr("Source reporting date", "Fecha del informe original")}:{" "}
        <time dateTime={record.workDate}>{record.workDate}</time> ·{" "}
        {tr("Reporting week", "Semana del informe")}: {record.reportingWeek}
      </p>
      <p>
        {tr("Source last updated", "Última actualización del origen")}:{" "}
        {record.finalizedAt ? (
          <time dateTime={record.finalizedAt}>{record.finalizedAt}</time>
        ) : (
          tr("Not Available", "No disponible")
        )}
      </p>
      <p>
        {record.employeeId} · {departmentLabel(record.departmentId, spanish)} ·{" "}
        {shiftLabel(record.shiftId, spanish)} ·{" "}
        {tr("Source record", "Registro original")}: {record.assignmentId} ·{" "}
        {tr("Revision", "Revisión")} {record.revision}
      </p>
    </div>
  ) : (
    <p className="utilization-source">
      {tr(
        "No finalized source report is available.",
        "No hay un informe original finalizado disponible.",
      )}
    </p>
  );
}

export function MyUtilization({
  record,
  tr,
  spanish = false,
}: {
  record?: PerformanceRecord;
  tr: Translate;
  spanish?: boolean;
}) {
  const band = utilizationBand(record?.utilizationPercent);
  const ranges = [
    {
      band: "low",
      range: "≤79%",
      label: tr("Low Utilization", "Utilización baja"),
    },
    {
      band: "target",
      range: "80–85%",
      label: tr("Target Range", "Rango objetivo"),
    },
    {
      band: "high",
      range: "≥86%",
      label: tr("High Utilization", "Utilización alta"),
    },
  ];
  return (
    <section
      className="panel my-utilization"
      aria-label={tr("My Utilization", "Mi utilización")}
    >
      <div className="my-utilization-heading">
        <div>
          <h2>{tr("My Utilization", "Mi utilización")}</h2>
          <p>
            {tr(
              "Utilization: How much of my eligible time was reported as qualifying work?",
              "Utilización: ¿Qué parte de mi tiempo elegible se reportó como trabajo que cumple los criterios?",
            )}
          </p>
        </div>
        <UtilizationBadge value={record?.utilizationPercent} tr={tr} />
      </div>
      <ul
        className="utilization-segments"
        aria-label={tr("Utilization display ranges", "Rangos de utilización")}
      >
        {ranges.map((range) => (
          <li
            key={range.band}
            className={`util-${range.band}`}
            data-active={band === range.band}
          >
            <strong>{range.range}</strong>
            <span>{range.label}</span>
            {band === range.band && (
              <small>{tr("Your reported range", "Tu rango reportado")}</small>
            )}
          </li>
        ))}
      </ul>
      <p className="utilization-reference">
        {tr(
          "Utilization is provided for reference. Official time classifications are verified in Manhattan.",
          "La utilización se proporciona como referencia. Las clasificaciones oficiales del tiempo se verifican en Manhattan.",
        )}{" "}
        {tr(
          "Higher is not automatically better. This value does not change your productivity status.",
          "Un valor mayor no siempre es mejor. Este valor no cambia tu estado de productividad.",
        )}
      </p>
      <UtilizationSource record={record} tr={tr} spanish={spanish} />
      <p className="utilization-source">
        {tr(
          "Reported for this assignment only; not a weekly utilization average. Missing values are not replaced with older reports.",
          "Reportado solo para esta asignación; no es un promedio semanal de utilización. Los valores ausentes no se sustituyen por informes anteriores.",
        )}
      </p>
    </section>
  );
}

export function DailyUtilization({
  rows,
  tr,
  spanish = false,
}: {
  rows: PerformanceRecord[];
  tr: Translate;
  spanish?: boolean;
}) {
  const finalized = rows.filter(isFinal);
  return (
    <section
      className="daily-utilization"
      aria-label={tr("Daily utilization", "Utilización diaria")}
    >
      <h3>{tr("Utilization · informational", "Utilización · informativa")}</h3>
      {finalized.length ? (
        finalized.map((record) => (
          <div className="daily-utilization-record" key={record.assignmentId}>
            <UtilizationBadge
              value={record.utilizationPercent}
              tr={tr}
              compact
            />
            <UtilizationSource record={record} tr={tr} spanish={spanish} />
          </div>
        ))
      ) : (
        <p>{tr("Not Available", "No disponible")}</p>
      )}
      <p className="utilization-reference">
        {tr(
          "Reported per assignment, without combining percentages. Official time classifications are verified in Manhattan.",
          "Reportado por asignación, sin combinar porcentajes. Las clasificaciones oficiales del tiempo se verifican en Manhattan.",
        )}
      </p>
    </section>
  );
}
