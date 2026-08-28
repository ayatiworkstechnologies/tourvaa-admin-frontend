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

// Edit/Delete are removed -- only an amendment (percentage/value and/or a
// later end date) is allowed, and every amendment is recorded as a new
// history version rather than overwriting the original record.
export async function amendGlobalDiscount(id: number, payload: GlobalDiscountAmendment): Promise<GlobalDiscount> {
  const response = await api.patch<{ data: GlobalDiscount }>(`/discounts/${id}/amend`, payload);
  return response.data.data;
}

export async function getGlobalDiscountHistory(id: number): Promise<GlobalDiscountHistoryEntry[]> {
  const response = await api.get<{ data: GlobalDiscountHistoryEntry[] }>(`/discounts/${id}/history`);
  return response.data.data;
}
