"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LuClock3, LuRefreshCw } from "react-icons/lu";
import { fetchPublicSettings } from "@/lib/api/publicClient";
import Loader from "@/components/ui/Loader";

type MaintenanceState = "checking" | "enabled" | "disabled";

function LoadingScreen() {
  return <Loader label="Checking Tourvaa availability..." fullScreen />;
}

function MaintenanceScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#FBF7F5] px-6 py-12 text-[#0B1F3A]">
      <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#146EF5]/8" />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#E16B2D]/10" />

      <section className="relative w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-[0_18px_50px_rgba(11,31,58,0.12)]">
          <LuClock3 className="h-9 w-9 text-[#E16B2D]" aria-hidden="true" />
        </div>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#146EF5]">Tourvaa</p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">We&apos;ll be back shortly</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600 sm:text-lg">
          We&apos;re making a few improvements to your travel experience. Please check back in a little while.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-[#0B1F3A] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#146EF5] focus:outline-none focus:ring-4 focus:ring-[#146EF5]/25"
        >
          <LuRefreshCw className="h-4 w-4" aria-hidden="true" />
          Check again
        </button>
      </section>
    </main>
  );
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const [state, setState] = useState<MaintenanceState>(isAdminRoute ? "disabled" : "checking");

  const checkMaintenanceMode = () => {
    if (isAdminRoute) {
      setState("disabled");
      return;
    }

    setState("checking");
    fetchPublicSettings()
      .then((settings) => {
        setState(String(settings.maintenance_mode).toLowerCase() === "true" ? "enabled" : "disabled");
      })
      // A temporary settings/API failure must not make the whole site
      // unavailable. Maintenance is enforced only when explicitly enabled.
      .catch(() => setState("disabled"));
  };

  useEffect(() => {
    checkMaintenanceMode();
    // Re-check whenever navigation crosses into or out of the admin area.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminRoute]);

  if (state === "checking") return <LoadingScreen />;
  if (state === "enabled") return <MaintenanceScreen onRetry={checkMaintenanceMode} />;
  return children;
}
