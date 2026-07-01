import api from "@/lib/api";

export type PaymentTransaction = {
  id: number;
  transaction_type: string;
  amount: string;
  status: string;
  gateway_reference?: string | null;
  created_at?: string | null;
};

export type PaymentHold = {
  id: number;
  hold_amount: string;
  captured_amount: string;
  released_amount: string;
  status: string;
  expires_at?: string | null;
  created_at?: string | null;
};

export type Payment = {
  id: number;
  payment_code: string;
  booking_id: number;
  booking_code?: string | null;
  customer_id: number;
  customer_name?: string | null;
  customer_email?: string | null;
  payment_method: string;
  payment_type: string;
  gateway?: string;
  total_amount: string;
  authorized_amount?: string;
  captured_amount?: string;
  paid_amount: string;
  pending_amount: string;
  gst_amount: string;
  surcharge_amount?: string;
  refunded_amount: string;
  payment_status: string;
  transaction_id?: string | null;
  created_at?: string | null;
  transactions?: PaymentTransaction[];
  holds?: PaymentHold[];
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
  total_amount: string | number;
  paid_amount: string | number;
  gst_amount?: string | number;
  surcharge_amount?: string | number;
  gateway?: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  idempotency_key?: string;
  transaction_id?: string;
  payment_date?: string;
  notes?: string;
};

export type PaymentAuthorize = {
  booking_id: number;
  amount: string | number;
  payment_method: string;
  payment_type?: string;
  gateway?: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  idempotency_key?: string;
  notes?: string;
};

export type PaginatedPayments = {
  items: Payment[];
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

type ApiDataResponse<T> = {
  status: string;
  data: T;
};

export async function getPayments(filters: PaymentFilters = {}) {
  const response = await api.get<PaginatedPayments & { status: string }>("/payments/", {
    params: filters,
  });

  return response.data;
}

export async function getPaymentDetail(paymentId: number | string) {
  const response = await api.get<ApiDataResponse<Payment>>(`/payments/${paymentId}`);
  return response.data.data;
}

export async function authorizePayment(payment: PaymentAuthorize) {
  const response = await api.post<ApiDataResponse<Payment>>("/payments/authorize", payment);
  return response.data.data;
}

export async function createPayment(payment: PaymentCreate) {
  const response = await api.post<ApiDataResponse<Payment>>("/payments/", payment);
  return response.data.data;
}

export async function capturePayment(
  paymentId: number | string,
  amount: string | number,
  transactionId?: string,
) {
  const response = await api.post<ApiDataResponse<Payment>>(`/payments/${paymentId}/capture`, {
    amount,
    transaction_id: transactionId,
  });

  return response.data.data;
}

export async function voidPayment(paymentId: number | string, reason?: string) {
  const response = await api.post<ApiDataResponse<Payment>>(`/payments/${paymentId}/void`, { reason });
  return response.data.data;
}

export async function processRefund(paymentId: number | string, amount: number, reason?: string) {
  const response = await api.post<ApiDataResponse<Payment>>(`/payments/${paymentId}/refund`, {
    amount,
    reason: reason ?? "Refund issued by admin",
  });

  return response.data.data;
}

export async function updatePaymentStatus(paymentId: number | string, paymentStatus: string) {
  const response = await api.patch<ApiDataResponse<Payment>>(`/payments/${paymentId}/status`, {
    payment_status: paymentStatus,
  });

  return response.data.data;
}



