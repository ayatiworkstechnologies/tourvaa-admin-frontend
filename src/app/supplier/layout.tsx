"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuBanknote as Banknote, LuBell as Bell, LuCalendarCheck as CalendarCheck, LuFileCheck2 as FileCheck, LuLayoutDashboard as LayoutDashboard, LuMapPinned as MapPinned, LuMessageSquare as MessageSquare, LuPlus as Plus, LuStore as Store, LuUser as User, LuWallet as Wallet } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import { canAccessSupplierRoute, isApprovedSupplier, isSupplierOperationalRoute } from "@/lib/auth/supplierAccess";

const NAV = [
  { href: "/supplier/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/supplier/tours", icon: MapPinned, label: "My Tours", section: "Tour Workspace" },
  { href: "/supplier/tours/create", icon: Plus, label: "Create Tour", section: "Tour Workspace" },
  { href: "/supplier/bookings", icon: CalendarCheck, label: "Bookings", section: "Operations" },
  { href: "/supplier/earnings", icon: Wallet, label: "Earnings", section: "Operations" },
  { href: "/supplier/payouts", icon: Banknote, label: "Payouts", section: "Operations" },
  { href: "/supplier/messages", icon: MessageSquare, label: "Messages", section: "Communication" },
  { href: "/supplier/notifications", icon: Bell, label: "Notifications", section: "Communication" },
  { href: "/supplier/profile#documents", icon: FileCheck, label: "Documents", placement: "bottom" as const },
  { href: "/supplier/profile", icon: User, label: "My Profile", placement: "bottom" as const },
];

const PAGE_TITLES: Record<string, string> = {
  "/supplier/dashboard": "Dashboard",
  "/supplier/tours": "My Tours",
  "/supplier/tours/create": "Create Tour",
  "/supplier/bookings": "Bookings",
  "/supplier/earnings": "Earnings",
  "/supplier/payouts": "Payouts",
  "/supplier/messages": "Messages",
  "/supplier/notifications": "Notifications",
  "/supplier/profile": "My Profile",
};

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [base, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(base + "/")) return title;
  }
  return "Supplier Portal";
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
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
      if (slug && slug !== "supplier") router.replace(getDashboardPath(slug));
    }
  }, [loading, isLoggedIn, dashboard, router]);

  const approved = isApprovedSupplier(user);
  const navItems = NAV.map((item) => ({
    ...item,
    locked: !approved && isSupplierOperationalRoute(item.href),
    badge: item.href === "/supplier/dashboard" && !approved ? "Pending" : undefined,
  }));

  useEffect(() => {
    if (!loading && user && !canAccessSupplierRoute(user, pathname)) {
      if (isSupplierOperationalRoute(pathname)) {
        setApprovalNotice(true);
        router.replace("/supplier/dashboard");
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
    <div className="flex min-h-screen bg-dash-bg" style={portalThemeStyles.supplier}>
      <Sidebar
        navItems={navItems}
        title="Tourvaa"
        subtitle="Supplier"
        logoIcon={Store}
        theme="supplier"
        mobile={false}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onLockedItemClick={() => setApprovalNotice(true)}
      />
      
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[260px] bg-white shadow-2xl">
            <Sidebar navItems={navItems} title="Tourvaa" subtitle="Supplier" logoIcon={Store} theme="supplier" mobile={true} collapsed={false} onToggleCollapse={() => {}} onLockedItemClick={() => setApprovalNotice(true)} />
          </div>
        </div>
      )}
      
      <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
        <Header
          title={pageTitle}
          name={user.name}
          profileImage={user.profile_image}
          role="Tour Supplier"
          profileHref="/supplier/profile"
          onMenuClick={() => setSidebarOpen(true)}
          theme="emerald"
        />
        <main className="flex-1">{children}</main>
      </div>
      {approvalNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true" aria-labelledby="supplier-approval-title">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="supplier-approval-title" className="text-lg font-black text-slate-950">Admin approval required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This feature will become available after Tourvaa approves your supplier account.</p>
            <button type="button" onClick={() => setApprovalNotice(false)} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Understood</button>
          </section>
        </div>
      )}
    </div>
  );
}
