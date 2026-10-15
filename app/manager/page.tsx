"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand, Kpi } from "@/components/ui";
import { useDemo } from "@/components/demo-provider";
import { Performance } from "@/components/performance";
import { ImportPanel } from "@/components/import-panel";
import { EmployeeProfile } from "@/components/assignment-profile";
import { associates, WEEK_STARTS } from "@/lib/data";
import { percent, scopedOverview, summarize } from "@/lib/performance";
import {
  departments,
  shifts,
  departmentLabel,
  shiftLabel,
  Scope,
  warehouseConfig,
} from "@/lib/warehouse";
export default function Manager() {
  const { records, publication } = useDemo();
  const [access, setAccess] = useState(false),
    [spanish, setSpanish] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState<"overview" | "import">("overview");
  const [shift, setShift] = useState("all"),
    [department, setDepartment] = useState("all"),
    [reporting, setReporting] = useState("four");
  const tr = (en: string, es: string) => (spanish ? es : en);
  useEffect(() => {
    document.documentElement.lang = spanish ? "es" : "en";
    return () => {
      document.documentElement.lang = "en";
    };
  }, [spanish]);
  const scope: Scope = useMemo(
    () => ({
      shiftId: shift === "all" ? undefined : (shift as Scope["shiftId"]),
      departmentId:
        department === "all"
          ? undefined
          : (department as Scope["departmentId"]),
    }),
    [shift, department],
  );
  const selectedWeeks = useMemo(
    () => (reporting === "four" ? WEEK_STARTS : [reporting]),
    [reporting],
  );
  const anchor = selectedWeeks[selectedWeeks.length - 1];
  const overview = useMemo(
    () => scopedOverview(records, scope, selectedWeeks),
    [records, scope, selectedWeeks],
  );
  const summaries = useMemo(
    () =>
      associates
        .filter((a) => overview.ids.includes(a.id))
        .map((a) => ({ ...a, ...summarize(records, a.id, scope, anchor) })),
    [records, scope, anchor, overview.ids],
  );
  const count = (status: string) =>
    summaries.filter((a) => a.standing === status).length;
  const rows = summaries.filter(
    (a) =>
      (filter === "all" || filter === a.standing) &&
      `${a.id} ${a.name} ${overview.expected
        .filter((w) => w.employeeId === a.id)
        .map((w) => departmentLabel(w.departmentId))
        .join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const changeScope = (setter: (value: string) => void, value: string) => {
    setter(value);
    setSelected(null);
  };
  function scopeFilters() {
    return (
      <section
        className="scope-filters"
        aria-label={tr("Warehouse scope", "Ámbito del almacén")}
      >
        <label>
          {tr("Shift", "Turno")}
          <select
            aria-label={tr("Shift filter", "Filtro de turno")}
            value={shift}
            onChange={(e) => changeScope(setShift, e.target.value)}
          >
            <option value="all">{tr("All Shifts", "Todos los turnos")}</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {spanish ? s.es : s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr("Department", "Departamento")}
          <select
            aria-label={tr("Department filter", "Filtro de departamento")}
            value={department}
            onChange={(e) => changeScope(setDepartment, e.target.value)}
          >
            <option value="all">
              {tr("All Departments", "Todos los departamentos")}
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {spanish ? d.es : d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr("Reporting period", "Período de informes")}
          <select
            aria-label={tr("Reporting period", "Período de informes")}
            value={reporting}
            onChange={(e) => changeScope(setReporting, e.target.value)}
          >
            <option value="four">
              {tr("All four weeks", "Las cuatro semanas")}
            </option>
            {WEEK_STARTS.map((w, i) => (
              <option key={w} value={w}>
                {tr("Week", "Semana")} {i + 1} · {w}
              </option>
            ))}
          </select>
        </label>
      </section>
    );
  }
  return (
    <main className="app-shell manager">
      <header className="header">
        <Brand />
        <div className="header-actions">
          <span className="demo-pill">
            {tr("MANAGER DEMO", "DEMO SUPERVISOR")}
          </span>
          <button className="language" onClick={() => setSpanish((v) => !v)}>
            {spanish ? "English" : "Español"}
          </button>
          {access && (
            <button
              className="secondary"
              onClick={() => {
                setAccess(false);
                setSelected(null);
                setQuery("");
                setFilter("all");
                setTab("overview");
                setShift("all");
                setDepartment("all");
                setReporting("four");
              }}
            >
              {tr("Exit demo", "Salir de la demo")}
            </button>
          )}
        </div>
      </header>
      {!access ? (
        <section className="manager-gate content">
          <div className="intro-symbol" aria-hidden="true">
            ◈
          </div>
          <p className="eyebrow">
            {tr(
              "A SEPARATE MANAGER EXPERIENCE",
              "UNA EXPERIENCIA PARA SUPERVISORES",
            )}
          </p>
          <h1>{tr("See the bigger picture.", "Ve el panorama completo.")}</h1>
          <p>
            {tr(
              "Review your team’s progress, verify reporting gaps and preview bulk imports.",
              "Revisa el progreso de tu equipo, verifica datos incompletos y prueba importaciones masivas.",
            )}
          </p>
          <div className="notice">
            {tr(
              "Clearly marked demonstration access. This is simulated access, not production authentication. All 30 associates are fictional.",
              "Acceso de demostración identificado. Es un acceso simulado, no autenticación de producción. Los 30 asociados son ficticios.",
            )}
          </div>
          <button className="primary" onClick={() => setAccess(true)}>
            {tr(
              "Enter manager demonstration",
              "Entrar a la demostración de supervisor",
            )}{" "}
            →
          </button>
          <Link className="text-button" href="/kiosk">
            ← {tr("Associate kiosk", "Kiosco para asociados")}
          </Link>
        </section>
      ) : (
        <div className="content manager-content">
          <div className="manager-topbar">
            <nav
              aria-label={tr("Manager navigation", "Navegación del supervisor")}
            >
              <button
                className={tab === "overview" ? "active" : ""}
                onClick={() => {
                  setTab("overview");
                  setSelected(null);
                }}
              >
                {tr("Team overview", "Resumen del equipo")}
              </button>
              <button
                className={tab === "import" ? "active" : ""}
                onClick={() => {
                  setTab("import");
                  setSelected(null);
                }}
              >
                {tr("Report imports", "Importar informes")}
              </button>
            </nav>
            <Link href="/kiosk" className="text-button">
              {tr("Open kiosk", "Abrir kiosco")} ↗
            </Link>
          </div>
          {tab === "overview" && scopeFilters()}
          {selected ? (
            <>
              <button
                className="secondary back"
                onClick={() => setSelected(null)}
              >
                ← {tr("All associates", "Todos los asociados")}
              </button>
              <EmployeeProfile id={selected} spanish={spanish} />
              <Performance
                key={`${selected}-${shift}-${department}-${anchor}`}
                records={records}
                id={selected}
                spanish={spanish}
                manager
                scope={scope}
                anchor={anchor}
                workWeeks={selectedWeeks}
              />
            </>
          ) : tab === "import" ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {tr(
                      "REVIEW. APPROVE. PUBLISH.",
                      "REVISAR. APROBAR. PUBLICAR.",
                    )}
                  </p>
                  <h1>
                    {tr(
                      "Better data. Clearer progress.",
                      "Mejores datos. Progreso más claro.",
                    )}
                  </h1>
                </div>
              </div>
              <ImportPanel tr={tr} />
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {tr(
                      "PEOPLE FIRST. PERFORMANCE CLEAR.",
                      "LAS PERSONAS PRIMERO. RENDIMIENTO CLARO.",
                    )}
                  </p>
                  <h1>
                    {tr(
                      "A clear view of your team.",
                      "Una visión clara de tu equipo.",
                    )}
                  </h1>
                  <p>
                    {tr(
                      "Four completed reporting weeks · Sep 14 – Oct 9, 2026",
                      "Cuatro semanas de informes · 14 sep – 9 oct de 2026",
                    )}
                  </p>
                </div>
                <span className="pill">
                  {tr("Synthetic warehouse", "Almacén ficticio")}
                </span>
              </div>
              <div className="kpis manager-kpis">
                <Kpi
                  label={tr("Total associates", "Total de asociados")}
                  value={overview.ids.length}
                  note={tr(
                    "Distinct employees in selected scope",
                    "Asociados únicos en el ámbito seleccionado",
                  )}
                />
                <Kpi
                  label={tr("Meeting standard", "Cumplen el estándar")}
                  value={count("meets")}
                  note={tr(
                    `1-week OR 4-week ≥ ${warehouseConfig.performanceStandard}%`,
                    `1 semana O 4 semanas ≥ ${warehouseConfig.performanceStandard}%`,
                  )}
                />
                <Kpi
                  label={tr("Manager review", "Revisión del supervisor")}
                  value={count("review")}
                  note={tr(
                    "Both complete periods below standard",
                    "Ambos períodos completos bajo el estándar",
                  )}
                />
                <Kpi
                  label={tr("Insufficient Data", "Datos insuficientes")}
                  value={count("insufficient")}
                  note={tr(
                    "No qualifying complete result",
                    "Sin resultado completo que cumpla",
                  )}
                />
              </div>
              <div className="productivity-band">
                <div>
                  <span>
                    {tr(
                      "Selected scope · weighted productivity",
                      "Ámbito seleccionado · productividad ponderada",
                    )}
                  </span>
                  <strong>{percent(overview.percent)}</strong>
                </div>
                <div>
                  <span>{tr("Finalized cases", "Cajas finalizadas")}</span>
                  <strong>{overview.cases.toLocaleString()}</strong>
                </div>
                <p>
                  {tr(
                    "Earned ÷ eligible productive hours. Missing and pending work is excluded from this partial productivity summary. Scheduled shift hours never enter the calculation.",
                    "Horas ganadas ÷ horas productivas elegibles. Este resumen parcial excluye trabajo ausente o pendiente. Las horas de turno programadas no entran en el cálculo.",
                  )}
                </p>
              </div>
              <div className="scope-reporting">
                <Kpi
                  label={tr("Work assignments", "Asignaciones de trabajo")}
                  value={overview.workAssignmentCount}
                  note={tr(
                    "Separate from distinct headcount",
                    "Independientes del número de asociados",
                  )}
                />
                <Kpi
                  label={tr(
                    "Missing / incomplete records",
                    "Registros ausentes / incompletos",
                  )}
                  value={`${overview.missing.length} / ${overview.pending.length}`}
                  note={tr(
                    "Expected assignments without a finalized result",
                    "Asignaciones previstas sin resultado finalizado",
                  )}
                />
                <Kpi
                  label={tr(
                    "Latest available report",
                    "Último informe disponible",
                  )}
                  value={overview.latestReport?.slice(0, 10) ?? "—"}
                  note={
                    overview.latestReport ??
                    tr(
                      "No finalized records in scope",
                      "Sin registros finalizados en el ámbito",
                    )
                  }
                />
              </div>
              <section className="panel roster">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{tr("YOUR TEAM", "TU EQUIPO")}</p>
                    <h2>
                      {tr("Associate performance", "Rendimiento de asociados")}
                    </h2>
                  </div>
                  <span>
                    {rows.length} / {overview.ids.length}
                  </span>
                </div>
                <div className="filters">
                  <input
                    type="search"
                    aria-label={tr("Search associates", "Buscar asociados")}
                    placeholder={tr(
                      "Search ID or department…",
                      "Buscar ID o departamento…",
                    )}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <select
                    aria-label={tr("Filter status", "Filtrar estado")}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">
                      {tr("All statuses", "Todos los estados")}
                    </option>
                    <option value="meets">
                      {tr("Meets standard", "Cumple el estándar")}
                    </option>
                    <option value="review">
                      {tr("Manager review", "Revisión del supervisor")}
                    </option>
                    <option value="insufficient">
                      {tr("Insufficient Data", "Datos insuficientes")}
                    </option>
                  </select>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr("Associate", "Asociado")}</th>
                        <th>
                          {tr(
                            "Work department(s)",
                            "Departamento(s) del trabajo",
                          )}
                        </th>
                        <th>{tr("Work shift(s)", "Turno(s) del trabajo")}</th>
                        <th>{tr("1 week", "1 semana")}</th>
                        <th>{tr("4 weeks", "4 semanas")}</th>
                        <th>{tr("Standing", "Estado")}</th>
                        <th>
                          <span className="sr-only">
                            {tr("Details", "Detalles")}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((a) => {
                        const work = overview.expected.filter(
                          (w) => w.employeeId === a.id,
                        );
                        return (
                          <tr key={a.id}>
                            <td>
                              <b>{a.id}</b>
                              <small>{a.name}</small>
                            </td>
                            <td>
                              {[
                                ...new Set(
                                  work.map((w) =>
                                    departmentLabel(w.departmentId, spanish),
                                  ),
                                ),
                              ].join(", ")}
                            </td>
                            <td>
                              {[
                                ...new Set(
                                  work.map((w) =>
                                    shiftLabel(w.shiftId, spanish),
                                  ),
                                ),
                              ].join(", ")}
                            </td>
                            <td>{percent(a.one.percent)}</td>
                            <td>{percent(a.four.percent)}</td>
                            <td>
                              <span className={`standing ${a.standing}`}>
                                {a.standing === "meets"
                                  ? tr("Meets standard", "Cumple el estándar")
                                  : a.standing === "review"
                                    ? tr(
                                        "Manager review",
                                        "Revisión del supervisor",
                                      )
                                    : tr(
                                        "Insufficient Data",
                                        "Datos insuficientes",
                                      )}
                              </span>
                            </td>
                            <td>
                              <button
                                className="view-button"
                                aria-label={`${tr("View", "Ver")} ${a.id}`}
                                onClick={() => setSelected(a.id)}
                              >
                                ↗
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!rows.length && (
                    <p className="empty" role="status">
                      {tr(
                        "No associates match your search.",
                        "Ningún asociado coincide con tu búsqueda.",
                      )}
                    </p>
                  )}
                </div>
              </section>
              <p className="quiet-note">
                {tr(
                  "Scope totals are independent of search/status filters. Accountability uses the selected work scope and the 1-week/4-week window ending at the selected period. Each employee is counted once; work assignments are counted separately. Review flags never initiate disciplinary action.",
                  "Los totales del ámbito son independientes de la búsqueda y el filtro de estado. La evaluación usa el ámbito del trabajo y los períodos de 1 y 4 semanas que terminan en el período elegido. Cada asociado se cuenta una vez; las asignaciones se cuentan por separado. Las alertas nunca inician acciones disciplinarias.",
                )}
              </p>
              <details className="legacy-note">
                <summary>
                  {tr(
                    "Legacy demonstration archive · 598 preserved records",
                    "Archivo histórico de demostración · 598 registros conservados",
                  )}
                </summary>
                <p>
                  {tr(
                    "Earlier department labels have no confirmed mapping. They remain preserved outside active configured reports; no historical records were deleted or silently relabeled.",
                    "Las etiquetas anteriores no tienen una correspondencia confirmada. Se conservan fuera de los informes configurados activos; no se eliminaron ni se cambiaron silenciosamente.",
                  )}
                </p>
                <a href="/samples/legacy-v1/baseline.csv" download>
                  {tr(
                    "Download original history",
                    "Descargar historial original",
                  )}{" "}
                  ↙
                </a>
              </details>
            </>
          )}
          <p className="report-time">
            {publication
              ? `${tr("Published locally", "Publicado localmente")}: ${publication}`
              : tr(
                  "Bundled synthetic snapshot · no live feed",
                  "Datos ficticios incluidos · sin conexión en vivo",
                )}
          </p>
        </div>
      )}
      <footer className="footer">
        <span>OneTap Performance / OneTap Creative</span>
        <span>
          {tr(
            "Local demo · resets on refresh",
            "Demo local · se reinicia al actualizar",
          )}
        </span>
      </footer>
    </main>
  );
}
