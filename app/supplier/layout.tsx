"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuBanknote as Banknote, LuCalendarCheck as CalendarCheck, LuChevronDown as ChevronDown, LuLayoutDashboard as LayoutDashboard, LuLogOut as LogOut, LuMapPinned as MapPinned, LuMenu as Menu, LuMessageSquare as MessageSquare, LuPlus as Plus, LuUser as User, LuWallet as Wallet } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const NAV = [
  { href: "/supplier/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/supplier/tours", icon: MapPinned, label: "My Tours" },
  { href: "/supplier/tours/create", icon: Plus, label: "Create Tour" },
  { href: "/supplier/bookings", icon: CalendarCheck, label: "Bookings" },
  { href: "/supplier/earnings", icon: Wallet, label: "Earnings" },
  { href: "/supplier/payouts", icon: Banknote, label: "Payouts" },
  { href: "/supplier/messages", icon: MessageSquare, label: "Messages" },
  { href: "/supplier/profile", icon: User, label: "My Profile" },
];

const PAGE_TITLES: Record<string, string> = {
  "/supplier/dashboard": "Dashboard",
  "/supplier/tours": "My Tours",
  "/supplier/tours/create": "Create Tour",
  "/supplier/bookings": "Bookings",
  "/supplier/earnings": "Earnings",
  "/supplier/payouts": "Payouts",
  "/supplier/messages": "Messages",
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
  const { isLoggedIn, loading, user, logout, dashboard } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-[#667085] shadow ring-1 ring-[#E7EAF0]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#43A9F6] border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  const pageTitle = getTitle(pathname);

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      <Sidebar
        navItems={NAV}
        title="Tourvaa"
        subtitle="Supplier"
        mobile={false}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[260px] bg-white shadow-2xl">
            <Sidebar navItems={NAV} title="Tourvaa" subtitle="Supplier" mobile={true} collapsed={false} onToggleCollapse={() => {}} />
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
    </div>
  );
}
