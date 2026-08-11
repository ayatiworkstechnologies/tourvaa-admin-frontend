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
import { useCurrency } from "@/hooks/useCurrency";
import { useTravelStore } from "@/providers/TravelStoreProvider";

const mobileLinks = [
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
  const { symbol: currencySymbol } = useCurrency();
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
  const transparent = isHome && !scrolled;
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${transparent ? "bg-transparent text-white" : "border-b border-slate-100 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl"}`}
    >
      <div className="mx-auto flex h-20 max-w-[1480px] min-w-0 items-center justify-between gap-4 py-2 pl-4 pr-36 sm:pl-7 sm:pr-36 lg:pl-12 lg:pr-40">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-[#1478f2]"
        >
          Tourvaa
        </Link>
        <nav className="hidden items-center gap-4 lg:flex lg:gap-6">
          <Link
            href="/wishlist"
            className="group relative flex flex-col items-center gap-1 text-[9px] font-semibold"
          >
            <Heart
              size={17}
              className="transition group-hover:-translate-y-1 group-hover:text-blue-600"
            />
            Wishlist
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/compare"
            className="group relative flex flex-col items-center gap-1 text-[9px] font-semibold"
          >
            <Scale
              size={17}
              className="transition group-hover:-translate-y-1 group-hover:text-blue-600"
            />
            Compare
            {compareCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
                {compareCount}
              </span>
            )}
          </Link>
          <span className="flex items-center gap-1 text-[9px] font-semibold">
            <span className="text-[15px] leading-none" aria-hidden="true">{currencySymbol}</span>
            <CurrencySelector inverse={transparent} plain />
          </span>
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="group flex flex-col items-center gap-0.5 text-[9px] font-semibold"
            >
              <User
                size={17}
                className="transition group-hover:-translate-y-1 group-hover:text-blue-600"
              />
              <span className="flex items-center gap-0.5">
                Profile{" "}
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
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          className="lg:hidden"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {mobileLinks.map(([label, href]) => (
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
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-3 text-xs font-bold text-blue-700"
          >
            <Heart size={15} />
            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </Link>
          <Link
            href="/compare"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-3 text-xs font-bold text-blue-700"
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
                  className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
                >
                  <LayoutDashboard size={17} />
                  Open My Dashboard
                </Link>
                {bookingsPath && (
                  <Link
                    href={bookingsPath}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    <CalendarCheck size={17} className="text-blue-600" />
                    My Bookings
                  </Link>
                )}
                <Link
                  href={profilePath}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-blue-100 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  <User size={17} className="text-blue-600" />
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
                    <Icon size={17} className="text-blue-600" />
                    {label}
                  </Link>
                  {registerHref && (
                    <Link
                      href={registerHref}
                      onClick={() => setOpen(false)}
                      className="flex shrink-0 items-center rounded-xl border border-blue-100 px-3 text-xs font-black text-blue-600"
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
          className="group flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-blue-50"
        >
          <Link
            role="menuitem"
            href={href}
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-3 py-1"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
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
              className="shrink-0 rounded-lg border border-blue-100 px-2.5 py-1.5 text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Register
            </Link>
          ) : (
            <span className="pr-1 text-blue-500 transition group-hover:translate-x-1">
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
      className="group flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon size={16} />
      </span>
      {label}
    </Link>
  );
}
