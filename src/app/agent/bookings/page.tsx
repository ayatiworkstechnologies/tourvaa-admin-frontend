"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuEye as Eye, LuPlane as Plane, LuRefreshCw as RefreshCw, LuCircleX as XCircle, LuFilter as Filter } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { AgentMetric, AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";
import { useCurrency } from "@/hooks/useCurrency";
import { bookingStatusLabel } from "@/lib/constants/bookingStatus";
import { API_DATA_UPDATED_EVENT } from "@/lib/api/events";

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  cancellation_source?: string | null;
  payment_status: string;
  payment_due_date?: string | null;
  payment_type?: string;
  agent_payment_method?: string | null;
  amount_paid?: string | number;
  amount_pending?: string | number;
  authorized_amount?: string | number;
  final_amount?: string | number;
  currency?: string;
};

// Keep this list at the booking-party level. Internal payment approval and
// supplier-allocation states are operational detail and do not belong in the
// Agent's booking filter.
const AGENT_BOOKING_FILTERS = [
  { value: "", cancellationSource: "", label: "All Booking Statuses" },
  { value: "pending_payment,pending_supplier_assignment,payment_authorized,pending_supplier_acceptance,supplier_accepted,supplier_reassignment_required,cancellation_requested", cancellationSource: "", label: "Booking Request Received" },
  { value: "confirmed,ready_to_travel,upcoming,postponed", cancellationSource: "", label: "Booking Confirmed" },
  { value: "ongoing", cancellationSource: "", label: "Ongoing" },
  { value: "completed", cancellationSource: "", label: "Completed" },
  { value: "cancelled", cancellationSource: "customer_request", label: "Cancelled by Customer" },
  { value: "cancelled,declined,refunded", cancellationSource: "admin,tourvaa_admin,system_expiry,agent_request,supplier_request,supplier_reassignment", label: "Cancelled by Tourvaa" },
];

const AGENT_PAYMENT_FILTERS = [
  { value: "", label: "All Payment Statuses" },
  { value: "unpaid", label: "Payment Required" },
  { value: "pending", label: "Pending Payment" },
  { value: "authorized", label: "Payment Authorized" },
  { value: "partially_paid", label: "Deposit Paid" },
  { value: "paid", label: "Fully Paid" },
  { value: "failed", label: "Payment Failed" },
  { value: "refund_pending", label: "Refund Pending" },
  { value: "partially_refunded", label: "Partially Refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "voided", label: "Voided" },
];

function agentBookingStatusLabel(status?: string, cancellationSource?: string | null) {
  return bookingStatusLabel(status, "agent", cancellationSource);
}

function agentPaymentStatusLabel(status?: string) {
  const value = (status || "").toLowerCase();
  if (["partial", "partially_paid"].includes(value)) return "Deposit Paid";
  if (value === "authorized") return "Payment Authorized";
  if (value === "paid") return "Fully Paid";
  return value ? value.replaceAll("_", " ") : "-";
}

function agentBookingMethodLabel(booking: Booking) {
  if (["pay_later", "credit", "bank_transfer"].includes((booking.agent_payment_method || "").toLowerCase())) return "Reserve now";
  if ((booking.payment_type || "").toLowerCase() === "deposit") return "Deposit";
  if (["full", "full_payment"].includes((booking.payment_type || "").toLowerCase())) return "Pay in full";
  return "-";
}

function dateText(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status?: string) {
  const v = (status || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["unpaid", "pending", "partial", "partially_paid", "authorized", "pending_payment", "pending_supplier_assignment", "payment_authorized", "pending_supplier_acceptance", "supplier_reassignment_required", "cancellation_requested", "refund_pending"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["cancelled", "declined", "failed"].includes(v)) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-700";
}

function Pill({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(status)}`}>
      {children}
    </span>
  );
}

export default function AgentBookingsPage() {
  const { code: displayCurrency, format: displayMoney, formatExact: recordedMoney } = useCurrency();
  // The table follows the currency chosen in the portal header so agents can
  // compare bookings consistently. Keep the actual settled value on hover;
  // that amount remains the accounting source of truth.
  const money = (value: string | number | undefined, currency = "USD") => {
    if (value === undefined || value === null) return "-";
    const displayed = displayMoney(value, currency);
    const recorded = recordedMoney(value, currency);
    return displayed === recorded ? displayed : <span title={`Recorded settlement amount: ${recorded}`}>{displayed}</span>;
  };
  const balanceDue = (booking: Booking) => {
    const paymentStatus = (booking.payment_status || "").toLowerCase();
    const pending = Number(booking.amount_pending || 0);
    const authorized = Number(booking.authorized_amount || 0);

    if (paymentStatus === "voided") return <span className="text-slate-500">Voided</span>;
    if (paymentStatus === "refunded") return <span className="text-slate-500">Refunded</span>;
    if (paymentStatus === "partially_refunded") return <span className="text-slate-500">Partially refunded</span>;
    if (paymentStatus === "refund_pending") return <span className="text-amber-700">Refund pending</span>;

    if (paymentStatus === "authorized") {
      const stillDue = Math.max(0, pending - authorized);
      if (stillDue === 0 && authorized > 0) {
        return <span className="text-sky-700">Covered by authorization</span>;
      }
      return stillDue > 0 ? money(stillDue, booking.currency) : <span className="text-slate-500">-</span>;
    }

    if (pending > 0) return money(pending, booking.currency);
    if (paymentStatus === "paid") return <span className="text-emerald-700">Paid in full</span>;
    return <span className="text-slate-500">-</span>;
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancellationSourceFilter, setCancellationSourceFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const limit = 10;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, unknown> = { limit, page };
        if (statusFilter) params.booking_status = statusFilter;
        if (cancellationSourceFilter) params.cancellation_source = cancellationSourceFilter;
        if (paymentFilter) params.payment_status = paymentFilter;
        const res = await api.get("/bookings", { params });
        if (!active) return;
        setBookings(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        setStatusCounts(res.data?.status_counts ?? {});
      } catch {
        if (active) {
          setBookings([]);
          setError("Bookings could not be loaded. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page, statusFilter, cancellationSourceFilter, paymentFilter, retryKey]);

  // Supplier decisions arrive as Agent notifications. Refresh an open list
  // in place when the shared portal listener receives that event.
  useEffect(() => {
    const refreshBookings = () => setRetryKey((value) => value + 1);
    window.addEventListener(API_DATA_UPDATED_EVENT, refreshBookings);
    return () => window.removeEventListener(API_DATA_UPDATED_EVENT, refreshBookings);
  }, []);

  const totalPages = Math.ceil(total / limit) || 1;

  function handleStatus(value: string) {
    const selected = AGENT_BOOKING_FILTERS.find((filter) => filter.value === value) || AGENT_BOOKING_FILTERS[0];
    setStatusFilter(selected.value);
    setCancellationSourceFilter(selected.cancellationSource);
    setPage(1);
  }

  function handlePaymentStatus(status: string) {
    setPaymentFilter(status);
    setPage(1);
  }

  const stats = [
    { label: "Total Bookings", value: Object.values(statusCounts).reduce((sum, count) => sum + count, 0), icon: CalendarCheck, tone: "bg-blue-50 text-blue-700" },
    { label: "Confirmed", value: (statusCounts.confirmed ?? 0) + (statusCounts.upcoming ?? 0) + (statusCounts.ongoing ?? 0), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Ready to Travel", value: statusCounts.ready_to_travel ?? 0, icon: Plane, tone: "bg-sky-50 text-sky-700" },
    { label: "Booking Requests", value: (statusCounts.pending_payment ?? 0) + (statusCounts.pending_supplier_assignment ?? 0) + (statusCounts.payment_authorized ?? 0) + (statusCounts.pending_supplier_acceptance ?? 0) + (statusCounts.supplier_accepted ?? 0) + (statusCounts.supplier_reassignment_required ?? 0), icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Cancelled", value: (statusCounts.cancelled ?? 0) + (statusCounts.declined ?? 0) + (statusCounts.refunded ?? 0), icon: XCircle, tone: "bg-rose-50 text-rose-700" },
  ];

  const columns: DataTableColumn<Booking>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * limit + index + 1,
    },
    { key: "code", header: "Code", render: (b) => <Link href={`/agent/bookings/${b.id}`} className="hover:text-dash-brand hover:underline">{b.booking_code}</Link>, className: "font-bold text-dash-text" },
    { key: "customer", header: "Customer", render: (b) => b.customer_name ?? "-", className: "hidden text-dash-muted sm:table-cell" },
    { key: "tour", header: "Tour", render: (b) => b.tour_name ?? "-", className: "hidden max-w-[180px] truncate text-dash-muted md:table-cell" },
    { key: "date", header: "Date", render: (b) => dateText(b.tour_date), className: "hidden text-dash-muted lg:table-cell" },
    { key: "status", header: "Booking Status", render: (b) => <Pill status={b.booking_status}>{agentBookingStatusLabel(b.booking_status, b.cancellation_source)}</Pill> },
    { key: "payment", header: "Payment Status", render: (b) => <Pill status={b.payment_status}>{agentPaymentStatusLabel(b.payment_status)}</Pill>, className: "hidden xl:table-cell" },
    { key: "payment_method", header: "Payment Plan", render: (b) => agentBookingMethodLabel(b), className: "hidden whitespace-nowrap text-dash-muted xl:table-cell" },
    { key: "paid", header: "Paid", render: (b) => money(b.amount_paid, b.currency), className: "hidden text-right text-dash-muted xl:table-cell" },
    {
      key: "balance_due",
      header: "Balance Due",
      render: balanceDue,
      className: "hidden text-right font-semibold text-amber-700 xl:table-cell",
    },
    { key: "due_date", header: "Due Date", render: (b) => dateText(b.payment_due_date), className: "hidden text-dash-muted lg:table-cell" },
    { key: "total", header: "Total", render: (b) => money(b.final_amount, b.currency), className: "hidden text-right font-bold text-dash-text xl:table-cell" },
  ];

  return (
    <AgentPageShell>
      <AgentPageHeader
        title="Bookings"
        description="Track every customer booking from payment through Tourvaa confirmation and travel completion."
        icon={CalendarCheck}
        eyebrow="Booking Operations"
      />

      {/* Stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon, tone }) => <AgentMetric key={label} label={label} value={value} icon={icon} tone={tone} />)}
      </div>

      <AgentSection className="mt-4">
      <div className="flex flex-col gap-3 border-b border-[#E7EDF6] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-dash-subtle" />
          <label className="sr-only" htmlFor="agent-booking-status-filter">Booking Status</label>
          <select
            id="agent-booking-status-filter"
            value={statusFilter}
            onChange={(event) => handleStatus(event.target.value)}
            className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
          >
            {AGENT_BOOKING_FILTERS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="sr-only" htmlFor="agent-payment-status-filter">Payment Status</label>
          <select
            id="agent-payment-status-filter"
            value={paymentFilter}
            onChange={(event) => handlePaymentStatus(event.target.value)}
            className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-text outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
          >
            {AGENT_PAYMENT_FILTERS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 rounded-xl bg-[#EDF5FF] px-4 py-2 text-sm font-bold text-dash-brand-hover">
            <span>{total} booking{total !== 1 ? "s" : ""}</span>
            <span className="text-xs font-medium text-dash-muted">Amounts shown in {displayCurrency}; hover to see the recorded settlement amount.</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div>
        {error && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"><span>{error}</span><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm ring-1 ring-rose-200"><RefreshCw size={13} />Retry</button></div>}
        <DataTable
          ariaLabel="Bookings"
          columns={columns}
          rows={bookings}
          loading={loading}
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle="No bookings found"
          emptyDescription="Bookings created from the public tour checkout will appear here."
          emptyAction={
              <Link
                href="/agent/tours"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover transition-all shadow-sm"
              >
                Browse Tours
              </Link>
          }
          actions={(b) => (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/agent/bookings/${b.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-semibold text-dash-body shadow-sm hover:bg-[#F3F8FC] hover:text-dash-brand transition-all"
              >
                <Eye size={14} /> View
              </Link>
            </div>
          )}
        />
      </div>
      </AgentSection>
    </AgentPageShell>
  );
}
