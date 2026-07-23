"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuEye as Eye, LuPlus as Plus, LuRefreshCw as RefreshCw, LuCircleX as XCircle } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { AgentMetric, AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  final_amount?: string | number;
  currency?: string;
};

const STATUSES = [
  "all",
  "draft",
  "pending_payment",
  "pending_credit_approval",
  "pending_supplier_assignment",
  "payment_authorized",
  "pending_supplier_acceptance",
  "supplier_reassignment_required",
  "confirmed",
  "ready_to_travel",
  "upcoming",
  "ongoing",
  "postponed",
  "cancellation_requested",
  "completed",
  "cancelled",
  "declined",
  "refunded",
];

function money(value: string | number | undefined, currency = "USD") {
  if (!value && value !== 0) return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
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
  if (["pending", "partial", "partially_paid", "pending_payment", "pending_credit_approval", "pending_supplier_assignment", "payment_authorized", "pending_supplier_acceptance", "supplier_reassignment_required", "cancellation_requested", "bank_transfer_pending", "credit_approval_pending"].includes(v)) return "bg-amber-50 text-amber-700";
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
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
        if (statusFilter !== "all") params.booking_status = statusFilter;
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
  }, [page, statusFilter, retryKey]);

  const totalPages = Math.ceil(total / limit) || 1;

  function handleStatus(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  const stats = [
    { label: "Total Bookings", value: Object.values(statusCounts).reduce((sum, count) => sum + count, 0), icon: CalendarCheck, tone: "bg-blue-50 text-blue-700" },
    { label: "Confirmed", value: (statusCounts.confirmed ?? 0) + (statusCounts.ready_to_travel ?? 0) + (statusCounts.upcoming ?? 0) + (statusCounts.ongoing ?? 0), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Pending", value: (statusCounts.pending_payment ?? 0) + (statusCounts.pending_credit_approval ?? 0) + (statusCounts.pending_supplier_assignment ?? 0) + (statusCounts.payment_authorized ?? 0) + (statusCounts.pending_supplier_acceptance ?? 0) + (statusCounts.supplier_reassignment_required ?? 0) + (statusCounts.cancellation_requested ?? 0), icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Cancelled", value: (statusCounts.cancelled ?? 0) + (statusCounts.declined ?? 0) + (statusCounts.refunded ?? 0), icon: XCircle, tone: "bg-rose-50 text-rose-700" },
  ];

  const columns: DataTableColumn<Booking>[] = [
    { key: "code", header: "Code", render: (b) => <Link href={`/agent/bookings/${b.id}`} className="hover:text-dash-brand hover:underline">{b.booking_code}</Link>, className: "font-bold text-dash-text" },
    { key: "customer", header: "Customer", render: (b) => b.customer_name ?? "-", className: "hidden text-dash-muted sm:table-cell" },
    { key: "tour", header: "Tour", render: (b) => b.tour_name ?? "-", className: "hidden max-w-[180px] truncate text-dash-muted md:table-cell" },
    { key: "date", header: "Date", render: (b) => dateText(b.tour_date), className: "hidden text-dash-muted lg:table-cell" },
    { key: "status", header: "Status", render: (b) => <Pill status={b.booking_status}>{b.booking_status.replaceAll("_", " ")}</Pill> },
    { key: "payment", header: "Payment", render: (b) => <Pill status={b.payment_status}>{b.payment_status.replaceAll("_", " ")}</Pill>, className: "hidden xl:table-cell" },
    { key: "total", header: "Total", render: (b) => money(b.final_amount, b.currency), className: "hidden text-right font-bold text-dash-text xl:table-cell" },
  ];

  return (
    <AgentPageShell>
      <AgentPageHeader
        title="Bookings"
        description="Track every customer booking from payment through supplier acceptance and travel completion."
        icon={CalendarCheck}
        eyebrow="Booking Operations"
      />

      {/* Stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon, tone }) => <AgentMetric key={label} label={label} value={value} icon={icon} tone={tone} />)}
      </div>

      <AgentSection className="mt-4">
      <div className="flex gap-2 overflow-x-auto border-b border-[#E7EDF6] p-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatus(s)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition-all ${
              statusFilter === s
                ? "bg-dash-brand text-white shadow-dash-brand/20"
                : "border border-dash-border/80 bg-white text-dash-muted hover:border-dash-brand/30 hover:text-dash-brand"
            }`}
          >
            {s === "all" ? "All" : s.replaceAll("_", " ")}
          </button>
        ))}
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
            <div className="flex justify-end gap-2">
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
