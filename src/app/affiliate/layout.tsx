"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuBanknote as Banknote, LuCoins as Coins, LuLayoutDashboard as LayoutDashboard, LuLink2 as Link2, LuMessageSquare as MessageSquare, LuMousePointerClick as MousePointerClick, LuTrendingUp as TrendingUp, LuUser as User, LuUsers as Users, LuWallet as Wallet } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import { canAccessAffiliateRoute, isApprovedAffiliate, isAffiliateOperationalRoute } from "@/lib/auth/affiliateAccess";

const NAV = [
  { href: "/affiliate/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/affiliate/referral-links", icon: Link2, label: "My Links", section: "Promote" },
  { href: "/affiliate/clicks", icon: MousePointerClick, label: "Clicks", section: "Promote" },
  { href: "/affiliate/conversions", icon: TrendingUp, label: "Conversions", section: "Promote" },
  { href: "/affiliate/commissions", icon: Coins, label: "Commissions", section: "Earnings" },
  { href: "/affiliate/wallet", icon: Wallet, label: "Wallet", section: "Earnings" },
  { href: "/affiliate/payouts", icon: Banknote, label: "Payouts", section: "Earnings" },
  { href: "/affiliate/support", icon: MessageSquare, label: "Support", placement: "bottom" as const },
  { href: "/affiliate/profile", icon: User, label: "My Profile", placement: "bottom" as const },
];

const PAGE_TITLES: Record<string, string> = {
  "/affiliate/dashboard": "Dashboard",
  "/affiliate/referral-links": "My Links",
  "/affiliate/clicks": "Clicks",
  "/affiliate/conversions": "Conversions",
  "/affiliate/commissions": "Commissions",
  "/affiliate/wallet": "Wallet",
  "/affiliate/payouts": "Payouts",
  "/affiliate/support": "Support",
  "/affiliate/profile": "My Profile",
};

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [base, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(base + "/")) return title;
  }
  return "Affiliate Portal";
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading, user, dashboard } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState(false);

  useEffect(() => {
    const close = () => setSidebarOpen(false);
    window.addEventListener("tourvaa:close-mobile-sidebar", close);
    return () => window.removeEventListener("tourvaa:close-mobile-sidebar", close);
  }, []);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace(`/login?redirect=${pathname}`);
  }, [loading, isLoggedIn, pathname, router]);

  useEffect(() => {
    if (!loading && isLoggedIn && dashboard) {
      const slug = (dashboard.user?.role as { slug?: string })?.slug ?? "";
      if (slug && slug !== "affiliate") router.replace(getDashboardPath(slug));
    }
  }, [loading, isLoggedIn, dashboard, router]);

  const approved = isApprovedAffiliate(user);
  const navItems = NAV.map((item) => ({
    ...item,
    locked: !approved && isAffiliateOperationalRoute(item.href),
    badge: item.href === "/affiliate/dashboard" && !approved ? "Pending" : undefined,
  }));

  useEffect(() => {
    if (!loading && user && !canAccessAffiliateRoute(user, pathname)) {
      if (isAffiliateOperationalRoute(pathname)) {
        setApprovalNotice(true);
        router.replace("/affiliate/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow ring-1 ring-dash-border">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-brand border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  const pageTitle = getTitle(pathname);

  return (
    <div className="flex min-h-screen bg-dash-bg" style={portalThemeStyles.affiliate}>
      <Sidebar
        navItems={navItems}
        title="Tourvaa"
        subtitle="Affiliate"
        logoIcon={Users}
        theme="affiliate"
        mobile={false}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onLockedItemClick={() => setApprovalNotice(true)}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[260px] bg-white shadow-2xl">
            <Sidebar navItems={navItems} title="Tourvaa" subtitle="Affiliate" logoIcon={Users} theme="affiliate" mobile={true} collapsed={false} onToggleCollapse={() => {}} onLockedItemClick={() => setApprovalNotice(true)} />
          </div>
        </div>
      )}

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
        <Header
          title={pageTitle}
          name={user.name}
          profileImage={user.profile_image}
          role="Affiliate Partner"
          profileHref="/affiliate/profile"
          onMenuClick={() => setSidebarOpen(true)}
          theme="violet"
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      {approvalNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true" aria-labelledby="affiliate-approval-title">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="affiliate-approval-title" className="text-lg font-black text-slate-950">Admin approval required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This feature will become available after Tourvaa approves your affiliate account.</p>
            <button type="button" onClick={() => setApprovalNotice(false)} className="mt-5 w-full rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-800">Understood</button>
          </section>
        </div>
      )}
    </div>
  );
}
