import { utilizationBand, utilizationPercent } from "@/lib/utilization";
import { Translate } from "./ui";
export function UtilizationBadge({
  value,
  tr,
  compact = false,
}: {
  value: number | null | undefined;
  tr: Translate;
  compact?: boolean;
}) {
  const band = utilizationBand(value);
  const label =
    band === "low"
      ? tr("Low Utilization", "Utilización baja")
      : band === "target"
        ? tr("Target Range", "Rango objetivo")
        : band === "high"
          ? tr("High Utilization", "Utilización alta")
          : band === "between"
            ? tr("Between display bands", "Entre rangos de visualización")
            : tr("Unavailable", "No disponible");
  return (
    <span
      className={`utilization-badge util-${band} ${compact ? "compact" : ""}`}
    >
      <strong>{utilizationPercent(value)}</strong>
      <span>{label}</span>
    </span>
  );
}
export function UtilizationGuide({ tr }: { tr: Translate }) {
  return (
    <section
      className="utilization-guide"
      aria-label={tr(
        "Utilization visual reference",
        "Referencia visual de utilización",
      )}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {tr("VISUAL REFERENCE ONLY", "SOLO REFERENCIA VISUAL")}
          </p>
          <h2>
            {tr(
              "Utilization is context. Verify the cause.",
              "La utilización aporta contexto. Verifica la causa.",
            )}
          </h2>
        </div>
        <span className="pill">
          {tr(
            "Separate from productivity",
            "Independiente de la productividad",
          )}
        </span>
      </div>
      <div className="utilization-legend">
        <span className="util-low">
          ≤79% · {tr("Low Utilization", "Utilización baja")}
        </span>
        <span className="util-target">
          80–85% · {tr("Target Range", "Rango objetivo")}
        </span>
        <span className="util-high">
          ≥86% · {tr("High Utilization", "Utilización alta")}
        </span>
      </div>
      <p>
        {tr(
          "The 80–85% display band is proposed, using an 85% benchmark. Higher is not automatically better. Low utilization may reflect more indirect time. High utilization may reflect interruptions or delays without appropriate indirect-function coding. These are possibilities, not conclusions.",
          "El rango visual de 80–85% es propuesto, con un punto de referencia del 85%. Un valor mayor no siempre es mejor. Un valor bajo puede reflejar más tiempo indirecto; uno alto puede reflejar interrupciones o demoras sin la codificación indirecta apropiada. Son posibilidades, no conclusiones.",
        )}
      </p>
      <p>
        <b>
          {tr(
            "Verify utilization, indirect functions, PF&D and downtime in Manhattan before drawing conclusions.",
            "Verifica la utilización, las funciones indirectas, PF&D y el tiempo de inactividad en Manhattan antes de sacar conclusiones.",
          )}
        </b>{" "}
        {tr(
          "Utilization does not change productivity standing or trigger review, coaching or discipline.",
          "La utilización no cambia el estado de productividad ni activa revisiones, orientación o medidas disciplinarias.",
        )}
      </p>
      <small>
        {tr(
          "Values below show the latest finalized work assignment in the selected scope and period, with its work date. They are not weekly, department or warehouse utilization averages. Missing reports remain unavailable. Fractional gaps between the specified bands stay neutral.",
          "Los valores muestran la última asignación finalizada en el ámbito y período seleccionados, con su fecha operativa. No son promedios semanales, departamentales ni del almacén. Los datos ausentes no están disponibles. Los valores fraccionarios entre los rangos indicados permanecen neutrales.",
        )}
      </small>
    </section>
  );
}
