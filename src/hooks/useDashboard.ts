"use client";

import { useAuthContext } from "@/providers/AuthProvider";

const DOCS_CAPTURE_ENABLED = process.env.NODE_ENV !== "production";
const DOCS_CAPTURE_MODE = DOCS_CAPTURE_ENABLED && typeof window !== "undefined" && Boolean(window.localStorage.getItem("tourvaa_docs_dashboard"));

export function useDashboard() {
  const { dashboard, loading, refreshSession, error } = useAuthContext();
  const docsDashboard = DOCS_CAPTURE_ENABLED && typeof window !== "undefined"
    ? window.localStorage.getItem("tourvaa_docs_dashboard")
    : null;
  let parsedDocsDashboard = null;
  if (docsDashboard) {
    try {
      parsedDocsDashboard = JSON.parse(docsDashboard);
    } catch {
      parsedDocsDashboard = null;
    }
  }

  return {
    dashboard: dashboard || parsedDocsDashboard,
    loading: DOCS_CAPTURE_MODE || parsedDocsDashboard ? false : loading,
    error,
    refetch: refreshSession,
  };
}
