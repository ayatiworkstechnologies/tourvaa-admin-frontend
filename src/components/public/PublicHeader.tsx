"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LuBriefcaseBusiness as Briefcase,
  LuCalendarCheck as CalendarCheck,
  LuChevronDown as ChevronDown,
  LuHeart as Heart,
  LuLayoutDashboard as LayoutDashboard,
  LuLogOut as LogOut,
  LuMenu as Menu,
  LuPlane as Plane,
  LuScale as Scale,
  LuUserRound as User,
  LuX as X,
} from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import CurrencySelector from "@/components/public/CurrencySelector";
import { useTravelStore } from "@/providers/TravelStoreProvider";

const browseLinks = [
  ["Destinations", "/destinations"],
  ["Tour Packages", "/tours"],
  ["Deals", "/tours?sort=price_asc"],
  ["Travel Advice", "/travel-advice"],
  ["About Tourvaa", "/about"],
] as const;

export default function PublicHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const listen = () => setScrolled(window.scrollY > 24);
    listen();
    window.addEventListener("scroll", listen, { passive: true });
    return () => window.removeEventListener("scroll", listen);
  }, []);
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
      className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/95 text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300"
    >
      <div className="mx-auto flex h-20 max-w-[1440px] min-w-0 items-center justify-between gap-6 px-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-slate-900 transition hover:opacity-90 sm:text-3xl"
        >
          Tourvaa
        </Link>
        <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex xl:gap-6">
          {browseLinks.map(([label, href]) => {
            const route = href.split("?")[0];
            const active = !href.includes("?") && (pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)));
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap text-xs font-bold transition hover:text-pub-secondary ${active ? "text-pub-secondary" : "text-slate-700"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <nav aria-label="Account and trip tools" className="hidden shrink-0 items-center gap-5 lg:flex lg:gap-7">
          <Link
            href="/wishlist"
            className="group relative flex flex-col items-center gap-1 text-[10px] font-medium text-slate-700 transition hover:text-pub-secondary"
          >
            <Heart
              size={18}
              className="stroke-[1.8] transition group-hover:-translate-y-0.5 group-hover:text-pub-secondary"
            />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pub-secondary px-1 text-[8px] font-black text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/compare"
            className="group relative flex flex-col items-center gap-1 text-[10px] font-medium text-slate-700 transition hover:text-pub-secondary"
          >
            <Scale
              size={18}
              className="stroke-[1.8] transition group-hover:-translate-y-0.5 group-hover:text-pub-secondary"
            />
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pub-secondary px-1 text-[8px] font-black text-white">
                {compareCount}
              </span>
            )}
          </Link>
          <CurrencySelector plain />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-1 text-[10px] font-medium text-slate-700 transition hover:text-pub-secondary"
            >
              <User
                size={18}
                className="stroke-[1.8] transition group-hover:-translate-y-0.5 group-hover:text-pub-secondary"
              />
              <span className="flex items-center gap-0.5">
                Profile
                <ChevronDown
                  size={9}
                  className={`transition ${profileOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            {profileOpen &&
              (isLoggedIn ? (
                <AuthenticatedProfileMenu
                  name={user?.name}
                  profilePath={profilePath}
                  onClose={() => setProfileOpen(false)}
                  onLogout={logout}
                />
              ) : (
                <ProfileLoginMenu onClose={() => setProfileOpen(false)} />
              ))}
          </div>
        </nav>
        <div className="flex items-center gap-3 lg:hidden">
          <CurrencySelector plain />
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            className="p-1.5 rounded-lg text-slate-800 hover:bg-slate-100"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {browseLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold"
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            href="/wishlist"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-pub-secondary/10 px-3 py-3 text-xs font-bold text-pub-secondary"
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
            {isLoggedIn ? "Your account" : "Account login"}
          </p>
          <div className="mt-2 grid gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardPath}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-pub-secondary px-4 py-3 text-sm font-bold text-white"
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
                  My Profile
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
              profileOptions.map(({ label, href, registerHref, icon: Icon }) => (
                <div key={label} className="flex items-stretch gap-2">
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex flex-1 items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <Icon size={17} className="text-pub-secondary" />
                    {label}
                  </Link>
                  {registerHref && (
                    <Link
                      href={registerHref}
                      onClick={() => setOpen(false)}
                      className="flex shrink-0 items-center rounded-xl border border-pub-secondary/20 px-3 text-xs font-black text-pub-secondary"
                    >
                      Register
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const profileOptions = [
  {
    label: "Traveller Login",
    note: "Bookings, wishlist and trips",
    href: "/login?role=traveller",
    registerHref: "/register",
    icon: Plane,
  },
  {
    label: "Agent Login",
    note: "Customers, bookings and earnings",
    href: "/agent-portal/login",
    registerHref: "/agent-portal/login?tab=register",
    icon: Briefcase,
  },
] as const;

function ProfileLoginMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="menu"
      className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.18)]"
    >
      <div className="px-3 pb-2 pt-2">
        <p className="text-sm font-black">Welcome to Tourvaa</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Choose your account type to continue
        </p>
      </div>
      {profileOptions.map(({ label, note, href, registerHref, icon: Icon }) => (
        <div
          key={label}
          className="group flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-pub-secondary/10"
        >
          <Link
            role="menuitem"
            href={href}
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-3 py-1"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pub-secondary/10 text-pub-secondary transition group-hover:bg-pub-secondary group-hover:text-white">
              <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-xs">{label}</b>
              <span className="mt-0.5 block text-[9px] text-slate-400">
                {note}
              </span>
            </span>
          </Link>
          {registerHref ? (
            <Link
              role="menuitem"
              href={registerHref}
              onClick={onClose}
              className="shrink-0 rounded-lg border border-pub-secondary/20 px-2.5 py-1.5 text-[9px] font-black text-pub-secondary hover:bg-pub-secondary hover:text-white"
            >
              Register
            </Link>
          ) : (
            <span className="pr-1 text-pub-secondary transition group-hover:translate-x-1">
              ›
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function AuthenticatedProfileMenu({
  name,
  profilePath,
  onClose,
  onLogout,
}: {
  name?: string;
  profilePath: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      role="menu"
      className="profile-dropdown-panel absolute right-0 top-[calc(100%+14px)] w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-[0_20px_55px_rgba(15,23,42,.18)]"
    >
      <div className="border-b border-slate-100 px-3 pb-3 pt-2">
        <p className="truncate text-sm font-black">{name || "My Tourvaa"}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Manage your account
        </p>
      </div>
      <div className="pt-2">
        <AccountMenuLink
          href={profilePath}
          label="Profile"
          icon={User}
          onClose={onClose}
        />
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
            <LogOut size={16} />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );
}

function AccountMenuLink({
  href,
  label,
  icon: Icon,
  onClose,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClose: () => void;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClose}
      className="group flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-pub-secondary/10 hover:text-pub-secondary"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pub-secondary/10 text-pub-secondary transition group-hover:bg-pub-secondary group-hover:text-white">
        <Icon size={16} />
      </span>
      {label}
    </Link>
  );
}
