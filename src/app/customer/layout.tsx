"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuCalendarCheck as CalendarCheck, LuCompass as Compass, LuCreditCard as CreditCard, LuFileText as FileText, LuHeadphones as Headphones, LuLayoutDashboard as LayoutDashboard, LuMapPinned as MapPinned, LuReceiptText as ReceiptText, LuUser as User, LuUsersRound as UsersRound } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { portalThemeStyles } from "@/lib/constants/portalThemes";

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

const PAGE_TITLES: Record<string, string> = {
  "/customer/dashboard": "Dashboard",
  "/tours": "Browse Tours",
  "/customer/bookings": "My Bookings",
  "/customer/payments": "Payments",
  "/customer/invoices": "Invoices",
  "/customer/travellers": "Travellers",
  "/customer/cancellations": "Cancellations",
  "/customer/profile": "My Profile",
  "/customer/support": "Support",
};

function getTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [base, title] of Object.entries(PAGE_TITLES)) {
    if (base !== "/tours" && pathname.startsWith(base + "/")) return title;
  }
  return "My Account";
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
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow ring-1 ring-dash-border">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-brand border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  const pageTitle = getTitle(pathname);

  return (
    <div className="flex min-h-screen bg-dash-bg" style={portalThemeStyles.customer}>
      <Sidebar
        navItems={NAV}
        title="Tourvaa"
        subtitle="Traveller"
        logoIcon={Compass}
        theme="customer"
        mobile={false}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[260px] bg-white shadow-2xl">
            <Sidebar navItems={NAV} title="Tourvaa" subtitle="Traveller" logoIcon={Compass} theme="customer" mobile={true} collapsed={false} onToggleCollapse={() => {}} />
          </div>
        </div>
      )}

      <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
        <Header
          title={pageTitle}
          name={user.name}
          profileImage={user.profile_image}
          role="Traveller"
          profileHref="/customer/profile"
          onMenuClick={() => setSidebarOpen(true)}
          theme="teal"
        />

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
