import { ReactNode } from "react";
export type Translate = (en: string, es: string) => string;
export function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M7 22V15M16 22V8M25 22V12"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <Mark />
      <div>
        <strong>
          OneTap <span>Performance</span>
        </strong>
        <small>BY ONETAP CREATIVE</small>
      </div>
    </div>
  );
}
export function Kpi({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note: string;
}) {
  return (
    <article className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty" role="status">
      {children}
    </div>
  );
}
