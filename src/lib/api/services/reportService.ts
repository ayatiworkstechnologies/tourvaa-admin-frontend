import api from "@/lib/api/client";

export type ReportPeriod = "day" | "week" | "month" | "quarter" | "half_year" | "year" | "custom" | "all";

export type PeriodParams = {
  period: ReportPeriod;
  start_date?: string;
  end_date?: string;
};

export type ReportSummary = {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  captured_revenue: string;
  pending_payments: string;
  invoice_total: string;
};

export type BookingReportRow = { status: string; count: number; amount: string };
export type PaymentReportRow = { status: string; count: number; captured: string; refunded: string };
export type PendingPaymentRow = { booking_id: number; booking_code: string; customer_id: number; amount_pending: string; payment_status: string };
export type OverduePaymentRow = { booking_id: number; booking_code: string; tour_start_date: string | null; amount_pending: string };
export type CountryWiseRow = { country: string; bookings: number; amount: string };
export type CancellationRow = { booking_id: number; booking_code: string; reason: string | null; cancelled_at: string | null; amount: string };
export type SupplierReportRow = { supplier_id: number; supplier_name: string; bookings: number; amount: string };
export type AgentReportRow = { agent_id: number; agent_name: string; bookings: number; amount: string };
export type CustomerReportRow = { customer_id: number; customer_name: string; bookings: number; amount: string; pending: string };

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

export type ReportType =
  | "summary"
  | "bookings"
  | "payments"
  | "pending-payments"
  | "overdue-payments"
  | "country-wise"
  | "cancellations"
  | "suppliers"
  | "agents"
  | "customers";

export const REPORT_TYPES: { value: ReportType; label: string; periodAware: boolean }[] = [
  { value: "summary", label: "Summary", periodAware: true },
  { value: "bookings", label: "Bookings", periodAware: true },
  { value: "payments", label: "Payments", periodAware: true },
  { value: "pending-payments", label: "Pending Payments", periodAware: false },
  { value: "overdue-payments", label: "Overdue Payments", periodAware: false },
  { value: "country-wise", label: "Country-wise Bookings", periodAware: true },
  { value: "cancellations", label: "Cancellations", periodAware: true },
  { value: "suppliers", label: "Suppliers", periodAware: true },
  { value: "agents", label: "Agents", periodAware: true },
  { value: "customers", label: "Customers", periodAware: true },
];

type ApiDataResponse<T> = { status: string; data: T };

function periodQuery(params: PeriodParams) {
  return {
    period: params.period,
    start_date: params.start_date ?? "",
    end_date: params.end_date ?? "",
  };
}

export async function getReportSummary(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<ReportSummary>>("/reports/summary", { params: periodQuery(params) });
  return res.data.data;
}

export async function getBookingReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<BookingReportRow[]>>("/reports/bookings", { params: periodQuery(params) });
  return res.data.data;
}

export async function getPaymentReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<PaymentReportRow[]>>("/reports/payments", { params: periodQuery(params) });
  return res.data.data;
}

export async function getPendingPaymentsReport() {
  const res = await api.get<ApiDataResponse<PendingPaymentRow[]>>("/reports/pending-payments");
  return res.data.data;
}

export async function getOverduePaymentsReport() {
  const res = await api.get<ApiDataResponse<OverduePaymentRow[]>>("/reports/overdue-payments");
  return res.data.data;
}

export async function getCountryWiseReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<CountryWiseRow[]>>("/reports/country-wise", { params: periodQuery(params) });
  return res.data.data;
}

export async function getCancellationsReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<CancellationRow[]>>("/reports/cancellations", { params: periodQuery(params) });
  return res.data.data;
}

export async function getSupplierReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<SupplierReportRow[]>>("/reports/suppliers", { params: periodQuery(params) });
  return res.data.data;
}

export async function getAgentReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<AgentReportRow[]>>("/reports/agents", { params: periodQuery(params) });
  return res.data.data;
}

export async function getCustomerReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<CustomerReportRow[]>>("/reports/customers", { params: periodQuery(params) });
  return res.data.data;
}

export async function getReportSnapshot() {
  const res = await api.get<ApiDataResponse<ReportSnapshot>>("/reports/snapshot");
  return res.data.data;
}

export async function exportReportCsv(report: ReportType, params: PeriodParams) {
  const response = await api.get("/reports/exports", {
    params: { report, format: "csv", ...periodQuery(params) },
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report}-${params.period}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
