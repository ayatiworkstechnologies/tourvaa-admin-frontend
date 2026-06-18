import api from "@/lib/api";

export type Booking = {
  id: number;
  booking_code: string;
  customer_id: number;
  tour_id?: number | null;
  supplier_id?: number | null;
  agent_id?: number | null;
  affiliate_id?: number | null;
  tour_name: string;
  tour_date: string;
  country: string;
  supplier_name: string;
  no_of_adults: number;
  no_of_children: number;
  no_of_infants: number;
  total_cost: number;
  amount_paid: number;
  amount_pending: number;
  booking_status: "upcoming" | "ongoing" | "completed" | "cancelled";
  payment_status: "pending" | "partial" | "paid" | "refunded";
  notes?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BookingFilters = {
  page?: number;
  limit?: number;
  search?: string;
  customer_id?: number;
  booking_status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
};

export type BookingCreate = {
  customer_id: number;
  tour_id?: number | null;
  supplier_id?: number | null;
  agent_id?: number | null;
  affiliate_id?: number | null;
  tour_name: string;
  tour_date: string;
  country?: string;
  supplier_name?: string;
  no_of_adults?: number;
  no_of_children?: number;
  no_of_infants?: number;
  total_cost?: number;
  notes?: string | null;
};

export type PaginatedBookings = {
  items: Booking[];
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export async function getBookings(filters: BookingFilters = {}) {
  const response = await api.get<PaginatedBookings & { status: string }>("/bookings/", {
    params: filters,
  });
  return response.data;
}

export async function getBookingDetail(bookingId: number | string) {
  const response = await api.get<{ status: string; data: Booking }>(`/bookings/${bookingId}`);
  return response.data.data;
}

export async function createBooking(data: BookingCreate) {
  const response = await api.post<{ status: string; data: Booking }>("/bookings/", data);
  return response.data.data;
}

export async function updateBooking(bookingId: number | string, data: Partial<BookingCreate>) {
  const response = await api.put<{ status: string; data: Booking }>(`/bookings/${bookingId}`, data);
  return response.data.data;
}

export async function updateBookingStatus(
  bookingId: number | string,
  booking_status: "upcoming" | "ongoing" | "completed" | "cancelled"
) {
  const response = await api.patch<{ status: string; data: Booking }>(`/bookings/${bookingId}/status`, {
    booking_status,
  });
  return response.data.data;
}

export async function cancelBooking(bookingId: number | string, reason?: string) {
  const response = await api.patch<{ status: string; data: Booking }>(`/bookings/${bookingId}/cancel`, {
    reason: reason ?? "Cancelled by admin",
  });
  return response.data.data;
}
