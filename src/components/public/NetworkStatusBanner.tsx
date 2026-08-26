"use client";

import { useEffect, useState } from "react";
import {
  LuWifiOff as WifiOff,
  LuWifi as Wifi,
  LuRefreshCw as RefreshCw,
  LuX as X,
} from "react-icons/lu";

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      setDismissed(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = window.setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Ping check
      await fetch("/favicon.ico", { cache: "no-store", method: "HEAD" });
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3500);
    } catch {
      setIsOnline(false);
    } finally {
      setIsRetrying(false);
    }
  };

  // If online and not showing the restored message, render nothing
  if (isOnline && !showRestored) return null;
  if (dismissed && !showRestored) return null;

  return (
    <aside
      role="status"
      aria-live="assertive"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9998] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {!isOnline ? (
        <div className="flex items-start gap-3.5 rounded-2xl border border-amber-300/80 bg-amber-50/95 p-4 text-slate-800 shadow-[0_12px_40px_rgba(245,158,11,0.2)] backdrop-blur-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <WifiOff size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">Connection Lost</h4>
              <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                Offline Mode
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
              You are currently browsing offline. Live search and booking may be unavailable until reconnected.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-950 active:scale-95 disabled:opacity-60"
              >
                <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
                <span>{isRetrying ? "Checking..." : "Retry Now"}</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss offline banner"
            className="rounded-lg p-1 text-amber-600 hover:bg-amber-200/50 transition"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        showRestored && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/80 bg-emerald-50/95 p-3.5 text-slate-800 shadow-[0_12px_40px_rgba(16,185,129,0.2)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Wifi size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-950">Connection Restored</h4>
              <p className="text-xs text-emerald-800 font-medium">You’re back online. Happy travels!</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRestored(false)}
              aria-label="Close message"
              className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-200/50 transition"
            >
              <X size={15} />
            </button>
          </div>
        )
      )}
    </aside>
  );
}
