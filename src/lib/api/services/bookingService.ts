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
  adults_count: number;
  children_count: number;
  total_travellers: number;
  currency: string;
  final_amount: string;
  amount_paid: string;
  amount_pending: string;
  booking_status: string;
  supplier_acceptance_status: string;
  payment_status: string;
  payment_type: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  travellers?: BookingTraveller[];
  optional_activities?: BookingLineItem[];
  accommodations?: BookingLineItem[];
  extensions?: BookingLineItem[];
  status_history?: BookingStatusHistoryItem[];
  communications?: BookingCommunication[];
};

export type BookingLineItem = {
  id?: number;
  name?: string;
  title?: string;
  amount?: string;
  price?: string;
};

export type BookingCommunication = {
  id: number;
  message: string;
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
  adults_count: number;
  children_count?: number;
  payment_type?: string;
  notes?: string;
  travellers?: BookingTraveller[];
  optional_activity_ids?: number[];
  accommodation_ids?: number[];
  extension_ids?: number[];
  promo_code?: string;
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





