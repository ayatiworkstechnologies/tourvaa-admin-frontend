"use client";

import { useAuthContext } from "@/providers/AuthProvider";

const DOCS_CAPTURE_MODE = typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

export function useDashboard() {
  const { dashboard, loading, refreshSession, error } = useAuthContext();
  const docsDashboard = typeof window !== "undefined"
    ? window.localStorage.getItem("tourvaa_docs_dashboard")
    : null;
  const parsedDocsDashboard = docsDashboard ? JSON.parse(docsDashboard) : null;

  return {
    dashboard: dashboard || parsedDocsDashboard,
    loading: DOCS_CAPTURE_MODE || parsedDocsDashboard ? false : loading,
    error,
    refetch: refreshSession,
  };
}
