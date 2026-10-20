import api from "@/lib/api/client";

export type GlobalDiscount = {
  id?: number;
  tour_id?: number | null;
  category_id?: number | null;
  country_id?: number | null;
  tour_title?: string | null;
  category_name?: string | null;
  country_name?: string | null;
  discount_name: string;
  discount_code?: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_scope: "tour" | "category" | "country" | "all_tours";
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  used_count?: number;
  minimum_booking_amount: number;
  status: string;
  /** Promo codes only: list on the tour page/checkout (true) or keep private (false). */
  show_on_website?: boolean;
};

export async function listAllDiscounts(params: { scope?: string; search?: string } = {}): Promise<GlobalDiscount[]> {
  const response = await api.get<{ data: GlobalDiscount[] }>("/discounts", { params });
  return response.data.data;
}

export async function createGlobalDiscount(payload: GlobalDiscount): Promise<GlobalDiscount> {
  const response = await api.post<{ data: GlobalDiscount }>("/discounts", payload);
  return response.data.data;
}

export type GlobalDiscountAmendment = {
  new_discount_value?: number | null;
  new_end_date?: string | null;
  reason?: string | null;
};

export type GlobalDiscountHistoryEntry = {
  id: number;
  discount_id: number;
  version_number: number;
  change_type: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date?: string | null;
  end_date?: string | null;
  reason?: string | null;
  changed_by?: number | null;
  changed_by_name?: string | null;
  created_at: string;
};

export type GlobalDiscountUsageEntry = {
  id: number;
  booking_id: number;
  booking_code?: string | null;
  booking_source?: string | null;
  customer_name?: string | null;
  agent_name?: string | null;
  discount_amount: number | string;
  currency: string;
  applied_at: string;
  booking_status?: string | null;
};

export type GlobalDiscountUsage = {
  items: GlobalDiscountUsageEntry[];
  tracked_count: number;
  used_count: number;
  unattributed_historical_count: number;
};

// Edit replaces every field (including scope/status -- setting status back
// to "active" reactivates an inactive discount). Delete is a soft-deactivate
// (status -> inactive) rather than a real row delete, so a discount that
// already has bookings referencing it keeps its history. Both are still
// recorded as a new history version server-side.
export async function updateGlobalDiscount(id: number, payload: GlobalDiscount): Promise<GlobalDiscount> {
  const response = await api.put<{ data: GlobalDiscount }>(`/discounts/${id}`, payload);
  return response.data.data;
}

export async function deactivateGlobalDiscount(id: number, reason?: string | null): Promise<GlobalDiscount> {
  const response = await api.patch<{ data: GlobalDiscount }>(`/discounts/${id}/deactivate`, { reason: reason || null });
  return response.data.data;
}

export async function amendGlobalDiscount(id: number, payload: GlobalDiscountAmendment): Promise<GlobalDiscount> {
  const response = await api.patch<{ data: GlobalDiscount }>(`/discounts/${id}/amend`, payload);
  return response.data.data;
}

export async function getGlobalDiscountHistory(id: number): Promise<GlobalDiscountHistoryEntry[]> {
  const response = await api.get<{ data: GlobalDiscountHistoryEntry[] }>(`/discounts/${id}/history`);
  return response.data.data;
}

export async function getGlobalDiscountUsage(id: number): Promise<GlobalDiscountUsage> {
  const response = await api.get<{ data: GlobalDiscountUsage }>(`/discounts/${id}/usage`);
  return response.data.data;
}
