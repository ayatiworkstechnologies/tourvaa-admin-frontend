"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendarCheck as CalendarCheck, LuCircleDollarSign as CircleDollarSign, LuFileText as FileText, LuMapPinned as MapPinned, LuPackageCheck as PackageCheck, LuPlus as Plus, LuUsers as Users } from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import DatePicker from "@/components/ui/DatePicker";

type Summary = {
  total_bookings?: number;
  active_customers?: number;
  monthly_revenue?: number;
  commission_earned?: number;
  upcoming_bookings?: number;
  completed_bookings?: number;
  currency?: string;
};

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  tour_name?: string;
  booking_status: string;
  final_amount?: string | number;
  currency?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "confirmed", "paid", "completed", "published"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "submitted", "draft"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected", "cancelled", "declined", "failed"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function AgentDashboardPage() {
  const { user } = useAuthContext();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ start_date: "", end_date: "", status: "" });

  const load = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
        const bookingParams: Record<string, string | number> = { limit: 5 };
        if (filters.start_date) bookingParams.start_date = filters.start_date;
        if (filters.end_date) bookingParams.end_date = filters.end_date;
        if (filters.status) bookingParams.booking_status = filters.status;
        const summaryParams = {
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          booking_status: filters.status || undefined,
        };
        const [sumRes, bookRes] = await Promise.allSettled([
          api.get("/dashboard/summary", { params: summaryParams }),
          api.get("/bookings", { params: bookingParams }),
        ]);
        if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
        if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
        if (sumRes.status === "rejected" || bookRes.status === "rejected") {
          setError("Some dashboard data could not be loaded. Retry to refresh the figures.");
        }
      } finally {
        setLoading(false);
      }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings ?? bookings.length, icon: CalendarCheck, sub: "Filtered", href: "/agent/bookings" },
    { label: "Active Customers", value: summary.active_customers ?? 0, icon: Users, sub: "Filtered", href: "/agent/customers" },
    { label: "Active Bookings", value: summary.upcoming_bookings ?? bookings.filter((b) => b.booking_status === "confirmed").length, icon: PackageCheck, sub: "In progress", href: "/agent/bookings" },
    { label: "Paid Revenue", value: formatCompact(summary.monthly_revenue), icon: CircleDollarSign, sub: "Filtered", href: "/agent/bookings" },
    { label: "Est. Commission", value: formatCompact(summary.commission_earned), icon: CircleDollarSign, sub: "Filtered", href: "/agent/invoices" },
    { label: "Completed", value: summary.completed_bookings ?? bookings.filter((b) => b.booking_status === "completed").length, icon: PackageCheck, sub: "Finished", href: "/agent/bookings" },
  ];

  return (
    <div className="space-y-6 px-5 pb-8 md:px-9">
      {/* Gradient hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--portal-hero-from)] via-[var(--portal-hero-via)] to-[var(--portal-hero-to)] p-10 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="relative z-10">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-100 backdrop-blur-md">Agent Portal</span>
          <h2 className="mt-4 text-[32px] leading-tight font-black tracking-tight text-white">Manage bookings & customers</h2>
          <p className="mt-2 text-sm text-white/80 max-w-lg">Create bookings, track commissions, and manage your customer relationships.</p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex flex-col items-center justify-center rounded-2xl bg-white/10 px-8 py-5 backdrop-blur-md border border-white/20 shadow-xl hidden sm:flex">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">SIGNED IN AS</span>
          <span className="text-xl font-black text-white leading-none">{user?.name}</span>
          <span className="text-xs text-white/70 mt-1">Agent / Reseller</span>
        </div>
        
        {/* Subtle background flare */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      </div>

      {/* Stat cards */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-white px-3 py-1.5 font-bold shadow-sm ring-1 ring-amber-200 hover:bg-amber-100">Retry</button>
        </div>
      )}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-dash-border bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, sub, href }) => (
            <Link key={label} href={href} className="group flex items-center justify-between rounded-3xl border border-dash-border/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-dash-brand/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--portal-soft)] text-dash-brand group-hover:bg-dash-brand group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-dash-muted uppercase tracking-wider">{label}</p>
                  <p className="mt-1 text-2xl font-black text-dash-text">{value}</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-dash-muted border border-slate-100">{sub}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Dashboard Filters */}
      <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <h2 className="font-black text-dash-text">Dashboard Filters</h2>
        <p className="mt-0.5 text-sm text-dash-muted">Filter booking data by date range and status.</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <DatePicker label="Start date" value={filters.start_date} maxDate={filters.end_date || undefined} onChange={(date) => setFilters((filters) => ({ ...filters, start_date: date }))} className="min-w-52" />
          <DatePicker label="End date" value={filters.end_date} minDate={filters.start_date || undefined} onChange={(date) => setFilters((filters) => ({ ...filters, end_date: date }))} className="min-w-52" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Booking Status</label>
            <select title="Booking status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-dash-body outline-none focus:border-dash-brand">
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="pending_supplier_acceptance">Pending Supplier</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <button type="button" onClick={() => setFilters({ start_date: "", end_date: "", status: "" })}
            className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-bold text-dash-muted hover:bg-[var(--portal-soft)]">
            ⊘ Reset
          </button>
        </div>
      </div>

      {/* Two-column panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Analytics */}
        <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-dash-text">Booking Analytics</h2>
            <Link href="/agent/bookings" className="flex items-center gap-1 text-sm font-bold text-dash-brand hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-dash-muted">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3">
                  <div>
                    <p className="font-semibold text-dash-text">{b.booking_code}</p>
                    <p className="text-xs text-dash-muted">{b.customer_name ?? b.tour_name ?? "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(b.booking_status)}`}>
                      {b.booking_status.replaceAll("_", " ")}
                    </span>
                    <Link href={`/agent/bookings/${b.id}`} className="text-xs font-bold text-dash-brand hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent finance and operations */}
        <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <h2 className="mb-4 font-black text-dash-text">Finance & Operations</h2>
          <div className="space-y-3">
            {[
              { label: "Booking invoices", href: "/agent/invoices" },
              { label: "Booking payment status", href: "/agent/bookings" },
              { label: "Create a customer booking", href: "/agent/bookings/create" },
              { label: "Manage customer accounts", href: "/agent/customers" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3 text-sm font-semibold text-dash-body transition hover:bg-[var(--portal-soft)]">
                {label} <ArrowRight size={14} className="text-dash-brand" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/agent/bookings/create", label: "New Booking", icon: Plus },
          { href: "/agent/tours", label: "Browse Tours", icon: MapPinned },
          { href: "/agent/customers", label: "My Customers", icon: Users },
          { href: "/agent/invoices", label: "Invoices", icon: FileText },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className="group flex items-center gap-3 rounded-2xl border border-dash-border/60 bg-white p-5 text-sm font-bold text-dash-body shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-dash-brand/30 transition-all hover:-translate-y-0.5 hover:text-dash-brand">
            <Icon size={20} className="text-dash-brand group-hover:text-dash-brand transition-colors" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
