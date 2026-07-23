"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuEye as Eye, LuMapPinned as MapPinned, LuWallet as Wallet } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { CustomerPageHeader, CustomerPageShell } from "@/components/customer/CustomerPage";

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  final_amount?: string | number;
  currency?: string;
};

const STATUSES = [
  "all",
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
  if (["paid", "completed", "confirmed", "active"].includes(v)) return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
  if (["pending", "partial", "partially_paid", "pending_payment", "payment_authorized", "pending_supplier_acceptance"].includes(v)) return "bg-amber-50 text-amber-700 border border-amber-200/50";
  if (["cancelled", "failed", "declined", "refunded"].includes(v)) return "bg-rose-50 text-rose-700 border border-rose-200/50";
  if (["pending_credit_approval", "bank_transfer_pending", "credit_approval_pending", "pending_supplier_assignment", "supplier_reassignment_required", "cancellation_requested", "postponed", "ready_to_travel", "upcoming", "ongoing"].includes(v)) return "bg-amber-50 text-amber-700 border border-amber-200/50";
  return "bg-slate-50 text-slate-700 border border-slate-200/50";
}

function Pill({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(status)}`}>
      {children}
    </span>
  );
}

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const limit = 10;

  useEffect(() => {
    const requestedStatus = new URLSearchParams(window.location.search).get("status");
    if (requestedStatus && STATUSES.includes(requestedStatus)) setStatusFilter(requestedStatus);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { limit, page };
        if (statusFilter !== "all") params.booking_status = statusFilter;
        const res = await api.get("/customer/bookings", { params });
        if (!active) return;
        setBookings(res.data?.items ?? res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        setStatusCounts(res.data?.status_counts ?? {});
      } catch {
        if (active) setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  function handleStatus(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  const stats = useMemo(() => {
    const allBookings = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const confirmed = (statusCounts.confirmed ?? 0) + (statusCounts.ready_to_travel ?? 0) + (statusCounts.upcoming ?? 0) + (statusCounts.ongoing ?? 0);
    const completed = statusCounts.completed ?? 0;
    const pending = (statusCounts.pending_payment ?? 0) + (statusCounts.pending_credit_approval ?? 0) + (statusCounts.pending_supplier_assignment ?? 0) + (statusCounts.payment_authorized ?? 0) + (statusCounts.pending_supplier_acceptance ?? 0) + (statusCounts.supplier_reassignment_required ?? 0) + (statusCounts.cancellation_requested ?? 0);
    return [
      { label: "Total Bookings", value: allBookings || total, icon: CalendarCheck, color: "text-dash-brand", bg: "bg-[var(--portal-soft)]" },
      { label: "Active / Upcoming", value: confirmed, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Pending Requests", value: pending, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
    ];
  }, [statusCounts, total]);

  const columns: DataTableColumn<Booking>[] = [
    { key: "code", header: "Code", render: (b) => <Link href={`/customer/bookings/${b.id}`} className="hover:text-dash-brand hover:underline">{b.booking_code}</Link>, className: "font-bold text-dash-text" },
    { key: "tour", header: "Tour Name", render: (b) => b.tour_name ?? "-", className: "text-dash-muted" },
    { key: "date", header: "Tour Date", render: (b) => dateText(b.tour_date), className: "hidden text-dash-muted sm:table-cell" },
    { key: "status", header: "Booking Status", render: (b) => <Pill status={b.booking_status}>{b.booking_status.replaceAll("_", " ")}</Pill> },
    { key: "payment", header: "Payment Status", render: (b) => <Pill status={b.payment_status}>{b.payment_status.replaceAll("_", " ")}</Pill>, className: "hidden md:table-cell" },
    { key: "total", header: "Total Amount", render: (b) => money(b.final_amount, b.currency), className: "hidden text-right font-bold text-dash-text md:table-cell" },
  ];

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="My Bookings"
        description="View upcoming journeys, track requests, and manage every Tourvaa booking."
        icon={CalendarCheck}
        action={{ label: "Browse Tours", href: "/tours", icon: MapPinned }}
      />

      {/* Stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="group relative overflow-hidden rounded-xl border border-[#DDE7F3] bg-white p-4 shadow-[0_6px_20px_-18px_rgba(24,68,126,.7)] transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7184A0]">{label}</p>
                <p className={`mt-2 text-[25px] font-black tracking-tight ${color}`}>{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-[#DDE7F3] bg-white p-3">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatus(s)}
            className={`rounded-lg px-4 py-2 text-[11px] font-bold capitalize transition-all ${
              statusFilter === s
                ? "bg-[#0868E8] text-white shadow-md shadow-blue-100"
                : "border border-[#DCE5F0] bg-white text-[#5C7190] hover:border-blue-300 hover:text-[#0865D9]"
            }`}
          >
            {s === "all" ? "All" : s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4">
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
          emptyDescription="You don't have any bookings yet. Browse our selection of tours to make your first trip!"
          emptyAction={
            <Link
              href="/tours"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover transition-all shadow-sm"
            >
              <MapPinned size={16} strokeWidth={2.5} /> Browse Tours
            </Link>
          }
          actions={(b) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/customer/bookings/${b.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border bg-white px-3 py-1.5 text-xs font-semibold text-dash-body shadow-sm hover:bg-[#F3F8FC] hover:text-dash-brand transition-all"
              >
                <Eye size={14} /> View
              </Link>
            </div>
          )}
        />
      </div>
    </CustomerPageShell>
  );
}
