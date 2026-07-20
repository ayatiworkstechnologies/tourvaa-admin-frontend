"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import LoadingState from "@/components/common/LoadingState";
import { getDashboardPath } from "@/lib/utils/dashboardPath";
import { useAuthContext } from "@/providers/AuthProvider";

const ADMIN_DASHBOARD_TYPES = new Set(["admin", "super_admin", "sub_admin"]);

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dashboard, loading, isLoggedIn } = useAuthContext();
  const docsMode = typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));
  const isAdminLogin = pathname === "/admin/login";
  const isWrongPortal = Boolean(
    isLoggedIn && dashboard && !ADMIN_DASHBOARD_TYPES.has(dashboard.dashboard_type),
  );

  useEffect(() => {
    if (!docsMode && !loading && !isLoggedIn && !isAdminLogin) {
      router.replace("/login");
      return;
    }
    if (!docsMode && isWrongPortal && dashboard) {
      router.replace(getDashboardPath(dashboard.user.role?.slug ?? ""));
    }
  }, [dashboard, docsMode, isAdminLogin, isLoggedIn, isWrongPortal, loading, router]);

  if (docsMode || isAdminLogin) return <>{children}</>;
  if (loading) return <LoadingState label="Checking admin access..." fullPage />;
  if (!isLoggedIn) return <LoadingState label="Redirecting to login..." fullPage />;
  if (isWrongPortal) return <LoadingState label="Redirecting to your portal..." fullPage />;

  return <>{children}</>;
}
