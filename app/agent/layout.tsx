"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquare,
  Plus,
  User,
  Users,
} from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const NAV = [
  { href: "/agent/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agent/tours", icon: MapPinned, label: "Browse Tours" },
  { href: "/agent/bookings", icon: CalendarCheck, label: "Bookings" },
  { href: "/agent/bookings/create", icon: Plus, label: "New Booking" },
  { href: "/agent/customers", icon: Users, label: "My Customers" },
  { href: "/agent/invoices", icon: FileText, label: "Invoices" },
  { href: "/agent/messages", icon: MessageSquare, label: "Messages" },
  { href: "/agent/profile", icon: User, label: "My Profile" },
];

const PAGE_TITLES: Record<string, string> = {
  "/agent/dashboard": "Dashboard",
  "/agent/tours": "Browse Tours",
  "/agent/bookings": "Bookings",
  "/agent/bookings/create": "New Booking",
  "/agent/customers": "My Customers",
  "/agent/invoices": "Invoices",
  "/agent/messages": "Messages",
  "/agent/profile": "My Profile",
};

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [base, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(base + "/")) return title;
  }
  return "Agent Portal";
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
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
      if (slug && slug !== "agent-reseller") router.replace(getDashboardPath(slug));
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
        subtitle="Agent"
        mobile={false}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[260px] bg-white shadow-2xl">
            <Sidebar navItems={NAV} title="Tourvaa" subtitle="Agent" mobile={true} collapsed={false} onToggleCollapse={() => {}} />
          </div>
        </div>
      )}
      
      <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
        <Header
          title={pageTitle}
          name={user.name}
          profileImage={user.profile_image}
          role="Agent / Reseller"
          profileHref="/agent/profile"
          onMenuClick={() => setSidebarOpen(true)}
          theme="orange"
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
