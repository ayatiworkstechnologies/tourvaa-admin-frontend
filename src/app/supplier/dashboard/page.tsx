"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuBanknote as Banknote,
  LuCalendarCheck as CalendarCheck,
  LuCircleAlert as AlertCircle,
  LuCircleDollarSign as CircleDollarSign,
  LuClock3 as Clock3,
  LuFileCheck2 as FileCheck,
  LuHeadphones as Headphones,
  LuLock as Lock,
  LuLogOut as LogOut,
  LuMailCheck as MailCheck,
  LuMapPinned as MapPinned,
  LuMessageSquare as MessageSquare,
  LuPlus as Plus,
  LuReceiptText as ReceiptText,
  LuRefreshCw as RefreshCw,
  LuRotateCcw as RotateCcw,
  LuStore as Store,
  LuTrendingDown as TrendingDown,
  LuTrendingUp as TrendingUp,
  LuUsersRound as UsersRound,
  LuWallet as Wallet,
  LuZap as Zap,
} from "react-icons/lu";
import DatePicker from "@/components/ui/DatePicker";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { isApprovedSupplier, supplierApprovalStatus } from "@/lib/auth/supplierAccess";

type Summary = {
  total_bookings?: number;
  upcoming_bookings?: number;
  accepted_bookings?: number;
  completed_bookings?: number;
  cancelled_bookings?: number;
  pending_payments?: number;
  profile_approval_status?: string;
};

type Booking = {
  id: number;
  booking_code: string;
  customer_name?: string;
  tour_name?: string;
  tour_date?: string;
  created_at?: string;
  total_travellers?: number;
  booking_status: string;
  payment_status?: string;
  final_amount?: string | number;
  currency?: string;
};

type LedgerEntry = {
  id: number;
  gross_amount?: string | number;
  commission_amount?: string | number;
  net_payable?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  status?: string;
};

type Payout = {
  id: number;
  payout_code?: string;
  total_amount?: string | number;
  currency?: string;
  status?: string;
  created_at?: string;
};

type Filters = {
  start_date: string;
  end_date: string;
  status: string;
};

const EMPTY_FILTERS: Filters = { start_date: "", end_date: "", status: "" };

function humanize(value?: string) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColors(value?: string) {
  const status = (value || "").toLowerCase();
  if (["active", "confirmed", "paid", "completed", "published", "approved", "ongoing"].includes(status)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  if (["pending", "pending_payment", "payment_authorized", "pending_supplier_acceptance", "submitted", "draft", "reserved"].includes(status)) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  if (["rejected", "cancelled", "declined", "failed"].includes(status)) {
    return "bg-rose-50 text-rose-600 ring-rose-100";
  }
  return "bg-slate-50 text-slate-600 ring-slate-100";
}

function money(value: string | number | undefined, currency = "USD") {
  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function dateText(value?: string) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

type PendingSupplierProfile = {
  supplier_name?: string;
  supplier_type?: string;
  country_id?: number;
  city_id?: number;
  years_in_operation?: number;
  pending_requirements?: string | null;
  documents?: Array<{ id: number; status?: string }>;
};

export default function SupplierDashboardPage() {
  const { user } = useAuthContext();
  return isApprovedSupplier(user) ? <ApprovedSupplierDashboard /> : <PendingSupplierDashboard />;
}

function PendingSupplierDashboard() {
  const { user, logout } = useAuthContext();
  const [profile, setProfile] = useState<PendingSupplierProfile>({});

  useEffect(() => {
    api.get("/suppliers/me")
      .then((response) => setProfile(response.data?.data ?? {}))
      .catch(() => setProfile({}));
  }, []);

  const checks = [
    Boolean(profile.supplier_name),
    Boolean(profile.supplier_type),
    Boolean(profile.country_id),
    Boolean(profile.city_id),
    Boolean(profile.documents?.length),
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const missingDocuments = !profile.documents?.length;
  const status = supplierApprovalStatus(user);
  const lockedModules = ["Tours", "Bookings", "Calendar", "Earnings", "Payouts", "Reports"];

  return (
    <div className="min-h-screen bg-[#F5FAF7] px-4 py-6 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#073A23] via-[#0C6D3A] to-[#1D9150] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold"><MailCheck size={15} /> Email verified</span>
              <h1 className="mt-4 text-2xl font-black sm:text-3xl">Welcome, {user?.name?.split(" ")[0] || "Supplier"}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">Your account is active. Tourvaa is reviewing your supplier profile before unlocking operational tools.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-100">Approval status</p>
              <p className="mt-2 text-xl font-black">{status.replaceAll("_", " ")}</p>
            </div>
          </div>
        </section>

        {profile.pending_requirements && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h2 className="font-black">More information required</h2>
            <p className="mt-1 text-sm leading-6">{profile.pending_requirements}</p>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-[#DCEBE2] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#123024]">Complete your supplier profile</h2>
                <p className="mt-1 text-sm text-slate-500">A complete profile helps the review team approve you faster.</p>
              </div>
              <span className="text-2xl font-black text-emerald-700">{completion}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${completion}%` }} /></div>
            {missingDocuments && <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800"><AlertCircle size={17} /> Verification documents are still missing.</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/supplier/profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"><Store size={16} /> Complete profile</Link>
              <Link href="/supplier/profile#documents" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-5 py-3 text-sm font-bold text-emerald-700"><FileCheck size={16} /> Upload documents</Link>
              <Link href="/supplier/messages" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"><Headphones size={16} /> Contact support</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[#DCEBE2] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#123024]">What happens next?</h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600">
              <li><b className="text-slate-900">1. Submit details.</b> Complete your profile and documents.</li>
              <li><b className="text-slate-900">2. Tourvaa reviews.</b> We may request more information.</li>
              <li><b className="text-slate-900">3. Operations unlock.</b> You will receive an email and notification.</li>
            </ol>
          </section>
        </div>

        <section className="rounded-2xl border border-[#DCEBE2] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#123024]">Operational modules</h2>
          <p className="mt-1 text-sm text-slate-500">These features unlock automatically after approval.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lockedModules.map((module) => <div key={module} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500"><Lock size={16} className="text-amber-500" /> {module}</div>)}
          </div>
          <button type="button" onClick={() => logout()} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-rose-600"><LogOut size={16} /> Sign out</button>
        </section>
      </div>
    </div>
  );
}

function ApprovedSupplierDashboard() {
  const { user } = useAuthContext();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [tourCounts, setTourCounts] = useState({ total: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const bookingParams: Record<string, string | number> = { limit: 6 };
    if (filters.start_date) bookingParams.start_date = filters.start_date;
    if (filters.end_date) bookingParams.end_date = filters.end_date;
    if (filters.status) bookingParams.booking_status = filters.status;
    const summaryParams = {
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      booking_status: filters.status || undefined,
    };

    const results = await Promise.allSettled([
      api.get("/dashboard/summary", { params: summaryParams }),
      api.get("/bookings", { params: bookingParams }),
      api.get("/supplier-ledgers", { params: { limit: 100 } }),
      api.get("/supplier-payouts", { params: { limit: 20 } }),
      api.get("/tours", { params: { limit: 1 } }),
      api.get("/tours", { params: { limit: 1, status: "published" } }),
    ]);

    const [summaryResult, bookingResult, ledgerResult, payoutResult, toursResult, publishedToursResult] = results;
    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value.data?.data ?? {});
    if (bookingResult.status === "fulfilled") {
      setBookings(bookingResult.value.data?.items ?? bookingResult.value.data?.data ?? []);
      setStatusCounts(bookingResult.value.data?.status_counts ?? {});
    }
    if (ledgerResult.status === "fulfilled") setLedgers(ledgerResult.value.data?.items ?? ledgerResult.value.data?.data ?? []);
    if (payoutResult.status === "fulfilled") setPayouts(payoutResult.value.data?.items ?? payoutResult.value.data?.data ?? []);
    if (toursResult.status === "fulfilled" || publishedToursResult.status === "fulfilled") {
      setTourCounts({
        total: toursResult.status === "fulfilled" ? Number(toursResult.value.data?.total ?? 0) : 0,
        published: publishedToursResult.status === "fulfilled" ? Number(publishedToursResult.value.data?.total ?? 0) : 0,
      });
    }
    if (results.some((result) => result.status === "rejected")) {
      setError("Some dashboard data could not be loaded. The available sections are shown below.");
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const commission = useMemo(() => {
    const currency = ledgers.find((entry) => entry.currency)?.currency || payouts.find((payout) => payout.currency)?.currency || "USD";
    const gross = ledgers.reduce((sum, entry) => sum + Number(entry.gross_amount || 0), 0);
    const commissionAmount = ledgers.reduce((sum, entry) => sum + Number(entry.commission_amount || 0), 0);
    const net = ledgers.reduce((sum, entry) => sum + Number(entry.net_payable || 0), 0);
    const paid = ledgers.reduce((sum, entry) => sum + Number(entry.amount_paid || 0), 0);
    const pending = ledgers
      .filter((entry) => ["pending", "partial"].includes((entry.status || "").toLowerCase()))
      .reduce((sum, entry) => sum + Number(entry.amount_pending || 0), 0);
    const reserved = ledgers
      .filter((entry) => (entry.status || "").toLowerCase() === "reserved")
      .reduce((sum, entry) => sum + Number(entry.amount_pending || 0), 0);
    const pendingPayouts = payouts.filter((payout) => ["pending", "approved"].includes((payout.status || "").toLowerCase()));
    const paidPayouts = payouts.filter((payout) => (payout.status || "").toLowerCase() === "paid");

    return {
      currency,
      gross,
      commissionAmount,
      net,
      paid,
      pending,
      reserved,
      rate: gross > 0 ? (commissionAmount / gross) * 100 : 0,
      pendingPayoutTotal: pendingPayouts.reduce((sum, payout) => sum + Number(payout.total_amount || 0), 0),
      paidPayoutTotal: paidPayouts.reduce((sum, payout) => sum + Number(payout.total_amount || 0), 0),
      latestPayout: payouts[0] ?? null,
    };
  }, [ledgers, payouts]);

  const awaitingAction = (statusCounts.payment_authorized ?? 0) + (statusCounts.pending_supplier_acceptance ?? 0);
  const activeTrips = (statusCounts.confirmed ?? 0) + (statusCounts.upcoming ?? 0) + (statusCounts.ongoing ?? 0);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Partner";
  const approvalStatus = summary.profile_approval_status || "pending";

  const stats = [
    {
      label: "Total Tours",
      value: tourCounts.total,
      note: `${tourCounts.published} currently live`,
      icon: MapPinned,
      href: "/supplier/tours",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Bookings",
      value: summary.total_bookings ?? 0,
      note: `${activeTrips} active trips`,
      icon: CalendarCheck,
      href: "/supplier/bookings",
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Awaiting Action",
      value: awaitingAction,
      note: awaitingAction ? "Review supplier decisions" : "You are all caught up",
      icon: Clock3,
      href: "/supplier/bookings?status=pending_supplier_acceptance",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Completed Trips",
      value: summary.completed_bookings ?? statusCounts.completed ?? 0,
      note: "Successfully delivered",
      icon: BadgeCheck,
      href: "/supplier/bookings?status=completed",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Available Payout",
      value: money(commission.pending, commission.currency),
      note: `${money(commission.reserved, commission.currency)} reserved`,
      icon: Wallet,
      href: "/supplier/payouts",
      tone: "bg-teal-50 text-teal-700",
    },
  ];

  const quickActions = [
    { label: "Create a Tour", note: "Build a new package", href: "/supplier/tours/create", icon: Plus },
    { label: "Review Bookings", note: `${awaitingAction} need attention`, href: "/supplier/bookings?status=pending_supplier_acceptance", icon: Zap },
    { label: "View Earnings", note: "Ledger and commission", href: "/supplier/earnings", icon: CircleDollarSign },
    { label: "Open Messages", note: "Customer and admin support", href: "/supplier/messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#F5FAF7] px-4 py-6 text-[#123024] sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#073A23] via-[#0C6D3A] to-[#1D9150] px-5 py-6 text-white shadow-[0_20px_55px_-34px_rgba(7,83,43,.8)] sm:px-7">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[42px] border-white/5" />
          <div className="pointer-events-none absolute bottom-[-90px] left-[42%] h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.15em] text-emerald-50 backdrop-blur">Supplier Control Centre</span>
                <Link href="/supplier/profile" className={`rounded-full px-3 py-1.5 text-[10px] font-black ring-1 ${approvalStatus === "approved" ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-amber-100 text-amber-800 ring-amber-200"}`}>
                  {humanize(approvalStatus)} profile
                </Link>
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-[30px]">Good morning, {firstName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
                Manage your tours, respond to new bookings, and keep payouts moving from one focused workspace.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/supplier/tours/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#096438] shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5">
                  <Plus size={15} /> Create New Tour
                </Link>
                <Link href="/supplier/bookings" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/15">
                  Manage Bookings <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:w-[390px]">
              <HeroMetric label="Needs attention" value={String(awaitingAction)} note="Booking decisions" icon={Clock3} />
              <HeroMetric label="Ready to request" value={money(commission.pending, commission.currency)} note="Available payout" icon={Banknote} />
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2"><AlertCircle size={17} /> {error}</span>
            <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 self-start font-black sm:self-auto">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        <section aria-label="Quick actions" className="mt-4 grid overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white shadow-[0_10px_30px_-27px_rgba(15,82,48,.65)] sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ label, note, href, icon: Icon }) => (
            <Link key={label} href={href} className="group flex min-w-0 items-center gap-3 border-b border-[#E7F0EB] px-4 py-4 transition hover:bg-[#F1F9F4] sm:border-r xl:border-b-0 xl:last:border-r-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F6ED] text-[#16833A] transition group-hover:bg-[#16833A] group-hover:text-white">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <b className="block truncate text-xs text-[#123024]">{label}</b>
                <span className="mt-0.5 block truncate text-[10px] text-[#698074]">{note}</span>
              </span>
              <ArrowRight size={13} className="ml-auto shrink-0 text-[#91A69A] transition group-hover:translate-x-1 group-hover:text-[#16833A]" />
            </Link>
          ))}
        </section>

        {awaitingAction > 0 && !loading && (
          <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Zap size={19} /></span>
              <div>
                <h2 className="text-sm font-black text-amber-950">Booking decisions are waiting</h2>
                <p className="mt-1 text-xs leading-5 text-amber-800">Review {awaitingAction} paid or authorized booking{awaitingAction === 1 ? "" : "s"} so travellers can receive confirmation.</p>
              </div>
            </div>
            <Link href="/supplier/bookings?status=pending_supplier_acceptance" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white hover:bg-amber-700">
              Review now <ArrowRight size={14} />
            </Link>
          </section>
        )}

        <section className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-[#DCEBE2] bg-white" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map(({ label, value, note, icon: Icon, href, tone }) => (
                <Link key={label} href={href} className="group rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(15,82,48,.7)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_-22px_rgba(15,82,48,.65)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></span>
                    <ArrowRight size={14} className="text-[#9AAEA2] transition group-hover:translate-x-1 group-hover:text-[#16833A]" />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[.11em] text-[#708579]">{label}</p>
                  <p className="mt-1 truncate text-xl font-black tracking-tight text-[#123024]">{value}</p>
                  <p className="mt-1 truncate text-[10px] text-[#71867A]">{note}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,.72fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]">
            <div className="border-b border-[#E5EFE9] px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[15px] font-black text-[#123024]">Recent Bookings</h2>
                  <p className="mt-1 text-[11px] text-[#6D8276]">Monitor new requests and keep upcoming trips moving.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => void load()} aria-label="Refresh dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8E7DE] text-[#5F776A] transition hover:bg-[#F0F8F3] hover:text-[#16833A]">
                    <RefreshCw size={15} />
                  </button>
                  <Link href="/supplier/bookings" className="inline-flex items-center gap-2 rounded-xl border border-[#D8E7DE] px-3 py-2 text-[11px] font-black text-[#16833A] hover:bg-[#F0F8F3]">
                    View all <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.1fr_auto]">
                <DatePicker label="From" value={filters.start_date} maxDate={filters.end_date || undefined} onChange={(date) => setFilters((current) => ({ ...current, start_date: date }))} />
                <DatePicker label="To" value={filters.end_date} minDate={filters.start_date || undefined} onChange={(date) => setFilters((current) => ({ ...current, end_date: date }))} />
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-dash-muted">Status</span>
                  <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-xl border border-[#D5E4DB] bg-white px-3 text-xs font-semibold text-[#365545] outline-none focus:border-[#16833A] focus:ring-4 focus:ring-emerald-50">
                    <option value="">All bookings</option>
                    <option value="pending_supplier_acceptance">Awaiting my decision</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="declined">Declined</option>
                  </select>
                </label>
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D5E4DB] px-3 text-xs font-bold text-[#61786B] hover:bg-[#F3F8F5]">
                  <RotateCcw size={13} /> Reset
                </button>
              </div>
            </div>

            {loading ? (
              <BookingSkeleton />
            ) : bookings.length === 0 ? (
              <EmptyBookings filtered={Boolean(filters.start_date || filters.end_date || filters.status)} />
            ) : (
              <div className="divide-y divide-[#E8F0EB]">
                {bookings.map((booking) => {
                  const requiresDecision = ["payment_authorized", "pending_supplier_acceptance"].includes(booking.booking_status);
                  return (
                    <div key={booking.id} className="grid gap-3 px-5 py-4 transition hover:bg-[#F8FCF9] sm:grid-cols-[minmax(0,1.4fr)_minmax(135px,.65fr)_auto] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${requiresDecision ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {requiresDecision ? <Clock3 size={18} /> : <CalendarCheck size={18} />}
                        </span>
                        <span className="min-w-0">
                          <Link href={`/supplier/bookings/${booking.id}`} className="block truncate text-xs font-black text-[#153426] hover:text-[#16833A]">{booking.tour_name || "Tour booking"}</Link>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#73877B]">
                            <b className="font-semibold text-[#526B5D]">{booking.booking_code}</b>
                            <span>•</span>
                            <span>{booking.customer_name || "Traveller"}</span>
                            {booking.total_travellers ? <><span>•</span><span className="inline-flex items-center gap-1"><UsersRound size={11} /> {booking.total_travellers}</span></> : null}
                          </span>
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-[#405F4E]">{dateText(booking.tour_date || booking.created_at)}</p>
                        <p className="mt-1 text-[10px] text-[#7A8D82]">{money(booking.final_amount, booking.currency || commission.currency)}</p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ring-1 ${statusColors(booking.booking_status)}`}>{humanize(booking.booking_status)}</span>
                        <Link href={`/supplier/bookings/${booking.id}`} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-black ${requiresDecision ? "bg-amber-600 text-white hover:bg-amber-700" : "border border-[#D7E6DC] text-[#16833A] hover:bg-[#F0F8F3]"}`}>
                          {requiresDecision ? "Review" : "Details"} <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]">
            <div className="bg-[#0D5F35] p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12"><Wallet size={20} /></span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-50">Payout Centre</span>
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-100/75">Available to request</p>
              <p className="mt-1 text-2xl font-black tracking-tight">{money(commission.pending, commission.currency)}</p>
              <p className="mt-2 text-[10px] text-emerald-100/75">{money(commission.reserved, commission.currency)} is reserved in open payout requests.</p>
              <Link href="/supplier/payouts" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#0D6337] transition hover:bg-emerald-50">
                <Banknote size={15} /> Request Payout
              </Link>
            </div>

            <div className="space-y-3 p-5">
              <BalanceRow label="Paid to date" value={money(commission.paid, commission.currency)} icon={BadgeCheck} tone="text-emerald-600 bg-emerald-50" />
              <BalanceRow label="Open payout requests" value={money(commission.pendingPayoutTotal, commission.currency)} icon={Clock3} tone="text-amber-600 bg-amber-50" />
              <BalanceRow label="Released payouts" value={money(commission.paidPayoutTotal, commission.currency)} icon={ReceiptText} tone="text-sky-600 bg-sky-50" />

              {commission.latestPayout ? (
                <div className="rounded-xl border border-[#E1ECE5] bg-[#F8FBF9] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#75897E]">Latest request</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>
                      <b className="block text-xs text-[#153426]">{commission.latestPayout.payout_code || `Payout #${commission.latestPayout.id}`}</b>
                      <span className="mt-1 block text-[10px] text-[#74887C]">{dateText(commission.latestPayout.created_at)}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ring-1 ${statusColors(commission.latestPayout.status)}`}>{humanize(commission.latestPayout.status)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D7E6DC] px-4 py-5 text-center text-[11px] text-[#75897E]">No payout requests yet.</div>
              )}
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
          <div className="rounded-2xl border border-[#DCEBE2] bg-white p-5 shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-black text-[#123024]">Earnings Overview</h2>
                <p className="mt-1 text-[11px] text-[#6D8276]">A clear view from gross booking value to your net earnings.</p>
              </div>
              <Link href="/supplier/earnings" className="inline-flex items-center gap-2 text-xs font-black text-[#16833A]">Open ledger <ArrowRight size={13} /></Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <EarningCard label="Gross booking value" value={money(commission.gross, commission.currency)} icon={TrendingUp} tone="bg-sky-50 text-sky-700" />
              <EarningCard label={`Tourvaa commission · ${commission.rate.toFixed(1)}%`} value={money(commission.commissionAmount, commission.currency)} icon={TrendingDown} tone="bg-amber-50 text-amber-700" />
              <EarningCard label="Net supplier earnings" value={money(commission.net, commission.currency)} icon={Wallet} tone="bg-emerald-50 text-emerald-700" />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#63796C]">Paid earnings progress</span>
                <span className="font-black text-[#153426]">{commission.net > 0 ? Math.min(100, (commission.paid / commission.net) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8F2EC]">
                <div className="h-full rounded-full bg-linear-to-r from-[#159447] to-[#38B96B]" style={{ width: `${commission.net > 0 ? Math.min(100, (commission.paid / commission.net) * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DCEBE2] bg-white p-5 shadow-[0_10px_32px_-27px_rgba(15,82,48,.7)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-black text-[#123024]">Tour Workspace</h2>
                <p className="mt-1 text-[11px] text-[#6D8276]">Keep your catalogue fresh and bookable.</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F6ED] text-[#16833A]"><Store size={19} /></span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F5FAF7] p-4">
                <p className="text-[10px] font-bold text-[#6B8074]">All tours</p>
                <p className="mt-1 text-2xl font-black text-[#153426]">{tourCounts.total}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-[10px] font-bold text-emerald-700">Published</p>
                <p className="mt-1 text-2xl font-black text-emerald-800">{tourCounts.published}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/supplier/tours" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D7E6DC] px-3 py-2.5 text-xs font-black text-[#16833A] hover:bg-[#F0F8F3]">Manage Tours</Link>
              <Link href="/supplier/tours/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16833A] px-3 py-2.5 text-xs font-black text-white hover:bg-[#117331]"><Plus size={14} /> New Tour</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-black uppercase tracking-[.12em] text-emerald-50/70">{label}</span>
        <Icon size={16} className="text-emerald-100" />
      </div>
      <p className="mt-3 truncate text-lg font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] text-emerald-50/65">{note}</p>
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="divide-y divide-[#E8F0EB]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-5 py-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2"><div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" /><div className="h-2.5 w-3/5 animate-pulse rounded bg-slate-100" /></div>
          <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyBookings({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF7EF] text-[#16833A]"><CalendarCheck size={25} /></span>
      <h3 className="mt-4 text-sm font-black text-[#153426]">{filtered ? "No bookings match these filters" : "No bookings yet"}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#72867A]">{filtered ? "Reset the filters to see all supplier bookings." : "New traveller bookings for your tours will appear here."}</p>
      <Link href="/supplier/tours" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#16833A]">View your tours <ArrowRight size={13} /></Link>
    </div>
  );
}

function BalanceRow({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E1ECE5] p-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></span>
      <span className="min-w-0">
        <span className="block text-[9px] font-bold uppercase tracking-[.08em] text-[#75897E]">{label}</span>
        <b className="mt-0.5 block truncate text-xs text-[#153426]">{value}</b>
      </span>
    </div>
  );
}

function EarningCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="rounded-xl border border-[#E1ECE5] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[.08em] text-[#71857A]">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={15} /></span>
      </div>
      <p className="mt-3 truncate text-base font-black text-[#153426]">{value}</p>
    </div>
  );
}
