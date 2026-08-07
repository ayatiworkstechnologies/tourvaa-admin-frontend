"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type PortalTheme = "emerald" | "blue" | "indigo";

const THEME_CLASSES: Record<PortalTheme, { bg: string; border: string; accent: string; button: string }> = {
  emerald: { bg: "bg-emerald-950", border: "border-emerald-900/10", accent: "text-emerald-300", button: "text-emerald-800" },
  blue: { bg: "bg-blue-950", border: "border-blue-900/10", accent: "text-blue-300", button: "text-blue-800" },
  indigo: { bg: "bg-indigo-950", border: "border-indigo-900/10", accent: "text-indigo-300", button: "text-indigo-800" },
};

export default function PortalPublicHeader({
  portalPath,
  roleLabel,
  icon,
  theme,
}: {
  portalPath: string;
  roleLabel: string;
  /** A rendered icon element (e.g. <Building size={16} />), not a component reference - this
   * renders inside a Client Component, and a bare function reference can't cross that boundary. */
  icon: ReactNode;
  theme: PortalTheme;
}) {
  const classes = THEME_CLASSES[theme];
  return (
    <header className={`sticky top-0 z-40 border-b ${classes.border} ${classes.bg} text-white`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={portalPath} className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            {icon}
          </span>
          Tourvaa <span className={`font-semibold ${classes.accent}`}>{roleLabel}</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-bold">
          <Link href={portalPath} className="hidden text-white/75 transition hover:text-white sm:inline">
            Overview
          </Link>
          <Link
            href={`${portalPath}/login`}
            className={`rounded-xl bg-white px-4 py-2 shadow transition hover:-translate-y-0.5 hover:shadow-lg ${classes.button}`}
          >
            Login / Register
          </Link>
          <Link href="/" className="hidden text-xs font-semibold text-white/50 transition hover:text-white/80 sm:inline">
            Main site
          </Link>
        </nav>
      </div>
    </header>
  );
}
