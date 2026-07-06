"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getDashboardPath } from "@/lib/dashboardPath";
import { clearSession, getStoredTokenSafe, setToken as storeToken } from "@/lib/session";
import { AuthUser, DashboardStats, MenuItem, PendingApproval, Permission } from "@/types/auth";

type DashboardData = {
  user: AuthUser;
  permissions: Permission[];
  menus: MenuItem[];
  sidebar_menu: MenuItem[];
  allowed_modules: string[];
  dashboard_type: string;
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
  logout: (redirectTo?: string) => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/admin/login"];

// Role-based portal paths are self-guarded -- exclude from global redirect
const portalPaths = ["/customer", "/agent", "/supplier", "/affiliate"];

const DOCS_CAPTURE_MODE = typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

const docsCaptureDashboard = {
  user: {
    id: 1,
    name: "Super Admin",
    email: "admin@tourvaa.com",
    user_type: "admin",
    role: { id: 1, name: "Super Admin", slug: "super-admin" },
    approval_status: "approved",
  },
  permissions: [],
  menus: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    { label: "Users", href: "/admin/users", icon: "Users" },
    { label: "Roles", href: "/admin/roles", icon: "Shield" },
    { label: "Customers", href: "/admin/customers", icon: "UserRound" },
    { label: "Suppliers", href: "/admin/suppliers", icon: "Briefcase" },
    { label: "Agents", href: "/admin/agents", icon: "Handshake" },
    { label: "Affiliates", href: "/admin/affiliates", icon: "Share2" },
    { label: "Tours", href: "/admin/tours", icon: "Map" },
    { label: "Bookings", href: "/admin/bookings", icon: "CalendarCheck" },
    { label: "Payments", href: "/admin/payments", icon: "CreditCard" },
    { label: "Invoices", href: "/admin/invoices", icon: "Receipt" },
    { label: "Reports", href: "/admin/reports", icon: "BarChart3" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ],
  sidebar_menu: [],
  allowed_modules: [],
  dashboard_type: "admin",
  stats: {},
  pending_approvals: [],
} as DashboardData;

function isPublicRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/tours") ||
    pathname.startsWith("/blogs") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/cookie-policy") ||
    pathname.startsWith("/cancellation-policy") ||
    pathname.startsWith("/accessibility") ||
    portalPaths.some((p) => pathname.startsWith(p)) ||
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

function permissionAliases(permission: string) {
  const aliases = new Set([permission]);
  const moduleAliases: Record<string, string[]> = {
    activity_logs: ["activity-logs"],
    "activity-logs": ["activity_logs"],
    email_templates: ["email"],
    email: ["email_templates"],
  };
  const dottedToLegacyAction: Record<string, string> = {
    view: "view",
    create: "create",
    edit: "update",
    delete: "delete",
  };
  const legacyToDottedAction: Record<string, string> = {
    view: "view",
    create: "create",
    update: "edit",
    delete: "delete",
  };

  const addModuleAliases = (action: string, moduleName: string, format: "dotted" | "legacy") => {
    const modules = [moduleName, ...(moduleAliases[moduleName] || [])];
    modules.forEach((name) => {
      aliases.add(format === "dotted" ? `${name}.${action}` : `${action}-${name}`);
    });
  };

  if (permission.includes(".")) {
    const [moduleName, action] = permission.split(".");
    const legacyAction = dottedToLegacyAction[action];

    if (moduleName && action) addModuleAliases(action, moduleName, "dotted");
    if (moduleName && legacyAction) addModuleAliases(legacyAction, moduleName, "legacy");
  }

  if (permission.includes("-")) {
    const [action, ...moduleParts] = permission.split("-");
    const moduleName = moduleParts.join("-");
    const dottedAction = legacyToDottedAction[action];

    if (moduleName) addModuleAliases(action, moduleName, "legacy");
    if (moduleName && dottedAction) addModuleAliases(dottedAction, moduleName, "dotted");
  }

  return aliases;
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const docsInitialDashboard = (() => {
    if (typeof window === "undefined") return DOCS_CAPTURE_MODE ? docsCaptureDashboard : null;
    const docsDashboard = window.localStorage.getItem("tourvaa_docs_dashboard");
    if (!docsDashboard) return DOCS_CAPTURE_MODE ? docsCaptureDashboard : null;
    try {
      return JSON.parse(docsDashboard) as DashboardData;
    } catch {
      window.localStorage.removeItem("tourvaa_docs_dashboard");
      return null;
    }
  })();
  const [token, setTokenState] = useState<string | null>(() => docsInitialDashboard ? (getStoredTokenSafe() || "docs-capture-token") : null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(() => docsInitialDashboard);
  const [loading, setLoading] = useState(() => DOCS_CAPTURE_MODE ? false : !docsInitialDashboard);
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
      clearSession();
      setTokenState(null);
      setDashboard(null);
      setError("Could not restore session.");
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      setLoading(true);

      const docsDashboard = typeof window !== "undefined"
        ? window.localStorage.getItem("tourvaa_docs_dashboard")
        : null;

      if (docsDashboard) {
        try {
          const parsed = JSON.parse(docsDashboard) as DashboardData;
          const docsToken = getStoredTokenSafe();
          if (active) {
            setTokenState(docsToken);
            setDashboard(parsed);
            setError("");
            setLoading(false);
          }
          return;
        } catch {
          window.localStorage.removeItem("tourvaa_docs_dashboard");
        }
      }

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

    const isPublic = isPublicRoute(pathname);

    if (!token && !isPublic) {
      router.replace("/login");
      return;
    }

    if (token && dashboard && (pathname === "/login" || pathname === "/admin/login")) {
      const roleSlug = dashboard.user?.role?.slug ?? "";
      router.replace(getDashboardPath(roleSlug));
    }
  }, [loading, pathname, router, token, dashboard]);

  const loginWithToken = useCallback(
    async (newToken: string) => {
      storeToken(newToken);
      setTokenState(newToken);
      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback((redirectTo = "/login") => {
    clearSession();
    setTokenState(null);
    setDashboard(null);
    router.push(redirectTo);
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => {
      const requestedPermissions = permissionAliases(permission);
      return Boolean(
        dashboard?.permissions?.some((item) =>
          Array.from(permissionAliases(item.slug)).some((alias) => requestedPermissions.has(alias))
        )
      );
    },
    [dashboard]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      dashboard: dashboard || (DOCS_CAPTURE_MODE ? docsCaptureDashboard : null),
      user: dashboard?.user || (DOCS_CAPTURE_MODE ? docsCaptureDashboard.user : null),
      loading: DOCS_CAPTURE_MODE ? false : loading,
      error,
      isLoggedIn: DOCS_CAPTURE_MODE ? true : Boolean(token),
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





