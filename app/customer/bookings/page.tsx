"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuEye as Eye, LuMapPinned as MapPinned, LuWallet as Wallet } from "react-icons/lu";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

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

const STATUSES = ["all", "confirmed", "pending", "pending_payment", "completed", "cancelled"];

function money(value: string | number | undefined, currency = "AED") {
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
  if (["pending", "partial", "partially_paid", "pending_payment"].includes(v)) return "bg-amber-50 text-amber-700 border border-amber-200/50";
  if (["cancelled", "failed"].includes(v)) return "bg-rose-50 text-rose-700 border border-rose-200/50";
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
  const limit = 10;

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
    const confirmed = bookings.filter((b) => ["confirmed", "ongoing"].includes(b.booking_status.toLowerCase())).length;
    const completed = bookings.filter((b) => b.booking_status.toLowerCase() === "completed").length;
    const pending = bookings.filter((b) => ["pending", "pending_payment"].includes(b.booking_status.toLowerCase())).length;
    return [
      { label: "Total Bookings", value: total || bookings.length, icon: CalendarCheck, color: "text-sky-600", bg: "bg-sky-50" },
      { label: "Active / Upcoming", value: confirmed, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Pending Payment", value: pending, icon: Wallet, color: "text-rose-600", bg: "bg-rose-50" },
    ];
  }, [bookings, total]);

  const columns: DataTableColumn<Booking>[] = [
    { key: "code", header: "Code", render: (b) => <Link href={`/customer/bookings/${b.id}`} className="hover:text-[#43A9F6] hover:underline">{b.booking_code}</Link>, className: "font-bold text-[#121826]" },
    { key: "tour", header: "Tour Name", render: (b) => b.tour_name ?? "-", className: "text-[#667085]" },
    { key: "date", header: "Tour Date", render: (b) => dateText(b.tour_date), className: "hidden text-[#667085] sm:table-cell" },
    { key: "status", header: "Booking Status", render: (b) => <Pill status={b.booking_status}>{b.booking_status.replaceAll("_", " ")}</Pill> },
    { key: "payment", header: "Payment Status", render: (b) => <Pill status={b.payment_status}>{b.payment_status.replaceAll("_", " ")}</Pill>, className: "hidden md:table-cell" },
    { key: "total", header: "Total Amount", render: (b) => money(b.final_amount, b.currency), className: "hidden text-right font-bold text-[#121826] md:table-cell" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 to-sky-700 p-7 text-white shadow-xl shadow-sky-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">My Bookings</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-sky-100">View and track all of your bookings and travel history.</p>
          </div>
          <Link
            href="/tours"
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 hover:-translate-y-0.5"
          >
            <MapPinned size={18} strokeWidth={2.5} /> Browse Tours
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
                ? "bg-[#43A9F6] text-white shadow-[#43A9F6]/20"
                : "border border-[#E7EAF0]/80 bg-white text-[#667085] hover:border-[#43A9F6]/30 hover:text-[#43A9F6]"
            }`}
          >
            {s === "all" ? "All" : s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6">
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
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9] transition-all shadow-sm"
            >
              <MapPinned size={16} strokeWidth={2.5} /> Browse Tours
            </Link>
          }
          actions={(b) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/customer/bookings/${b.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7EAF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] shadow-sm hover:bg-[#F3F8FC] hover:text-[#43A9F6] transition-all"
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
