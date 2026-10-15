"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Brand } from "@/components/ui";
import { Keypad } from "@/components/keypad";
import { Performance } from "@/components/performance";
import { useDemo } from "@/components/demo-provider";
import { demoLogin, useIdleSession } from "@/lib/session";
export default function Kiosk() {
  const { records } = useDemo();
  const [signed, setSigned] = useState(false),
    [id, setId] = useState(""),
    [pin, setPin] = useState(""),
    [field, setField] = useState<"id" | "pin">("id"),
    [error, setError] = useState(""),
    [spanish, setSpanish] = useState(false),
    [expired, setExpired] = useState(false);
  const tr = (en: string, es: string) => (spanish ? es : en);
  useEffect(() => {
    document.documentElement.lang = spanish ? "es" : "en";
    return () => {
      document.documentElement.lang = "en";
    };
  }, [spanish]);
  const clearSession = useCallback(() => {
    setSigned(false);
    setId("");
    setPin("");
    setField("id");
    setError("");
    setSpanish(false);
  }, []);
  const expire = useCallback(() => {
    clearSession();
    setExpired(true);
  }, [clearSession]);
  const remaining = useIdleSession(signed, expire);
  const login = () => {
    if (demoLogin(id, pin)) {
      setSigned(true);
      setPin("");
      setId("");
      setExpired(false);
      setError("");
    } else {
      setPin("");
      setError(
        tr(
          "ID or PIN doesn’t match. Please try again.",
          "El ID o PIN no coincide. Inténtalo de nuevo.",
        ),
      );
    }
  };
  const key = (value: string) => {
    setError("");
    const update = (old: string) =>
      value === "clear"
        ? ""
        : value === "back"
          ? old.slice(0, -1)
          : (old + value).slice(0, field === "id" ? 3 : 8);
    if (field === "id") setId((v) => "EMP" + update(v.replace(/^EMP/i, "")));
    else setPin(update);
  };
  return (
    <main className="app-shell kiosk">
      <header className="header">
        <Brand />
        <div className="header-actions">
          <button
            className="language"
            onClick={() => setSpanish((v) => !v)}
            aria-label={tr("Switch to Spanish", "Cambiar a inglés")}
          >
            {spanish ? "EN" : "ES"}{" "}
            <span>{spanish ? "English" : "Español"}</span>
          </button>
          {signed && (
            <button
              className="signout"
              onClick={() => {
                clearSession();
                setExpired(false);
              }}
            >
              {tr("Finish & Sign Out", "Terminar y salir")}{" "}
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </header>
      {signed ? (
        <div className="content">
          <div className="session-line">
            <span>
              <span className="live-dot" />{" "}
              {tr("Your private session", "Tu sesión privada")} · EMP002
            </span>
            <span
              role="timer"
              className={remaining <= 15 ? "timeout urgent" : "timeout"}
            >
              {tr("Auto sign-out", "Salida automática")}: {remaining}s
            </span>
          </div>
          <Performance records={records} id="EMP002" spanish={spanish} />
        </div>
      ) : (
        <div className="login-layout content">
          <section className="login-intro">
            <div className="intro-symbol" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none">
                <path
                  d="M18 55L34 39L45 48L64 23M51 23H64V36"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="eyebrow">
              {tr("ONE PLACE. YOUR PROGRESS.", "UN LUGAR. TU PROGRESO.")}
            </p>
            <h1>
              {tr("Your work.", "Tu trabajo.")}
              <br />
              <span>{tr("Your progress.", "Tu progreso.")}</span>
            </h1>
            <p className="intro-description">
              {tr(
                "See where you stand. Celebrate your progress. Make your next shift count.",
                "Mira cómo vas. Celebra tu progreso. Haz que tu próximo turno cuente.",
              )}
            </p>
            <div className="privacy-note">
              <span aria-hidden="true">◈</span>
              <span>
                {tr(
                  "Built for a shared iPad. Your session clears automatically after 60 seconds of inactivity.",
                  "Diseñado para un iPad compartido. Tu sesión se borra tras 60 segundos de inactividad.",
                )}
              </span>
            </div>
            <div className="demo-credentials">
              <b>{tr("TRY THE DEMO", "PRUEBA LA DEMOSTRACIÓN")}</b>
              <p>
                {tr("Employee ID", "ID de empleado")}: <strong>EMP002</strong>{" "}
                <span>·</span> PIN: <strong>1234</strong>
              </p>
              <small>
                {tr(
                  "Simulated sign-in · fictional records only",
                  "Acceso simulado · solo registros ficticios",
                )}
              </small>
            </div>
            <Link className="manager-link" href="/manager">
              {tr("Manager demonstration", "Demostración para supervisores")} ↗
            </Link>
          </section>
          <section className="login-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {tr("LET’S GET STARTED", "COMENCEMOS")}
                </p>
                <h2>{tr("Check your progress", "Consulta tu progreso")}</h2>
              </div>
              <span className="step-badge">01</span>
            </div>
            {expired && (
              <p role="status" className="notice">
                {tr(
                  "Your session ended for privacy. Sign in to start again.",
                  "Tu sesión terminó por privacidad. Inicia sesión de nuevo.",
                )}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login();
              }}
              autoComplete="off"
            >
              <div className="login-fields">
                <label>
                  {tr("Employee ID", "ID de empleado")}
                  <div
                    className={`id-field ${field === "id" ? "focused" : ""}`}
                  >
                    <span aria-hidden="true">EMP</span>
                    <input
                      aria-label={tr("Employee ID", "ID de empleado")}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      spellCheck={false}
                      value={id.replace(/^EMP/i, "")}
                      onFocus={() => setField("id")}
                      onChange={(e) =>
                        setId(
                          "EMP" + e.target.value.replace(/\D/g, "").slice(0, 3),
                        )
                      }
                      placeholder="002"
                    />
                  </div>
                </label>
                <label>
                  {tr("Private PIN", "PIN privado")}
                  <input
                    className={field === "pin" ? "focused" : ""}
                    aria-label={tr("Private PIN", "PIN privado")}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onFocus={() => setField("pin")}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="••••"
                  />
                </label>
              </div>
              <p className="keypad-hint">
                {tr("Keypad entering", "El teclado ingresa")}:{" "}
                <b>
                  {field === "id" ? tr("Employee ID", "ID de empleado") : "PIN"}
                </b>
              </p>
              <Keypad tr={tr} onKey={key} />
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="primary full"
                disabled={!/^EMP\d{3}$/.test(id) || pin.length < 4}
              >
                {tr("View my performance", "Ver mi rendimiento")}{" "}
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="text-button full"
                onClick={() => {
                  setId("EMP002");
                  setPin("1234");
                  setField("pin");
                  setError("");
                }}
              >
                {tr(
                  "Fill demo credentials",
                  "Completar credenciales de prueba",
                )}
              </button>
            </form>
          </section>
        </div>
      )}
      <footer className="footer">
        <span>
          OneTap Performance <span className="footer-dot">/</span>{" "}
          {tr("Synthetic demonstration", "Demostración ficticia")}
        </span>
        <span>
          {signed
            ? tr(
                "Finish your session to keep it private.",
                "Termina tu sesión para mantenerla privada.",
              )
            : tr(
                "Your progress starts with one tap.",
                "Tu progreso comienza con un toque.",
              )}
        </span>
      </footer>
    </main>
  );
}
