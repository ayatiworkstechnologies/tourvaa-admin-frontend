"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuCalendarCheck as CalendarCheck, LuCompass as Compass, LuCreditCard as CreditCard, LuFileText as FileText, LuHeadphones as Headphones, LuLayoutDashboard as LayoutDashboard, LuMapPinned as MapPinned, LuReceiptText as ReceiptText, LuUser as User, LuUsersRound as UsersRound } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import PublicHeader from "@/components/public/PublicHeader";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";

const NAV = [
  { href: "/customer/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tours", icon: MapPinned, label: "Browse Tours", section: "My Travel" },
  { href: "/customer/bookings", icon: CalendarCheck, label: "My Bookings", section: "My Travel" },
  { href: "/customer/travellers", icon: UsersRound, label: "Travellers", section: "My Travel" },
  { href: "/customer/payments", icon: CreditCard, label: "Payments", section: "Billing" },
  { href: "/customer/invoices", icon: ReceiptText, label: "Invoices", section: "Billing" },
  { href: "/customer/cancellations", icon: FileText, label: "Cancellations", section: "Billing" },
  { href: "/customer/support", icon: Headphones, label: "Support", placement: "bottom" as const },
  { href: "/customer/profile", icon: User, label: "My Profile", placement: "bottom" as const },
];

const TITLES: Record<string, string> = {
  "/customer/dashboard": "Dashboard", "/customer/bookings": "My Bookings", "/customer/travellers": "Travellers",
  "/customer/payments": "Payments", "/customer/invoices": "Invoices", "/customer/cancellations": "Cancellations",
  "/customer/support": "Support", "/customer/profile": "My Profile",
};

function pageTitle(pathname: string) {
  const match = Object.entries(TITLES).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] || "My Tourvaa";
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading, user, dashboard } = useAuthContext();
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
      if (slug && slug !== "customer") router.replace(getDashboardPath(slug));
    }
  }, [loading, isLoggedIn, dashboard, router]);

  if (loading) {
    return (
      <TravelStoreProvider>
        <div className="min-h-screen bg-[#F7FAFF]" style={portalThemeStyles.customer}>
          <PublicHeader />
          <div className="flex min-h-screen items-center justify-center pt-20">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow-lg ring-1 ring-dash-border">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-brand border-t-transparent" />
              Loading your trips...
            </div>
          </div>
        </div>
      </TravelStoreProvider>
    );
  }

  if (!isLoggedIn || !user) return null;

  return (
    <TravelStoreProvider>
      <div className="customer-public-portal min-h-screen bg-dash-bg" style={portalThemeStyles.customer}>
        <PublicHeader />
        <div className="flex min-h-screen pt-20">
          <Sidebar navItems={NAV} title="My Tourvaa" subtitle="Traveller Portal" logoIcon={Compass} theme="customer" collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} headerOffset />

          {sidebarOpen && <div className="fixed inset-x-0 bottom-0 top-20 z-40 lg:hidden"><button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /><div className="relative h-full w-[260px] bg-white shadow-2xl"><Sidebar navItems={NAV} title="My Tourvaa" subtitle="Traveller Portal" logoIcon={Compass} theme="customer" mobile /></div></div>}

          <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
            <Header title={pageTitle(pathname)} name={user.name} profileImage={user.profile_image} role="Traveller" profileHref="/customer/profile" onMenuClick={() => setSidebarOpen(true)} theme="sky" spacious headerOffset />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </TravelStoreProvider>
  );
}
