"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  LuCircleCheckBig as CheckCircle2,
  LuCircleAlert as AlertCircle,
  LuTriangleAlert as AlertTriangle,
  LuInfo as Info,
  LuX as X,
} from "react-icons/lu";

type ToastType = "success" | "error" | "warning" | "info";
type Toast = { id: number; type: ToastType; title?: string; message: string; createdAt: number };
type ToastContextValue = {
  toast: (type: ToastType, message: string, title?: string) => void;
  notify: (title: string, message: string, type?: ToastType) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 4200;

const TOAST_CONFIG: Record<
  ToastType,
  {
    icon: typeof CheckCircle2;
    iconBg: string;
    iconColor: string;
    border: string;
    progressBg: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    iconColor: "text-emerald-600",
    border: "border-emerald-200/80 shadow-emerald-500/10",
    progressBg: "bg-emerald-500",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-rose-50 text-rose-600 border-rose-200",
    iconColor: "text-rose-600",
    border: "border-rose-200/80 shadow-rose-500/10",
    progressBg: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 text-amber-600 border-amber-200",
    iconColor: "text-amber-600",
    border: "border-amber-200/80 shadow-amber-500/10",
    progressBg: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-sky-50 text-[#1478f2] border-sky-200",
    iconColor: "text-[#1478f2]",
    border: "border-sky-200/80 shadow-sky-500/10",
    progressBg: "bg-[#1478f2]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Date.now() + Math.random();
      const safeMessage = typeof message === "string" ? message : "Something went wrong.";
      setToasts((current) => [...current, { id, type, title, message: safeMessage, createdAt: Date.now() }]);
      window.setTimeout(() => remove(id), DURATION_MS);
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
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const config = TOAST_CONFIG[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border bg-white/95 backdrop-blur-md p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-right-3 ${config.border}`}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.iconBg}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  {item.title && (
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {item.title}
                    </h4>
                  )}
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed font-normal">
                    {item.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Animated Progress Timer Bar */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${config.progressBg} opacity-80`}
                  style={{
                    animation: `shrinkToastProgress ${DURATION_MS}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes shrinkToastProgress {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
