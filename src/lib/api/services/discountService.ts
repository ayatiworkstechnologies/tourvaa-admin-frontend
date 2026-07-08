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

export async function updateGlobalDiscount(id: number, payload: GlobalDiscount): Promise<GlobalDiscount> {
  const response = await api.put<{ data: GlobalDiscount }>(`/discounts/${id}`, payload);
  return response.data.data;
}

export async function deleteGlobalDiscount(id: number): Promise<void> {
  await api.delete(`/discounts/${id}`);
}
