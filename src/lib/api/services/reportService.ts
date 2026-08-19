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

// -- row-level "first release" reports --

export type BookingDetailRow = {
  booking_id: number;
  booking_code: string;
  booking_date: string;
  customer_or_agent: string;
  tour_name: string | null;
  supplier: string | null;
  travel_date: string | null;
  adults: number;
  children: number;
  booking_amount: string;
  payment_status: string;
  booking_status: string;
  cancellation_status: string;
};

export type SalesRevenueReport = {
  total_bookings: number;
  gross_booking_value: string;
  discounts: string;
  taxes: string;
  platform_commission: string;
  supplier_payable: string;
  refund_amount: string;
  net_platform_revenue: string;
  granularity: "day" | "week" | "month";
  time_series: { period: string; sales: string }[];
};

export type PaymentDetailRow = {
  transaction_id: string | null;
  booking_id: number;
  payment_gateway: string;
  payment_method: string;
  paid_amount: string;
  payment_date: string | null;
  payment_status: string;
  failed_payment_reason: string | null;
  refund_status: string;
};

export type SupplierDetailRow = {
  supplier_name: string;
  company_name: string;
  registration_date: string;
  verification_status: string;
  active_tours: number;
  total_bookings: number;
  gross_sales: string;
  commission_deducted: string;
  amount_paid: string;
  outstanding_payable: string;
  supplier_status: string;
};

export type SupplierPayoutReportRow = {
  payout_id: string | number;
  supplier: string | null;
  payout_period: string;
  total_booking_amount: string;
  commission: string;
  refund_deductions: string;
  other_adjustments: string;
  net_payable: string;
  payment_reference: string | null;
  payout_status: string;
  paid_date: string | null;
};

export type TourPerformanceRow = {
  tour_name: string;
  supplier: string | null;
  destination: string;
  category: string | null;
  views: string;
  enquiries: string;
  bookings: number;
  confirmed_travellers: number;
  booking_conversion_rate: string;
  cancellation_rate: string;
  revenue: string;
  average_rating: number | null;
};

export type CancellationRefundRow = {
  booking_id: number;
  tour: string | null;
  customer: string | null;
  supplier: string | null;
  cancellation_date: string | null;
  cancelled_by: string;
  cancellation_reason: string | null;
  booking_amount: string;
  cancellation_charge: string;
  refundable_amount: string;
  refund_status: string;
  refund_date: string | null;
};

// -- supplier self-service reports --

export type MyBookingRow = {
  booking_id: number;
  booking_code: string;
  customer_or_agent: string;
  tour_name: string | null;
  booking_date: string;
  travel_date: string | null;
  adults: number;
  children: number;
  total_amount: string;
  booking_status: string;
  payment_status: string;
  special_requests: string | null;
};

export type MyEarningsReport = {
  total_sales: string;
  platform_commission: string;
  refund_deductions: string;
  adjustments: string;
  net_earnings: string;
  paid_earnings: string;
  pending_earnings: string;
};

export type MyTravellerRow = {
  booking_id: number;
  traveller_name: string;
  contact_information: string | null;
  travel_date: string | null;
  number_of_travellers: number;
  pickup_location: string | null;
  emergency_contact: string | null;
  special_requirements: string | null;
  booking_status: string;
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
  | "customers"
  | "booking-report"
  | "sales-revenue-report"
  | "payment-report"
  | "supplier-report"
  | "supplier-payout-report"
  | "tour-performance-report"
  | "cancellation-refund-report"
  | "my-bookings"
  | "my-earnings"
  | "my-travellers";

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
  { value: "booking-report", label: "Booking Report", periodAware: true },
  { value: "sales-revenue-report", label: "Sales and Revenue Report", periodAware: true },
  { value: "payment-report", label: "Payment Report", periodAware: true },
  { value: "supplier-report", label: "Supplier Report", periodAware: true },
  { value: "supplier-payout-report", label: "Supplier Payout Report", periodAware: false },
  { value: "tour-performance-report", label: "Tour Performance Report", periodAware: false },
  { value: "cancellation-refund-report", label: "Cancellation and Refund Report", periodAware: true },
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

export async function getBookingDetailReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<BookingDetailRow[]>>("/reports/booking-report", { params: periodQuery(params) });
  return res.data.data;
}

export async function getSalesRevenueReport(params: PeriodParams, granularity: "day" | "week" | "month" = "day") {
  const res = await api.get<ApiDataResponse<SalesRevenueReport>>("/reports/sales-revenue-report", { params: { ...periodQuery(params), granularity } });
  return res.data.data;
}

export async function getPaymentDetailReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<PaymentDetailRow[]>>("/reports/payment-report", { params: periodQuery(params) });
  return res.data.data;
}

export async function getSupplierDetailReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<SupplierDetailRow[]>>("/reports/supplier-report", { params: periodQuery(params) });
  return res.data.data;
}

export async function getSupplierPayoutReport() {
  const res = await api.get<ApiDataResponse<SupplierPayoutReportRow[]>>("/reports/supplier-payout-report");
  return res.data.data;
}

export async function getTourPerformanceReport() {
  const res = await api.get<ApiDataResponse<TourPerformanceRow[]>>("/reports/tour-performance-report");
  return res.data.data;
}

export async function getCancellationRefundReport(params: PeriodParams) {
  const res = await api.get<ApiDataResponse<CancellationRefundRow[]>>("/reports/cancellation-refund-report", { params: periodQuery(params) });
  return res.data.data;
}

export async function getMyBookingsReport(params: { booking_status?: string; payment_status?: string; start_date?: string; end_date?: string } = {}) {
  const res = await api.get<ApiDataResponse<MyBookingRow[]>>("/reports/my-bookings", { params });
  return res.data.data;
}

export async function getMyEarningsReport() {
  const res = await api.get<ApiDataResponse<MyEarningsReport>>("/reports/my-earnings");
  return res.data.data;
}

export async function getMyTravellersReport() {
  const res = await api.get<ApiDataResponse<MyTravellerRow[]>>("/reports/my-travellers");
  return res.data.data;
}

export async function getReportSnapshot() {
  const res = await api.get<ApiDataResponse<ReportSnapshot>>("/reports/snapshot");
  return res.data.data;
}

export type ReportSchedule = {
  id: number;
  report_type: string;
  cadence: string;
  recipient_emails: string;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
};

export async function getReportSchedules() {
  const res = await api.get<ApiDataResponse<ReportSchedule[]>>("/reports/schedule");
  return res.data.data;
}

export async function createReportSchedule(data: { report_type: string; cadence: string; recipient_emails: string }) {
  const res = await api.post<ApiDataResponse<ReportSchedule>>("/reports/schedule", data);
  return res.data.data;
}

export async function deleteReportSchedule(scheduleId: number) {
  await api.delete(`/reports/schedule/${scheduleId}`);
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
