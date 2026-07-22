"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendarCheck as CalendarCheck, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuCreditCard as CreditCard, LuFileText as FileText, LuHeadphones as Headphones, LuMapPin as MapPin, LuMapPinned as MapPinned, LuPlane as Plane, LuReceiptText as ReceiptText, LuShieldCheck as ShieldCheck, LuSparkles as Sparkles, LuUsersRound as UsersRound, LuWallet as Wallet } from "react-icons/lu";
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
  const [welcome, setWelcome] = useState("Welcome back");

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
  useEffect(() => { setWelcome(greeting()); }, []);

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
    <div className="min-h-screen bg-dash-bg px-4 py-5 sm:px-6 md:py-7 lg:px-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <section className="animate-fade-up relative isolate min-h-[310px] overflow-hidden rounded-[28px] bg-[#082f63] shadow-[0_24px_70px_-30px_rgba(15,76,155,.7)]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=2000&q=88')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-linear-to-r from-[#071d3d]/95 via-[#0b4f9d]/78 to-[#1478f2]/25" />
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/20 bg-white/10 blur-2xl" />
          <div className="relative flex min-h-[310px] flex-col justify-between gap-8 p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:p-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold backdrop-blur-md"><Sparkles size={13} /> Your journey starts here</span>
              <p className="mt-6 text-sm font-semibold text-blue-100">{welcome}, {firstName}</p>
              <h1 className="mt-2 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">Where will your next story take you?</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/78 sm:text-base">Discover new destinations and keep every booking, payment, traveller, and travel document together.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/tours" className="group inline-flex items-center gap-2 rounded-xl bg-[#1478F2] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-500"><MapPinned size={17} /> Explore tours <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
                <Link href="/customer/bookings" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"><CalendarCheck size={17} /> My bookings</Link>
              </div>
            </div>
            <div className="hidden w-64 shrink-0 rounded-3xl border border-white/20 bg-slate-950/20 p-5 backdrop-blur-md lg:block">
              <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.16em] text-blue-100">Travel ready</span><ShieldCheck size={19} /></div>
              <div className="my-5 h-px bg-white/15" />
              <p className="text-4xl font-black">{summary.upcoming_tours ?? 0}</p>
              <p className="mt-1 text-sm text-white/70">upcoming adventures</p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/80"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Your portal is up to date</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} className="h-32" />) : stats.map(({ label, value, icon: Icon, href, color, bg }, index) => (
            <Link key={label} href={href} className="group rounded-2xl border border-blue-100/80 bg-white p-5 shadow-[0_12px_34px_-24px_rgba(15,76,155,.45)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_-22px_rgba(20,120,242,.45)]" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-center justify-between gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}><Icon size={21} className={color} /></span>
                <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>
              <p className={`mt-5 text-3xl font-black tracking-tight ${color}`}>{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-400">{label}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
          <div className="overflow-hidden rounded-3xl border border-blue-100/80 bg-white shadow-[0_16px_50px_-34px_rgba(15,76,155,.5)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Your journeys</p><h2 className="mt-1 text-xl font-black text-slate-950">Recent bookings</h2></div>
              <Link href="/customer/bookings" className="group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50">View all <ArrowRight size={14} className="transition group-hover:translate-x-1" /></Link>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} className="h-20" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Plane size={27} /></span>
                <p className="mt-4 text-lg font-black text-slate-900">Your adventure list is empty</p>
                <p className="mt-1 text-sm text-slate-500">Find a tour you love and your journey will appear here.</p>
                <Link href="/tours" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Find a tour <ArrowRight size={15} /></Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <Link key={booking.id} href={`/customer/bookings/${booking.id}`} className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-blue-50/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-200"><Plane size={20} /></span>
                      <div className="min-w-0"><p className="truncate font-black text-slate-900 transition group-hover:text-blue-700">{booking.tour_name || booking.booking_code}</p><p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="font-mono text-slate-400">{booking.booking_code}</span><span className="inline-flex items-center gap-1"><CalendarCheck size={12} />{formatDate(booking.tour_date)}</span>{booking.country && <span className="inline-flex items-center gap-1"><MapPin size={12} />{booking.country}</span>}</p></div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 pl-16 sm:pl-0"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(booking.booking_status)}`}>{booking.booking_status.replaceAll("_", " ")}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(booking.payment_status)}`}>{booking.payment_status.replaceAll("_", " ")}</span></div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_16px_50px_-34px_rgba(15,76,155,.5)]">
              <div className="relative min-h-40 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=84')] bg-cover bg-center p-5 text-white">
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/80 to-blue-900/30" />
                <div className="relative"><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">Next adventure</span>{nextTrip ? <><h2 className="mt-6 line-clamp-2 text-xl font-black">{nextTrip.tour_name || nextTrip.booking_code}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-white/80"><CalendarCheck size={14} />{formatDate(nextTrip.tour_date)}</p></> : <><h2 className="mt-6 text-xl font-black">The world is waiting</h2><p className="mt-2 text-sm text-white/75">Choose your next unforgettable journey.</p></>}</div>
              </div>
              <div className="p-5">{loading ? <CardSkeleton className="h-11" /> : nextTrip ? <Link href={`/customer/bookings/${nextTrip.id}`} className="group flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">View trip details <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link> : <Link href="/tours" className="group flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Explore destinations <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {portalCards.map(({ label, value, href, icon: Icon, note }) => (
                <Link key={label} href={href} className="group flex items-center justify-between rounded-2xl border border-blue-100/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"><Icon size={18} /></span><div className="min-w-0"><p className="font-bold text-slate-900">{label}</p><p className="truncate text-xs text-slate-500">{note}</p></div></div>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-black text-slate-800">{value}</span>
                </Link>
              ))}
            </div>

            <Link href="/customer/support" className="group flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition hover:bg-blue-50"><span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><Headphones size={19} /></span><span><b className="block text-sm text-slate-900">Need travel help?</b><span className="text-xs text-slate-500">Our support team is here</span></span></span><ArrowRight size={16} className="text-blue-600 transition group-hover:translate-x-1" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
