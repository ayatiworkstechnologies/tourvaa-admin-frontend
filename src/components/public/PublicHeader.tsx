"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuChevronDown as ChevronDown, LuHeart as Heart, LuLayoutDashboard as LayoutDashboard, LuLogOut as LogOut, LuMenu as Menu, LuSearch as Search, LuUser as User, LuX as X } from "react-icons/lu";
import { useState, useRef, useEffect } from "react";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { useAuthContext } from "@/providers/AuthProvider";
import CurrencySelector from "@/components/public/CurrencySelector";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tour Packages" },
  { href: "/#experiences", label: "Experiences" },
  { href: "/about", label: "About Us" },
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const dropRef = useRef<HTMLDivElement>(null);

  const { isLoggedIn, loading: sessionLoading, user, logout, dashboard } = useAuthContext();
  const roleSlug = dashboard?.user?.role?.slug ?? "";
  const dashboardPath = getDashboardPath(roleSlug);

  const NON_ADMIN_ROLES = ["customer", "agent-reseller", "supplier", "affiliate"];
  const isPortalUser = isLoggedIn && NON_ADMIN_ROLES.includes(roleSlug);

  function profilePath() {
    if (roleSlug === "customer") return "/customer/profile";
    if (roleSlug === "agent-reseller") return "/agent/profile";
    if (roleSlug === "supplier") return "/supplier/profile";
    if (roleSlug === "affiliate") return "/affiliate/profile";
    return "/";
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    setDropOpen(false);
    logout();
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const isHome = pathname === "/";
  const headerText = isHome && !scrolled ? "text-white" : "text-zinc-950";

  return (
    <div className="fixed top-0 z-50 w-full px-4 pt-3 sm:px-6 lg:px-8 transition-all duration-500">
      <header
        className={`mx-auto flex max-w-7xl items-center justify-between gap-5 rounded-xl px-4 py-2.5 transition-all duration-500 ${
          scrolled || !isHome
            ? "bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-white/20"
            : "bg-transparent border border-transparent"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 flex-col leading-none">
          <span className={`font-heading text-xl font-black uppercase tracking-[0.08em] transition-colors ${headerText}`}>Tourvaa</span>
          <span className={`mt-1 text-[8px] font-semibold tracking-wide transition-colors ${isHome && !scrolled ? "text-white/75" : "text-slate-500"}`}>Your World. Your Way.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navLinks.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && !!pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? scrolled || !isHome ? "text-sky-600 bg-sky-50/80" : "text-white bg-white/10"
                    : scrolled || !isHome ? "text-zinc-600 hover:text-zinc-950 hover:bg-slate-50" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <CurrencySelector inverse={isHome && !scrolled} />
          <div className={`hidden items-center gap-1 lg:flex ${headerText}`}>
            <Link href="/tours" className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition ${scrolled || !isHome ? "hover:bg-slate-100" : "hover:bg-white/10"}`}><Search size={14} /> Search</Link>
            <Link href={isPortalUser ? dashboardPath : "/login"} className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition ${scrolled || !isHome ? "hover:bg-slate-100" : "hover:bg-white/10"}`}><Heart size={14} /> Wishlist</Link>
          </div>
          {!sessionLoading && isPortalUser ? (
            <div className="relative hidden sm:block" ref={dropRef}>
              <button
                type="button"
                onClick={() => setDropOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all ${
                  scrolled || !isHome
                    ? "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-slate-50"
                    : "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${scrolled || !isHome ? "bg-sky-50 text-sky-600" : "bg-white/20 text-white"}`}>
                  {initials}
                </span>
                <span className="max-w-28 truncate">{user?.name?.split(" ")[0] ?? "Account"}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                  <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                    <p className="truncate text-sm font-bold text-zinc-950">{user?.name}</p>
                    <p className="truncate text-xs text-zinc-500">{user?.email}</p>
                  </div>
                  <Link
                    href={dashboardPath}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-slate-50 hover:text-zinc-950"
                  >
                    <LayoutDashboard size={16} className="text-sky-500" /> My Dashboard
                  </Link>
                  <Link
                    href={profilePath()}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-slate-50 hover:text-zinc-950"
                  >
                    <User size={16} className="text-sky-500" /> My Profile
                  </Link>
                  <div className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !sessionLoading && !isPortalUser ? (
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Link
                href="/login"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  scrolled || !isHome
                    ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                <User size={14} /> Login
              </Link>
              <Link
                href="/contact"
                className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-orange-950/10 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
              >
                Plan My Trip
              </Link>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:hidden ${
              scrolled || !isHome ? "text-zinc-600 hover:bg-zinc-100" : "text-white hover:bg-white/20"
            }`}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="absolute inset-x-4 top-20 rounded-2xl border border-slate-100 bg-white/95 px-5 pb-6 pt-4 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && !!pathname?.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    active ? "bg-sky-50 text-sky-600" : "text-zinc-600 hover:bg-slate-50 hover:text-zinc-950"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!sessionLoading && isPortalUser ? (
            <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4">
              <p className="px-4 pb-2 text-xs font-semibold text-zinc-400">
                Hi, {user?.name?.split(" ")[0]}
              </p>
              <Link
                href={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-slate-50 hover:text-zinc-950"
              >
                <LayoutDashboard size={16} className="text-sky-500" /> My Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-3 text-center text-sm font-semibold text-zinc-600 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-orange-600"
              >
                Plan My Trip
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
