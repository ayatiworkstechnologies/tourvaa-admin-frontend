"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccessDenied from "@/components/common/AccessDenied";
import LoadingState from "@/components/common/LoadingState";
import { useAuthContext } from "@/providers/AuthProvider";

type Props = {
  children: React.ReactNode;
  requiredPermission?: string;
};

export default function ProtectedRoute({ children, requiredPermission }: Props) {
  const router = useRouter();
  const { loading, isLoggedIn, hasPermission } = useAuthContext();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, loading, router]);

  if (loading) return <LoadingState label="Restoring session..." fullPage />;
  if (!isLoggedIn) return <LoadingState label="Redirecting to login..." fullPage />;
  if (requiredPermission && !hasPermission(requiredPermission)) return <AccessDenied />;

  return <>{children}</>;
}
