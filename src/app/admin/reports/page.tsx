"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuDownload as Download, LuLoaderCircle as Loader2, LuTrendingUp as TrendingUp } from "react-icons/lu";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import ReportScheduleSection from "@/components/reports/ReportScheduleSection";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import DatePicker from "@/components/ui/DatePicker";
import {
  exportReportCsv,
  getAgentReport,
  getBookingDetailReport,
  getBookingReport,
  getCancellationRefundReport,
  getCancellationsReport,
  getCountryWiseReport,
  getCustomerReport,
  getOverduePaymentsReport,
  getPaymentDetailReport,
  getPaymentReport,
  getPendingPaymentsReport,
  getReportSnapshot,
  getReportSummary,
  getSalesRevenueReport,
  getSupplierDetailReport,
  getSupplierPayoutReport,
  getSupplierReport,
  getTourPerformanceReport,
  REPORT_TYPES,
  ReportPeriod,
  ReportSnapshot,
  ReportType,
  SalesRevenueReport,
} from "@/lib/api/services/reportService";
import PrintButton from "@/components/reports/PrintButton";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).replace(",", "");
}

function changeBadge(pct: number) {
  if (pct === 0) return null;
  const positive = pct > 0;
  return (
    <span className={`text-sm font-medium ${positive ? "text-[#17B26A]" : "text-[#F04438]"}`}>
      {positive ? "+" : ""}{pct}%
    </span>
  );
}

// status badge
function StatusBadge({ status }: { status: "ready" | "review" }) {
  return status === "ready" ? (
    <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#027A48]">ready</span>
  ) : (
    <span className="rounded-full bg-[#FFFAEB] px-2 py-0.5 text-xs font-semibold text-[#B54708]">review</span>
  );
}

// snapshot card
interface SnapshotCardProps {
  title: string;
  status: "ready" | "review";
  value: React.ReactNode;
  sub: React.ReactNode;
}

function SnapshotCard({ title, status, value, sub }: SnapshotCardProps) {
  return (
    <div className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-dash-body">{title}</span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-3xl font-bold text-[#175CD3]">{value}</p>
      <p className="mt-1 text-sm text-dash-muted">{sub}</p>
    </div>
  );
}

// format badge (xlsx / pdf / csv)
const FORMAT_COLORS: Record<string, string> = {
  XLSX: "bg-[#E6F4EA] text-[#1E7E34]",
  PDF:  "bg-[#FDE8E8] text-[#C81E1E]",
  CSV:  "bg-[#EEF4FF] text-[#3538CD]",
};

function FormatBadge({ format }: { format: string }) {
  const cls = FORMAT_COLORS[format] ?? "bg-[#F2F4F7] text-dash-body";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${cls}`}>{format}</span>
  );
}

// period options
const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "half_year", label: "Half Year" },
  { value: "year", label: "Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

// report row types (loose - different report types have different shapes)
type ReportRow = Record<string, string | number | null>;

type FormatMoney = (value: number | string | null | undefined, fromCurrency?: string) => string;

function buildColumns(reportType: ReportType, money: FormatMoney): DataTableColumn<ReportRow>[] {
  switch (reportType) {
    case "bookings":
      return [
        { key: "status", header: "Booking Status", className: "capitalize font-semibold text-dash-text" },
        { key: "count", header: "Count" },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ];
    case "payments":
      return [
        { key: "status", header: "Payment Status", className: "capitalize font-semibold text-dash-text" },
        { key: "count", header: "Count" },
        { key: "captured", header: "Captured", className: "text-emerald-700", render: (r) => money(r.captured) },
        { key: "refunded", header: "Refunded", className: "text-purple-700", render: (r) => money(r.refunded) },
      ];
    case "pending-payments":
      return [
        { key: "booking_code", header: "Booking", className: "font-bold text-dash-text" },
        { key: "payment_status", header: "Payment Status", className: "capitalize" },
        { key: "amount_pending", header: "Pending", className: "font-bold text-red-600", render: (r) => money(r.amount_pending) },
      ];
    case "overdue-payments":
      return [
        { key: "booking_code", header: "Booking", className: "font-bold text-dash-text" },
        { key: "tour_start_date", header: "Tour Start" },
        { key: "amount_pending", header: "Pending", className: "font-bold text-red-600", render: (r) => money(r.amount_pending) },
      ];
    case "country-wise":
      return [
        { key: "country", header: "Country", className: "font-semibold text-dash-text" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ];
    case "cancellations":
      return [
        { key: "booking_code", header: "Booking", className: "font-bold text-dash-text" },
        { key: "reason", header: "Reason" },
        { key: "cancelled_at", header: "Cancelled At", render: (r) => (r.cancelled_at ? formatDate(String(r.cancelled_at)) : "-") },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ];
    case "suppliers":
      return [
        { key: "supplier_name", header: "Supplier", className: "font-semibold text-dash-text" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Revenue", render: (r) => money(r.amount) },
      ];
    case "agents":
      return [
        { key: "agent_name", header: "Agent", className: "font-semibold text-dash-text" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Revenue", render: (r) => money(r.amount) },
      ];
    case "customers":
      return [
        { key: "customer_name", header: "Customer", className: "font-semibold text-dash-text" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Spent", render: (r) => money(r.amount) },
        { key: "pending", header: "Pending", className: "text-amber-700", render: (r) => money(r.pending) },
      ];
    case "booking-report":
      return [
        { key: "booking_code", header: "Booking ID", className: "font-bold text-dash-text" },
        { key: "booking_date", header: "Booking Date", render: (r) => (r.booking_date ? formatDate(String(r.booking_date)) : "-") },
        { key: "customer_or_agent", header: "Customer/Agent" },
        { key: "tour_name", header: "Tour" },
        { key: "supplier", header: "Supplier" },
        { key: "travel_date", header: "Travel Date" },
        { key: "adults", header: "Adults" },
        { key: "children", header: "Children" },
        { key: "booking_amount", header: "Amount", render: (r) => money(r.booking_amount) },
        { key: "payment_status", header: "Payment Status", className: "capitalize" },
        { key: "booking_status", header: "Booking Status", className: "capitalize" },
        { key: "cancellation_status", header: "Cancellation Status", className: "capitalize" },
      ];
    case "sales-revenue-report":
      return [
        { key: "total_bookings", header: "Total Bookings" },
        { key: "gross_booking_value", header: "Gross Booking Value", render: (r) => money(r.gross_booking_value) },
        { key: "discounts", header: "Discounts", render: (r) => money(r.discounts) },
        { key: "taxes", header: "Taxes", render: (r) => money(r.taxes) },
        { key: "platform_commission", header: "Platform Commission", render: (r) => money(r.platform_commission) },
        { key: "supplier_payable", header: "Supplier Payable", render: (r) => money(r.supplier_payable) },
        { key: "refund_amount", header: "Refund Amount", render: (r) => money(r.refund_amount) },
        { key: "net_platform_revenue", header: "Net Platform Revenue", className: "font-bold text-emerald-700", render: (r) => money(r.net_platform_revenue) },
      ];
    case "payment-report":
      return [
        { key: "transaction_id", header: "Transaction ID", className: "font-bold text-dash-text" },
        { key: "booking_id", header: "Booking ID" },
        { key: "payment_gateway", header: "Gateway", className: "capitalize" },
        { key: "payment_method", header: "Method", className: "capitalize" },
        { key: "paid_amount", header: "Paid Amount", render: (r) => money(r.paid_amount) },
        { key: "payment_date", header: "Payment Date", render: (r) => (r.payment_date ? formatDate(String(r.payment_date)) : "-") },
        { key: "payment_status", header: "Payment Status", className: "capitalize" },
        { key: "failed_payment_reason", header: "Failure Reason" },
        { key: "refund_status", header: "Refund Status", className: "capitalize" },
      ];
    case "supplier-report":
      return [
        { key: "supplier_name", header: "Supplier", className: "font-semibold text-dash-text" },
        { key: "company_name", header: "Company Name" },
        { key: "registration_date", header: "Registered", render: (r) => (r.registration_date ? formatDate(String(r.registration_date)) : "-") },
        { key: "verification_status", header: "Verification", className: "capitalize" },
        { key: "active_tours", header: "Active Tours" },
        { key: "total_bookings", header: "Bookings" },
        { key: "gross_sales", header: "Gross Sales", render: (r) => money(r.gross_sales) },
        { key: "commission_deducted", header: "Commission", render: (r) => money(r.commission_deducted) },
        { key: "amount_paid", header: "Paid", render: (r) => money(r.amount_paid) },
        { key: "outstanding_payable", header: "Outstanding", className: "text-amber-700", render: (r) => money(r.outstanding_payable) },
        { key: "supplier_status", header: "Status", className: "capitalize" },
      ];
    case "supplier-payout-report":
      return [
        { key: "payout_id", header: "Payout ID", className: "font-bold text-dash-text" },
        { key: "supplier", header: "Supplier" },
        { key: "payout_period", header: "Payout Period" },
        { key: "total_booking_amount", header: "Total Booking Amount", render: (r) => money(r.total_booking_amount) },
        { key: "commission", header: "Commission", render: (r) => money(r.commission) },
        { key: "refund_deductions", header: "Refund Deductions", render: (r) => money(r.refund_deductions) },
        { key: "other_adjustments", header: "Other Adjustments", render: (r) => money(r.other_adjustments) },
        { key: "net_payable", header: "Net Payable", className: "font-bold text-emerald-700", render: (r) => money(r.net_payable) },
        { key: "payment_reference", header: "Reference" },
        { key: "payout_status", header: "Status", className: "capitalize" },
        { key: "paid_date", header: "Paid Date", render: (r) => (r.paid_date ? formatDate(String(r.paid_date)) : "-") },
      ];
    case "tour-performance-report":
      return [
        { key: "tour_name", header: "Tour", className: "font-semibold text-dash-text" },
        { key: "supplier", header: "Supplier" },
        { key: "destination", header: "Destination" },
        { key: "category", header: "Category" },
        { key: "views", header: "Views" },
        { key: "enquiries", header: "Enquiries" },
        { key: "bookings", header: "Bookings" },
        { key: "confirmed_travellers", header: "Confirmed Travellers" },
        { key: "booking_conversion_rate", header: "Conversion Rate" },
        { key: "cancellation_rate", header: "Cancellation Rate" },
        { key: "revenue", header: "Revenue", render: (r) => money(r.revenue) },
        { key: "average_rating", header: "Avg Rating", render: (r) => (r.average_rating == null ? "-" : String(r.average_rating)) },
      ];
    case "cancellation-refund-report":
      return [
        { key: "booking_id", header: "Booking ID", className: "font-bold text-dash-text" },
        { key: "tour", header: "Tour" },
        { key: "customer", header: "Customer" },
        { key: "supplier", header: "Supplier" },
        { key: "cancellation_date", header: "Cancelled At", render: (r) => (r.cancellation_date ? formatDate(String(r.cancellation_date)) : "-") },
        { key: "cancelled_by", header: "Cancelled By", className: "capitalize" },
        { key: "cancellation_reason", header: "Reason" },
        { key: "booking_amount", header: "Booking Amount", render: (r) => money(r.booking_amount) },
        { key: "cancellation_charge", header: "Cancellation Charge", render: (r) => (r.cancellation_charge === "-" ? "-" : money(r.cancellation_charge)) },
        { key: "refundable_amount", header: "Refundable", render: (r) => (r.refundable_amount === "-" ? "-" : money(r.refundable_amount)) },
        { key: "refund_status", header: "Refund Status", className: "capitalize" },
        { key: "refund_date", header: "Refund Date", render: (r) => (r.refund_date ? formatDate(String(r.refund_date)) : "-") },
      ];
    case "summary":
    default:
      return [
        { key: "total_bookings", header: "Total Bookings" },
        { key: "confirmed_bookings", header: "Confirmed" },
        { key: "cancelled_bookings", header: "Cancelled" },
        { key: "captured_revenue", header: "Revenue", render: (r) => money(r.captured_revenue) },
        { key: "pending_payments", header: "Pending", render: (r) => money(r.pending_payments) },
        { key: "invoice_total", header: "Invoiced", render: (r) => money(r.invoice_total) },
      ];
  }
}

async function fetchReportRows(reportType: ReportType, periodParams: { period: ReportPeriod; start_date?: string; end_date?: string }): Promise<ReportRow[]> {
  switch (reportType) {
    case "bookings": return (await getBookingReport(periodParams)) as unknown as ReportRow[];
    case "payments": return (await getPaymentReport(periodParams)) as unknown as ReportRow[];
    case "pending-payments": return (await getPendingPaymentsReport()) as unknown as ReportRow[];
    case "overdue-payments": return (await getOverduePaymentsReport()) as unknown as ReportRow[];
    case "country-wise": return (await getCountryWiseReport(periodParams)) as unknown as ReportRow[];
    case "cancellations": return (await getCancellationsReport(periodParams)) as unknown as ReportRow[];
    case "suppliers": return (await getSupplierReport(periodParams)) as unknown as ReportRow[];
    case "agents": return (await getAgentReport(periodParams)) as unknown as ReportRow[];
    case "customers": return (await getCustomerReport(periodParams)) as unknown as ReportRow[];
    case "booking-report": return (await getBookingDetailReport(periodParams)) as unknown as ReportRow[];
    case "payment-report": return (await getPaymentDetailReport(periodParams)) as unknown as ReportRow[];
    case "supplier-report": return (await getSupplierDetailReport(periodParams)) as unknown as ReportRow[];
    case "supplier-payout-report": return (await getSupplierPayoutReport()) as unknown as ReportRow[];
    case "tour-performance-report": return (await getTourPerformanceReport()) as unknown as ReportRow[];
    case "cancellation-refund-report": return (await getCancellationRefundReport(periodParams)) as unknown as ReportRow[];
    case "sales-revenue-report": {
      const report = await getSalesRevenueReport(periodParams);
      const { time_series: _timeSeries, ...totals } = report;
      return [totals as unknown as ReportRow];
    }
    case "summary":
    default: {
      const summary = await getReportSummary(periodParams);
      return [summary as unknown as ReportRow];
    }
  }
}

// page
export default function ReportsPage() {
  const toast = useToast();
  const { format: money, formatCompact } = useCurrency();
  const [data, setData] = useState<ReportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportType, setReportType] = useState<ReportType>("summary");
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [salesTimeSeries, setSalesTimeSeries] = useState<SalesRevenueReport["time_series"]>([]);
  const [rowsPage, setRowsPage] = useState(1);
  const rowsPageSize = 10;

  const reportMeta = REPORT_TYPES.find((r) => r.value === reportType)!;
  const columns = useMemo(() => {
    const serialColumn: DataTableColumn<ReportRow> = {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (rowsPage - 1) * rowsPageSize + index + 1,
    };
    return [serialColumn, ...buildColumns(reportType, money)];
  }, [reportType, money, rowsPage]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReportSnapshot()
      .then((d) => { if (active) { setData(d); setError(""); } })
      .catch(() => { if (active) setError("Could not load report snapshot."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const fetchRows = useCallback(async () => {
    setRowsLoading(true);
    setRowsError("");
    try {
      const periodParams = reportMeta.periodAware
        ? { period, start_date: customStart, end_date: customEnd }
        : { period: "all" as ReportPeriod };
      if (reportType === "sales-revenue-report") {
        const report = await getSalesRevenueReport(periodParams);
        const { time_series, ...totals } = report;
        setRows([totals as unknown as ReportRow]);
        setSalesTimeSeries(time_series);
      } else {
        const result = await fetchReportRows(reportType, periodParams);
        setRows(result);
        setSalesTimeSeries([]);
      }
      setRowsPage(1);
    } catch {
      setRowsError("Could not load this report.");
      setRows([]);
      setSalesTimeSeries([]);
    } finally {
      setRowsLoading(false);
    }
  }, [reportType, period, customStart, customEnd, reportMeta.periodAware]);

  useEffect(() => {
    if (period === "custom" && reportMeta.periodAware && (!customStart || !customEnd)) return;
    void fetchRows();
  }, [fetchRows, period, customStart, customEnd, reportMeta.periodAware]);

  async function handleExport() {
    setExporting(true);
    try {
      const periodParams = reportMeta.periodAware
        ? { period, start_date: customStart, end_date: customEnd }
        : { period: "all" as ReportPeriod };
      await exportReportCsv(reportType, periodParams);
      toast.success("Export downloaded.");
    } catch {
      toast.error("Could not export this report.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ModuleWrapper title="Reports" requiredPermission="reports.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-dash-text">Reports</h1>
          <p className="mt-1 text-sm font-medium text-dash-muted">Live analytics across bookings, revenue, suppliers and agents.</p>
        </div>

        {loading && <Loader label="Loading reports..." />}
        {error   && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">

            {/* left: snapshot cards */}
            <div className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <div className="mb-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-base font-bold text-dash-text"><TrendingUp size={16} /> Reports Snapshot</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <SnapshotCard
                  title="Booking Performance"
                  status="ready"
                  value={data.booking_performance.total}
                  sub={changeBadge(data.booking_performance.change_pct) ?? "No change this month"}
                />

                <SnapshotCard
                  title="Revenue Summary"
                  status="ready"
                  value={formatCompact(data.revenue_summary.total_raw)}
                  sub={changeBadge(data.revenue_summary.change_pct) ?? "No change this month"}
                />

                <SnapshotCard
                  title="Supplier Approval"
                  status={data.supplier_approval.pending > 0 ? "review" : "ready"}
                  value={data.supplier_approval.total}
                  sub={
                    data.supplier_approval.pending > 0
                      ? `${data.supplier_approval.pending} pending`
                      : "All approved"
                  }
                />

                <SnapshotCard
                  title="Agent Sales"
                  status="ready"
                  value={data.agent_sales.total}
                  sub={changeBadge(data.agent_sales.change_pct) ?? "No change this month"}
                />

                <SnapshotCard
                  title="Payment Collection"
                  status={data.payment_collection.pending_pct > 5 ? "review" : "ready"}
                  value={`${data.payment_collection.collected_pct}%`}
                  sub={
                    data.payment_collection.pending_pct > 0
                      ? `${data.payment_collection.pending_pct}% pending`
                      : "Fully collected"
                  }
                />

                <SnapshotCard
                  title="Country-wise Bookings"
                  status="ready"
                  value={data.country_wise.country_count}
                  sub="countries"
                />

              </div>
            </div>

            {/* right: stats + recent exports */}
            <div className="flex flex-col gap-4">

              {/* Stats strip */}
              <div className="flex divide-x divide-dash-border-soft rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                {[
                  { label: "Reports",   value: data.meta.report_types },
                  { label: "Scheduled", value: data.meta.scheduled },
                  { label: "Exports",   value: data.meta.total_exports },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-1 flex-col items-center py-4">
                    <span className="text-2xl font-bold text-dash-text">{value}</span>
                    <span className="mt-0.5 text-xs text-dash-muted">{label}</span>
                  </div>
                ))}
              </div>

              {/* Recent Exports */}
              <div className="flex-1 rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                <h3 className="mb-4 text-sm font-bold text-dash-text">Recent Exports</h3>

                {data.recent_exports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm text-dash-muted">No exports yet.</p>
                    <p className="mt-1 text-xs text-dash-subtle">
                      Run a report export and it will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.recent_exports.map((ex) => (
                      <li key={ex.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-dash-body">{ex.label}</p>
                          <p className="text-xs text-dash-subtle">{formatDate(ex.exported_at)}</p>
                        </div>
                        <FormatBadge format={ex.format} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}

        {/* detailed / filterable reports */}
        <section className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] print:border-none print:p-0 print:shadow-none">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
            <div>
              <h2 className="text-lg font-black text-dash-text">Detailed Reports</h2>
              <p className="text-xs font-medium text-dash-subtle">Filter by period, view the data, and export or print it.</p>
            </div>
            <div className="flex gap-2">
              <PrintButton label={`${reportMeta.label} (${period})`} />
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={exporting || rowsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:opacity-60"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export CSV
              </button>
            </div>
          </div>

          {/* Report type tabs */}
          <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-dash-border bg-dash-bg p-1.5 print:hidden">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setReportType(rt.value)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  reportType === rt.value ? "bg-dash-brand text-white shadow-sm" : "text-dash-body hover:bg-white"
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Period filter */}
          {reportMeta.periodAware ? (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1 rounded-xl border border-dash-border bg-white p-1">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      period === p.value ? "bg-[#EDF5FF] text-dash-brand-hover" : "text-dash-muted hover:bg-dash-bg"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="flex items-center gap-2 print:hidden">
                  <DatePicker value={customStart} maxDate={customEnd || undefined} onChange={setCustomStart} placeholder="Start date" className="w-48" />
                  <span className="text-xs text-dash-subtle">to</span>
                  <DatePicker value={customEnd} minDate={customStart || undefined} onChange={setCustomEnd} placeholder="End date" className="w-48" align="right" />
                </div>
              )}
            </div>
          ) : (
            <p className="mb-5 text-xs font-semibold text-dash-subtle">
              This report always shows current outstanding records, not a date range.
            </p>
          )}

          {rowsError && <p className="mb-3 text-sm text-red-600">{rowsError}</p>}

          {reportType === "sales-revenue-report" && salesTimeSeries.length > 0 && (
            <div className="mb-5 h-64 w-full rounded-xl border border-dash-border p-4 print:hidden">
              <p className="mb-2 text-xs font-bold uppercase text-dash-subtle">Sales trend</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTimeSeries.map((point) => ({ period: point.period, sales: Number(point.sales) }))} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EAF0" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#667085" }} />
                  <Tooltip cursor={{ fill: "#F7F9FC" }} contentStyle={{ borderRadius: "10px", border: "1px solid #E7EAF0" }} formatter={(value) => money(value as number)} />
                  <Bar dataKey="sales" fill="#43A9F6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <DataTable
            ariaLabel={reportMeta.label}
            columns={columns}
            rows={rows
              .map((row, index) => ({ ...row, id: index }))
              .slice((rowsPage - 1) * rowsPageSize, rowsPage * rowsPageSize)}
            loading={rowsLoading}
            page={rowsPage}
            pageSize={rowsPageSize}
            total={rows.length}
            totalPages={Math.max(1, Math.ceil(rows.length / rowsPageSize))}
            onPageChange={setRowsPage}
            emptyTitle="No data for this report/period"
            emptyDescription="Try a different period or report type."
          />
        </section>

        <ReportScheduleSection />
      </div>
    </ModuleWrapper>
  );
}
