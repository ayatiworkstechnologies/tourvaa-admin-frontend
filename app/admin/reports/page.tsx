"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuDownload as Download, LuLoaderCircle as Loader2, LuTrendingUp as TrendingUp } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import {
  exportReportCsv,
  getAgentReport,
  getBookingReport,
  getCancellationsReport,
  getCountryWiseReport,
  getCustomerReport,
  getOverduePaymentsReport,
  getPaymentReport,
  getPendingPaymentsReport,
  getReportSnapshot,
  getReportSummary,
  getSupplierReport,
  REPORT_TYPES,
  ReportPeriod,
  ReportSnapshot,
  ReportType,
} from "@/lib/services/reportService";
import { useToast } from "@/hooks/useToast";

// helpers
function formatRevenue(raw: number): string {
  if (raw >= 10_000_000) return `₹${(raw / 10_000_000).toFixed(1)}Cr`;
  if (raw >= 100_000)    return `₹${(raw / 100_000).toFixed(1)}L`;
  if (raw >= 1_000)      return `₹${(raw / 1_000).toFixed(1)}K`;
  return `₹${raw.toFixed(0)}`;
}

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
    <div className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#344054]">{title}</span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-3xl font-bold text-[#175CD3]">{value}</p>
      <p className="mt-1 text-sm text-[#667085]">{sub}</p>
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
  const cls = FORMAT_COLORS[format] ?? "bg-[#F2F4F7] text-[#344054]";
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

// report row types (loose — different report types have different shapes)
type ReportRow = Record<string, string | number | null>;

function money(value: unknown) {
  const num = Number(value ?? 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildColumns(reportType: ReportType): DataTableColumn<ReportRow>[] {
  switch (reportType) {
    case "bookings":
      return [
        { key: "status", header: "Booking Status", className: "capitalize font-semibold text-[#121826]" },
        { key: "count", header: "Count" },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ];
    case "payments":
      return [
        { key: "status", header: "Payment Status", className: "capitalize font-semibold text-[#121826]" },
        { key: "count", header: "Count" },
        { key: "captured", header: "Captured", className: "text-emerald-700", render: (r) => money(r.captured) },
        { key: "refunded", header: "Refunded", className: "text-purple-700", render: (r) => money(r.refunded) },
      ];
    case "pending-payments":
      return [
        { key: "booking_code", header: "Booking", className: "font-bold text-[#121826]" },
        { key: "payment_status", header: "Payment Status", className: "capitalize" },
        { key: "amount_pending", header: "Pending", className: "font-bold text-red-600", render: (r) => money(r.amount_pending) },
      ];
    case "overdue-payments":
      return [
        { key: "booking_code", header: "Booking", className: "font-bold text-[#121826]" },
        { key: "tour_start_date", header: "Tour Start" },
        { key: "amount_pending", header: "Pending", className: "font-bold text-red-600", render: (r) => money(r.amount_pending) },
      ];
    case "country-wise":
      return [
        { key: "country", header: "Country", className: "font-semibold text-[#121826]" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ];
    case "cancellations":
      return [
        { key: "booking_code", header: "Booking", className: "font-bold text-[#121826]" },
        { key: "reason", header: "Reason" },
        { key: "cancelled_at", header: "Cancelled At", render: (r) => (r.cancelled_at ? formatDate(String(r.cancelled_at)) : "-") },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ];
    case "suppliers":
      return [
        { key: "supplier_name", header: "Supplier", className: "font-semibold text-[#121826]" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Revenue", render: (r) => money(r.amount) },
      ];
    case "agents":
      return [
        { key: "agent_name", header: "Agent", className: "font-semibold text-[#121826]" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Revenue", render: (r) => money(r.amount) },
      ];
    case "customers":
      return [
        { key: "customer_name", header: "Customer", className: "font-semibold text-[#121826]" },
        { key: "bookings", header: "Bookings" },
        { key: "amount", header: "Spent", render: (r) => money(r.amount) },
        { key: "pending", header: "Pending", className: "text-amber-700", render: (r) => money(r.pending) },
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

  const reportMeta = REPORT_TYPES.find((r) => r.value === reportType)!;
  const columns = useMemo(() => buildColumns(reportType), [reportType]);

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
      const result = await fetchReportRows(reportType, periodParams);
      setRows(result);
    } catch {
      setRowsError("Could not load this report.");
      setRows([]);
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
          <h1 className="text-[28px] font-black tracking-tight text-[#121826]">Reports</h1>
          <p className="mt-1 text-sm font-medium text-[#667085]">Live analytics across bookings, revenue, suppliers and agents.</p>
        </div>

        {loading && <Loader label="Loading reports..." />}
        {error   && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">

            {/* left: snapshot cards */}
            <div className="rounded-2xl border border-[#E9EDF3] bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <div className="mb-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-base font-bold text-[#121826]"><TrendingUp size={16} /> Reports Snapshot</span>
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
                  value={formatRevenue(data.revenue_summary.total_raw)}
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
              <div className="flex divide-x divide-[#E9EDF3] rounded-2xl border border-[#E9EDF3] bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                {[
                  { label: "Reports",   value: data.meta.report_types },
                  { label: "Scheduled", value: data.meta.scheduled },
                  { label: "Exports",   value: data.meta.total_exports },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-1 flex-col items-center py-4">
                    <span className="text-2xl font-bold text-[#121826]">{value}</span>
                    <span className="mt-0.5 text-xs text-[#667085]">{label}</span>
                  </div>
                ))}
              </div>

              {/* Recent Exports */}
              <div className="flex-1 rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                <h3 className="mb-4 text-sm font-bold text-[#121826]">Recent Exports</h3>

                {data.recent_exports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm text-[#667085]">No exports yet.</p>
                    <p className="mt-1 text-xs text-[#98A2B3]">
                      Run a report export and it will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.recent_exports.map((ex) => (
                      <li key={ex.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#344054]">{ex.label}</p>
                          <p className="text-xs text-[#98A2B3]">{formatDate(ex.exported_at)}</p>
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
        <section className="rounded-2xl border border-[#E9EDF3] bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#121826]">Detailed Reports</h2>
              <p className="text-xs font-medium text-[#98A2B3]">Filter by period, view the data, and export it as CSV.</p>
            </div>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting || rowsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-[#2F9FE9] disabled:opacity-60"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export CSV
            </button>
          </div>

          {/* Report type tabs */}
          <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-[#E7EAF0] bg-[#F7F9FC] p-1.5">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setReportType(rt.value)}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  reportType === rt.value ? "bg-[#43A9F6] text-white shadow-sm" : "text-[#344054] hover:bg-white"
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Period filter */}
          {reportMeta.periodAware ? (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1 rounded-xl border border-[#E7EAF0] bg-white p-1">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      period === p.value ? "bg-[#EDF5FF] text-[#2F9FE9]" : "text-[#667085] hover:bg-[#F7F9FC]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    title="Start date"
                    aria-label="Start date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="rounded-xl border border-[#E7EAF0] px-3 py-1.5 text-xs outline-none focus:border-[#43A9F6]"
                  />
                  <span className="text-xs text-[#98A2B3]">to</span>
                  <input
                    type="date"
                    title="End date"
                    aria-label="End date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="rounded-xl border border-[#E7EAF0] px-3 py-1.5 text-xs outline-none focus:border-[#43A9F6]"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="mb-5 text-xs font-semibold text-[#98A2B3]">
              This report always shows current outstanding records, not a date range.
            </p>
          )}

          {rowsError && <p className="mb-3 text-sm text-red-600">{rowsError}</p>}

          <DataTable
            ariaLabel={reportMeta.label}
            columns={columns}
            rows={rows.map((row, index) => ({ ...row, id: index }))}
            loading={rowsLoading}
            emptyTitle="No data for this report/period"
            emptyDescription="Try a different period or report type."
          />
        </section>
      </div>
    </ModuleWrapper>
  );
}
