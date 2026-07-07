"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuBanknote as Banknote, LuCoins as Coins, LuLayoutDashboard as LayoutDashboard, LuLink2 as Link2, LuLogOut as LogOut, LuMenu as Menu, LuMousePointerClick as MousePointerClick, LuTrendingUp as TrendingUp, LuUser as User, LuX as X } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/dashboardPath";

const NAV = [
  { href: "/affiliate/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/affiliate/referral-links", icon: Link2, label: "Referral Links" },
  { href: "/affiliate/clicks", icon: MousePointerClick, label: "Clicks" },
  { href: "/affiliate/conversions", icon: TrendingUp, label: "Conversions" },
  { href: "/affiliate/commissions", icon: Coins, label: "Commissions" },
  { href: "/affiliate/payouts", icon: Banknote, label: "Payouts" },
  { href: "/affiliate/profile", icon: User, label: "Profile" },
];

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
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-[#667085] shadow ring-1 ring-[#E7EAF0]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          Loading affiliate portal…
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  const initials = (user.name || "A").split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2);

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-purple-800/30 bg-purple-700 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-base font-black text-white">{initials}</div>
          <p className="mt-3 font-bold text-white">{user?.name}</p>
          <p className="text-xs text-purple-100">{user?.email}</p>
          <span className="mt-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white">Affiliate Partner</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/affiliate/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-purple-50 text-purple-700" : "text-[#344054] hover:bg-[#F5F7FA] hover:text-[#121826]"}`}>
                <Icon size={18} className={active ? "text-purple-600" : "text-[#667085]"} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#E7EAF0] p-3">
          <button type="button" onClick={() => logout("/")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#667085] hover:bg-red-50 hover:text-red-600">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-white shadow-sm ring-1 ring-[#E7EAF0] md:flex">
        <SidebarContent />
      </aside>

      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl md:hidden">
          <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-white hover:bg-white/10 z-10">
            <X size={18} />
          </button>
          <SidebarContent />
        </aside>
      )}

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="flex items-center justify-between border-b border-[#E7EAF0] bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-[#344054] hover:bg-[#F5F7FA]"><Menu size={20} /></button>
          <span className="font-bold text-purple-700">Affiliate Portal</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-xs font-black text-white">{initials}</div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
