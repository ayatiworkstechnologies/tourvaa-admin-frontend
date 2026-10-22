import api from "@/lib/api/client";

export type Customer = {
  id: number;
  user_id?: number | null;
  customer_code: string;
  customer_type?: string;
  agent_id?: number | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  phone_country_code?: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  profile_image: string;
  country_id?: number | null;
  city_id?: number | null;
  country: string;
  state: string;
  city: string;
  country_name?: string;
  state_name?: string;
  city_name?: string;
  pincode: string;
  status: "active" | "inactive" | "blocked";
  is_blocked: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  blocked_reason?: string | null;
  blocked_at?: string | null;
  created_at?: string | null;
  total_bookings: number;
  completed_tours: number;
  cancelled_tours: number;
  upcoming_tours: number;
  amount_paid: number;
  amount_pending: number;
  /** Live, exact booking balances. Mixed currencies are never collapsed into
   * one converted or unlabeled total. */
  currency?: string | null;
  has_mixed_currencies?: boolean;
  amounts_by_currency?: { currency: string; paid: number; pending: number }[];
  booking_summary?: {
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
  };
  payment_summary?: {
    paid: number;
    pending: number;
  };
  recent_bookings?: BookingHistory[];
  recent_payments?: PaymentHistory[];
  last_login_at?: string | null;
  last_login_ip?: string | null;
};

export type CustomerFilters = {
  page: number;
  limit: number;
  search?: string;
  country?: string;
  status?: string;
  booking_status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: string;
};

export type Paginated<T> = {
  items: T[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type BookingHistory = {
  id: number;
  booking_code: string;
  tour_id?: number | null;
  tour_name: string;
  tour_date?: string | null;
  booking_date?: string | null;
  country?: string;
  supplier_name?: string;
  booking_status: string;
  payment_status: string;
  tour_cost: number | string;
  amount_paid: number | string;
  amount_pending: number | string;
  currency?: string;
  created_at?: string | null;
};

export type PaymentHistory = {
  id?: number;
  payment_code?: string;
  booking_id?: number;
  booking_code?: string;
  payment_method?: string;
  payment_type?: string;
  total_amount?: number | string;
  paid_amount?: number | string;
  pending_amount?: number | string;
  gst_amount?: number | string;
  payment_status?: string;
  transaction_id?: string | null;
  gateway_payment_id?: string | null;
  payment_date?: string | null;
  created_at?: string | null;
  currency?: string;
};

export type CustomerCommunication = {
  id: number;
  customer_id: number;
  booking_id?: number | null;
  subject: string;
  message: string;
  sent_by_user_id?: number | null;
  sent_to_email: string;
  message_type: string;
  email_status: string;
  created_at?: string | null;
};

export async function getCustomers(filters: CustomerFilters) {
  const response = await api.get<Paginated<Customer> & { status: string }>("/customers/", {
    params: filters,
  });
  return response.data;
}

export async function getCustomerDetail(customerId: string | number) {
  const response = await api.get<{ status: string; data: Customer }>(`/customers/${customerId}`);
  return response.data.data;
}

export async function updateCustomer(customerId: string | number, payload: Record<string, unknown>) {
  const response = await api.put<{ status: string; data: Customer }>(`/customers/${customerId}`, payload);
  return response.data.data;
}

export async function updateCustomerStatus(customerId: string | number, status: "active" | "inactive") {
  const response = await api.patch<{ status: string; data: Customer }>(`/customers/${customerId}/status`, {
    status,
  });
  return response.data.data;
}

export async function blockCustomer(customerId: string | number, reason: string) {
  const response = await api.patch<{ status: string; data: Customer }>(`/customers/${customerId}/block`, {
    reason,
  });
  return response.data.data;
}

export async function unblockCustomer(customerId: string | number) {
  const response = await api.patch<{ status: string; data: Customer }>(`/customers/${customerId}/unblock`);
  return response.data.data;
}

export async function resetCustomerPassword(customerId: string | number) {
  const response = await api.post<{ status: string; data: Customer }>(`/customers/${customerId}/reset-password`);
  return response.data.data;
}

export async function getCustomerBookings(customerId: string | number) {
  const response = await api.get<Paginated<BookingHistory> & { status: string }>(`/customers/${customerId}/bookings`, {
    params: { limit: 1000 },
  });
  return response.data;
}

export async function getCustomerPayments(customerId: string | number) {
  const response = await api.get<Paginated<PaymentHistory> & { status: string }>(`/customers/${customerId}/payments`, {
    params: { limit: 1000 },
  });
  return response.data;
}

export async function getCustomerCommunications(customerId: string | number) {
  const response = await api.get<Paginated<CustomerCommunication> & { status: string }>(
    `/customers/${customerId}/communications`,
    { params: { limit: 1000 } }
  );
  return response.data;
}

export async function sendCustomerMessage(
  customerId: string | number,
  payload: { subject: string; message: string; booking_id?: number | null }
) {
  const response = await api.post<{ status: string; data: CustomerCommunication }>(
    `/customers/${customerId}/communications`,
    payload
  );
  return response.data.data;
}




