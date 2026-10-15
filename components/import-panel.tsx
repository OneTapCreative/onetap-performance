"use client";
import { useState } from "react";
import { useDemo } from "./demo-provider";
import { ImportStage, parseFile, publish } from "@/lib/import";
import { Translate } from "./ui";
export function ImportPanel({ tr }: { tr: Translate }) {
  const { records, setRecords, setPublication } = useDemo();
  const [stage, setStage] = useState<ImportStage | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function select(file?: File) {
    if (!file) return;
    setBusy(true);
    setStage(null);
    setMessage("");
    try {
      setStage(await parseFile(file, records));
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : tr("Unable to read report.", "No se pudo leer el informe."),
      );
    } finally {
      setBusy(false);
    }
  }
  function approve() {
    if (!stage) return;
    try {
      setRecords(publish(records, stage));
      setPublication(new Date().toISOString());
      setMessage(
        tr(
          `${stage.rows.length} records published locally. Open the kiosk in this tab to see the updated data.`,
          `${stage.rows.length} registros publicados localmente. Abre el kiosco en esta pestaña para ver los datos actualizados.`,
        ),
      );
      setStage(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Publication failed.");
    }
  }
  return (
    <section className="panel import-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {tr("FROM REPORT TO CLARITY", "DEL INFORME A LA CLARIDAD")}
          </p>
          <h2>
            {tr(
              "Publish a performance report",
              "Publica un informe de rendimiento",
            )}
          </h2>
        </div>
        <span className="pill">CSV / XLSX</span>
      </div>
      <p>
        {tr(
          "Use synthetic files only. Reports are parsed in your browser and published to memory in this tab. Nothing is uploaded or saved to a server. Refreshing resets all imports.",
          "Usa solo archivos ficticios. Los informes se procesan en tu navegador y se publican en la memoria de esta pestaña. Nada se carga ni se guarda en un servidor. Al actualizar se borran las importaciones.",
        )}
      </p>
      <div className="import-workflow" aria-hidden="true">
        <span>01 {tr("Choose", "Elegir")}</span>
        <span>02 {tr("Review", "Revisar")}</span>
        <span>03 {tr("Publish", "Publicar")}</span>
      </div>
      <label className="upload-zone">
        <span className="upload-icon" aria-hidden="true">
          ↑
        </span>
        <strong>
          {busy
            ? tr("Reading report…", "Leyendo informe…")
            : tr("Choose a synthetic report", "Elige un informe ficticio")}
        </strong>
        <small>
          {tr(
            "CSV or Excel · up to 5 MB · first worksheet only",
            "CSV o Excel · hasta 5 MB · solo primera hoja",
          )}
        </small>
        <input
          aria-label={tr("Upload synthetic report", "Cargar informe ficticio")}
          type="file"
          accept=".csv,.xlsx"
          disabled={busy}
          onChange={(e) => {
            void select(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <div className="sample-links">
        <a href="/samples/sample-correction.csv" download>
          {tr("Sample CSV ↙", "Ejemplo CSV ↙")}
        </a>
        <a href="/samples/sample-correction.xlsx" download>
          {tr("Sample Excel ↙", "Ejemplo Excel ↙")}
        </a>
        <a href="/samples/schema.md" download>
          {tr("Schema guide ↙", "Guía del esquema ↙")}
        </a>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {stage && (
        <div className="import-preview">
          <div className="section-heading">
            <h3>
              {tr("Review before publishing", "Revisa antes de publicar")}
            </h3>
            <span className="pill">{stage.name}</span>
          </div>
          <div className="preview-stats">
            <span>
              <b>{stage.rows.length}</b> {tr("changes", "cambios")}
            </span>
            <span>
              <b>{stage.duplicates}</b>{" "}
              {tr("identical skipped", "idénticos omitidos")}
            </span>
            <span>
              <b>{stage.corrections}</b> {tr("revisions", "revisiones")}
            </span>
            <span>
              <b>{stage.errors.length}</b> {tr("errors", "errores")}
            </span>
          </div>
          {!!stage.errors.length && (
            <div className="error" role="alert">
              <b>
                {tr(
                  "Resolve these errors before publication.",
                  "Corrige estos errores antes de publicar.",
                )}
              </b>
              <ul>
                {stage.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
              {stage.errors.length > 10 && (
                <p>
                  + {stage.errors.length - 10}{" "}
                  {tr("more errors", "errores más")}
                </p>
              )}
            </div>
          )}
          {!!stage.warnings.length && (
            <details className="validation-notes">
              <summary>
                {stage.warnings.length}{" "}
                {tr("validation notes", "notas de validación")}
              </summary>
              <ul>
                {stage.warnings.slice(0, 20).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              {!!stage.missing.length && (
                <p>
                  {tr("Missing from file", "Ausentes del archivo")}:{" "}
                  {stage.missing.join(", ")}
                </p>
              )}
            </details>
          )}
          {!!stage.preview.length && (
            <div className="table-scroll">
              <table>
                <caption>
                  {tr(
                    "Preview of changes (first 8)",
                    "Vista previa de cambios (primeros 8)",
                  )}
                </caption>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{tr("Date", "Fecha")}</th>
                    <th>{tr("Cases", "Cajas")}</th>
                    <th>%</th>
                    <th>{tr("Revision", "Revisión")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stage.preview.map((r) => (
                    <tr key={r.employeeId + r.workDate}>
                      <td>{r.employeeId}</td>
                      <td>{r.workDate}</td>
                      <td>{r.cases}</td>
                      <td>{r.officialPercent}%</td>
                      <td>{r.revision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!stage.errors.length && !stage.rows.length && (
            <p role="status">
              {tr(
                "Duplicate report: all records already match. No publication is needed.",
                "Informe duplicado: todos los registros ya coinciden. No es necesario publicar.",
              )}
            </p>
          )}
          <div className="button-row">
            <button
              className="primary"
              disabled={!!stage.errors.length || !stage.rows.length}
              onClick={approve}
            >
              {tr("Approve & publish locally", "Aprobar y publicar localmente")}{" "}
              →
            </button>
            <button className="secondary" onClick={() => setStage(null)}>
              {tr("Discard", "Descartar")}
            </button>
          </div>
        </div>
      )}
      <p className="quiet-note">
        {tr(
          "Imports merge by employee ID + work date. Missing employees remain unchanged. Changed records require a higher revision.",
          "Las importaciones se combinan por ID + fecha de trabajo. Los empleados ausentes no cambian. Los registros modificados requieren una revisión mayor.",
        )}
      </p>
    </section>
  );
}
