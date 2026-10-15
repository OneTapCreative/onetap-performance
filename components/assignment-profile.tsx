"use client";
import { associates, AS_OF_DATE, workAssignments } from "@/lib/data";
import {
  assignmentOn,
  departmentLabel,
  shiftLabel,
  shiftById,
  supervisorLabel,
} from "@/lib/warehouse";
import { coachingModule } from "@/lib/coaching";
import { Translate } from "./ui";
export function AssignmentSummary({
  id,
  spanish = false,
}: {
  id: string;
  spanish?: boolean;
}) {
  const employee = associates.find((e) => e.id === id),
    a = employee && assignmentOn(employee, AS_OF_DATE);
  if (!a) return null;
  const s = shiftById(a.shiftId)!;
  return (
    <section
      className="assignment-summary"
      aria-label={
        spanish ? "Asignación principal actual" : "Current primary assignment"
      }
    >
      <span>
        <small>{spanish ? "Departamento" : "Department"}</small>
        <b>{departmentLabel(a.departmentId, spanish)}</b>
      </span>
      <span>
        <small>{spanish ? "Turno" : "Shift"}</small>
        <b>{shiftLabel(a.shiftId, spanish)}</b>
      </span>
      <span>
        <small>{spanish ? "Horario" : "Schedule"}</small>
        <b>{spanish ? s.scheduleEs : s.schedule}</b>
      </span>
    </section>
  );
}
export function EmployeeProfile({
  id,
  spanish = false,
}: {
  id: string;
  spanish?: boolean;
}) {
  const employee = associates.find((e) => e.id === id)!;
  const a = assignmentOn(employee, AS_OF_DATE)!;
  const tr: Translate = (en, es) => (spanish ? es : en);
  const exceptions = workAssignments.filter(
    (a) => a.employeeId === id && a.kind !== "primary",
  );
  return (
    <section className="panel employee-profile">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {tr("EMPLOYEE PROFILE", "PERFIL DEL ASOCIADO")}
          </p>
          <h2>
            {employee.name} · {id}
          </h2>
        </div>
        <span className="pill">
          {tr("Stable employee identity", "Identidad estable del asociado")}
        </span>
      </div>
      <p>
        {tr("Assigned supervisor", "Supervisor asignado")}:{" "}
        <b>{supervisorLabel(a.managerId)}</b>
      </p>
      <AssignmentSummary id={id} spanish={spanish} />
      <details className="profile-history">
        <summary>
          {tr(
            "Shift & department assignment history",
            "Historial de asignaciones de turno y departamento",
          )}
        </summary>
        <p className="quiet-note">
          {tr(
            "Dates are inclusive from, exclusive until. Current primary assignment is separate from work performed.",
            "La fecha inicial es inclusiva y la final exclusiva. La asignación principal actual es independiente del trabajo realizado.",
          )}
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{tr("From / until", "Desde / hasta")}</th>
                <th>{tr("Shift", "Turno")}</th>
                <th>{tr("Department", "Departamento")}</th>
                <th>{tr("Supervisor", "Supervisor")}</th>
              </tr>
            </thead>
            <tbody>
              {employee.assignments.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.effectiveFrom}
                    <small>{row.effectiveTo ?? tr("Current", "Actual")}</small>
                  </td>
                  <td>{shiftLabel(row.shiftId, spanish)}</td>
                  <td>{departmentLabel(row.departmentId, spanish)}</td>
                  <td>{supervisorLabel(row.managerId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {!!exceptions.length && (
        <details className="profile-history">
          <summary>
            {tr(
              "Temporary assignments & overtime",
              "Asignaciones temporales y horas extra",
            )}{" "}
            ({exceptions.length})
          </summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{tr("Work date", "Fecha operativa")}</th>
                  <th>{tr("Shift", "Turno")}</th>
                  <th>{tr("Department", "Departamento")}</th>
                  <th>{tr("Type", "Tipo")}</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((row) => (
                  <tr key={row.id}>
                    <td>{row.workDate}</td>
                    <td>{shiftLabel(row.shiftId, spanish)}</td>
                    <td>{departmentLabel(row.departmentId, spanish)}</td>
                    <td>
                      {row.kind === "overtime"
                        ? tr("Overtime", "Horas extra")
                        : tr("Temporary", "Temporal")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <details className="profile-history">
        <summary>
          {tr(
            "Coaching & 1-on-1 history — planned",
            "Historial de reuniones y orientación — previsto",
          )}
        </summary>
        <p className="notice">
          {coachingModule.state === "planned" &&
            tr(
              "The coaching module is not implemented. The schema supports notes, meeting dates, employee response, performance snapshots, action plans, follow-ups and audit events linked to this employee ID across transfers. Secure storage and authorized manager access still require a backend.",
              "El módulo de orientación aún no está implementado. El esquema admite notas, fechas, respuesta del asociado, rendimiento, planes, seguimientos y auditoría vinculados a este ID después de transferencias. El almacenamiento seguro y el acceso autorizado requieren un backend.",
            )}
        </p>
      </details>
    </section>
  );
}
