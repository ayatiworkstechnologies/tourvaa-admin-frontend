"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
type Toast = { id: number; type: ToastType; message: string };
type ToastContextValue = {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const colors: Record<ToastType, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  error: "border-red-100 bg-red-50 text-red-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  info: "border-sky-100 bg-sky-50 text-[#238DD7]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent).detail as { type?: ToastType; message?: string };
      if (detail?.message) toast(detail.type || "info", detail.message);
    };
    window.addEventListener("tourvaa:toast", listener);
    return () => window.removeEventListener("tourvaa:toast", listener);
  }, [toast]);

  const value = useMemo(
    () => ({
      toast,
      success: (message: string) => toast("success", message),
      error: (message: string) => toast("error", message),
      warning: (message: string) => toast("warning", message),
      info: (message: string) => toast("info", message),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] space-y-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`flex min-w-72 max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${colors[item.type]}`}
            role="status"
          >
            <span className="min-w-0 flex-1">{item.message}</span>
            <button type="button" onClick={() => remove(item.id)} aria-label="Dismiss notification">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
