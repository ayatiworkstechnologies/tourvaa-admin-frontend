"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { clearSession, getStoredTokenSafe, setToken as storeToken } from "@/lib/session";
import { AuthUser, DashboardStats, MenuItem, PendingApproval, Permission } from "@/types/auth";

type DashboardData = {
  user: AuthUser;
  permissions: Permission[];
  menus: MenuItem[];
  stats: DashboardStats;
  pending_approvals: PendingApproval[];
};

type AuthContextValue = {
  token: string | null;
  dashboard: DashboardData | null;
  user: AuthUser | null;
  loading: boolean;
  error: string;
  isLoggedIn: boolean;
  loginWithToken: (token: string) => Promise<void>;
  refreshSession: () => Promise<DashboardData | null>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

function normalizePermission(permission: string) {
  const [module, action] = permission.split(".");
  if (!module || !action) return permission;
  const moduleMap: Record<string, string> = {
    email_templates: "email",
  };
  const actionMap: Record<string, string> = {
    view: "view",
    create: "create",
    update: "update",
    delete: "delete",
  };
  return `${actionMap[action] || action}-${moduleMap[module] || module}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setTokenState] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async () => {
    const currentToken = getStoredTokenSafe();

    if (!currentToken) {
      setTokenState(null);
      setDashboard(null);
      return null;
    }

    try {
      const response = await api.get("/dashboard/me");
      setTokenState(currentToken);
      setDashboard(response.data.data);
      setError("");
      return response.data.data as DashboardData;
    } catch {
      setDashboard(null);
      setError("Could not restore session.");
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      setLoading(true);
      await refreshSession();
      if (active) setLoading(false);
    };

    restore();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

    if (!token && !isPublic) {
      router.replace("/login");
      return;
    }

    if (token && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [loading, pathname, router, token]);

  const loginWithToken = useCallback(
    async (newToken: string) => {
      storeToken(newToken);
      setTokenState(newToken);
      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setTokenState(null);
    setDashboard(null);
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => {
      const slug = normalizePermission(permission);
      return Boolean(
        dashboard?.permissions?.some((item) => item.slug === permission || item.slug === slug)
      );
    },
    [dashboard]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      dashboard,
      user: dashboard?.user || null,
      loading,
      error,
      isLoggedIn: Boolean(token),
      loginWithToken,
      refreshSession,
      logout,
      hasPermission,
    }),
    [dashboard, error, hasPermission, loading, loginWithToken, logout, refreshSession, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used inside AuthProvider");
  return context;
}
