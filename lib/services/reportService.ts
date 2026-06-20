import api from "@/lib/api";

export type ReportSummary = {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  captured_revenue: string;
  invoice_total: string;
};

export type BookingReportRow = {
  status: string;
  count: number;
};

export type PaymentReportRow = {
  status: string;
  count: number;
  amount: string;
};

type ApiDataResponse<T> = {
  status: string;
  data: T;
};

export async function getReportSummary() {
  const response = await api.get<ApiDataResponse<ReportSummary>>("/reports/summary");
  return response.data.data;
}

export async function getBookingReport() {
  const response = await api.get<ApiDataResponse<BookingReportRow[]>>("/reports/bookings");
  return response.data.data;
}

export async function getPaymentReport() {
  const response = await api.get<ApiDataResponse<PaymentReportRow[]>>("/reports/payments");
  return response.data.data;
}
