import api from "@/lib/api";

export type Customer = {
  id: number;
  user_id?: number | null;
  customer_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  status: "active" | "inactive" | "blocked";
  is_blocked: boolean;
  blocked_reason?: string | null;
  blocked_at?: string | null;
  created_at?: string | null;
  total_bookings: number;
  completed_tours: number;
  cancelled_tours: number;
  upcoming_tours: number;
  amount_paid: number;
  amount_pending: number;
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
  tour_name: string;
  tour_date: string;
  country: string;
  supplier_name: string;
  booking_status: string;
  payment_status: string;
  tour_cost: number;
  amount_paid: number;
  amount_pending: number;
};

export type PaymentHistory = {
  id: number;
  payment_code: string;
  booking_id: number;
  booking_code: string;
  payment_method: string;
  payment_type: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  gst_amount: number;
  payment_status: string;
  transaction_id: string;
  payment_date: string;
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
  const response = await api.get<Paginated<BookingHistory> & { status: string }>(`/customers/${customerId}/bookings`);
  return response.data;
}

export async function getCustomerPayments(customerId: string | number) {
  const response = await api.get<Paginated<PaymentHistory> & { status: string }>(`/customers/${customerId}/payments`);
  return response.data;
}

export async function getCustomerCommunications(customerId: string | number) {
  const response = await api.get<Paginated<CustomerCommunication> & { status: string }>(
    `/customers/${customerId}/communications`
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
