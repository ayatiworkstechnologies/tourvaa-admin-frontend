import api from "@/lib/api/client";

export type ReviewRecord = {
  id: number;
  code?: string;
  name?: string;
  supplier_code?: string;
  supplier_name?: string;
  agent_code?: string;
  agent_name?: string;
  affiliate_code?: string;
  business_type?: string;
  email?: string;
  phone?: string;
  type?: string;
  supplier_type?: string;
  agent_type?: string;
  country_name?: string;
  city_name?: string;
  years_in_operation?: number;
  status: string;
  approval_status: string;
  rejection_reason?: string | null;
  admin_comments?: string | null;
  pending_requirements?: string | null;
  markup_type?: string | null;
  markup_value?: number;
  discount_type?: string | null;
  discount_value?: number;
  commission_request_type?: string | null;
  commission_request_value?: number | null;
  commission_request_status?: string | null;
  commission_requested_at?: string | null;
  commission_reviewed_at?: string | null;
  api_link?: string;
  number_of_tours?: number;
  completed_tours?: number;
  cancelled_tours?: number;
  upcoming_tours?: number;
  total_bookings?: number;
  completed_bookings?: number;
  cancelled_bookings?: number;
  upcoming_bookings?: number;
  contacts?: unknown[];
  vehicles?: unknown[];
  documents?: unknown[];
  approval_history?: Array<{
    id: number;
    from_status?: string | null;
    to_status: string;
    notes?: string | null;
    changed_by?: number | null;
    created_at?: string;
  }>;
  business_info?: Record<string, unknown> | null;
  marketing_info?: Record<string, unknown> | null;
  invoicing?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type PaginatedResponse<T> = {
  data?: T[];
  items?: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type ReviewModule = "suppliers" | "agents" | "affiliates";

export async function listReviewRecords(module: ReviewModule, params: Record<string, string | number>) {
  const response = await api.get<PaginatedResponse<ReviewRecord>>(`/${module}`, { params });
  return response.data;
}

export async function getReviewRecord(module: ReviewModule, id: string | number) {
  const response = await api.get<{ data: ReviewRecord }>(`/${module}/${id}`);
  return response.data.data;
}

export async function createReviewRecord(module: ReviewModule, payload: Record<string, unknown>) {
  const response = await api.post<{ data: ReviewRecord }>(`/${module}/`, payload);
  return response.data.data;
}

export async function updateReviewRecord(module: ReviewModule, id: string | number, payload: Record<string, unknown>) {
  const response = await api.put<{ data: ReviewRecord }>(`/${module}/${id}`, payload);
  return response.data.data;
}

export async function approveReviewRecord(module: ReviewModule, id: string | number) {
  const response = await api.patch<{ data: ReviewRecord }>(`/${module}/${id}/approve`);
  return response.data.data;
}

export async function rejectReviewRecord(module: ReviewModule, id: string | number, payload: { rejection_reason: string; admin_comments?: string }) {
  const response = await api.patch<{ data: ReviewRecord }>(`/${module}/${id}/reject`, payload);
  return response.data.data;
}

export async function partialApproveReviewRecord(module: Exclude<ReviewModule, "affiliates">, id: string | number, payload: { admin_comments?: string; pending_requirements?: string }) {
  const response = await api.patch<{ data: ReviewRecord }>(`/${module}/${id}/partial-approve`, payload);
  return response.data.data;
}

export async function updateCommercialValue(module: "suppliers" | "agents", id: string | number, payload: Record<string, unknown>) {
  const path = module === "suppliers" ? "markup" : "discount";
  const response = await api.patch<{ data: ReviewRecord }>(`/${module}/${id}/${path}`, payload);
  return response.data.data;
}

export async function updateAffiliateApiLink(id: string | number, api_link: string) {
  const response = await api.patch<{ data: ReviewRecord }>(`/affiliates/${id}/api-link`, { api_link });
  return response.data.data;
}

export async function reviewSupplierDocument(
  supplierId: string | number,
  documentId: number,
  payload: { status: "approved" | "rejected"; rejection_reason?: string }
) {
  const response = await api.patch(`/suppliers/${supplierId}/documents/${documentId}/review`, payload);
  return response.data.data;
}

export async function acceptSupplier(id: string | number) {
  const response = await api.post<{ data: ReviewRecord }>(`/suppliers/${id}/accept`);
  return response.data.data;
}

export async function setSupplierAccountState(
  id: string | number,
  action: "deactivate" | "reactivate" | "suspend",
  reason = "",
) {
  const response = await api.post<{ data: ReviewRecord }>(`/suppliers/${id}/${action}`, { reason });
  return response.data.data;
}

export async function reviewAgentDocument(
  agentId: string | number,
  documentId: number,
  payload: { status: "approved" | "rejected"; rejection_reason?: string }
) {
  const response = await api.patch(`/agents/${agentId}/documents/${documentId}/review`, payload);
  return response.data.data;
}

export async function reviewSupplierVehicle(
  supplierId: string | number,
  vehicleId: number,
  payload: { approval_status: "approved" | "rejected"; rejection_reason?: string }
) {
  const response = await api.patch(`/suppliers/${supplierId}/vehicles/${vehicleId}/review`, payload);
  return response.data.data;
}


