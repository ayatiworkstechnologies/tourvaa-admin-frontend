"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import CustomerPortalHeader from "@/components/customer/CustomerPortalHeader";
import CustomerSidebar from "@/components/customer/CustomerSidebar";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, loading, user, dashboard } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="flex min-h-screen items-center justify-center bg-[#F7FAFF]" style={portalThemeStyles.customer}>
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-dash-muted shadow-lg ring-1 ring-dash-border">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-dash-brand border-t-transparent" />
              Loading your trips...
            </div>
        </div>
      </TravelStoreProvider>
    );
  }

  if (!isLoggedIn || !user) return null;

  return (
    <TravelStoreProvider>
      <div className="customer-public-portal min-h-screen bg-dash-bg" style={portalThemeStyles.customer}>
        <CustomerSidebar />

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />
            <div className="relative h-full w-[250px] bg-white shadow-2xl">
              <CustomerSidebar mobile onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-h-screen min-w-0 flex-col lg:ml-[250px]">
          <CustomerPortalHeader name={user.name} profileImage={user.profile_image} onMenuClick={() => setSidebarOpen(true)} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </TravelStoreProvider>
  );
}
