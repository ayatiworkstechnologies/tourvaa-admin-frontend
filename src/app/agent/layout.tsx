"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuCalendarCheck as CalendarCheck, LuCircleDollarSign as CircleDollarSign, LuCompass as Compass, LuLayoutDashboard as LayoutDashboard, LuMessageSquare as MessageSquare, LuReceiptText as ReceiptText, LuUser as User, LuUsers as Users } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ElfsightTranslator from "@/components/public/ElfsightTranslator";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import api from "@/lib/api/client";
import CommissionConsentModal from "@/components/portal/CommissionConsentModal";
import CommissionCheckFailed from "@/components/common/CommissionCheckFailed";
import Loader from "@/components/ui/Loader";
import PortalDataRefresh from "@/components/common/PortalDataRefresh";

const NAV = [
  { href: "/agent/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agent/tours", icon: Compass, label: "Browse Tours", section: "Sales Workspace", permissions: ["tours.view", "view-tours"] },
  { href: "/agent/bookings", icon: CalendarCheck, label: "Bookings", section: "Sales Workspace" },
  { href: "/agent/customers", icon: Users, label: "My Customers", section: "Sales Workspace" },
  { href: "/agent/invoices", icon: ReceiptText, label: "Invoices", section: "Finance" },
  { href: "/agent/payouts", icon: CircleDollarSign, label: "Payouts", section: "Finance" },
  { href: "/agent/messages", icon: MessageSquare, label: "Messages", section: "Communication" },
  { href: "/agent/profile", icon: User, label: "My Profile", placement: "bottom" as const },
];

// The only pages an agent can use before approval.
const UNLOCKED_WHILE_PENDING = ["/agent/dashboard", "/agent/profile"];

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
    if (pathname.startsWith(`${base}/`)) return title;
  }
  return "Agent Portal";
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading, user, dashboard, hasPermission } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState(false);
  const [commissionAccepted, setCommissionAccepted] = useState<boolean | null>(null);
  // Fail closed: a failed consent check blocks the portal with a retry,
  // it is never treated as acceptance.
  const [consentCheckFailed, setConsentCheckFailed] = useState(false);
  const [consentRetry, setConsentRetry] = useState(0);
  // Agent approval (Agent.approval_status). Until "approved" the backend
  // blocks every operational endpoint (auth.permissions.ensure_approved_agent),
  // so the portal only opens the pages that still work: Dashboard and My
  // Profile (where verification documents are uploaded).
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const isApproved = (approvalStatus ?? "").toLowerCase() === "approved";

  useEffect(() => {
    const close = () => setSidebarOpen(false);
    window.addEventListener("tourvaa:close-mobile-sidebar", close);
    return () => window.removeEventListener("tourvaa:close-mobile-sidebar", close);
  }, []);

  useEffect(() => {
    if (loading || !isLoggedIn) { setCommissionAccepted(null); setConsentCheckFailed(false); return; }
    api.get("/agents/me")
      .then((res) => {
        setCommissionAccepted(Boolean(res.data?.data?.commission_accepted_at));
        setApprovalStatus(String(res.data?.data?.approval_status ?? ""));
      })
      .catch(() => setConsentCheckFailed(true));
  }, [loading, isLoggedIn, consentRetry]);

  // A locked page opened by URL (bookmark, old link) goes to the dashboard.
  useEffect(() => {
    if (approvalStatus === null || isApproved) return;
    if (!UNLOCKED_WHILE_PENDING.some((base) => pathname === base || pathname.startsWith(`${base}/`))) {
      router.replace("/agent/dashboard");
    }
  }, [approvalStatus, isApproved, pathname, router]);

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
    return <Loader label="Loading agent portal..." fullScreen />;
  }

  if (!isLoggedIn || !user) return null;

  if (consentCheckFailed) {
    return <CommissionCheckFailed onRetry={() => { setConsentCheckFailed(false); setConsentRetry((n) => n + 1); }} />;
  }

  if (commissionAccepted === null) {
    return <Loader label="Preparing your agent workspace..." fullScreen />;
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

  // Preserve every Agent navigation item, but render it in the shared
  // Supplier-style workspace shell. Agents deliberately have no Vehicles tab.
  const navItems = NAV
    .filter((item) => !("permissions" in item) || !item.permissions || item.permissions.some((permission) => hasPermission(permission)))
    .map((item) => ({ ...item, locked: !isApproved && !UNLOCKED_WHILE_PENDING.includes(item.href) }));
  const pageTitle = getTitle(pathname);

  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <div className="agent-portal flex min-h-screen bg-dash-bg" style={portalThemeStyles.agent}>
          <PortalDataRefresh />
          <ElfsightTranslator />
          <Sidebar
            navItems={navItems}
            title="Tourvaa"
            subtitle="Agent"
            logoIcon={Compass}
            theme="agent"
            mobile={false}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            onLockedItemClick={() => setApprovalNotice(true)}
          />

          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
              <div className="relative h-full w-[260px] bg-white shadow-2xl">
                <Sidebar navItems={navItems} title="Tourvaa" subtitle="Agent" logoIcon={Compass} theme="agent" mobile collapsed={false} onToggleCollapse={() => {}} onLockedItemClick={() => setApprovalNotice(true)} />
              </div>
            </div>
          )}

          <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}`}>
            <Header
              title={pageTitle}
              name={user.name}
              profileImage={user.profile_image}
              role="Travel Agent"
              profileHref="/agent/profile"
              onMenuClick={() => setSidebarOpen(true)}
              theme="sky"
            />
            <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">{children}</main>
          </div>
          {approvalNotice && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true" aria-labelledby="agent-approval-title">
              <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 id="agent-approval-title" className="text-lg font-black text-slate-950">Admin approval required</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Upload your verification documents in My Profile. Other sections unlock once Tourvaa approves your agent account.</p>
                <button type="button" onClick={() => setApprovalNotice(false)} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Understood</button>
              </section>
            </div>
          )}
        </div>
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
