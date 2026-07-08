import api from "@/lib/api/client";

export type UserSession = {
  id: number;
  user_id: number;
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


