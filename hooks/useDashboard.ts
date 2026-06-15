"use client";

import { useAuthContext } from "@/providers/AuthProvider";

export function useDashboard() {
  const { dashboard, loading, refreshSession, error } = useAuthContext();

  return {
    dashboard,
    loading,
    error,
    refetch: refreshSession,
  };
}
