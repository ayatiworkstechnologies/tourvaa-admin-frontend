"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuCreditCard as CreditCard, LuFileText as FileText, LuHeadphones as Headphones, LuMapPin as MapPin, LuMapPinned as MapPinned, LuReceiptText as ReceiptText, LuUsersRound as UsersRound, LuWallet as Wallet } from "react-icons/lu";
import api from "@/lib/api/client";
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

type PortalCounts = {
  payments: number;
  invoices: number;
  travellers: number;
  cancellations: number;
};

function statusClass(status?: string) {
  const value = (status || "").toLowerCase();
  if (["paid", "completed", "confirmed", "active"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "partial", "partially_paid", "authorized"].includes(value)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["cancelled", "failed", "declined", "rejected"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(value?: string | null) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function CardSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

export default function CustomerDashboardPage() {
  const { isLoggedIn, user } = useAuthContext();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<PortalCounts>({ payments: 0, invoices: 0, travellers: 0, cancellations: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [summaryRes, bookingRes, paymentRes, invoiceRes, travellerRes, cancellationRes] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/customer/bookings", { params: { limit: 5 } }),
        api.get("/customer/payments", { params: { limit: 1 } }),
        api.get("/customer/invoices", { params: { limit: 1 } }),
        api.get("/customer/travellers"),
        api.get("/customer/cancellations"),
      ]);

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data?.data ?? {});
      if (bookingRes.status === "fulfilled") setBookings(bookingRes.value.data?.items ?? bookingRes.value.data?.data ?? []);
      setCounts({
        payments: paymentRes.status === "fulfilled" ? Number(paymentRes.value.data?.total ?? 0) : 0,
        invoices: invoiceRes.status === "fulfilled" ? Number(invoiceRes.value.data?.total ?? 0) : 0,
        travellers: travellerRes.status === "fulfilled" ? Number(travellerRes.value.data?.total ?? 0) : 0,
        cancellations: cancellationRes.status === "fulfilled" ? Number(cancellationRes.value.data?.total ?? 0) : 0,
      });
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { void load(); }, [load]);

  const pendingAmount = useMemo(() => {
    const fromBookings = bookings.reduce((sum, booking) => sum + Number(booking.amount_pending || 0), 0);
    return fromBookings || Number(summary.pending_payments || 0);
  }, [bookings, summary.pending_payments]);

  const nextTrip = bookings.find((booking) => ["confirmed", "upcoming", "pending_payment", "payment_authorized"].includes((booking.booking_status || "").toLowerCase()));
  const firstName = user?.name?.split(" ")[0] || "Traveller";

  const stats = [
    { label: "Total bookings", value: summary.total_bookings ?? bookings.length, icon: CalendarCheck, href: "/customer/bookings", color: "text-dash-brand", bg: "bg-[var(--portal-soft)]" },
    { label: "Upcoming trips", value: summary.upcoming_tours ?? bookings.filter((booking) => booking.booking_status === "confirmed").length, icon: Clock3, href: "/customer/bookings", color: "text-indigo-700", bg: "bg-indigo-50" },
    { label: "Completed trips", value: summary.completed_tours ?? bookings.filter((booking) => booking.booking_status === "completed").length, icon: CheckCircle2, href: "/customer/bookings", color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Pending balance", value: formatCompact(pendingAmount), icon: Wallet, href: "/customer/payments", color: "text-rose-700", bg: "bg-rose-50" },
  ];

  const portalCards = [
    { label: "Payments", value: counts.payments, href: "/customer/payments", icon: CreditCard, note: pendingAmount > 0 ? "Balance needs attention" : "Payment history" },
    { label: "Invoices", value: counts.invoices, href: "/customer/invoices", icon: ReceiptText, note: "Receipts and documents" },
    { label: "Travellers", value: counts.travellers, href: "/customer/travellers", icon: UsersRound, note: "Saved passenger profiles" },
    { label: "Cancellations", value: counts.cancellations, href: "/customer/cancellations", icon: FileText, note: "Refund request tracking" },
  ];

  return (
    <div className="min-h-screen bg-dash-bg p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-dash-border bg-gradient-to-br from-[var(--portal-hero-from)] via-[var(--portal-hero-via)] to-[var(--portal-hero-to)] p-6 text-white shadow-lg md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-white/80">{greeting()}, {firstName}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Your travel portal</h1>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Track bookings, payments, travellers, invoices, and support requests from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/tours" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-dash-brand shadow-sm hover:bg-[var(--portal-soft)]">
                <MapPinned size={17} /> Browse tours
              </Link>
              <Link href="/customer/support" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">
                <Headphones size={17} /> Get support
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} className="h-32" />) : stats.map(({ label, value, icon: Icon, href, color, bg }) => (
            <Link key={label} href={href} className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-subtle">{label}</p>
                  <p className={`mt-3 text-3xl font-black ${color}`}>{value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}><Icon size={20} className={color} /></span>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-dash-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-dash-border px-5 py-4">
              <h2 className="font-black text-dash-text">Recent bookings</h2>
              <Link href="/customer/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-dash-brand hover:underline">View all <ArrowRight size={14} /></Link>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} className="h-16" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <CalendarCheck className="mx-auto text-dash-subtle" />
                <p className="mt-3 font-bold text-dash-text">No bookings yet</p>
                <p className="mt-1 text-sm text-dash-muted">Book a tour and it will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F2F5]">
                {bookings.map((booking) => (
                  <Link key={booking.id} href={`/customer/bookings/${booking.id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[#F7FAFF] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-dash-text">{booking.tour_name || booking.booking_code}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dash-muted">
                        <span className="font-mono">{booking.booking_code}</span>
                        <span>{formatDate(booking.tour_date)}</span>
                        {booking.country && <span className="inline-flex items-center gap-1"><MapPin size={12} />{booking.country}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClass(booking.booking_status)}`}>{booking.booking_status.replaceAll("_", " ")}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClass(booking.payment_status)}`}>{booking.payment_status.replaceAll("_", " ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm">
              <h2 className="font-black text-dash-text">Next trip</h2>
              {loading ? <CardSkeleton className="mt-4 h-32" /> : nextTrip ? (
                <Link href={`/customer/bookings/${nextTrip.id}`} className="mt-4 block rounded-2xl border border-dash-border bg-[var(--portal-soft)] p-4 transition hover:border-teal-300 hover:bg-teal-100/60">
                  <p className="text-sm font-black text-dash-text">{nextTrip.tour_name || nextTrip.booking_code}</p>
                  <p className="mt-2 text-sm text-dash-muted">{formatDate(nextTrip.tour_date)}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-dash-brand-dark">Open booking <ArrowRight size={14} /></p>
                </Link>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#D8DEE8] p-5 text-center">
                  <MapPinned className="mx-auto text-dash-subtle" />
                  <p className="mt-3 text-sm font-bold text-dash-text">No upcoming trip</p>
                  <Link href="/tours" className="mt-3 inline-flex text-sm font-bold text-dash-brand hover:underline">Explore tours</Link>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {portalCards.map(({ label, value, href, icon: Icon, note }) => (
                <Link key={label} href={href} className="flex items-center justify-between rounded-2xl border border-dash-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-soft)] text-dash-brand"><Icon size={18} /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-dash-text">{label}</p>
                      <p className="truncate text-xs text-dash-muted">{note}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-dash-text">{value}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
