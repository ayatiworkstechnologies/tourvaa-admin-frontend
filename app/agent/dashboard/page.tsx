"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendarCheck as CalendarCheck, LuCircleDollarSign as CircleDollarSign, LuFileText as FileText, LuMapPinned as MapPinned, LuPackageCheck as PackageCheck, LuPlus as Plus, LuUsers as Users } from "react-icons/lu";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";

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
  const [filters, setFilters] = useState({ start_date: "", end_date: "", status: "" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sumRes, bookRes] = await Promise.allSettled([
          api.get("/dashboard/summary"),
          api.get("/bookings", { params: { limit: 5 } }),
        ]);
        if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
        if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings ?? bookings.length, icon: CalendarCheck, sub: "Filtered" },
    { label: "Active Customers", value: summary.active_customers ?? 0, icon: Users, sub: "Platform" },
    { label: "Upcoming Bookings", value: summary.upcoming_bookings ?? bookings.filter((b) => b.booking_status === "confirmed").length, icon: PackageCheck, sub: "Confirmed" },
    { label: "Monthly Revenue", value: formatCompact(summary.monthly_revenue), icon: CircleDollarSign, sub: "Revenue" },
    { label: "Commission Earned", value: formatCompact(summary.commission_earned), icon: CircleDollarSign, sub: "All time" },
    { label: "Completed", value: summary.completed_bookings ?? bookings.filter((b) => b.booking_status === "completed").length, icon: PackageCheck, sub: "Finished" },
  ];

  return (
    <div className="space-y-6 px-5 pb-8 md:px-9">
      {/* Gradient hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1120] via-[#1D3E64] to-[#43A9F6] p-10 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#43A9F6] bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">Agent Portal</span>
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
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[#E7EAF0] bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="group flex items-center justify-between rounded-3xl border border-[#E7EAF0]/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-[#43A9F6]/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F0F7FF] text-[#43A9F6] group-hover:bg-[#43A9F6] group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#667085] uppercase tracking-wider">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#121826]">{value}</p>
                </div>
              </div>
              <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-[#667085] border border-slate-100">{sub}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Filters */}
      <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <h2 className="font-black text-[#121826]">Dashboard Filters</h2>
        <p className="mt-0.5 text-sm text-[#667085]">Filter booking data by date range and status.</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-[#667085]">Start Date</label>
            <input type="date" title="Start date" value={filters.start_date} onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
              className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-[#344054] outline-none focus:border-[#43A9F6]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-[#667085]">End Date</label>
            <input type="date" title="End date" value={filters.end_date} onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
              className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-[#344054] outline-none focus:border-[#43A9F6]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wide text-[#667085]">Booking Status</label>
            <select title="Booking status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-[#344054] outline-none focus:border-[#43A9F6]">
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button type="button" onClick={() => setFilters({ start_date: "", end_date: "", status: "" })}
            className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-bold text-[#667085] hover:bg-[#F3F8FC]">
            ⊘ Reset
          </button>
        </div>
      </div>

      {/* Two-column panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Analytics */}
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-[#121826]">Booking Analytics</h2>
            <Link href="/agent/bookings" className="flex items-center gap-1 text-sm font-bold text-[#43A9F6] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#667085]">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] px-4 py-3">
                  <div>
                    <p className="font-semibold text-[#121826]">{b.booking_code}</p>
                    <p className="text-xs text-[#667085]">{b.customer_name ?? b.tour_name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(b.booking_status)}`}>
                      {b.booking_status.replaceAll("_", " ")}
                    </span>
                    <Link href={`/agent/bookings/${b.id}`} className="text-xs font-bold text-[#43A9F6] hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="rounded-3xl border border-[#E7EAF0]/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <h2 className="mb-4 font-black text-[#121826]">Payment Status</h2>
          <div className="space-y-3">
            {[
              { label: "Full payments", href: "/agent/invoices?status=paid" },
              { label: "Partial payments", href: "/agent/invoices?status=partial" },
              { label: "Pending payments", href: "/agent/invoices?status=pending" },
              { label: "Commission payouts", href: "/agent/invoices?type=commission" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                className="flex items-center justify-between rounded-xl border border-[#E7EAF0] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F3F8FC]">
                {label} <ArrowRight size={14} className="text-[#43A9F6]" />
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
          <Link key={label} href={href} className="group flex items-center gap-3 rounded-2xl border border-[#E7EAF0]/60 bg-white p-5 text-sm font-bold text-[#344054] shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-[#43A9F6]/30 transition-all hover:-translate-y-0.5 hover:text-[#43A9F6]">
            <Icon size={20} className="text-[#43A9F6] group-hover:text-[#43A9F6] transition-colors" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
