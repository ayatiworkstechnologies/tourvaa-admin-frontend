"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  LuArrowRight as ArrowRight,
  LuBriefcaseBusiness as Briefcase,
  LuBuilding2 as Building,
  LuCalendarCheck as CalendarCheck,
  LuChevronDown as ChevronDown,
  LuHandshake as Handshake,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuLayoutDashboard as LayoutDashboard,
  LuLogOut as LogOut,
  LuMenu as Menu,
  LuPlane as Plane,
  LuScale as Scale,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuUserRound as User,
  LuX as X,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import LanguageCurrencySelector from "@/components/public/LanguageCurrencySelector";
import { useTravelStore } from "@/providers/TravelStoreProvider";

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, dashboard, user, logout } = useAuthContext();
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
      setScrolled(currentScrollY > 24);

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
      className={`print:hidden sticky top-0 z-50 border-b border-slate-100/80 bg-white/95 text-slate-900 backdrop-blur-md transition-all duration-300 ease-in-out ${
        scrolled
          ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          : "shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      } ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] min-w-0 items-center justify-between gap-6 px-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-slate-900 transition hover:opacity-90 sm:text-3xl"
        >
          Tourvaa
        </Link>
        <nav
          aria-label="Account and trip tools"
          className="hidden shrink-0 items-center gap-5 lg:flex lg:gap-7"
        >
          <Link
            href="/wishlist"
            className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] transition-colors hover:text-[#E4572E]"
          >
            <Heart
              size={18}
              className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E4572E]"
            />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E4572E] px-1 text-[8px] font-black text-white shadow-xs">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/compare"
            className="group relative flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] transition-colors hover:text-[#E4572E]"
          >
            <Scale
              size={18}
              className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E4572E]"
            />
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E4572E] px-1 text-[8px] font-black text-white shadow-xs">
                {compareCount}
              </span>
            )}
          </Link>
          <LanguageCurrencySelector plain />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-1 text-[10px] font-semibold text-[#0f2439] transition-colors hover:text-[#E4572E]"
            >
              {isLoggedIn ? (
                <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-[#E4572E] to-amber-500 text-[10px] font-black text-white shadow-xs">
                  {(user?.name || "T")[0]?.toUpperCase()}
                </div>
              ) : (
                <User
                  size={18}
                  className="text-[#0f2439] stroke-[1.8] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-[#E4572E]"
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
                      ? "rotate-180 text-[#E4572E]"
                      : "text-[#0f2439] group-hover:text-[#E4572E]"
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
          <LanguageCurrencySelector plain />
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            className="group p-1.5 rounded-lg text-[#0f2439] transition-colors hover:text-[#E4572E] hover:bg-orange-50"
          >
            {open ? (
              <X size={22} className="text-[#0f2439] group-hover:text-[#E4572E]" />
            ) : (
              <Menu size={22} className="text-[#0f2439] group-hover:text-[#E4572E]" />
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg lg:hidden">
          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-lg bg-pub-secondary/10 px-3 py-3 text-xs font-bold text-pub-secondary"
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E4572E] to-amber-500 text-white font-extrabold text-sm shadow-xs">
                    {(user?.name || "T")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-slate-900">
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
                  <Headset size={17} className="text-purple-600" />
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
                <div className="rounded-xl border border-orange-200/70 bg-gradient-to-br from-slate-50 to-orange-50/40 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E4572E] text-white">
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
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#0B1527] py-2 text-xs font-bold text-white shadow-xs"
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

                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Partner & Business Portals
                  </p>
                  {partnerPortals.map((partner) => {
                    const Icon = partner.icon;
                    return (
                      <div
                        key={partner.label}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5"
                      >
                        <Link
                          href={partner.href}
                          onClick={() => setOpen(false)}
                          className="flex flex-1 items-center gap-2.5 text-xs font-bold text-slate-700"
                        >
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${partner.accent}`}
                          >
                            <Icon size={15} />
                          </span>
                          <span>{partner.label}</span>
                        </Link>
                        <Link
                          href={partner.registerHref}
                          onClick={() => setOpen(false)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-[#E4572E]"
                        >
                          {partner.registerLabel}
                        </Link>
                      </div>
                    );
                  })}
                </div>
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
    label: "Travel Agent Portal",
    note: "B2B wholesale rates & bookings",
    href: "/agent-portal/login",
    registerHref: "/agent-portal/login?tab=register",
    registerLabel: "Register",
    icon: Briefcase,
    accent: "text-blue-600 bg-blue-50 group-hover:bg-blue-600",
  },
  {
    label: "Affiliate Partner",
    note: "Earn commissions on every referral",
    href: "/affiliate-portal/login",
    registerHref: "/affiliate-portal/login?tab=register",
    registerLabel: "Register",
    icon: Handshake,
    accent: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600",
  },
  {
    label: "Tour Operator / Supplier",
    note: "List tours & manage departures",
    href: "/supplier-portal/login",
    registerHref: "/supplier/onboarding",
    registerLabel: "Join",
    icon: Building,
    accent: "text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600",
  },
] as const;

function ProfileLoginMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="menu"
      className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.2)] ring-1 ring-slate-900/5 animate-in fade-in-0 zoom-in-95 duration-200"
    >
      {/* Header Welcome */}
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-3 border-b border-slate-100">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#E4572E]">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">Welcome to Tourvaa</p>
          <p className="truncate text-[11px] text-slate-500 font-medium">
            Sign in to unlock exclusive travel perks
          </p>
        </div>
      </div>

      {/* Primary Traveller Card */}
      <div className="mt-3 rounded-xl bg-gradient-to-br from-slate-50 to-orange-50/40 p-3 border border-slate-200/80">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E4572E] text-white shadow-xs">
            <User size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-900">Traveller Account</p>
            <p className="text-[10px] text-slate-500">Plan trips, view bookings & wishlist</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            role="menuitem"
            href="/login?role=traveller"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0B1527] py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C] active:scale-95"
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

      {/* Partner Portals Section */}
      <div className="mt-3">
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
                    <b className="block text-xs font-bold text-slate-900 group-hover:text-[#E4572E] transition-colors">
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
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:border-[#E4572E] hover:text-[#E4572E]"
                >
                  {partner.registerLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Help & Trust */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between px-3 text-[11px] text-slate-500">
        <Link
          href="/help-centre"
          onClick={onClose}
          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-[#E4572E] transition"
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
  user: any;
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E4572E] to-amber-500 text-white font-black text-sm shadow-xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-900">{name}</p>
          {email && (
            <p className="truncate text-[11px] text-slate-500 font-medium">{email}</p>
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
            <Heart size={14} className="text-[#E4572E]" />
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
              <b className="block text-xs font-bold text-slate-900">My Dashboard</b>
              <span className="block text-[10px] text-slate-400 font-normal">Overview & activity</span>
            </span>
          </span>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
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
                <b className="block text-xs font-bold text-slate-900">My Bookings</b>
                <span className="block text-[10px] text-slate-400 font-normal">Tours & departure dates</span>
              </span>
            </span>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
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
              <b className="block text-xs font-bold text-slate-900">Account Settings</b>
              <span className="block text-[10px] text-slate-400 font-normal">Profile & preferences</span>
            </span>
          </span>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
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
              <b className="block text-xs font-bold text-slate-900">Help Centre</b>
              <span className="block text-[10px] text-slate-400 font-normal">FAQs & customer support</span>
            </span>
          </span>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
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
