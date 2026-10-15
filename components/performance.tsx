"use client";
import { useState } from "react";
import {
  dateAt,
  isFinal,
  PerformanceRecord,
  WEEK_STARTS,
  workAssignments,
} from "@/lib/data";
import { percent, period, summarize, weighted } from "@/lib/performance";
import {
  departmentLabel,
  matchesScope,
  Scope,
  shiftLabel,
  warehouseConfig,
} from "@/lib/warehouse";
import { AssignmentSummary } from "./assignment-profile";
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
  scope = {},
  anchor = WEEK_STARTS[3],
  workWeeks = WEEK_STARTS,
}: {
  records: PerformanceRecord[];
  id: string;
  spanish?: boolean;
  manager?: boolean;
  scope?: Scope;
  anchor?: string;
  workWeeks?: string[];
}) {
  const [week, setWeek] = useState<number | null>(null),
    [day, setDay] = useState<string | null>(null),
    [workDate, setWorkDate] = useState("all");
  const tr: Translate = (en, es) => (spanish ? es : en);
  const { one, four, latest, standing, own } = summarize(
      records,
      id,
      scope,
      anchor,
    ),
    standard = warehouseConfig.performanceStandard;
  const expected = workAssignments.filter(
    (a) => a.employeeId === id && matchesScope(a, scope),
  );
  function daily(date: string) {
    const rows = own.filter((r) => r.workDate === date),
      planned = expected.filter((a) => a.workDate === date);
    const complete =
      planned.length > 0 &&
      planned.every((a) =>
        rows.some((r) => r.assignmentId === a.id && isFinal(r)),
      );
    return {
      rows,
      complete,
      percent: complete
        ? rows.length === 1
          ? rows[0].officialPercent
          : weighted(rows)
        : null,
      cases: rows.filter(isFinal).reduce((s, r) => s + r.cases, 0),
    };
  }
  const workRows = own.filter((r) => workWeeks.includes(r.reportingWeek));
  const selected = day ? daily(day) : null;
  const time = own
    .filter(isFinal)
    .map((r) => r.finalizedAt)
    .sort()
    .at(-1);
  const title =
    standing === "meets"
      ? tr("You’re meeting the standard.", "Estás cumpliendo el estándar.")
      : standing === "review"
        ? tr("Let’s review your progress.", "Revisemos tu progreso.")
        : tr("Your report is incomplete.", "Tu informe está incompleto.");
  const scoped = !!scope.shiftId || !!scope.departmentId;
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
          {!manager && <AssignmentSummary id={id} spanish={spanish} />}
          {scoped && (
            <p className="notice">
              {tr("Filtered work history", "Historial de trabajo filtrado")}:{" "}
              {scope.shiftId
                ? shiftLabel(scope.shiftId, spanish)
                : tr("All Shifts", "Todos los turnos")}{" "}
              ·{" "}
              {scope.departmentId
                ? departmentLabel(scope.departmentId, spanish)
                : tr("All Departments", "Todos los departamentos")}
              .{" "}
              {tr(
                "Current primary assignment is shown separately.",
                "La asignación principal actual se muestra por separado.",
              )}
            </p>
          )}
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
              <h2>{title}</h2>
              <p>
                {tr(
                  `You meet the ${standard}% standard when either your 1-week OR 4-week average qualifies.`,
                  `Cumples el estándar del ${standard}% si tu promedio de 1 semana O de 4 semanas lo alcanza.`,
                )}
              </p>
            </div>
            <div className="score-ring">
              <span>{tr("4-WEEK AVERAGE", "PROMEDIO DE 4 SEMANAS")}</span>
              <strong>{percent(four.percent)}</strong>
              <small>
                {four.complete
                  ? tr(`${standard}% standard`, `Estándar del ${standard}%`)
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
              note={
                latest &&
                own.filter((r) => r.workDate === latest.workDate).length > 1
                  ? tr(
                      "Weighted across work assignments",
                      "Ponderado por asignación de trabajo",
                    )
                  : tr(
                      "Official daily report value",
                      "Valor oficial del informe diario",
                    )
              }
            />
          </div>
          <button
            className="history-cta"
            onClick={() => setWeek(WEEK_STARTS.indexOf(anchor))}
          >
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
            {time ?? "—"} · {tr("Synthetic data", "Datos ficticios")}
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
            {WEEK_STARTS.filter((w) => w <= anchor).map((w, i) => {
              const p = period(records, [w], id, scope);
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
                      {p.percent !== null && p.percent >= standard ? "✓" : "↗"}
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
                {tr(
                  `${standard}% daily indicator`,
                  `Indicador diario del ${standard}%`,
                )}
              </span>
            </div>
            <div className="day-list">
              {Array.from({ length: 5 }, (_, d) => {
                const date = dateAt(WEEK_STARTS[week], d),
                  value = daily(date);
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
                      {value.complete ? value.cases.toLocaleString() : "—"}{" "}
                      <small>{tr("cases", "cajas")}</small>
                    </span>
                    <span
                      className={`day-score ${value.percent !== null && value.percent >= standard ? "positive" : ""}`}
                    >
                      {value.complete
                        ? percent(value.percent)
                        : value.rows.length
                          ? tr("Incomplete", "Incompleto")
                          : tr("Unavailable", "No disponible")}
                      <small>
                        {value.complete
                          ? value.percent! >= standard
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
          {day && selected && (
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
              {selected.complete ? (
                <>
                  <div className="detail-grid">
                    <Kpi
                      label={tr("Cases completed", "Cajas completadas")}
                      value={selected.cases.toLocaleString()}
                      note={day}
                    />
                    <Kpi
                      label={tr("Official performance", "Rendimiento oficial")}
                      value={percent(selected.percent)}
                      note={
                        selected.rows.length === 1
                          ? tr("Reported daily value", "Valor diario reportado")
                          : tr(
                              "Weighted assignment results",
                              "Resultados ponderados de asignaciones",
                            )
                      }
                    />
                    <Kpi
                      label={tr(
                        "Earned standard hours",
                        "Horas estándar ganadas",
                      )}
                      value={selected.rows
                        .reduce((s, r) => s + r.earnedHours, 0)
                        .toFixed(3)}
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
                      value={selected.rows
                        .reduce((s, r) => s + r.actualHours, 0)
                        .toFixed(2)}
                      note={tr(
                        "Eligible productive time",
                        "Tiempo productivo elegible",
                      )}
                    />
                  </div>
                  {selected.rows.map((r) => (
                    <p className="report-time" key={r.assignmentId}>
                      {departmentLabel(r.departmentId, spanish)} ·{" "}
                      {shiftLabel(r.shiftId, spanish)} ·{" "}
                      {tr("Work date", "Fecha operativa")}: {r.workDate} ·{" "}
                      {tr("Revision", "Revisión")} {r.revision} ·{" "}
                      {r.status === "corrected"
                        ? tr("Corrected", "Corregido")
                        : tr("Finalized", "Finalizado")}{" "}
                      · {r.finalizedAt}
                    </p>
                  ))}
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
      {manager && (
        <section className="panel work-records">
          <div className="section-heading">
            <h2>
              {tr(
                "Work assignment records",
                "Registros de asignaciones de trabajo",
              )}
            </h2>
            <label className="date-filter">
              {tr("Work date", "Fecha operativa")}
              <select
                aria-label={tr("Filter work date", "Filtrar fecha operativa")}
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
              >
                <option value="all">
                  {tr("All dates", "Todas las fechas")}
                </option>
                {[...new Set(workRows.map((r) => r.workDate))]
                  .sort()
                  .map((date) => (
                    <option key={date}>{date}</option>
                  ))}
              </select>
            </label>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{tr("Date", "Fecha")}</th>
                  <th>{tr("Department", "Departamento")}</th>
                  <th>{tr("Shift", "Turno")}</th>
                  <th>{tr("Cases", "Cajas")}</th>
                  <th>%</th>
                  <th>
                    {tr("Earned / eligible h", "Horas ganadas / elegibles")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {workRows
                  .filter((r) => workDate === "all" || r.workDate === workDate)
                  .map((r) => (
                    <tr key={r.assignmentId}>
                      <td>
                        {r.workDate}
                        <small>{r.assignmentId}</small>
                      </td>
                      <td>{departmentLabel(r.departmentId, spanish)}</td>
                      <td>{shiftLabel(r.shiftId, spanish)}</td>
                      <td>{isFinal(r) ? r.cases : "—"}</td>
                      <td>
                        {isFinal(r)
                          ? percent(r.officialPercent)
                          : tr("Incomplete", "Incompleto")}
                      </td>
                      <td>
                        {r.earnedHours.toFixed(3)} / {r.actualHours.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!workRows.length && (
              <p className="empty">
                {tr(
                  "No records in this scope.",
                  "No hay registros en este ámbito.",
                )}
              </p>
            )}
          </div>
        </section>
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
