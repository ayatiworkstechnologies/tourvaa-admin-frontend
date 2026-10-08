"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import RichText from "@/components/public/home/RichText";
import { list, useSectionCopy } from "@/components/public/home/useSectionCopy";
import { useSectionVisibility } from "@/components/public/home/sectionVisibility";
import { useEffect, useRef, useState } from "react";
import {
  LuArrowRight as ArrowRight,
  LuBriefcaseBusiness as Briefcase,
  LuBuilding2 as Building,
  LuCalendarCheck as CalendarCheck,
  LuChevronDown as ChevronDown,
  LuGlobe as Globe,
  LuHandshake as Handshake,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuHeartHandshake as HeartHandshake,
  LuLayoutDashboard as LayoutDashboard,
  LuLogOut as LogOut,
  LuMenu as Menu,
  LuMic as Mic,
  LuMessageSquare as MessageSquare,
  LuSearch as Search,
  LuScale as Scale,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuUserRound as User,
  LuX as X,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import LanguageCurrencySelector from "@/components/public/LanguageCurrencySelector";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import type { AuthUser } from "@/types/auth";
import { AFFILIATE_ENABLED } from "@/lib/features";

const TRUST_ICONS = [
  { Icon: Globe, color: "text-sky-400" },
  { Icon: Star, color: "text-emerald-400" },
  { Icon: MessageSquare, color: "text-pub-accent" },
  { Icon: HeartHandshake, color: "text-sky-400" },
];


export default function PublicHeader() {
  const pathname = usePathname();
  // CMS > Home Page > Top Bar replaces the default highlights when set.
  const customTrust = list(useSectionCopy("trust_bar").items);
  const showTopBar = useSectionVisibility()("top-bar");
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, dashboard, user, logout } = useAuthContext();
  const { settings } = usePublicSettings();
  const logoUrl = settings.logo?.trim() || "";
  const { wishlistCount, compareCount } = useTravelStore();
  const dashboardPath = getDashboardPath(dashboard?.user?.role?.slug ?? "");
  const roleSlug = dashboard?.user?.role?.slug ?? "";
  const profilePath =
    roleSlug === "customer"
      ? "/customer/profile"
      : `${dashboardPath.replace(/\/dashboard$/, "")}/profile`;
  const bookingsPath =
    roleSlug === "customer"
      ? "/customer/bookings"
      : roleSlug === "agent-reseller"
        ? "/agent/bookings"
        : roleSlug === "supplier"
          ? "/supplier/bookings"
          : null;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at or near top
      if (currentScrollY <= 80) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Keep visible if mobile drawer or profile dropdown is active
      if (open || profileOpen) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // Ignore micro-scrolls under 8px to prevent jitter
      if (Math.abs(diff) < 8) {
        return;
      }

      if (diff > 0) {
        // Scrolling down -> hide header
        setVisible(false);
      } else {
        // Scrolling up -> reveal header
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open, profileOpen]);

  useEffect(() => {
    if (open || profileOpen) {
      setVisible(true);
    }
  }, [open, profileOpen]);

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      )
        setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) =>
      event.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <header
      className={`print:hidden sticky top-0 z-50 bg-white/95 text-pub-primary backdrop-blur-md transition-all duration-300 ease-in-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      {/* Top Trust Bar -- full width edge-to-edge, matching footer pub-primary signature color.
          Hidden site-wide by the Top Bar switch in CMS > Home Page. */}
      {showTopBar && (
      <div className="w-full bg-pub-primary text-white border-b border-white/10 overflow-hidden">
        <div className="mx-auto flex h-11 sm:h-12 w-full max-w-[1440px] min-w-0 items-center justify-start lg:justify-center gap-4 sm:gap-6 md:gap-8 px-4 sm:px-8 lg:px-12 text-xs sm:text-[12.5px] font-semibold overflow-x-auto no-scrollbar whitespace-nowrap py-2 sm:py-2.5">
          {customTrust.length ? (
            customTrust.map((t, i) => {
              const { Icon, color } = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <span
                      className="h-4 w-px bg-white/25 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex items-center gap-2 shrink-0">
                    <Icon size={15} className={color} />
                    <RichText value={t} strongClassName="font-black" />
                  </span>
                </React.Fragment>
              );
            })
          ) : (
            <>
              <span className="flex items-center gap-2 shrink-0">
                <Globe size={15} className="text-sky-400" />
                Shop 2,500+ handpicked operators
              </span>
              <span
                className="h-4 w-px bg-white/25 shrink-0"
                aria-hidden="true"
              />
              <span className="flex items-center gap-2 shrink-0">
                <Star size={15} className="text-emerald-400" />
                4.8 stars on{" "}
                <span className="font-black text-emerald-400">Trustpilot</span>
                <span className="text-white/70">(15,000+ reviews)</span>
              </span>
              <span
                className="h-4 w-px bg-white/25 shrink-0"
                aria-hidden="true"
              />
              <span className="flex items-center gap-2 shrink-0">
                <MessageSquare size={15} className="text-pub-accent" />
                24/7 customer support
              </span>
              <span
                className="h-4 w-px bg-white/25 shrink-0"
                aria-hidden="true"
              />
              <span className="flex items-center gap-2 shrink-0">
                <HeartHandshake size={15} className="text-sky-400" />
                500k+ experiences shared by travelers
              </span>
            </>
          )}
        </div>
      </div>
      )}

      {/* Reserve a fixed top-right lane for the external language widget so
          it never overlays the signed-in account trigger. */}
      <div className="mx-auto flex h-20 max-w-[1440px] min-w-0 items-center justify-between gap-6 pl-4 pr-[132px] sm:pl-8 sm:pr-[148px] lg:pl-12 lg:pr-[164px]">
        <Link
          href="/"
          className="flex shrink-0 items-center text-2xl font-black tracking-tight text-pub-primary transition hover:opacity-90 sm:text-3xl"
        >
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- logo comes from an admin-uploaded external URL, not a local/optimizable asset */
            <img
              src={logoUrl}
              alt="Tourvaa"
              className="h-9 w-auto object-contain sm:h-10"
            />
          ) : (
            "Tourvaa"
          )}
        </Link>

        <HeaderTourSearch />

        <nav
          aria-label="Account and trip tools"
          className="hidden shrink-0 items-center gap-5 lg:flex lg:gap-7"
        >
          <Link
            href="/wishlist"
            className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-pub-primary transition-colors hover:text-pub-secondary"
          >
            <Heart
              size={18}
              className="text-pub-primary stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-pub-secondary"
            />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pub-accent px-1 text-[8px] font-black text-white shadow-xs">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/compare"
            className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-pub-primary transition-colors hover:text-pub-secondary"
          >
            <Scale
              size={18}
              className="text-pub-primary stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-pub-secondary"
            />
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pub-accent px-1 text-[8px] font-black text-white shadow-xs">
                {compareCount}
              </span>
            )}
          </Link>
          <LanguageCurrencySelector showCountry />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-1 text-[10px] font-semibold text-pub-primary transition-colors hover:text-pub-secondary"
            >
              {isLoggedIn ? (
                <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-pub-accent to-amber-500 text-[10px] font-black text-white shadow-xs">
                  {(user?.name || "T")[0]?.toUpperCase()}
                </div>
              ) : (
                <User
                  size={18}
                  className="text-pub-primary stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-pub-secondary"
                />
              )}
              <span className="flex items-center gap-0.5">
                {isLoggedIn
                  ? user?.name?.split(" ")[0] || "Profile"
                  : "Profile"}
                <ChevronDown
                  size={9}
                  className={`transition-transform duration-200 ${
                    profileOpen
                      ? "rotate-180 text-pub-accent"
                      : "text-pub-primary group-hover:text-pub-secondary"
                  }`}
                />
              </span>
            </button>
            {profileOpen &&
              (isLoggedIn ? (
                <AuthenticatedProfileMenu
                  user={user}
                  profilePath={profilePath}
                  bookingsPath={bookingsPath}
                  dashboardPath={dashboardPath}
                  wishlistCount={wishlistCount}
                  compareCount={compareCount}
                  onClose={() => setProfileOpen(false)}
                  onLogout={logout}
                />
              ) : (
                <ProfileLoginMenu onClose={() => setProfileOpen(false)} />
              ))}
          </div>
        </nav>
        <div className="flex items-center gap-3 lg:hidden">
          <LanguageCurrencySelector showCountry />
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            className="group p-1.5 rounded-lg text-pub-primary transition-colors hover:text-pub-secondary hover:bg-blue-50"
          >
            {open ? (
              <X
                size={22}
                className="text-pub-primary group-hover:text-pub-secondary"
              />
            ) : (
              <Menu
                size={22}
                className="text-pub-primary group-hover:text-pub-secondary"
              />
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg lg:hidden">
          <HeaderTourSearch compact onSearch={() => setOpen(false)} />
          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-pub-secondary/10 px-3 py-3 text-xs font-bold text-pub-secondary"
          >
            <Heart size={15} />
            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </Link>
          <Link
            href="/compare"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-pub-secondary/10 px-3 py-3 text-xs font-bold text-pub-secondary"
          >
            <Scale size={15} />
            Compare {compareCount > 0 && `(${compareCount})`}
          </Link>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isLoggedIn ? "Your account" : "Account & partner portals"}
          </p>
          <div className="mt-2 grid gap-2">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pub-accent to-amber-500 text-white font-semibold text-sm shadow-xs">
                    {(user?.name || "T")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {user?.name || "Traveller"}
                    </p>
                    {user?.email && (
                      <p className="truncate text-[10px] text-slate-500">
                        {user.email}
                      </p>
                    )}
                    <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-2 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200/60">
                      {user?.role?.name || user?.user_type || "Traveller"}
                    </span>
                  </div>
                </div>

                <Link
                  href={dashboardPath}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-pub-secondary px-4 py-3 text-sm font-bold text-white shadow-xs"
                >
                  <LayoutDashboard size={17} />
                  Open My Dashboard
                </Link>
                {bookingsPath && (
                  <Link
                    href={bookingsPath}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-pub-secondary/20 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <CalendarCheck size={17} className="text-pub-secondary" />
                    My Bookings
                  </Link>
                )}
                <Link
                  href={profilePath}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-pub-secondary/20 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  <User size={17} className="text-pub-secondary" />
                  Account Settings
                </Link>
                <Link
                  href="/help-centre"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Headset size={15} />
                  </span>
                  Help Centre & FAQs
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-left text-sm font-bold text-rose-600"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-pub-accent/25 bg-gradient-to-br from-slate-50 to-pub-accent/10 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pub-accent text-white">
                      <User size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        Traveller Account
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Plan trips, bookings & reviews
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login?role=traveller"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-pub-primary py-2 text-xs font-bold text-white shadow-xs"
                    >
                      <span>Sign In</span>
                      <ArrowRight size={12} />
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold text-slate-800 shadow-xs"
                    >
                      Register
                    </Link>
                  </div>
                </div>

                <PortalNavigationLinks onClose={() => setOpen(false)} />
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const partnerPortals = [
  {
    label: "Affiliate Partner",
    note: "Earn commissions on every referral",
    href: "/affiliate-portal/login",
    registerHref: "/affiliate-portal/login?tab=register",
    registerLabel: "Register",
    icon: Handshake,
    accent: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600",
  },
].filter((portal) => AFFILIATE_ENABLED || !portal.href.startsWith("/affiliate"));

function ProfileLoginMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="menu"
      className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.2)] ring-1 ring-slate-900/5 animate-in fade-in-0 zoom-in-95 duration-200"
    >
      {/* Header Welcome */}
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-3 border-b border-slate-100">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pub-accent/10 text-pub-accent">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">
            Welcome to Tourvaa
          </p>
          <p className="truncate text-[11px] text-slate-500 font-medium">
            Sign in to unlock exclusive travel perks
          </p>
        </div>
      </div>

      {/* Primary Traveller Card */}
      <div className="mt-3 rounded-xl bg-gradient-to-br from-slate-50 to-pub-accent/10 p-3 border border-slate-200/80">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pub-accent text-white shadow-xs">
            <User size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-900">
              Traveller Account
            </p>
            <p className="text-[10px] text-slate-500">
              Plan trips, view bookings & wishlist
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            role="menuitem"
            href="/login?role=traveller"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-pub-primary py-2 text-xs font-bold text-white shadow-xs transition hover:bg-pub-primary-dark active:scale-95"
          >
            <span>Sign In</span>
            <ArrowRight size={12} />
          </Link>
          <Link
            role="menuitem"
            href="/register"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-95"
          >
            Register
          </Link>
        </div>
      </div>

      <PortalNavigationLinks onClose={onClose} />

      {/* Partner Portals Section */}
      {partnerPortals.length > 0 && <div className="mt-3">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Partner & Business Portals
        </p>
        <div className="mt-1 space-y-1">
          {partnerPortals.map((partner) => {
            const Icon = partner.icon;
            return (
              <div
                key={partner.label}
                className="group flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition hover:bg-slate-50"
              >
                <Link
                  role="menuitem"
                  href={partner.href}
                  onClick={onClose}
                  className="flex min-w-0 flex-1 items-center gap-2.5 py-0.5"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition group-hover:text-white ${partner.accent}`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-xs font-bold text-slate-900 group-hover:text-pub-secondary transition-colors">
                      {partner.label}
                    </b>
                    <span className="block truncate text-[10px] text-slate-400 font-normal">
                      {partner.note}
                    </span>
                  </span>
                </Link>

                <Link
                  role="menuitem"
                  href={partner.registerHref}
                  onClick={onClose}
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:border-pub-secondary hover:text-pub-secondary"
                >
                  {partner.registerLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Bottom Help & Trust */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between px-3 text-[11px] text-slate-500">
        <Link
          href="/help-centre"
          onClick={onClose}
          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-pub-secondary transition"
        >
          <Headset size={13} />
          <span>Need Help?</span>
        </Link>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          Verified Secure
        </span>
      </div>
    </div>
  );
}

const portalNavigation = [
  { label: "Agent Portal", href: "/agent-portal", icon: Briefcase },
  { label: "Supplier Portal", href: "/supplier-portal", icon: Building },
];

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function HeaderTourSearch({ compact = false, onSearch }: { compact?: boolean; onSearch?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (value = query) => {
    const term = value.trim();
    if (!term) return;
    onSearch?.();
    router.push(`/tours?search=${encodeURIComponent(term)}`);
  };

  const startVoiceSearch = () => {
    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      inputRef.current?.focus();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setQuery(transcript);
      submit(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); submit(); }} className={`relative ${compact ? "w-full" : "hidden min-w-0 flex-1 lg:block lg:max-w-xl"}`} role="search">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tours, cities or itineraries" aria-label="Search tours, cities or itineraries" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-20 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-pub-secondary focus:bg-white focus:ring-2 focus:ring-pub-secondary/15" />
      <button type="button" onClick={startVoiceSearch} aria-label="Search by voice" title="Search by voice" className={`absolute right-9 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition ${listening ? "bg-rose-100 text-rose-600 animate-pulse" : "text-slate-500 hover:bg-slate-100 hover:text-pub-secondary"}`}><Mic size={16} /></button>
      <button type="submit" aria-label="Search tours" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-pub-primary p-1.5 text-white transition hover:bg-pub-secondary"><Search size={15} /></button>
    </form>
  );
}

function PortalNavigationLinks({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {portalNavigation.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Icon size={15} />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}

function AuthenticatedProfileMenu({
  user,
  profilePath,
  bookingsPath,
  dashboardPath,
  wishlistCount,
  compareCount,
  onClose,
  onLogout,
}: {
  user: AuthUser | null;
  profilePath: string;
  bookingsPath: string | null;
  dashboardPath: string;
  wishlistCount: number;
  compareCount: number;
  onClose: () => void;
  onLogout: () => void;
}) {
  const name = user?.name || "Traveller";
  const email = user?.email || "";
  const roleName = user?.role?.name || user?.user_type || "Traveller";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("") || "T";

  return (
    <div
      role="menu"
      className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.2)] ring-1 ring-slate-900/5 animate-in fade-in-0 zoom-in-95 duration-200"
    >
      {/* User Header Profile Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pub-accent to-amber-500 text-white font-black text-sm shadow-xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {name}
          </p>
          {email && (
            <p className="truncate text-[11px] text-slate-500 font-medium">
              {email}
            </p>
          )}
          <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200/60">
            {roleName}
          </span>
        </div>
      </div>

      {/* Quick Shortcuts: Wishlist & Compare */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Link
          role="menuitem"
          href="/wishlist"
          onClick={onClose}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-200"
        >
          <span className="flex items-center gap-1.5">
            <Heart size={14} className="text-pub-accent" />
            Wishlist
          </span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {wishlistCount}
          </span>
        </Link>
        <Link
          role="menuitem"
          href="/compare"
          onClick={onClose}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-200"
        >
          <span className="flex items-center gap-1.5">
            <Scale size={14} className="text-blue-600" />
            Compare
          </span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {compareCount}
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="mt-2.5 space-y-0.5 border-t border-slate-100 pt-2 text-xs font-semibold">
        <Link
          role="menuitem"
          href={dashboardPath}
          onClick={onClose}
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <LayoutDashboard size={16} />
            </span>
            <span>
              <b className="block text-xs font-bold text-slate-900">
                My Dashboard
              </b>
              <span className="block text-[10px] text-slate-400 font-normal">
                Overview & activity
              </span>
            </span>
          </span>
          <ArrowRight
            size={14}
            className="text-slate-300 group-hover:text-slate-600 transition"
          />
        </Link>

        {bookingsPath && (
          <Link
            role="menuitem"
            href={bookingsPath}
            onClick={onClose}
            className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CalendarCheck size={16} />
              </span>
              <span>
                <b className="block text-xs font-bold text-slate-900">
                  My Bookings
                </b>
                <span className="block text-[10px] text-slate-400 font-normal">
                  Tours & departure dates
                </span>
              </span>
            </span>
            <ArrowRight
              size={14}
              className="text-slate-300 group-hover:text-slate-600 transition"
            />
          </Link>
        )}

        <Link
          role="menuitem"
          href={profilePath}
          onClick={onClose}
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <User size={16} />
            </span>
            <span>
              <b className="block text-xs font-bold text-slate-900">
                Account Settings
              </b>
              <span className="block text-[10px] text-slate-400 font-normal">
                Profile & preferences
              </span>
            </span>
          </span>
          <ArrowRight
            size={14}
            className="text-slate-300 group-hover:text-slate-600 transition"
          />
        </Link>

        <Link
          role="menuitem"
          href="/help-centre"
          onClick={onClose}
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <Headset size={16} />
            </span>
            <span>
              <b className="block text-xs font-bold text-slate-900">
                Help Centre
              </b>
              <span className="block text-[10px] text-slate-400 font-normal">
                FAQs & customer support
              </span>
            </span>
          </span>
          <ArrowRight
            size={14}
            className="text-slate-300 group-hover:text-slate-600 transition"
          />
        </Link>
      </div>

      {/* Sign Out Action */}
      <div className="mt-2.5 border-t border-slate-100 pt-2">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
            <LogOut size={15} />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
