import api from "@/lib/api/client";

type ApiDataResponse<T> = { status: string; data: T };

export type DashboardSummaryParams = {
  start_date?: string;
  end_date?: string;
  country_id?: number;
  supplier_id?: number;
  agent_id?: number;
  booking_status?: string;
};

export async function getDashboardMe() {
  const res = await api.get<ApiDataResponse<Record<string, unknown>>>("/dashboard/me");
  return res.data.data;
}

export async function getDashboardSummary(params: DashboardSummaryParams = {}) {
  const res = await api.get<ApiDataResponse<Record<string, unknown>>>("/dashboard/summary", { params });
  return res.data.data;
}

export async function getDashboardCharts(params: DashboardSummaryParams = {}) {
  const res = await api.get<ApiDataResponse<Record<string, unknown>>>("/dashboard/charts", { params });
  return res.data.data;
}

export async function getDashboardRecentActivities(params: DashboardSummaryParams = {}) {
  const res = await api.get<ApiDataResponse<Record<string, unknown>[]>>("/dashboard/recent-activities", { params });
  return res.data.data;
}

export async function getDashboardAlerts(params: DashboardSummaryParams = {}) {
  const res = await api.get<ApiDataResponse<Record<string, unknown>[]>>("/dashboard/alerts", { params });
  return res.data.data;
}
