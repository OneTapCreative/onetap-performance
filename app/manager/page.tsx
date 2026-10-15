"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Brand, Kpi } from "@/components/ui";
import { useDemo } from "@/components/demo-provider";
import { Performance } from "@/components/performance";
import { ImportPanel } from "@/components/import-panel";
import { associates, isFinal, WEEK_STARTS } from "@/lib/data";
import { percent, summarize, weighted } from "@/lib/performance";
export default function Manager() {
  const { records, publication } = useDemo();
  const [access, setAccess] = useState(false),
    [spanish, setSpanish] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState<"overview" | "import">("overview");
  const tr = (en: string, es: string) => (spanish ? es : en);
  useEffect(() => {
    document.documentElement.lang = spanish ? "es" : "en";
    return () => {
      document.documentElement.lang = "en";
    };
  }, [spanish]);
  const summaries = useMemo(
    () => associates.map((a) => ({ ...a, ...summarize(records, a.id) })),
    [records],
  );
  const count = (s: string) => summaries.filter((a) => a.standing === s).length;
  const rows = summaries.filter(
    (a) =>
      (filter === "all" || filter === a.standing) &&
      `${a.id} ${a.name} ${a.department}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const recent = records.filter(
    (r) => r.reportingWeek === WEEK_STARTS[3] && isFinal(r),
  );
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
          {selected ? (
            <>
              <button
                className="secondary back"
                onClick={() => setSelected(null)}
              >
                ← {tr("All associates", "Todos los asociados")}
              </button>
              <Performance
                key={selected}
                records={records}
                id={selected}
                spanish={spanish}
                manager
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
                  value={associates.length}
                  note={tr(
                    "Fictional demo roster",
                    "Plantilla de demostración ficticia",
                  )}
                />
                <Kpi
                  label={tr("Meeting standard", "Cumplen el estándar")}
                  value={count("meets")}
                  note={tr(
                    "1-week OR 4-week ≥ 95%",
                    "1 semana O 4 semanas ≥ 95%",
                  )}
                />
                <Kpi
                  label={tr("Manager review", "Revisión del supervisor")}
                  value={count("review")}
                  note={tr(
                    "Both complete periods below 95%",
                    "Ambos períodos completos bajo el 95%",
                  )}
                />
                <Kpi
                  label={tr("Insufficient Data", "Datos insuficientes")}
                  value={count("insufficient")}
                  note={tr(
                    "Verify missing or pending reports",
                    "Verifica informes ausentes o pendientes",
                  )}
                />
              </div>
              <div className="productivity-band">
                <div>
                  <span>
                    {tr(
                      "Latest week · reported productivity",
                      "Última semana · productividad reportada",
                    )}
                  </span>
                  <strong>{percent(weighted(recent))}</strong>
                </div>
                <div>
                  <span>{tr("Finalized cases", "Cajas finalizadas")}</span>
                  <strong>
                    {recent.reduce((s, r) => s + r.cases, 0).toLocaleString()}
                  </strong>
                </div>
                <p>
                  {tr(
                    "Weighted earned ÷ actual eligible hours. Partial team coverage: missing or pending records excluded.",
                    "Horas ganadas ÷ reales elegibles, ponderadas. Cobertura parcial: excluye registros ausentes o pendientes.",
                  )}
                </p>
              </div>
              <section className="panel roster">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{tr("YOUR TEAM", "TU EQUIPO")}</p>
                    <h2>
                      {tr("Associate performance", "Rendimiento de asociados")}
                    </h2>
                  </div>
                  <span>{rows.length} / 30</span>
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
                        <th>{tr("Department", "Departamento")}</th>
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
                      {rows.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <b>{a.id}</b>
                            <small>{a.name}</small>
                          </td>
                          <td>{a.department}</td>
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
                      ))}
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
                  "Review flags support supervisor verification only and never initiate disciplinary action.",
                  "Las alertas apoyan la verificación del supervisor y nunca inician acciones disciplinarias.",
                )}
              </p>
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
