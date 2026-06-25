"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Headphones,
  MapPinned,
  User,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";

type Summary = {
  total_bookings?: number;
  upcoming_tours?: number;
  completed_tours?: number;
  pending_payments?: number;
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  final_amount?: string | number;
  amount_pending?: string | number;
  currency?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(v)) return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
  if (["pending", "pending_payment", "upcoming", "partial"].includes(v)) return "bg-amber-50 text-amber-700 border border-amber-200/50";
  if (["cancelled", "failed", "declined"].includes(v)) return "bg-red-50 text-red-600 border border-red-200/50";
  return "bg-slate-50 text-slate-600 border border-slate-200/50";
}

export default function CustomerDashboardPage() {
  const { isLoggedIn, user } = useAuthContext();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start_date: "", end_date: "", status: "" });
  const [support, setSupport] = useState({ subject: "", message: "" });
  const [supportState, setSupportState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [sumRes, bookRes] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/customer/bookings", { params: { limit: 5 } }),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
      if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { void load(); }, [load]);

  const pendingAmount = bookings.reduce((acc, b) => acc + Number(b.amount_pending || 0), 0) || Number(summary.pending_payments || 0);

  const stats = [
    { label: "Total Bookings", value: summary.total_bookings ?? bookings.length, icon: CalendarCheck, sub: "All time", bg: "bg-blue-50 text-blue-600", border: "hover:border-blue-500/30" },
    { label: "Upcoming Trips", value: summary.upcoming_tours ?? bookings.filter((b) => b.booking_status === "confirmed").length, icon: Clock, sub: "Confirmed", bg: "bg-amber-50 text-amber-600", border: "hover:border-amber-500/30" },
    { label: "Completed Trips", value: summary.completed_tours ?? bookings.filter((b) => b.booking_status === "completed").length, icon: CheckCircle2, sub: "Finished", bg: "bg-emerald-50 text-emerald-600", border: "hover:border-emerald-500/30" },
    { label: "Pending Balance", value: formatCompact(pendingAmount), icon: CreditCard, sub: "Outstanding", bg: "bg-rose-50 text-rose-600", border: "hover:border-rose-500/30" },
  ];

  async function sendSupport(e: React.FormEvent) {
    e.preventDefault();
    if (!support.subject.trim() || !support.message.trim()) return;
    setSupportState("sending");
    try {
      await api.post("/customer/messages", support);
      setSupport({ subject: "", message: "" });
      setSupportState("sent");
    } catch { setSupportState("error"); }
  }

  return (
    <div className="space-y-6 px-5 pb-8 md:px-9">
      {/* Gradient premium hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white border border-indigo-500/10 shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">My Travel Account</p>
          <h2 className="mt-2 text-2xl font-black md:text-3xl tracking-tight">Your travel at a glance</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-md leading-relaxed">View your bookings, upcoming trips, and manage your travel profile.</p>
        </div>
        <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-right backdrop-blur-md md:block z-10">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">Signed in as</p>
          <p className="mt-1 text-lg font-black text-white">{user?.name}</p>
          <p className="text-xs text-slate-300">Traveller</p>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[#E7EAF0] bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, sub, bg, border }) => (
            <div key={label} className={`flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${border} transition-all duration-300`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} transition-all duration-300`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#667085]">{label}</p>
                  <p className="text-2xl font-black text-[#121826] tracking-tight">{value}</p>
                </div>
              </div>
              <span className="rounded-lg bg-[#F5F7FA] px-2.5 py-1 text-xs font-bold text-[#667085]">{sub}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Filters */}
      <div className="rounded-xl border border-[#E7EAF0]/80 bg-white p-5 shadow-sm transition-all duration-200">
        <h2 className="font-bold text-[#121826] text-base">Dashboard Filters</h2>
        <p className="mt-0.5 text-sm text-[#667085]">Filter your travel history by date range and trip status.</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-[#667085]">Start Date</label>
            <input type="date" title="Start date" value={filters.start_date} onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
              className="rounded-xl border border-[#E6E8F0] px-3.5 py-2.5 text-sm text-[#344054] outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all duration-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-[#667085]">End Date</label>
            <input type="date" title="End date" value={filters.end_date} onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
              className="rounded-xl border border-[#E6E8F0] px-3.5 py-2.5 text-sm text-[#344054] outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all duration-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-[#667085]">Trip Status</label>
            <select title="Trip status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="rounded-xl border border-[#E6E8F0] px-3.5 py-2.5 text-sm text-[#344054] outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 bg-white transition-all duration-200">
              <option value="">All Trips</option>
              <option value="confirmed">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button type="button" onClick={() => setFilters({ start_date: "", end_date: "", status: "" })}
            className="flex items-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-4 py-2.5 text-sm font-bold text-[#667085] hover:bg-[#F3F8FC] hover:text-[#43A9F6] hover:border-[#43A9F6]/20 transition-all duration-200">
            ⊘ Reset
          </button>
        </div>
      </div>

      {/* Two-column panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Analytics */}
        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-[#121826] text-base">Booking Analytics</h2>
            <Link href="/customer/bookings" className="flex items-center gap-1 text-sm font-bold text-[#43A9F6] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#667085]">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] px-4 py-3 hover:bg-[#F3F8FC]/40 transition-colors duration-200">
                  <div>
                    <p className="font-semibold text-[#121826]">{b.booking_code}</p>
                    <p className="text-xs text-[#667085] mt-0.5">{b.tour_name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColors(b.booking_status)}`}>
                      {b.booking_status.replaceAll("_", " ")}
                    </span>
                    <Link href={`/customer/bookings/${b.id}`} className="text-xs font-bold text-[#43A9F6] hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-[#121826] text-base">Payment Status</h2>
          <div className="space-y-3">
            {[
              { label: "Full payments", href: "/customer/bookings?payment=paid" },
              { label: "Partial payments", href: "/customer/bookings?payment=partial" },
              { label: "Pending payments", href: "/customer/bookings?payment=pending" },
              { label: "Refunds", href: "/customer/bookings?payment=refund" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                className="flex items-center justify-between rounded-xl border border-[#E7EAF0] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F3F8FC] hover:border-[#43A9F6]/20">
                {label} <ArrowRight size={14} className="text-[#43A9F6]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Headphones size={18} className="text-[#43A9F6]" />
          <h2 className="font-bold text-[#121826] text-base">Contact Support</h2>
        </div>
        <form onSubmit={sendSupport} className="flex flex-wrap gap-3">
          <input value={support.subject} onChange={(e) => setSupport((s) => ({ ...s, subject: e.target.value }))}
            placeholder="Subject" title="Support subject"
            className="min-w-48 flex-1 rounded-xl border border-[#E7EAF0] px-3.5 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all duration-200" />
          <input value={support.message} onChange={(e) => setSupport((s) => ({ ...s, message: e.target.value }))}
            placeholder="Describe your issue..." title="Support message"
            className="min-w-64 flex-2 rounded-xl border border-[#E7EAF0] px-3.5 py-2.5 text-sm outline-none focus:border-[#43A9F6] focus:ring-2 focus:ring-sky-100 transition-all duration-200" />
          <button type="submit" disabled={supportState === "sending"}
            className="rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#238DD7] active:scale-98 disabled:opacity-60 transition-all duration-150">
            {supportState === "sending" ? "Sending…" : "Send"}
          </button>
          {supportState === "sent" && <p className="self-center text-sm font-semibold text-emerald-700">Message sent!</p>}
          {supportState === "error" && <p className="self-center text-sm font-semibold text-red-600">Could not send.</p>}
        </form>
      </div>

      {/* Quick nav */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/tours", label: "Browse Tours", icon: MapPinned },
          { href: "/customer/bookings", label: "My Bookings", icon: CalendarCheck },
          { href: "/customer/profile", label: "My Profile", icon: User },
          { href: "/customer/support", label: "Support", icon: Headphones },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className="flex items-center gap-3 rounded-xl border border-[#E7EAF0] bg-white p-4 text-sm font-bold text-[#344054] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#43A9F6]/20 transition-all duration-300">
            <Icon size={18} className="text-[#43A9F6]" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
