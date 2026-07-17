"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuBanknote as Banknote, LuCoins as Coins, LuLayoutDashboard as LayoutDashboard, LuLink2 as Link2, LuLogOut as LogOut, LuMenu as Menu, LuMousePointerClick as MousePointerClick, LuTrendingUp as TrendingUp, LuUser as User, LuX as X } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";

const NAV = [
  { href: "/affiliate/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/affiliate/referral-links", icon: Link2, label: "Referral Links" },
  { href: "/affiliate/clicks", icon: MousePointerClick, label: "Clicks" },
  { href: "/affiliate/conversions", icon: TrendingUp, label: "Conversions" },
  { href: "/affiliate/commissions", icon: Coins, label: "Commissions" },
  { href: "/affiliate/payouts", icon: Banknote, label: "Payouts" },
  { href: "/affiliate/profile", icon: User, label: "Profile" },
];

type SidebarContentProps = {
  initials: string;
  name: string;
  email: string;
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
};

function SidebarContent({ initials, name, email, pathname, onNavigate, onLogout }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-purple-800/30 bg-purple-700 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-base font-black text-white">{initials}</div>
        <p className="mt-3 font-bold text-white">{name}</p>
        <p className="text-xs text-purple-100">{email}</p>
        <span className="mt-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white">Affiliate Partner</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/affiliate/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={onNavigate}
              className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-purple-50 text-purple-700" : "text-dash-body hover:bg-dash-bg-muted hover:text-dash-text"}`}>
              <Icon size={18} className={active ? "text-purple-600" : "text-dash-muted"} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-dash-border p-3">
        <button type="button" onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-dash-muted hover:bg-red-50 hover:text-red-600">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading, user, logout, dashboard } = useAuthContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace(`/login?redirect=${pathname}`);
  }, [loading, isLoggedIn, pathname, router]);

  useEffect(() => {
    if (!loading && isLoggedIn && dashboard) {
      const slug = dashboard.user?.role?.slug ?? "";
      if (slug && slug !== "affiliate") router.replace(getDashboardPath(slug));
    }
  }, [loading, isLoggedIn, dashboard, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg-muted">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow ring-1 ring-dash-border">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          Loading affiliate portal…
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  const initials = (user.name || "A").split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex min-h-screen bg-dash-bg-muted">
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-white shadow-sm ring-1 ring-dash-border md:flex">
        <SidebarContent initials={initials} name={user.name} email={user.email} pathname={pathname} onNavigate={() => setOpen(false)} onLogout={() => logout("/")} />
      </aside>

      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl md:hidden">
          <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-white hover:bg-white/10 z-10">
            <X size={18} />
          </button>
          <SidebarContent initials={initials} name={user.name} email={user.email} pathname={pathname} onNavigate={() => setOpen(false)} onLogout={() => logout("/")} />
        </aside>
      )}

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="flex items-center justify-between border-b border-dash-border bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-dash-body hover:bg-dash-bg-muted"><Menu size={20} /></button>
          <span className="font-bold text-purple-700">Affiliate Portal</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white">{initials}</div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
