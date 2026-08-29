"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuCircleDollarSign as CircleDollarSign, LuBriefcaseBusiness as BriefcaseBusiness, LuCalendarCheck as CalendarCheck, LuCompass as Compass, LuLayoutDashboard as LayoutDashboard, LuMessageSquare as MessageSquare, LuReceiptText as ReceiptText, LuUser as User, LuUsers as Users } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import api from "@/lib/api/client";
import CommissionConsentModal from "@/components/portal/CommissionConsentModal";

const NAV = [
  { href: "/agent/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agent/tours", icon: Compass, label: "Browse Tours", section: "Sales Workspace" },
  { href: "/agent/bookings", icon: CalendarCheck, label: "Bookings", section: "Sales Workspace" },
  { href: "/agent/customers", icon: Users, label: "My Customers", section: "Sales Workspace" },
  { href: "/agent/invoices", icon: ReceiptText, label: "Invoices", section: "Finance" },
  { href: "/agent/payouts", icon: CircleDollarSign, label: "Payouts", section: "Finance" },
  { href: "/agent/messages", icon: MessageSquare, label: "Messages", section: "Communication" },
  { href: "/agent/profile", icon: User, label: "My Profile", placement: "bottom" as const },
];

const PAGE_TITLES: Record<string, string> = {
  "/agent/dashboard": "Dashboard",
  "/agent/tours": "Browse Tours",
  "/agent/bookings": "Bookings",
  "/agent/customers": "My Customers",
  "/agent/invoices": "Invoices",
  "/agent/payouts": "Payouts",
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
  const { isLoggedIn, loading, user, dashboard } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commissionAccepted, setCommissionAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const close = () => setSidebarOpen(false);
    window.addEventListener("tourvaa:close-mobile-sidebar", close);
    return () => window.removeEventListener("tourvaa:close-mobile-sidebar", close);
  }, []);

  useEffect(() => {
    if (loading || !isLoggedIn) { setCommissionAccepted(null); return; }
    api.get("/agents/me")
      .then((res) => setCommissionAccepted(Boolean(res.data?.data?.commission_accepted_at)))
      .catch(() => setCommissionAccepted(true));
  }, [loading, isLoggedIn]);

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
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow ring-1 ring-dash-border">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-brand border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  if (commissionAccepted === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow ring-1 ring-dash-border">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-brand border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (!commissionAccepted) {
    return (
      <div className="min-h-screen bg-dash-bg" style={portalThemeStyles.agent}>
        <CommissionConsentModal
          settingsKey="agent_default_commission_percentage"
          acceptEndpoint="/agents/me/accept-commission"
          title="Your Default Commission from Tourvaa"
          description="This is the commission Tourvaa pays you on every booking you make. You must agree to this rate before you can upload verification documents or continue."
          onAccepted={() => setCommissionAccepted(true)}
        />
      </div>
    );
  }

  const pageTitle = getTitle(pathname);

  return (
    <div className="agent-portal flex min-h-screen bg-dash-bg" style={portalThemeStyles.agent}>
      <Sidebar
        navItems={NAV}
        title="Tourvaa"
        subtitle="Agent"
        logoIcon={BriefcaseBusiness}
        theme="agent"
        mobile={false}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[260px] bg-white shadow-2xl">
            <Sidebar navItems={NAV} title="Tourvaa" subtitle="Agent" logoIcon={BriefcaseBusiness} theme="agent" mobile={true} collapsed={false} onToggleCollapse={() => {}} />
          </div>
        </div>
      )}
      
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
        <Header
          title={pageTitle}
          name={user.name}
          profileImage={user.profile_image}
          role="Agent / Reseller"
          profileHref="/agent/profile"
          onMenuClick={() => setSidebarOpen(true)}
          theme="navy"
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
