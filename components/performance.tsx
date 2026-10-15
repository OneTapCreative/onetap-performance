"use client";
import { useState } from "react";
import { dateAt, isFinal, PerformanceRecord, WEEK_STARTS } from "@/lib/data";
import { percent, period, summarize } from "@/lib/performance";
import { Kpi, Translate } from "./ui";
const formatDate = (date: string, es: boolean) =>
  new Date(date + "T12:00:00Z").toLocaleDateString(es ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
export function Performance({
  records,
  id,
  spanish = false,
  manager = false,
}: {
  records: PerformanceRecord[];
  id: string;
  spanish?: boolean;
  manager?: boolean;
}) {
  const [week, setWeek] = useState<number | null>(null),
    [day, setDay] = useState<string | null>(null);
  const tr: Translate = (en, es) => (spanish ? es : en);
  const summary = summarize(records, id),
    { one, four, latest, standing, own } = summary;
  const selected = day ? own.find((r) => r.workDate === day) : undefined;
  const status =
    standing === "meets"
      ? tr("You’re meeting the standard.", "Estás cumpliendo el estándar.")
      : standing === "review"
        ? tr("Let’s review your progress.", "Revisemos tu progreso.")
        : tr("Your report is incomplete.", "Tu informe está incompleto.");
  const time = own
    .filter(isFinal)
    .map((r) => r.finalizedAt)
    .sort()
    .at(-1);
  return (
    <div className="performance" key={id}>
      {week === null ? (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {tr(
                  "YOUR PERFORMANCE, AT A GLANCE",
                  "TU RENDIMIENTO, DE UN VISTAZO",
                )}
              </p>
              <h1>
                {tr(
                  "Every shift moves you forward.",
                  "Cada turno te hace avanzar.",
                )}
              </h1>
              <p>
                {tr(
                  "A clear look at your latest completed work.",
                  "Una mirada clara a tu último trabajo completado.",
                )}
              </p>
            </div>
            <span className="identity">
              {id}{" "}
              <span>· {tr("Synthetic associate", "Asociado ficticio")}</span>
            </span>
          </div>
          <section
            className={`spotlight ${standing}`}
            aria-label={tr("Performance status", "Estado de rendimiento")}
          >
            <div className="spotlight-copy">
              <div className="status-tag">
                <span className="status-dot" />
                {standing === "meets"
                  ? tr("ON TRACK", "VAS BIEN")
                  : standing === "review"
                    ? tr("MANAGER REVIEW", "REVISIÓN DEL SUPERVISOR")
                    : tr("INSUFFICIENT DATA", "DATOS INSUFICIENTES")}
              </div>
              <h2>{status}</h2>
              <p>
                {tr(
                  "You meet the 95% standard when either your 1-week OR 4-week average qualifies.",
                  "Cumples el estándar del 95% si tu promedio de 1 semana O de 4 semanas lo alcanza.",
                )}
              </p>
            </div>
            <div className="score-ring">
              <span>{tr("4-WEEK AVERAGE", "PROMEDIO DE 4 SEMANAS")}</span>
              <strong>{percent(four.percent)}</strong>
              <small>
                {four.complete
                  ? tr("95% standard", "Estándar del 95%")
                  : tr("Insufficient Data", "Datos insuficientes")}
              </small>
            </div>
          </section>
          <div className="kpis">
            <Kpi
              label={tr("1-week average", "Promedio de 1 semana")}
              value={percent(one.percent)}
              note={
                one.complete
                  ? tr(
                      "Latest completed reporting week",
                      "Última semana de informes",
                    )
                  : tr("Insufficient Data", "Datos insuficientes")
              }
            />
            <Kpi
              label={tr("Latest shift · cases", "Último turno · cajas")}
              value={
                latest?.cases.toLocaleString(spanish ? "es-US" : "en-US") ?? "—"
              }
              note={
                latest
                  ? formatDate(latest.workDate, spanish)
                  : tr("Unavailable", "No disponible")
              }
            />
            <Kpi
              label={tr(
                "Latest shift · efficiency",
                "Último turno · rendimiento",
              )}
              value={percent(latest?.officialPercent ?? null)}
              note={tr(
                "Official daily report value",
                "Valor oficial del informe diario",
              )}
            />
          </div>
          <button className="history-cta" onClick={() => setWeek(3)}>
            <span>
              <small>
                {tr(
                  "THE STORY BEHIND YOUR NUMBERS",
                  "LA HISTORIA DETRÁS DE TUS NÚMEROS",
                )}
              </small>
              <strong>
                {tr(
                  "Explore your 4-week history",
                  "Explora tu historial de 4 semanas",
                )}
              </strong>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
          <p className="report-time">
            {tr("Latest finalized report:", "Último informe finalizado:")}{" "}
            {time
              ? new Date(time).toLocaleString(spanish ? "es-US" : "en-US", {
                  timeZone: "UTC",
                }) + " UTC"
              : "—"}{" "}
            · {tr("Synthetic data", "Datos ficticios")}
          </p>
          {standing === "review" && (
            <p className="notice">
              {tr(
                "A supervisor will verify these results. This flag does not initiate disciplinary action.",
                "Un supervisor verificará estos resultados. Esta alerta no inicia una acción disciplinaria.",
              )}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {tr("YOUR PROGRESS OVER TIME", "TU PROGRESO CON EL TIEMPO")}
              </p>
              <h1>
                {tr(
                  "Four weeks. One clear view.",
                  "Cuatro semanas. Una visión clara.",
                )}
              </h1>
              <p>
                {tr(
                  "Choose a week, then a day to see the details.",
                  "Elige una semana y luego un día para ver los detalles.",
                )}
              </p>
            </div>
            <button
              className="secondary"
              onClick={() => {
                setWeek(null);
                setDay(null);
              }}
            >
              ← {tr("Overview", "Resumen")}
            </button>
          </div>
          <div className="week-grid">
            {WEEK_STARTS.map((w, i) => {
              const p = period(own, [w]);
              return (
                <button
                  key={w}
                  aria-pressed={week === i}
                  className={`week-card ${week === i ? "selected" : ""}`}
                  onClick={() => {
                    setWeek(i);
                    setDay(null);
                  }}
                >
                  <div>
                    <span>
                      {tr("Week", "Semana")} {i + 1}
                    </span>
                    <span aria-hidden="true">
                      {p.percent !== null && p.percent >= 95 ? "✓" : "↗"}
                    </span>
                  </div>
                  <strong>{percent(p.percent)}</strong>
                  <small>
                    {formatDate(w, spanish)} –{" "}
                    {formatDate(dateAt(w, 4), spanish)}
                  </small>
                  <div className="mini-track">
                    <span
                      style={{
                        width: `${Math.min(100, ((p.percent ?? 0) / 120) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>
                    {p.complete
                      ? `${p.cases.toLocaleString()} ${tr("cases", "cajas")}`
                      : tr("Insufficient Data", "Datos insuficientes")}
                  </small>
                </button>
              );
            })}
          </div>
          <section className="panel daily">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {tr("DAILY BREAKDOWN", "DETALLE DIARIO")}
                </p>
                <h2>
                  {tr("Week", "Semana")} {week + 1}
                </h2>
              </div>
              <span>
                {tr("95% daily indicator", "Indicador diario del 95%")}
              </span>
            </div>
            <div className="day-list">
              {Array.from({ length: 5 }, (_, d) => {
                const date = dateAt(WEEK_STARTS[week], d),
                  row = own.find((r) => r.workDate === date),
                  ready = !!row && isFinal(row);
                return (
                  <button
                    className={`day-row ${day === date ? "active" : ""}`}
                    key={date}
                    onClick={() => setDay(date)}
                    aria-expanded={day === date}
                  >
                    <span>
                      <b>
                        {new Date(date + "T12:00:00Z").toLocaleDateString(
                          spanish ? "es-US" : "en-US",
                          { weekday: "long", timeZone: "UTC" },
                        )}
                      </b>
                      <small>{formatDate(date, spanish)}</small>
                    </span>
                    <span className="day-cases">
                      {ready ? row.cases.toLocaleString() : "—"}{" "}
                      <small>{tr("cases", "cajas")}</small>
                    </span>
                    <span
                      className={`day-score ${ready && row.officialPercent >= 95 ? "positive" : ""}`}
                    >
                      {ready
                        ? percent(row.officialPercent)
                        : tr(
                            row ? "Incomplete" : "Unavailable",
                            row ? "Incompleto" : "No disponible",
                          )}
                      <small>
                        {ready
                          ? row.officialPercent >= 95
                            ? tr("At standard", "Cumple el estándar")
                            : tr("Below daily target", "Bajo la meta diaria")
                          : tr(
                              "No finalized record",
                              "Sin registro finalizado",
                            )}
                      </small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                );
              })}
            </div>
          </section>
          {day && (
            <section className="panel day-detail" aria-live="polite">
              <div className="section-heading">
                <h2>
                  {tr("Day details", "Detalles del día")} ·{" "}
                  {formatDate(day, spanish)}
                </h2>
                <button className="text-button" onClick={() => setDay(null)}>
                  {tr("Close", "Cerrar")}
                </button>
              </div>
              {selected && isFinal(selected) ? (
                <>
                  <div className="detail-grid">
                    <Kpi
                      label={tr("Cases completed", "Cajas completadas")}
                      value={selected.cases.toLocaleString()}
                      note={selected.workDate}
                    />
                    <Kpi
                      label={tr("Official performance", "Rendimiento oficial")}
                      value={percent(selected.officialPercent)}
                      note={tr(
                        "Reported daily value",
                        "Valor diario reportado",
                      )}
                    />
                    <Kpi
                      label={tr(
                        "Earned standard hours",
                        "Horas estándar ganadas",
                      )}
                      value={selected.earnedHours.toFixed(3)}
                      note={tr(
                        "Synthetic exported hours",
                        "Horas exportadas ficticias",
                      )}
                    />
                    <Kpi
                      label={tr(
                        "Actual productive hours",
                        "Horas productivas reales",
                      )}
                      value={selected.actualHours.toFixed(2)}
                      note={tr(
                        "Eligible productive time",
                        "Tiempo productivo elegible",
                      )}
                    />
                  </div>
                  <p className="report-time">
                    {tr("Report status", "Estado del informe")}:{" "}
                    {selected.status === "corrected"
                      ? tr("Corrected", "Corregido")
                      : tr("Finalized", "Finalizado")}{" "}
                    · {tr("Revision", "Revisión")} {selected.revision} ·{" "}
                    {selected.finalizedAt}
                  </p>
                </>
              ) : (
                <p className="notice">
                  {tr(
                    "Insufficient Data. No finalized record is available for this day.",
                    "Datos insuficientes. No hay un registro finalizado disponible para este día.",
                  )}
                </p>
              )}
            </section>
          )}
        </>
      )}
      {!manager && (
        <p className="quiet-note">
          {tr(
            "Questions about a result? Ask your supervisor to review the source report.",
            "¿Tienes preguntas sobre un resultado? Pide a tu supervisor que revise el informe original.",
          )}
        </p>
      )}
    </div>
  );
}
