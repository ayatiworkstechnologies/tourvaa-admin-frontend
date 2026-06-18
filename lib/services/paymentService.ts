import api from "@/lib/api";

export type Payment = {
  id: number;
  payment_code: string;
  booking_id: number;
  customer_id: number;
  payment_method: string;
  payment_type: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  gst_amount: number;
  refunded_amount: number;
  payment_status: "pending" | "partial" | "paid" | "failed" | "refunded";
  transaction_id?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  failure_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PaymentFilters = {
  page?: number;
  limit?: number;
  search?: string;
  customer_id?: number;
  booking_id?: number;
  payment_status?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
};

export type PaymentCreate = {
  booking_id: number;
  customer_id: number;
  payment_method: string;
  payment_type: string;
  total_amount: number;
  paid_amount: number;
  gst_amount?: number;
  transaction_id?: string | null;
  payment_date?: string | null;
  notes?: string | null;
};

export type PaginatedPayments = {
  items: Payment[];
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export async function getPayments(filters: PaymentFilters = {}) {
  const response = await api.get<PaginatedPayments & { status: string }>("/payments/", {
    params: filters,
  });
  return response.data;
}

export async function getPaymentDetail(paymentId: number | string) {
  const response = await api.get<{ status: string; data: Payment }>(`/payments/${paymentId}`);
  return response.data.data;
}

export async function getCustomerPayments(
  customerId: number | string,
  filters: { page?: number; limit?: number; payment_status?: string; payment_method?: string } = {}
) {
  const response = await api.get<PaginatedPayments & { status: string }>(`/payments/customer/${customerId}`, {
    params: filters,
  });
  return response.data;
}

export async function createPayment(data: PaymentCreate) {
  const response = await api.post<{ status: string; data: Payment }>("/payments/", data);
  return response.data.data;
}

export async function updatePayment(paymentId: number | string, data: Partial<PaymentCreate>) {
  const response = await api.put<{ status: string; data: Payment }>(`/payments/${paymentId}`, data);
  return response.data.data;
}

export async function updatePaymentStatus(
  paymentId: number | string,
  payment_status: "pending" | "partial" | "paid" | "failed" | "refunded"
) {
  const response = await api.patch<{ status: string; data: Payment }>(`/payments/${paymentId}/status`, {
    payment_status,
  });
  return response.data.data;
}

export async function processRefund(paymentId: number | string, amount: number, reason?: string) {
  const response = await api.post<{ status: string; data: Payment }>(`/payments/${paymentId}/refund`, {
    amount,
    reason: reason ?? "Refund issued by admin",
  });
  return response.data.data;
}
