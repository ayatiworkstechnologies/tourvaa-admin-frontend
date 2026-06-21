"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
type Toast = { id: number; type: ToastType; title?: string; message: string };
type ToastContextValue = {
  toast: (type: ToastType, message: string, title?: string) => void;
  notify: (title: string, message: string, type?: ToastType) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
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
    (type: ToastType, message: string, title?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, type, title, message }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent).detail as { type?: ToastType; title?: string; message?: string };
      if (detail?.message) toast(detail.type || "info", detail.message, detail.title);
    };
    window.addEventListener("tourvaa:toast", listener);
    return () => window.removeEventListener("tourvaa:toast", listener);
  }, [toast]);

  const value = useMemo(
    () => ({
      toast,
      notify: (title: string, message: string, type: ToastType = "info") => toast(type, message, title),
      success: (message: string, title?: string) => toast("success", message, title),
      error: (message: string, title?: string) => toast("error", message, title),
      warning: (message: string, title?: string) => toast("warning", message, title),
      info: (message: string, title?: string) => toast("info", message, title),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-70 space-y-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`flex min-w-72 max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${colors[item.type]}`}
            role="status"
          >
            <div className="min-w-0 flex-1">
              {item.title && <p className="font-bold">{item.title}</p>}
              <p className={item.title ? "mt-0.5 font-normal text-[0.8rem]" : ""}>{item.message}</p>
            </div>
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
