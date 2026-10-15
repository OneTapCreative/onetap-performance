import { useEffect, useState } from "react";
export const TIMEOUT_MS = 60000;
export function demoLogin(employeeId: string, pin: string) {
  return employeeId.toUpperCase() === "EMP002" && pin === "1234";
}
export function useIdleSession(active: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(60);
  useEffect(() => {
    if (!active) return;
    let deadline = Date.now() + TIMEOUT_MS;
    setRemaining(60);
    const check = () => {
      const left = deadline - Date.now();
      setRemaining(Math.max(0, Math.ceil(left / 1000)));
      if (left <= 0) onExpire();
    };
    const reset = () => {
      if (Date.now() >= deadline) {
        onExpire();
        return;
      }
      deadline = Date.now() + TIMEOUT_MS;
      setRemaining(60);
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "wheel",
    ] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, 1000);
    return () => {
      window.clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [active, onExpire]);
  return remaining;
}
