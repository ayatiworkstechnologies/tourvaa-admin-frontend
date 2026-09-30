"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuMenu as Menu } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import CustomerSidebar from "@/components/customer/CustomerSidebar";
import CustomerPortalHeader from "@/components/customer/CustomerPortalHeader";
import ElfsightTranslator from "@/components/public/ElfsightTranslator";
import { portalThemeStyles } from "@/lib/constants/portalThemes";
import { TravelStoreProvider } from "@/providers/TravelStoreProvider";
import { PublicSettingsProvider } from "@/providers/PublicSettingsProvider";
import Loader from "@/components/ui/Loader";

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
        <div style={portalThemeStyles.customer}><Loader label="Loading your trips..." fullScreen /></div>
      </TravelStoreProvider>
    );
  }

  if (!isLoggedIn || !user) return null;

  return (
    <PublicSettingsProvider>
      <TravelStoreProvider>
        <div className="customer-public-portal min-h-screen bg-[#F8FAFC]">
        <ElfsightTranslator />
        <CustomerPortalHeader showNotifications />

        <div className="pt-20 sm:pt-[84px]">
          <CustomerSidebar />

          {sidebarOpen && (
            <div className="fixed inset-x-0 bottom-0 top-20 z-50 lg:hidden">
              <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />
              <div className="relative h-full w-[min(86vw,320px)] rounded-r-3xl bg-[#F8FBFF] p-3 shadow-2xl sm:p-4">
                <CustomerSidebar mobile onNavigate={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          <div className="flex min-h-[calc(100vh-84px)] min-w-0 flex-col lg:ml-[250px]">
            <div className="sticky top-20 z-30 flex h-14 items-center gap-3 border-b border-[#DDE7F4] bg-white/95 px-3 shadow-sm backdrop-blur-md sm:px-6 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE7F4] bg-[#F8FBFF] text-[#15315A]"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#2475E8]">Traveller Portal</p>
                <p className="text-sm font-black text-[#0C2043]">My Tourvaa</p>
              </div>
            </div>
            <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
        </div>
      </TravelStoreProvider>
    </PublicSettingsProvider>
  );
}
