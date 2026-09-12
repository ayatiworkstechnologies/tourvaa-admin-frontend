"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessDenied from "@/components/common/AccessDenied";
import LoadingState from "@/components/common/LoadingState";
import { useAuthContext } from "@/providers/AuthProvider";

type Props = {
  children: React.ReactNode;
  // A route can be reachable via more than one permission (e.g. the CMS nav
  // item shows for either website_cms.view or settings.view) - an array is
  // "any of these", so the guard here matches whatever made the link/button
  // to this route visible in the first place, instead of only recognizing
  // one of the permissions that actually grants access and denying the rest.
  requiredPermission?: string | string[];
};

const DOCS_CAPTURE_ENABLED = process.env.NODE_ENV !== "production";
const DOCS_CAPTURE_MODE = DOCS_CAPTURE_ENABLED && typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

export default function ProtectedRoute({ children, requiredPermission }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isLoggedIn, hasPermission } = useAuthContext();
  const docsMode = DOCS_CAPTURE_ENABLED && typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

  useEffect(() => {
    if (!docsMode && !loading && !isLoggedIn) {
      router.replace(pathname.startsWith("/admin") ? "/admin/login" : "/login");
    }
  }, [docsMode, isLoggedIn, loading, pathname, router]);

  if (DOCS_CAPTURE_MODE) return <>{children}</>;
  if (!docsMode && loading) return <LoadingState label="Restoring session..." fullPage />;
  if (!docsMode && !isLoggedIn) return <LoadingState label="Redirecting to login..." fullPage />;
  const requiredPermissions = requiredPermission
    ? (Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission])
    : [];
  if (!docsMode && requiredPermissions.length > 0 && !requiredPermissions.some((permission) => hasPermission(permission))) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
