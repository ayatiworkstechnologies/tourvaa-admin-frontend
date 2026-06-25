import api from "@/lib/api";

export type DashboardFilters = {
  start_date?: string;
  end_date?: string;
  country_id?: number;
  supplier_id?: number;
  agent_id?: number;
};

function buildQuery(filters?: DashboardFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.country_id) params.set("country_id", String(filters.country_id));
  if (filters.supplier_id) params.set("supplier_id", String(filters.supplier_id));
  if (filters.agent_id) params.set("agent_id", String(filters.agent_id));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getDashboardMe() {
  const resp = await api.get("/dashboard/me");
  return resp.data?.data ?? resp.data;
}

export async function getDashboardSummary(filters?: DashboardFilters) {
  const resp = await api.get(`/dashboard/summary${buildQuery(filters)}`);
  return resp.data?.data ?? resp.data;
}

export async function getDashboardCharts(filters?: DashboardFilters) {
  const resp = await api.get(`/dashboard/charts${buildQuery(filters)}`);
  return resp.data?.data ?? resp.data;
}

export async function getDashboardRecentActivities(filters?: DashboardFilters) {
  const resp = await api.get(`/dashboard/recent-activities${buildQuery(filters)}`);
  return resp.data?.data ?? resp.data;
}

export async function getDashboardAlerts(filters?: DashboardFilters) {
  const resp = await api.get(`/dashboard/alerts${buildQuery(filters)}`);
  return resp.data?.data ?? resp.data;
}


