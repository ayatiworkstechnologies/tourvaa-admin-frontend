"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import {
  DashboardStats,
  MenuItem,
  PendingApproval,
  Permission,
} from "@/types/auth";

type DashboardData = {
  user: {
    id: number;
    name: string;
    email: string;
    profile_image?: string;
    role: {
      id: number;
      name: string;
      slug: string;
    };
  };
  permissions: Permission[];
  menus: MenuItem[];
  stats: DashboardStats;
  pending_approvals: PendingApproval[];
};

export function useDashboard() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await api.get("/dashboard/me");
      setDashboard(response.data.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        removeToken();
        localStorage.removeItem("tourvaa_user");
        router.replace("/login");
        return;
      }

      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Dashboard data is fetched once when the protected page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    refetch: fetchDashboard,
  };
}
