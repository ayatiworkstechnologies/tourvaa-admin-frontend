import api from "@/lib/api/client";
import { PaginatedResponse } from "@/lib/api/services/operationsService";

export type CmsRecord = {
  id: number;
  [key: string]: string | number | boolean | null | undefined | number[];
};

export async function listCms(endpoint: string, params: Record<string, string | number> = {}) {
  const response = await api.get<PaginatedResponse<CmsRecord>>(endpoint, { params });
  return response.data;
}

export async function getCms(endpoint: string, id: string | number) {
  const response = await api.get<{ data: CmsRecord }>(`${endpoint}/${id}`);
  return response.data.data;
}

export async function createCms(endpoint: string, payload: Record<string, unknown>) {
  const response = await api.post<{ data: CmsRecord }>(endpoint, payload);
  return response.data.data;
}

export async function updateCms(endpoint: string, id: string | number, payload: Record<string, unknown>) {
  const response = await api.put<{ data: CmsRecord }>(`${endpoint}/${id}`, payload);
  return response.data.data;
}

export async function updateCmsStatus(endpoint: string, id: string | number, status: string) {
  const response = await api.patch<{ data: CmsRecord }>(`${endpoint}/${id}/status`, { status });
  return response.data.data;
}
