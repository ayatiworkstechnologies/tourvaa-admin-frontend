"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getDashboardPath } from "@/lib/dashboardPath";
import { getApiErrorMessage } from "@/lib/error-handler";
import { normalizeEmail } from "@/lib/validators";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type LoginPayload = {
  email: string;
  password: string;
};

export function useAuth() {
  const router = useRouter();
  const auth = useAuthContext();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: normalizeEmail(payload.email),
        password: payload.password,
      });
      const data = response.data.data;

      await auth.loginWithToken(data.access_token);

      const roleSlug = data.user?.role?.slug ?? "";
      router.push(getDashboardPath(roleSlug));
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirectTo?: string) => {
    auth.logout(redirectTo);
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

