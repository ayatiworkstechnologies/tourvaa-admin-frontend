import api from "@/lib/api/client";

export type UserSession = {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  session_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  status: string;
  created_at?: string | null;
  last_seen_at?: string | null;
};

export type SessionFilters = {
  page?: number;
  limit?: number;
  user_id?: number;
  status?: string;
};

export type PaginatedSessions = {
  data: UserSession[];
  items: UserSession[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

type ApiDataResponse<T> = {
  status: string;
  data: T;
};

export async function getSessions(filters: SessionFilters = {}) {
  const response = await api.get<PaginatedSessions>("/sessions/", { params: filters });
  return response.data;
}

export async function revokeSession(sessionId: number | string) {
  const response = await api.post<ApiDataResponse<UserSession>>(`/sessions/${sessionId}/revoke`);
  return response.data.data;
}

export async function forceLogoutUser(userId: number | string) {
  const response = await api.post<ApiDataResponse<{ user_id: number; revoked: boolean }>>(`/sessions/users/${userId}/force-logout`);
  return response.data.data;
}

export type LoginHistoryEntry = {
  id: number;
  user_id: number | null;
  email: string;
  status: string;
  failure_reason?: string | null;
  client_type: string;
  device_name?: string | null;
  ip_address?: string | null;
  created_at?: string | null;
};

export type PaginatedLoginHistory = {
  items: LoginHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export async function getLoginHistory(filters: { page?: number; limit?: number; status?: string } = {}) {
  const response = await api.get<PaginatedLoginHistory>("/sessions/login-history", { params: filters });
  return response.data;
}


