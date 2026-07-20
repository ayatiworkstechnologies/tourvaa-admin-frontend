"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuEye as Eye, LuPlus as Plus, LuRefreshCw as RefreshCw, LuCircleX as XCircle } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

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

const STATUSES = ["all", "pending_payment", "payment_authorized", "pending_supplier_acceptance", "confirmed", "ongoing", "completed", "cancelled", "declined"];

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
  if (["pending", "partial", "partially_paid", "pending_payment", "payment_authorized", "pending_supplier_acceptance"].includes(v)) return "bg-amber-50 text-amber-700";
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
    { label: "Total Bookings", value: Object.values(statusCounts).reduce((sum, count) => sum + count, 0), icon: CalendarCheck, color: "text-dash-brand", bg: "bg-[var(--portal-soft)]" },
    { label: "Confirmed", value: (statusCounts.confirmed ?? 0) + (statusCounts.ongoing ?? 0), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending", value: (statusCounts.pending_payment ?? 0) + (statusCounts.payment_authorized ?? 0) + (statusCounts.pending_supplier_acceptance ?? 0), icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Cancelled", value: (statusCounts.cancelled ?? 0) + (statusCounts.declined ?? 0) + (statusCounts.refunded ?? 0), icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
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
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[var(--portal-hero-from)] to-[var(--portal-hero-to)] p-7 text-white shadow-xl shadow-blue-200/40 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Bookings</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-blue-100">All bookings created on behalf of your customers.</p>
          </div>
          <Link
            href="/agent/bookings/create"
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-dash-brand-dark shadow-sm transition hover:bg-[var(--portal-soft)] hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={2.5} /> New Booking
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-black tracking-tight ${color}`}>{value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="mt-8 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatus(s)}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold capitalize transition-all shadow-[0_2px_8px_rgb(0,0,0,0.02)] ${
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
      <div className="mt-6">
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
          emptyDescription="Create a booking for a customer to see it here."
          emptyAction={
              <Link
                href="/agent/bookings/create"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover transition-all shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} /> Create Booking
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
    </div>
  );
}
