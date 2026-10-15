"use client";
import { Translate } from "./ui";
export function Keypad({
  tr,
  onKey,
}: {
  tr: Translate;
  onKey: (key: string) => void;
}) {
  return (
    <div
      className="keypad"
      role="group"
      aria-label={tr("Numeric keypad", "Teclado numérico")}
    >
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map(
        (value) => (
          <button
            type="button"
            key={value}
            className={
              value === "clear" || value === "back" ? "key-action" : ""
            }
            onClick={() => onKey(value)}
            aria-label={
              value === "back"
                ? tr("Backspace", "Borrar último")
                : value === "clear"
                  ? tr("Clear", "Borrar")
                  : value
            }
          >
            {value === "clear"
              ? tr("Clear", "Borrar")
              : value === "back"
                ? "⌫"
                : value}
          </button>
        ),
      )}
    </div>
  );
}
