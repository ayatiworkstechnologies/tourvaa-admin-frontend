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
  LuHeadset as Headset,
  LuMegaphone as Megaphone,
  LuMenu as Menu,
  LuUserRound as User,
  LuX as X,
} from "react-icons/lu";

export type PortalTheme = "emerald" | "blue" | "indigo" | "purple";

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
}: {
  portalPath: string;
  roleLabel: string;
  icon: ReactNode;
  theme?: PortalTheme;
}) {
  const pathname = usePathname();
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
  const isSupplier = portalPath.includes("supplier");

  return (
    <header className="sticky top-0 z-50 border-b border-pub-border bg-white/95 backdrop-blur-md text-pub-fg transition-all shadow-2xs">
      <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-4 sm:px-6">
        {/* Brand & Portal Label */}
        <div className="flex items-center gap-3">
          <Link
            href={portalPath}
            className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight text-pub-fg hover:opacity-95 transition"
          >
            Tourvaa
          </Link>

          {/* Switch Portal Dropdown (Desktop & Tablet) */}
          <div ref={switcherRef} className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => setSwitcherOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full border border-pub-border bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-pub-muted hover:bg-slate-100 transition cursor-pointer"
            >
              <span>{roleLabel}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  switcherOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {switcherOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-pub-border bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-pub-muted">
                  Switch Partner Workspace
                </div>
                <div className="space-y-1">
                  {PORTALS.map((p) => {
                    const IconComponent = p.icon;
                    const isActive = pathname.startsWith(p.path);
                    return (
                      <Link
                        key={p.path}
                        href={p.path}
                        onClick={() => setSwitcherOpen(false)}
                        className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                          isActive
                            ? "bg-pub-secondary/10 text-pub-secondary font-bold"
                            : "text-pub-muted hover:bg-slate-50 hover:text-pub-fg"
                        }`}
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <IconComponent size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold">{p.name}</div>
                          <div className="text-[10px] text-pub-muted font-normal">
                            {p.badge}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="my-1 border-t border-pub-border" />
                  <Link
                    href="/"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-pub-muted hover:bg-slate-50 hover:text-pub-fg transition"
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={14} /> Main Marketplace
                    </span>
                    <ArrowUpRight size={13} className="text-pub-muted" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {!isLoginPage && (
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs font-semibold text-pub-muted">
            <a
              href="#overview"
              className="hover:text-pub-fg transition-colors py-1"
            >
              Overview
            </a>
            <a
              href="#benefits"
              className="hover:text-pub-fg transition-colors py-1"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              className="hover:text-pub-fg transition-colors py-1"
            >
              How It Works
            </a>
            <a
              href="#calculator"
              className="hover:text-pub-fg transition-colors py-1"
            >
              Calculator
            </a>
            <a
              href="#documents"
              className="hover:text-pub-fg transition-colors py-1"
            >
              Requirements
            </a>
            <a
              href="#guidelines"
              className="hover:text-pub-fg transition-colors py-1"
            >
              Guidelines
            </a>
            <a
              href="#faq"
              className="hover:text-pub-fg transition-colors py-1"
            >
              FAQ
            </a>
          </nav>
        )}

        {/* Desktop Right Action Tools (Matching Screenshot) */}
        <div className="hidden sm:flex items-center gap-4 lg:gap-6">
          {/* Switch to Agent / Supplier */}
          <Link
            href={isSupplier ? "/agent-portal" : "/supplier-portal"}
            className="flex flex-col items-center justify-center text-pub-muted hover:text-pub-fg transition group"
          >
            <Briefcase size={16} className="text-pub-muted group-hover:text-pub-fg transition" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              {isSupplier ? "To Agent" : "To Supplier"}
            </span>
          </Link>

          {/* Switch to Affiliate */}
          <Link
            href="/affiliate-portal"
            className="flex flex-col items-center justify-center text-pub-muted hover:text-pub-fg transition group"
          >
            <Megaphone size={16} className="text-pub-muted group-hover:text-pub-fg transition" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              To Affiliate
            </span>
          </Link>

          {/* Help */}
          <Link
            href="/contact"
            className="flex flex-col items-center justify-center text-pub-muted hover:text-pub-fg transition group"
          >
            <Headset size={16} className="text-pub-muted group-hover:text-pub-fg transition" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              Help
            </span>
          </Link>

          {/* USD / Currency */}
          <div className="flex flex-col items-center justify-center text-pub-muted hover:text-pub-fg transition group cursor-pointer">
            <Globe size={16} className="text-pub-muted group-hover:text-pub-fg transition" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              USD
            </span>
          </div>

          {/* Sign In */}
          <Link
            href={`${portalPath}/login`}
            className="flex flex-col items-center justify-center text-pub-fg hover:opacity-80 transition group font-semibold"
          >
            <User size={16} className="text-pub-fg group-hover:opacity-80 transition" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              Sign In
            </span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href={`${portalPath}/login`}
            className="rounded-lg bg-pub-primary text-white px-3 py-1.5 text-xs font-bold"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-pub-border text-pub-fg hover:bg-slate-50 transition"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-pub-border bg-white px-4 py-5 sm:hidden space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-150 shadow-xl">
          {!isLoginPage && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-pub-muted mb-2">
                Page Sections
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <a
                  href="#overview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  Overview
                </a>
                <a
                  href="#benefits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  Benefits
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  How It Works
                </a>
                <a
                  href="#calculator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  Calculator
                </a>
                <a
                  href="#documents"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  Requirements
                </a>
                <a
                  href="#guidelines"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  Guidelines
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition"
                >
                  FAQ
                </a>
              </div>
            </div>
          )}

          <div className="border-t border-pub-border pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-pub-muted mb-2">
              Partner Portals
            </div>
            <div className="space-y-1">
              {PORTALS.map((p) => {
                const IconComponent = p.icon;
                const isActive = pathname.startsWith(p.path);
                return (
                  <Link
                    key={p.path}
                    href={p.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg p-2 text-xs font-semibold ${
                      isActive
                        ? "bg-pub-secondary/10 text-pub-secondary font-bold"
                        : "text-pub-muted hover:bg-slate-50"
                    }`}
                  >
                    <IconComponent size={14} />
                    <span>{p.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-semibold text-pub-muted hover:bg-slate-50"
              >
                <Headset size={14} />
                <span>Help & Contact</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pub-border">
            <Link
              href={`${portalPath}/login`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center rounded-xl border border-pub-border p-2.5 text-center text-xs font-bold text-pub-fg hover:bg-slate-50 transition"
            >
              Sign In
            </Link>
            <Link
              href={`${portalPath}/login?tab=register`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center rounded-xl bg-pub-accent hover:bg-pub-accent/90 p-2.5 text-center text-xs font-bold text-white shadow-sm transition"
            >
              Register Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}


