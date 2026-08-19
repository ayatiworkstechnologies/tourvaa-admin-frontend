"use client";

import { useCallback, useEffect, useState } from "react";
import { LuChartColumn as ChartColumn, LuDownload as Download, LuLoaderCircle as Loader2, LuPrinter as Printer } from "react-icons/lu";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import Loader from "@/components/ui/Loader";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";
import {
  exportReportCsv,
  getMyBookingsReport,
  getMyEarningsReport,
  getMyTravellersReport,
  MyBookingRow,
  MyEarningsReport,
  MyTravellerRow,
} from "@/lib/api/services/reportService";

type SupplierReportType = "my-bookings" | "my-earnings" | "my-travellers";

const REPORT_TABS: { value: SupplierReportType; label: string }[] = [
  { value: "my-bookings", label: "My Booking Report" },
  { value: "my-earnings", label: "Earnings Report" },
  { value: "my-travellers", label: "Traveller Report" },
];

const BOOKING_STATUS_OPTIONS = ["", "confirmed", "ongoing", "completed", "cancelled", "declined", "pending_supplier_acceptance"];
const PAYMENT_STATUS_OPTIONS = ["", "unpaid", "authorized", "partially_paid", "paid", "refunded"];

function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function EarningsSummary({ report, money }: { report: MyEarningsReport; money: (v: string | number) => string }) {
  const cards = [
    { label: "Total Sales", value: report.total_sales, tone: "text-dash-text" },
    { label: "Platform Commission", value: report.platform_commission, tone: "text-amber-700" },
    { label: "Refund Deductions", value: report.refund_deductions, tone: "text-red-600" },
    { label: "Adjustments", value: report.adjustments, tone: "text-dash-text" },
    { label: "Net Earnings", value: report.net_earnings, tone: "text-emerald-700 font-black" },
    { label: "Paid Earnings", value: report.paid_earnings, tone: "text-emerald-700" },
    { label: "Pending Earnings", value: report.pending_earnings, tone: "text-amber-700" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-[#DCEBE2] bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B8074]">{card.label}</p>
          <p className={`mt-1 text-lg ${card.tone}`}>{money(card.value)}</p>
        </div>
      ))}
    </div>
  );
}

export default function SupplierReportsPage() {
  const { format: money } = useCurrency();
  const toast = useToast();
  const [reportType, setReportType] = useState<SupplierReportType>("my-bookings");
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [bookingRows, setBookingRows] = useState<MyBookingRow[]>([]);
  const [earnings, setEarnings] = useState<MyEarningsReport | null>(null);
  const [travellerRows, setTravellerRows] = useState<MyTravellerRow[]>([]);
  const [rowsPage, setRowsPage] = useState(1);
  const rowsPageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (reportType === "my-bookings") {
        const rows = await getMyBookingsReport({ booking_status: bookingStatus, payment_status: paymentStatus });
        setBookingRows(rows);
      } else if (reportType === "my-earnings") {
        const report = await getMyEarningsReport();
        setEarnings(report);
      } else {
        const rows = await getMyTravellersReport();
        setTravellerRows(rows);
      }
      setRowsPage(1);
    } catch {
      setError("Could not load this report.");
    } finally {
      setLoading(false);
    }
  }, [reportType, bookingStatus, paymentStatus]);

  useEffect(() => { void load(); }, [load]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportReportCsv(reportType, { period: "all" });
      toast.success("Export downloaded.");
    } catch {
      toast.error("Could not export this report.");
    } finally {
      setExporting(false);
    }
  }

  const bookingColumns: DataTableColumn<MyBookingRow>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (rowsPage - 1) * rowsPageSize + index + 1,
    },
    { key: "booking_code", header: "Booking ID", className: "font-bold text-[#153426]" },
    { key: "customer_or_agent", header: "Customer/Agent" },
    { key: "tour_name", header: "Tour" },
    { key: "booking_date", header: "Booking Date", render: (r) => formatDate(r.booking_date) },
    { key: "travel_date", header: "Travel Date", render: (r) => r.travel_date || "-" },
    { key: "adults", header: "Adults" },
    { key: "children", header: "Children" },
    { key: "total_amount", header: "Amount", render: (r) => money(r.total_amount) },
    { key: "booking_status", header: "Booking Status", className: "capitalize" },
    { key: "payment_status", header: "Payment Status", className: "capitalize" },
    { key: "special_requests", header: "Special Requests", render: (r) => r.special_requests || "-" },
  ];

  const travellerColumns: DataTableColumn<MyTravellerRow>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (rowsPage - 1) * rowsPageSize + index + 1,
    },
    { key: "booking_id", header: "Booking ID", className: "font-bold text-[#153426]" },
    { key: "traveller_name", header: "Traveller" },
    { key: "contact_information", header: "Contact", render: (r) => r.contact_information || "-" },
    { key: "travel_date", header: "Travel Date", render: (r) => r.travel_date || "-" },
    { key: "number_of_travellers", header: "Travellers" },
    { key: "pickup_location", header: "Pickup Location", render: (r) => r.pickup_location || "-" },
    { key: "emergency_contact", header: "Emergency Contact", render: (r) => r.emergency_contact || "-" },
    { key: "special_requirements", header: "Special Requirements", render: (r) => r.special_requirements || "-" },
    { key: "booking_status", header: "Booking Status", className: "capitalize" },
  ];

  return (
    <SupplierPageShell>
      <SupplierPageHeader
        title="Reports"
        description="Your own bookings, earnings, and traveller details - never another supplier's data."
        icon={ChartColumn}
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]">
        <div className="flex flex-col gap-4 border-b border-[#E5EFE9] p-5 lg:flex-row lg:items-center lg:justify-between print:hidden">
          <div className="flex flex-wrap gap-1 rounded-xl border border-[#DCEBE2] bg-[#F5FAF7] p-1.5">
            {REPORT_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setReportType(tab.value)}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${
                  reportType === tab.value ? "bg-[#16833A] text-white shadow-sm" : "text-[#4B6156] hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-[#DCEBE2] px-4 py-2.5 text-sm font-bold text-[#4B6156] hover:bg-[#F5FAF7]">
              <Printer size={15} /> Print
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#117331] disabled:opacity-60"
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export CSV
            </button>
          </div>
        </div>

        {reportType === "my-bookings" && (
          <div className="flex flex-wrap gap-3 border-b border-[#E5EFE9] p-5 print:hidden">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6B8074]">Booking Status</span>
              <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} className="h-10 rounded-xl border border-[#D5E4DB] bg-white px-3 text-xs font-semibold text-[#365545] outline-none focus:border-[#16833A]">
                {BOOKING_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.replaceAll("_", " ") : "All statuses"}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6B8074]">Payment Status</span>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="h-10 rounded-xl border border-[#D5E4DB] bg-white px-3 text-xs font-semibold text-[#365545] outline-none focus:border-[#16833A]">
                {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.replaceAll("_", " ") : "All statuses"}</option>)}
              </select>
            </label>
          </div>
        )}

        <div className="p-5">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {loading ? (
            <Loader label="Loading report..." />
          ) : reportType === "my-earnings" ? (
            earnings && <EarningsSummary report={earnings} money={money} />
          ) : reportType === "my-bookings" ? (
            <DataTable
              ariaLabel="My Booking Report"
              columns={bookingColumns}
              rows={bookingRows
                .map((row, index) => ({ ...row, id: index }))
                .slice((rowsPage - 1) * rowsPageSize, rowsPage * rowsPageSize)}
              page={rowsPage}
              pageSize={rowsPageSize}
              total={bookingRows.length}
              totalPages={Math.max(1, Math.ceil(bookingRows.length / rowsPageSize))}
              onPageChange={setRowsPage}
              emptyTitle="No bookings found"
              emptyDescription="Bookings for your tours will appear here."
            />
          ) : (
            <DataTable
              ariaLabel="Traveller Report"
              columns={travellerColumns}
              rows={travellerRows
                .map((row, index) => ({ ...row, id: index }))
                .slice((rowsPage - 1) * rowsPageSize, rowsPage * rowsPageSize)}
              page={rowsPage}
              pageSize={rowsPageSize}
              total={travellerRows.length}
              totalPages={Math.max(1, Math.ceil(travellerRows.length / rowsPageSize))}
              onPageChange={setRowsPage}
              emptyTitle="No travellers found"
              emptyDescription="Travellers on your bookings will appear here."
            />
          )}
        </div>
      </div>
    </SupplierPageShell>
  );
}
