"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessDenied from "@/components/common/AccessDenied";
import LoadingState from "@/components/common/LoadingState";
import { useAuthContext } from "@/providers/AuthProvider";

type Props = {
  children: React.ReactNode;
  requiredPermission?: string;
};

const DOCS_CAPTURE_MODE = typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

export default function ProtectedRoute({ children, requiredPermission }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isLoggedIn, hasPermission } = useAuthContext();
  const docsMode = typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

  useEffect(() => {
    if (!docsMode && !loading && !isLoggedIn) {
      router.replace(pathname.startsWith("/admin") ? "/admin/login" : "/login");
    }
  }, [docsMode, isLoggedIn, loading, pathname, router]);

  if (DOCS_CAPTURE_MODE) return <>{children}</>;
  if (!docsMode && loading) return <LoadingState label="Restoring session..." fullPage />;
  if (!docsMode && !isLoggedIn) return <LoadingState label="Redirecting to login..." fullPage />;
  if (!docsMode && requiredPermission && !hasPermission(requiredPermission)) return <AccessDenied />;

  return <>{children}</>;
}
