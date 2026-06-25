"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getDashboardPath } from "@/lib/dashboardPath";
import { useAuthContext } from "@/providers/AuthProvider";

const navLinks = [
  { href: "/tours", label: "Tours" },
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
  const isPortalUser = isLoggedIn && !!roleSlug;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
    logout("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 md:px-8">

        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0A0F1E] text-sm font-black text-sky-400 transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white">
            T
          </span>
          <span className="text-[15px] font-black tracking-tight text-[#0F172A]">Tourvaa</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
          {navLinks.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && !!pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-px h-px rounded-full bg-sky-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {!sessionLoading && isPortalUser ? (
            <div className="relative hidden sm:block" ref={dropRef}>
              <button
                type="button"
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-[#0F172A]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-600">
                  {initials}
                </span>
                <span className="max-w-28 truncate">{user?.name?.split(" ")[0] ?? "Account"}</span>
                <ChevronDown size={13} className={`shrink-0 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-xs font-bold text-[#0F172A]">{user?.name}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <Link
                    href={dashboardPath}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#0F172A]"
                  >
                    <LayoutDashboard size={14} className="text-sky-500" /> My Dashboard
                  </Link>
                  <Link
                    href={roleSlug === "customer" ? "/customer/profile" : "/admin/profile"}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#0F172A]"
                  >
                    <User size={14} className="text-sky-500" /> My Profile
                  </Link>
                  <div className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !sessionLoading && !isPortalUser ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-sky-600"
              >
                Register
              </Link>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0F172A] md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && !!pathname?.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!sessionLoading && isPortalUser ? (
            <div className="mt-3 flex flex-col gap-0.5 border-t border-slate-100 pt-3">
              <p className="px-4 pb-1 text-xs font-semibold text-slate-400">
                Hi, {user?.name?.split(" ")[0]}
              </p>
              <Link
                href={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <LayoutDashboard size={14} className="text-sky-500" /> My Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-600"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-sky-500 py-2.5 text-center text-sm font-bold text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
