"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  MapPin,
  MapPinned,
  Plane,
  User,
  Wallet,
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
  country?: string;
};

function statusBadge(s: string) {
  const v = (s || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(v))
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (["pending", "pending_payment", "upcoming", "partial"].includes(v))
    return "bg-amber-50 text-amber-700 border border-amber-100";
  if (["cancelled", "failed", "declined"].includes(v))
    return "bg-red-50 text-red-600 border border-red-100";
  return "bg-slate-100 text-slate-600";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export default function CustomerDashboardPage() {
  const { isLoggedIn, user } = useAuthContext();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [sumRes, bookRes] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/customer/bookings", { params: { limit: 5 } }),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
      if (bookRes.status === "fulfilled")
        setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { void load(); }, [load]);

  const pendingAmount =
    bookings.reduce((acc, b) => acc + Number(b.amount_pending || 0), 0) ||
    Number(summary.pending_payments || 0);

  const upcomingBooking = bookings.find((b) =>
    ["confirmed", "upcoming", "pending_payment"].includes(b.booking_status.toLowerCase())
  );

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const stats = [
    {
      label: "Total Bookings",
      value: summary.total_bookings ?? bookings.length,
      icon: CalendarCheck,
      color: "text-sky-600",
      bg: "bg-sky-50",
      ring: "ring-sky-100",
    },
    {
      label: "Upcoming Trips",
      value: summary.upcoming_tours ?? bookings.filter((b) => b.booking_status === "confirmed").length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-100",
    },
    {
      label: "Completed",
      value: summary.completed_tours ?? bookings.filter((b) => b.booking_status === "completed").length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
    {
      label: "Pending Balance",
      value: formatCompact(pendingAmount),
      icon: Wallet,
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-100",
    },
  ];

  const quickLinks = [
    { href: "/tours", label: "Browse Tours", icon: Globe, sub: "Find your next adventure", color: "text-sky-600", bg: "bg-sky-50" },
    { href: "/customer/bookings", label: "My Bookings", icon: CalendarCheck, sub: "View booking history", color: "text-violet-600", bg: "bg-violet-50" },
    { href: "/customer/profile", label: "My Profile", icon: User, sub: "Account & password", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/customer/support", label: "Get Help", icon: Headphones, sub: "Talk to our team", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl space-y-7 px-5 py-7 md:px-8">

        {/* ── Hero greeting ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 to-sky-700 p-7 text-white shadow-xl shadow-sky-200/60 md:p-10">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-1/3 top-1/2 h-20 w-20 rounded-full bg-white/5 blur-xl" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-100">{greeting()},</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                {user?.name?.split(" ")[0] ?? "Traveller"} ✈️
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-sky-100">
                {upcomingBooking
                  ? `Your next trip "${upcomingBooking.tour_name ?? upcomingBooking.booking_code}" is ready.`
                  : "Browse tours and start planning your next journey."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/tours"
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-50">
                  <MapPinned size={15} /> Browse Tours
                </Link>
                <Link href="/customer/bookings"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
                  My Bookings <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="hidden shrink-0 sm:block">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-3xl font-black text-white backdrop-blur-sm ring-4 ring-white/20">
                  {initials}
                </div>
                <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
                  <CheckCircle2 size={14} className="text-white" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            : stats.map(({ label, value, icon: Icon, color, bg, ring }) => (
                <div key={label}
                  className={`group relative overflow-hidden rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:${ring}`}>
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

        {/* ── Next Trip + Recent Bookings ───────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* Next trip highlight */}
          <div className="lg:col-span-2">
            {loading ? (
              <Skeleton className="h-52" />
            ) : upcomingBooking ? (
              <Link href={`/customer/bookings/${upcomingBooking.id}`}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg shadow-violet-200/60 transition hover:-translate-y-0.5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                    <Plane size={11} /> Next Trip
                  </span>
                  <h3 className="mt-3 text-xl font-black leading-snug">{upcomingBooking.tour_name ?? upcomingBooking.booking_code}</h3>
                  {upcomingBooking.country && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-violet-200">
                      <MapPin size={13} /> {upcomingBooking.country}
                    </p>
                  )}
                  {upcomingBooking.tour_date && (
                    <p className="mt-1 text-sm text-violet-200">
                      <Clock size={12} className="mr-1 inline" />
                      {formatDate(upcomingBooking.tour_date)}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                    {upcomingBooking.booking_code}
                  </span>
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
                  <MapPinned size={24} className="text-sky-500" />
                </div>
                <p className="font-bold text-slate-700">No upcoming trips</p>
                <p className="mt-1 text-sm text-slate-400">Find your next adventure.</p>
                <Link href="/tours"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600">
                  Browse Tours <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Recent bookings */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-800">Recent Bookings</h2>
                <Link href="/customer/bookings"
                  className="flex items-center gap-1 text-sm font-bold text-sky-600 hover:underline">
                  View all <ArrowRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarCheck size={28} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-400">No bookings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {bookings.map((b) => (
                    <div key={b.id}
                      className="flex items-center justify-between px-6 py-3.5 transition hover:bg-slate-50/60">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{b.tour_name ?? b.booking_code}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono">{b.booking_code}</span>
                          {b.tour_date && <span>· {formatDate(b.tour_date)}</span>}
                        </p>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusBadge(b.booking_status)}`}>
                          {b.booking_status.replaceAll("_", " ")}
                        </span>
                        <Link href={`/customer/bookings/${b.id}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-sky-300 hover:text-sky-600">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Discover banner ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] px-8 py-7 md:px-12">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-linear-to-l from-sky-500/10 to-transparent" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Explore More</p>
              <h2 className="mt-1 text-xl font-black text-white">Find your next destination</h2>
              <p className="mt-1 text-sm text-slate-400">
                Handpicked tours across India, UAE, and the Gulf region.
              </p>
            </div>
            <Link href="/tours"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-400">
              Browse Tours <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-4 font-bold text-slate-700">Quick Access</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map(({ href, label, icon: Icon, sub, color, bg }) => (
              <Link key={label} href={href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg} transition group-hover:scale-105`}>
                  <Icon size={20} className={color} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{label}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Payment summary strip ─────────────────────────────────────── */}
        {!loading && pendingAmount > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <CreditCard size={18} className="text-amber-700" />
              </div>
              <div>
                <p className="font-bold text-amber-800">You have an outstanding balance</p>
                <p className="text-sm text-amber-600">Complete payment to confirm your booking.</p>
              </div>
            </div>
            <Link href="/customer/bookings"
              className="ml-4 shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition">
              Pay Now
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
