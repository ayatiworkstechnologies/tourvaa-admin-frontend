import api from "@/lib/api/client";

export type BookingStatusHistoryItem = {
  id: number;
  old_status?: string | null;
  new_status: string;
  reason?: string | null;
  created_at?: string | null;
};

export type BookingTraveller = {
  id?: number;
  full_name: string;
  age?: number | null;
  traveller_type?: string;
  passport_number?: string | null;
};

export type Booking = {
  id: number;
  booking_code: string;
  customer_id: number;
  customer_name?: string | null;
  customer_email?: string | null;
  tour_id?: number | null;
  tour_calendar_id?: number | null;
  supplier_id?: number | null;
  agent_id?: number | null;
  tour_name: string;
  tour_date: string;
  country: string;
  supplier_name: string;
  no_of_adults: number;
  no_of_children: number;
  no_of_infants: number;
  adults_count: number;
  children_count: number;
  total_travellers: number;
  currency: string;
  final_amount: string;
  amount_paid: string;
  amount_pending: string;
  payment_due_date?: string | null;
  balance_due_date?: string | null;
  booking_status: string;
  supplier_acceptance_status: string;
  payment_status: string;
  payment_type: string;
  notes?: string | null;
  customer_notes?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  travellers?: BookingTraveller[];
  optional_activities?: BookingLineItem[];
  accommodations?: BookingLineItem[];
  extensions?: BookingLineItem[];
  status_history?: BookingStatusHistoryItem[];
  communications?: BookingCommunication[];
  payments?: PaymentAttempt[];
  // Admin-only -- present only when this booking detail was fetched by an
  // admin (see services.bookings.get_booking_detail's role gate); absent
  // for agent/supplier/customer views of the same booking.
  supplier_breakdown?: SupplierBreakdown | null;
  booking_source?: "admin" | "agent" | "customer" | null;
  agent_payment_method?: string | null;
  agent_payment_summary?: AgentPaymentSummary | null;
  // Immutable commission snapshot captured once at booking creation (see
  // Booking model / serialize_booking in the backend). Admin-only, same
  // gate as supplier_breakdown -- null/undefined for older bookings or
  // non-admin views, so each field must be checked before rendering.
  tourvaa_commission_percentage?: string | null;
  tourvaa_commission_amount?: string | null;
  supplier_net_payable?: string | null;
  agent_commission_percentage?: string | null;
  agent_commission_amount?: string | null;
  admin_markup_percentage?: string | null;
  tourvaa_gross_revenue?: string | null;
  affiliate_commission_percentage?: string | null;
  affiliate_commission_amount?: string | null;
  tourvaa_net_revenue?: string | null;
  non_commissionable_addon_amount?: string | null;
  cost_plus_supplier_payable?: string | null;
  group_discount_funded_by?: "SUPPLIER" | "TOURVAA" | "SHARED" | null;
  promo_discount_funded_by?: "SUPPLIER" | "TOURVAA" | "SHARED" | null;
  cancellation_source?: string | null;
};

export type SupplierBreakdown = {
  currency: string;
  gross_amount: string;
  commission_percentage: string;
  commission_amount: string;
  net_payable: string;
  customer_price: string;
  customer_price_currency: string;
  tourvaa_margin: string;
  payment_status?: string | null;
  payment_date?: string | null;
};

export type AgentPaymentSummary = {
  transaction_type: "Full Payment" | "Booking Reserved";
  is_reserved: boolean;
  amount_paid: string;
  total_booking_amount: string;
  commission_percentage: string;
  commission_amount: string;
  commission_payable: string;
  commission_status: string;
  commission_payment_date?: string | null;
  agent_price: string;
  invoice_status: string;
  payment_due_date?: string | null;
};

export type PaymentAttempt = {
  id: number;
  payment_code: string;
  payment_method: string;
  payment_type: string;
  gateway: string;
  total_amount: string;
  captured_amount: string;
  refunded_amount: string;
  payment_status: string;
  failure_reason?: string | null;
  created_at?: string | null;
};

export type BookingLineItem = {
  id?: number;
  name?: string;
  title?: string;
  amount?: string;
  price?: string;
  activity_name_snapshot?: string;
  accommodation_name_snapshot?: string;
  extension_name_snapshot?: string;
  total_price?: string;
  unit_price?: string;
  quantity?: number;
};

export type BookingCommunication = {
  id: number;
  message: string;
  subject?: string | null;
  message_type?: string | null;
  visibility?: string | null;
  sender_type?: string | null;
  created_at?: string | null;
};

export type BookingFilters = {
  page?: number;
  limit?: number;
  search?: string;
  customer_id?: number;
  booking_status?: string;
  payment_status?: string;
  supplier_acceptance_status?: string;
  country_id?: number;
  supplier_id?: number;
  agent_id?: number;
  tour_id?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  _ts?: number;
};

export type BookingCreate = {
  customer_id: number;
  tour_id?: number;
  tour_calendar_id?: number;
  tour_date?: string;
  no_of_adults: number;
  no_of_children?: number;
  no_of_infants?: number;
  booking_source?: "admin" | "agent" | "customer";
  payment_type?: string;
  notes?: string;
  travellers?: BookingTraveller[];
  optional_activity_ids?: number[];
  accommodation_ids?: number[];
  extension_ids?: number[];
  promo_code?: string;
  affiliate_ref_code?: string;
};

export type PaginatedBookings = {
  items: Booking[];
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

type ApiDataResponse<T> = {
  status: string;
  data: T;
};

type BookingStatusPayload = {
  booking_status: string;
  reason?: string;
};

type SupplierAssignmentPayload = {
  supplier_id: number;
  reason?: string;
};

export async function getBookings(filters: BookingFilters = {}) {
  const response = await api.get<PaginatedBookings & { status: string }>("/bookings/", {
    params: filters,
  });

  return response.data;
}

export async function getBookingDetail(bookingId: number | string) {
  const response = await api.get<ApiDataResponse<Booking>>(`/bookings/${bookingId}`);
  return response.data.data;
}

export async function createBooking(booking: BookingCreate) {
  const response = await api.post<ApiDataResponse<Booking>>("/bookings/", booking);
  return response.data.data;
}

export async function updateBooking(bookingId: number | string, booking: Partial<BookingCreate>) {
  const response = await api.put<ApiDataResponse<Booking>>(`/bookings/${bookingId}`, booking);
  return response.data.data;
}

export async function updateBookingStatus(
  bookingId: number | string,
  bookingStatus: string,
  reason?: string,
) {
  const payload: BookingStatusPayload = { booking_status: bookingStatus, reason };
  const response = await api.patch<ApiDataResponse<Booking>>(`/bookings/${bookingId}/status`, payload);
  return response.data.data;
}

export async function assignSupplier(
  bookingId: number | string,
  supplierId: number,
  reason?: string,
) {
  const payload: SupplierAssignmentPayload = { supplier_id: supplierId, reason };
  const response = await api.post<ApiDataResponse<Booking>>(
    `/bookings/${bookingId}/assign-supplier`,
    payload,
  );

  return response.data.data;
}

export async function cancelBooking(bookingId: number | string, reason?: string) {
  const response = await api.patch<ApiDataResponse<Booking>>(`/bookings/${bookingId}/cancel`, {
    reason: reason ?? "Cancelled by admin",
  });

  return response.data.data;
}

export async function getBookingPayments(bookingId: number | string) {
  const response = await api.get("/payments/", { params: { booking_id: bookingId } });
  return response.data;
}

export async function exportBookingsCsv() {
  const response = await api.get("/bookings/export", { responseType: "blob" });
  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bookings-export.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getBookingPaymentLink(bookingId: number | string) {
  const response = await api.get<ApiDataResponse<{ booking_id: number; booking_code: string; amount_pending: string; payment_link: string }>>(`/bookings/${bookingId}/payment-link`);
  return response.data.data;
}





