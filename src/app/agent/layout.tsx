"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuCircleDollarSign as CircleDollarSign, LuCalendarCheck as CalendarCheck, LuCompass as Compass, LuLayoutDashboard as LayoutDashboard, LuMenu as Menu, LuMessageSquare as MessageSquare, LuReceiptText as ReceiptText, LuUser as User, LuUsers as Users } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import CustomerSidebar, { type PortalNavItem } from "@/components/customer/CustomerSidebar";
import CustomerPortalHeader, { type PortalHeaderLink } from "@/components/customer/CustomerPortalHeader";
import ElfsightTranslator from "@/components/public/ElfsightTranslator";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import api from "@/lib/api/client";
import CommissionConsentModal from "@/components/portal/CommissionConsentModal";
import CommissionCheckFailed from "@/components/common/CommissionCheckFailed";
import Loader from "@/components/ui/Loader";

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

// Quick links in the top bar (the customer portal shows Wishlist/Compare here).
const HEADER_LINKS: PortalHeaderLink[] = [
  { label: "Tours", href: "/agent/tours", icon: Compass },
  { label: "Bookings", href: "/agent/bookings", icon: CalendarCheck },
  { label: "Messages", href: "/agent/messages", icon: MessageSquare },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading, user, dashboard, hasPermission } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const visibleNav: PortalNavItem[] = NAV.filter((item) => !("permissions" in item) || !item.permissions || item.permissions.some((permission) => hasPermission(permission)))
    .map(({ href, icon, label }) => ({ href, icon, label, locked: !isApproved && !UNLOCKED_WHILE_PENDING.includes(href) }));
  const sidebarProps = isApproved
    ? { navigation: visibleNav, badgeLabel: "Travel Agent" }
    : {
        navigation: visibleNav,
        badgeLabel: "Under Review",
        badgeTone: "pending" as const,
        notice: <><strong className="block font-bold">Account under review</strong>Upload your verification documents in My Profile. Other sections unlock once Tourvaa approves your account.</>,
      };

  // Same public-site shell as the customer portal (see app/customer/layout.tsx):
  // site header on top, profile card + links on the left, site footer below.
  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <div className="agent-portal min-h-screen bg-[#F8FAFC]" style={portalThemeStyles.agent}>
          <ElfsightTranslator />
          <CustomerPortalHeader quickLinks={isApproved ? HEADER_LINKS : []} profileHref="/agent/profile" showNotifications />

          <div className="pt-20 sm:pt-[84px]">
            <CustomerSidebar {...sidebarProps} />

            {sidebarOpen && (
              <div className="fixed inset-x-0 bottom-0 top-20 z-50 lg:hidden">
                <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />
                <div className="relative h-full w-[240px] bg-white shadow-2xl p-4">
                  <CustomerSidebar mobile {...sidebarProps} onNavigate={() => setSidebarOpen(false)} />
                </div>
              </div>
            )}

            <div className="flex min-h-[calc(100vh-84px)] min-w-0 flex-col lg:ml-[250px]">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                className="fixed left-4 top-[88px] z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-[#DDE7F4] bg-white text-[#15315A] shadow-sm sm:top-[92px] lg:hidden"
              >
                <Menu size={20} />
              </button>
              {/* No site footer in the agent workspace (the customer portal keeps it). */}
              <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
        </div>
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
