"use client";

import { useState } from "react";
import api from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { normalizeEmail } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginOptions = {
  requiredDashboardTypes?: string[];
  unauthorizedMessage?: string;
  unauthorizedRedirect?: string;
};

export function useAuth() {
  const auth = useAuthContext();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (payload: LoginPayload, options?: LoginOptions) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: normalizeEmail(payload.email),
        password: payload.password,
        client_type: "web-cookie",
      });
      void response.data;
      const dashboard = await auth.loginWithToken();
      if (
        dashboard &&
        options?.requiredDashboardTypes &&
        !options.requiredDashboardTypes.includes(dashboard.dashboard_type)
      ) {
        const message = options.unauthorizedMessage ?? "This account cannot access this login.";
        auth.logout(options.unauthorizedRedirect);
        setError(message);
        toast.error(message);
      }
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.logout();
  };

  return {
    login,
    logout,
    loading,
    error,
    user: auth.user,
    dashboard: auth.dashboard,
    isLoggedIn: auth.isLoggedIn,
    sessionLoading: auth.loading,
    refreshSession: auth.refreshSession,
  };
}

