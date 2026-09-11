"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LuArrowUpRight as ArrowUpRight,
  LuBriefcaseBusiness as Briefcase,
  LuBuilding2 as Building,
  LuChevronDown as ChevronDown,
  LuGlobe as Globe,
  LuMegaphone as Megaphone,
  LuMenu as Menu,
  LuX as X,
} from "react-icons/lu";

export type PortalTheme = "emerald" | "blue" | "indigo" | "purple";

const THEME_CLASSES: Record<
  PortalTheme,
  {
    bg: string;
    border: string;
    accent: string;
    pillBg: string;
    button: string;
    buttonSecondary: string;
  }
> = {
  emerald: {
    bg: "bg-emerald-950/95 backdrop-blur-md",
    border: "border-emerald-800/30",
    accent: "text-emerald-300",
    pillBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25",
    button: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-emerald-950/30",
    buttonSecondary: "border-emerald-600/40 hover:bg-emerald-900/50 text-emerald-100",
  },
  blue: {
    bg: "bg-blue-950/95 backdrop-blur-md",
    border: "border-blue-800/30",
    accent: "text-blue-300",
    pillBg: "bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25",
    button: "bg-blue-400 text-blue-950 hover:bg-blue-300 shadow-blue-950/30",
    buttonSecondary: "border-blue-600/40 hover:bg-blue-900/50 text-blue-100",
  },
  indigo: {
    bg: "bg-indigo-950/95 backdrop-blur-md",
    border: "border-indigo-800/30",
    accent: "text-indigo-300",
    pillBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25",
    button: "bg-indigo-400 text-indigo-950 hover:bg-indigo-300 shadow-indigo-950/30",
    buttonSecondary: "border-indigo-600/40 hover:bg-indigo-900/50 text-indigo-100",
  },
  purple: {
    bg: "bg-purple-950/95 backdrop-blur-md",
    border: "border-purple-800/30",
    accent: "text-purple-300",
    pillBg: "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25",
    button: "bg-purple-400 text-purple-950 hover:bg-purple-300 shadow-purple-950/30",
    buttonSecondary: "border-purple-600/40 hover:bg-purple-900/50 text-purple-100",
  },
};

const PORTALS = [
  {
    name: "Supplier Portal",
    path: "/supplier-portal",
    badge: "Tour & Activity Operators",
    icon: Building,
  },
  {
    name: "Agent Portal",
    path: "/agent-portal",
    badge: "Travel Agencies & Advisors",
    icon: Briefcase,
  },
  {
    name: "Affiliate Programme",
    path: "/affiliate-portal",
    badge: "Creators & Content Publishers",
    icon: Megaphone,
  },
];

export default function PortalPublicHeader({
  portalPath,
  roleLabel,
  icon,
  theme,
}: {
  portalPath: string;
  roleLabel: string;
  icon: ReactNode;
  theme: PortalTheme;
}) {
  const pathname = usePathname();
  const classes = THEME_CLASSES[theme];

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target as Node)
      ) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isLoginPage = pathname.endsWith("/login");

  return (
    <header
      className={`sticky top-0 z-50 border-b ${classes.border} ${classes.bg} text-white transition-all`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Portal Label */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={portalPath}
            className="flex items-center gap-2.5 text-lg font-black tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 shadow-inner shrink-0">
              {icon}
            </span>
            <div className="flex flex-col">
              <span className="leading-tight text-white font-black text-base sm:text-lg">
                Tourvaa
              </span>
              <span className={`text-[11px] font-bold ${classes.accent} -mt-0.5 whitespace-nowrap`}>
                {roleLabel}
              </span>
            </div>
          </Link>

          {/* Switch Portal Dropdown (Desktop & Tablet) */}
          <div ref={switcherRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setSwitcherOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur transition ${classes.pillBg}`}
            >
              <span>All Portals</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  switcherOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {switcherOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-700/60 bg-slate-900/98 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Partner Workspace
                </div>
                <div className="space-y-1">
                  {PORTALS.map((p) => {
                    const Icon = p.icon;
                    const isActive = pathname.startsWith(p.path);
                    return (
                      <Link
                        key={p.path}
                        href={p.path}
                        onClick={() => setSwitcherOpen(false)}
                        className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                          isActive
                            ? "bg-white/15 text-white font-bold"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {p.badge}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="my-1 border-t border-slate-800" />
                  <Link
                    href="/"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={14} /> Main Marketplace
                    </span>
                    <ArrowUpRight size={13} className="text-slate-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {!isLoginPage && (
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-bold text-slate-200">
            <a
              href="#overview"
              className="hover:text-white transition-colors py-1"
            >
              Overview
            </a>
            <a
              href="#benefits"
              className="hover:text-white transition-colors py-1"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors py-1"
            >
              How It Works
            </a>
            <a
              href="#calculator"
              className="hover:text-white transition-colors py-1"
            >
              Calculator
            </a>
            <a
              href="#documents"
              className="hover:text-white transition-colors py-1"
            >
              Requirements
            </a>
            <a
              href="#guidelines"
              className="hover:text-white transition-colors py-1"
            >
              Guidelines
            </a>
            <a
              href="#faq"
              className="hover:text-white transition-colors py-1"
            >
              FAQ
            </a>
          </nav>
        )}

        {/* Desktop & Tablet Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link
            href="/"
            className="text-xs font-semibold text-white/60 hover:text-white transition px-2.5 py-1.5"
          >
            Main Site
          </Link>
          <Link
            href={`${portalPath}/login`}
            className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${classes.buttonSecondary}`}
          >
            Sign In
          </Link>
          <Link
            href={`${portalPath}/login?tab=register`}
            className={`rounded-xl px-4 py-2 text-xs font-black shadow-lg transition hover:-translate-y-0.5 ${classes.button}`}
          >
            Register Now
          </Link>
        </div>

        {/* Mobile & Tablet Right Controls (shown below lg) */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href={`${portalPath}/login`}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${classes.button}`}
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer (below lg) */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-5 lg:hidden space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-150">
          {!isLoginPage && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Page Sections
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <a
                  href="#overview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  Overview
                </a>
                <a
                  href="#benefits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  Benefits
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  How It Works
                </a>
                <a
                  href="#calculator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  Calculator
                </a>
                <a
                  href="#documents"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  Requirements
                </a>
                <a
                  href="#guidelines"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  Guidelines
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition"
                >
                  FAQ
                </a>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Partner Portals
            </div>
            <div className="space-y-1">
              {PORTALS.map((p) => {
                const Icon = p.icon;
                const isActive = pathname.startsWith(p.path);
                return (
                  <Link
                    key={p.path}
                    href={p.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg p-2 text-xs font-semibold ${
                      isActive
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{p.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                <Globe size={14} />
                <span>Tourvaa Marketplace</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <Link
              href={`${portalPath}/login`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center rounded-xl border border-white/20 p-2.5 text-center text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Sign In
            </Link>
            <Link
              href={`${portalPath}/login?tab=register`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center rounded-xl p-2.5 text-center text-xs font-black transition ${classes.button}`}
            >
              Register Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
