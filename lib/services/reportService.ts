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

export type ReportSnapshot = {
  booking_performance: { total: number; current_month: number; change_pct: number };
  revenue_summary: { total: string; total_raw: number; current_month: string; change_pct: number };
  supplier_approval: { total: number; pending: number };
  agent_sales: { total: number; current_month: number; change_pct: number };
  payment_collection: {
    collected_pct: number;
    pending_pct: number;
    total_amount: string;
    collected_amount: string;
    pending_amount: string;
  };
  country_wise: { country_count: number };
  meta: { report_types: number; scheduled: number; total_exports: number };
  recent_exports: { id: number; label: string; format: string; exported_at: string }[];
};

type ApiDataResponse<T> = { status: string; data: T };

export async function getReportSummary() {
  const res = await api.get<ApiDataResponse<ReportSummary>>("/reports/summary");
  return res.data.data;
}

export async function getBookingReport() {
  const res = await api.get<ApiDataResponse<BookingReportRow[]>>("/reports/bookings");
  return res.data.data;
}

export async function getPaymentReport() {
  const res = await api.get<ApiDataResponse<PaymentReportRow[]>>("/reports/payments");
  return res.data.data;
}

export async function getReportSnapshot() {
  const res = await api.get<ApiDataResponse<ReportSnapshot>>("/reports/snapshot");
  return res.data.data;
}
