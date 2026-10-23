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
import { AFFILIATE_ENABLED } from "@/lib/features";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import LanguageCurrencySelector from "@/components/public/LanguageCurrencySelector";

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
].filter((portal) => AFFILIATE_ENABLED || !portal.path.startsWith("/affiliate"));

/**
 * Portal-specific public header.
 * Wrapped with PublicSettingsProvider + TravelStoreProvider so portal layouts
 * (agent-portal, supplier-portal, affiliate-portal) don't need to supply them -
 * identical pattern to PortalPublicFooter.
 */
export default function PortalPublicHeader(props: {
  portalPath: string;
  roleLabel: string;
  icon: ReactNode;
  theme?: PortalTheme;
}) {
  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <PortalPublicHeaderInner {...props} />
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}

function PortalPublicHeaderInner({
  portalPath,
  roleLabel,
}: {
  portalPath: string;
  roleLabel: string;
  icon: ReactNode;
  theme?: PortalTheme;
}) {
  const { settings } = usePublicSettings();
  const logoUrl = settings.logo?.trim() || "";
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
  const isAffiliate = portalPath.includes("affiliate");
  const contactPath = isSupplier
    ? "/supplier-contact#contact-form-section"
    : portalPath.includes("agent")
      ? "/agent-contact#contact-form-section"
      : "/contact#contact-form-section";
  const sectionLinks = isAffiliate
    ? [
        { href: "#overview", label: "Overview" },
        { href: "#benefits", label: "Benefits" },
        { href: "#ideal-for", label: "Ideal For" },
        { href: "#cta", label: "Get Started" },
      ]
    : [
        { href: "#overview", label: "Overview" },
        { href: "#benefits", label: "Benefits" },
        { href: "#how-it-works", label: "How It Works" },
        { href: "#calculator", label: "Calculator" },
        { href: "#documents", label: "Requirements" },
        { href: "#guidelines", label: "Guidelines" },
        { href: "#faq", label: "FAQ" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-pub-border bg-white/95 backdrop-blur-md text-pub-fg transition-all shadow-2xs">
      <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-4 sm:px-6">
        {/* Brand & Portal Label */}
        <div className="flex items-center gap-3">
          <Link
            href={portalPath}
            className="flex shrink-0 items-center text-xl sm:text-2xl font-black tracking-tight text-pub-fg hover:opacity-95 transition"
          >
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- logo comes from an admin-uploaded external URL */
              <img
                src={logoUrl}
                alt="Tourvaa"
                className="h-8 w-auto object-contain sm:h-9"
              />
            ) : (
              "Tourvaa"
            )}
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
            {sectionLinks.map((link) => <a key={link.href} href={link.href} className="hover:text-pub-fg transition-colors py-1">{link.label}</a>)}
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

          {AFFILIATE_ENABLED && (
            <Link
              href="/affiliate-portal"
              className="flex flex-col items-center justify-center text-pub-muted hover:text-pub-fg transition group"
            >
              <Megaphone size={16} className="text-pub-muted group-hover:text-pub-fg transition" />
              <span className="text-[10px] font-medium tracking-tight mt-0.5">To Affiliate</span>
            </Link>
          )}

          {/* Help */}
          <Link
            href={contactPath}
            className="flex flex-col items-center justify-center text-pub-muted hover:text-pub-fg transition group"
          >
            <Headset size={16} className="text-pub-muted group-hover:text-pub-fg transition" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5">
              Help
            </span>
          </Link>

          <LanguageCurrencySelector />

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
          {!isLoginPage && (
            <Link
              href={`${portalPath}/login?tab=register`}
              className="rounded-lg bg-pub-accent px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-pub-accent/90"
            >
              Join now
            </Link>
          )}
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
                {sectionLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-slate-50 p-2.5 text-pub-fg hover:bg-slate-100 transition">{link.label}</a>)}
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
                href={contactPath}
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


