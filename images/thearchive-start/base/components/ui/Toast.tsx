"use client";

import { useEffect, useState, useCallback } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onDismiss: () => void;
  visible: boolean;
}

export function Toast({
  message,
  type = "info",
  onDismiss,
  visible,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  // Statusfarben aus dem Archiv-System: Forest für Erfolg, Burgundy-Rot für
  // Fehler. Tailwind-Standardgrün/-rot bricht die Papierpalette auf.
  const typeStyles: Record<string, string> = {
    success:
      "border border-outline-variant bg-tertiary-fixed text-on-tertiary-fixed",
    error: "border border-error/40 bg-error-container text-on-error-container",
    info: "border border-outline-variant bg-surface-container text-on-surface",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`flex min-w-[300px] max-w-[28rem] items-center gap-3 px-5 py-4 ${typeStyles[type]}`}
      >
        {/* Status indicator dot */}
        <span
          className={`h-2 w-2 shrink-0 border ${
            type === "success"
              ? "border-tertiary bg-tertiary"
              : type === "error"
                ? "border-error bg-error"
                : "border-outline bg-on-surface-variant"
          }`}
          aria-hidden="true"
        />

        {/* Message */}
        <p className="font-body-md flex-1">{message}</p>

        {/* Close button */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="font-body-md shrink-0 text-on-surface-variant transition-colors hover:text-primary"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
} | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") =>
      setToast({ message, type }),
    [],
  );

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, dismiss };
}

export default Toast;
