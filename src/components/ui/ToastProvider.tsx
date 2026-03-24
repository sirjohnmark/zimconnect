"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const variantClass: Record<ToastVariant, string> = {
  success: "bg-brand-600 text-white",
  error:   "bg-red-600 text-white",
  info:    "bg-slate-800 text-white",
};

// ─── Provider ─────────────────────────────────────────────────────────────────

const DURATION_MS = 4000;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const counterRef = useRef(0);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), DURATION_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium pointer-events-auto ${variantClass[t.variant]}`}
              >
                <span>{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 opacity-70 hover:opacity-100 transition-opacity mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
