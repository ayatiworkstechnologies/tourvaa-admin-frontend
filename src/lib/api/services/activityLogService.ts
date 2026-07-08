import api from "@/lib/api/client";

export type ActivityLog = {
  id: number;
  actor_user_id?: number | null;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  ip_address?: string | null;
  created_at?: string | null;
};

export type ActivityLogFilters = {
  page?: number;
  limit?: number;
  action?: string;
  entity_type?: string;
  actor_user_id?: number;
};

export type PaginatedActivityLogs = {
  data: ActivityLog[];
  items: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export async function getActivityLogs(filters: ActivityLogFilters = {}) {
  const response = await api.get<PaginatedActivityLogs>("/activity-logs/", { params: filters });
  return response.data;
}


