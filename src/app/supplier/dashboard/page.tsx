"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight, LuBanknote as Banknote, LuCalendarCheck as CalendarCheck, LuCircleDollarSign as CircleDollarSign, LuClock3 as Clock3, LuMapPinned as MapPinned, LuPackageCheck as PackageCheck, LuPlus as Plus, LuReceiptText as ReceiptText, LuRefreshCw as RefreshCw, LuScale as Scale, LuTrendingDown as TrendingDown, LuTrendingUp as TrendingUp, LuWallet as Wallet } from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";

type Summary = {
  total_tours?: number;
  active_tours?: number;
  total_bookings?: number;
  monthly_revenue?: number;
  pending_tours?: number;
  completed_tours?: number;
  currency?: string;
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  booking_status: string;
  final_amount?: string | number;
  currency?: string;
};

type LedgerEntry = {
  id: number;
  booking_code?: string;
  gross_amount?: string | number;
  commission_amount?: string | number;
  commission_percentage?: string | number;
  net_payable?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  status?: string;
  created_at?: string;
};

type Payout = {
  id: number;
  payout_code?: string;
  total_amount?: string | number;
  currency?: string;
  status?: string;
  created_at?: string;
  paid_at?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "confirmed", "paid", "completed", "published"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_payment", "submitted", "draft", "approved", "reserved"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected", "cancelled", "declined", "failed"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function money(value: string | number | undefined, currency = "AED") {
  return `${currency} ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateText(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SupplierDashboardPage() {
  const { user } = useAuthContext();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start_date: "", end_date: "", status: "" });

  async function load() {
    setLoading(true);
    try {
      const bookParams: Record<string, string> = { limit: "5" };
      if (filters.start_date) bookParams.start_date = filters.start_date;
      if (filters.end_date) bookParams.end_date = filters.end_date;
      if (filters.status) bookParams.booking_status = filters.status;
      const [sumRes, bookRes, ledgerRes, payoutRes] = await Promise.allSettled([
        api.get("/dashboard/summary", { params: filters.start_date || filters.end_date ? { start_date: filters.start_date, end_date: filters.end_date } : {} }),
        api.get("/supplier/bookings", { params: bookParams }),
        api.get("/supplier-ledgers", { params: { limit: 50 } }),
        api.get("/supplier-payouts", { params: { limit: 20 } }),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
      if (bookRes.status === "fulfilled") setBookings(bookRes.value.data?.items ?? bookRes.value.data?.data ?? []);
      if (ledgerRes.status === "fulfilled") setLedgers(ledgerRes.value.data?.items ?? ledgerRes.value.data?.data ?? []);
      if (payoutRes.status === "fulfilled") setPayouts(payoutRes.value.data?.items ?? payoutRes.value.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [filters]);

  const commission = useMemo(() => {
    const currency = ledgers.find((entry) => entry.currency)?.currency || summary.currency || "AED";
    const gross = ledgers.reduce((sum, entry) => sum + Number(entry.gross_amount || 0), 0);
    const commissionAmount = ledgers.reduce((sum, entry) => sum + Number(entry.commission_amount || 0), 0);
    const net = ledgers.reduce((sum, entry) => sum + Number(entry.net_payable || 0), 0);
    const paid = ledgers.reduce((sum, entry) => sum + Number(entry.amount_paid || 0), 0);
    const pending = ledgers.reduce((sum, entry) => sum + Number(entry.amount_pending || 0), 0);
    const avgRate = gross > 0 ? (commissionAmount / gross) * 100 : 0;
    const pendingPayouts = payouts.filter((p) => ["pending", "approved"].includes((p.status || "").toLowerCase()));
    const paidPayouts = payouts.filter((p) => (p.status || "").toLowerCase() === "paid");
    return {
      currency,
      gross,
      commissionAmount,
      net,
      paid,
      pending,
      avgRate,
      pendingPayoutTotal: pendingPayouts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      paidPayoutTotal: paidPayouts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      latestPayout: payouts[0] ?? null,
    };
  }, [ledgers, payouts, summary.currency]);

  const stats = [
    { label: "My Tours", value: summary.total_tours ?? 0, icon: MapPinned, sub: "Total" },
    { label: "Active Tours", value: summary.active_tours ?? 0, icon: TrendingUp, sub: "Live" },
    { label: "Total Bookings", value: summary.total_bookings ?? bookings.length, icon: CalendarCheck, sub: "Filtered" },
    { label: "Net Payable", value: money(commission.net, commission.currency), icon: Wallet, sub: "After commission" },
    { label: "Pending Payout", value: money(commission.pending, commission.currency), icon: Clock3, sub: "Available" },
    { label: "Commission Rate", value: `${commission.avgRate.toFixed(1)}%`, icon: Scale, sub: "Average" },
  ];

  return (
    <div className="space-y-6 px-5 pb-8 md:px-9">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1120] via-[#1D3E64] to-dash-brand p-8 text-white shadow-lg md:p-10">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#9DD7FF] backdrop-blur-md">Supplier Portal</span>
            <h2 className="mt-4 text-[32px] leading-tight font-black tracking-tight text-white">Commissions, payouts & tour operations</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80">Track gross sales, Tourvaa commission, net payable, and payout release status from one dashboard.</p>
          </div>
          <div className="hidden rounded-2xl border border-white/20 bg-white/10 px-8 py-5 text-center shadow-xl backdrop-blur-md sm:block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/60">Signed in as</span>
            <span className="block text-xl font-black leading-none text-white">{user?.name}</span>
            <span className="mt-1 block text-xs text-white/70">Tour Supplier</span>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-dash-border bg-white" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="group flex items-center justify-between rounded-3xl border border-dash-border/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-dash-brand/30 hover:shadow-xl">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F0F7FF] text-dash-brand shadow-sm transition-colors duration-300 group-hover:bg-dash-brand group-hover:text-white">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-dash-muted">{label}</p>
                  <p className="mt-1 text-2xl font-black text-dash-text">{value}</p>
                </div>
              </div>
              <span className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-dash-muted">{sub}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-dash-text">Commission Summary</h2>
              <p className="mt-0.5 text-sm text-dash-muted">Gross sales minus Tourvaa commission equals your net payable.</p>
            </div>
            <Link href="/supplier/earnings" className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body hover:bg-[#F3F8FC]">
              View ledger <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Gross Sales", value: money(commission.gross, commission.currency), icon: TrendingUp, tone: "bg-blue-50 text-blue-700" },
              { label: "Tourvaa Commission", value: money(commission.commissionAmount, commission.currency), icon: TrendingDown, tone: "bg-amber-50 text-amber-700" },
              { label: "Net Payable", value: money(commission.net, commission.currency), icon: Wallet, tone: "bg-emerald-50 text-emerald-700" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-dash-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase text-dash-muted">{label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></span>
                </div>
                <p className="mt-3 text-xl font-black text-dash-text">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-dash-bg p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Paid to date</p>
              <p className="mt-1 text-lg font-black text-dash-text">{money(commission.paid, commission.currency)}</p>
            </div>
            <div className="rounded-2xl bg-dash-bg p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Pending payout</p>
              <p className="mt-1 text-lg font-black text-dash-text">{money(commission.pending, commission.currency)}</p>
            </div>
            <div className="rounded-2xl bg-dash-bg p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Avg commission</p>
              <p className="mt-1 text-lg font-black text-dash-text">{commission.avgRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-black text-dash-text">Payout Status</h2>
            <Link href="/supplier/payouts" className="text-sm font-bold text-dash-brand hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-dash-border p-4">
              <div><p className="text-xs font-bold uppercase text-dash-subtle">Pending / approved</p><p className="mt-1 font-black text-dash-text">{money(commission.pendingPayoutTotal, commission.currency)}</p></div>
              <Clock3 size={20} className="text-amber-600" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-dash-border p-4">
              <div><p className="text-xs font-bold uppercase text-dash-subtle">Released payouts</p><p className="mt-1 font-black text-dash-text">{money(commission.paidPayoutTotal, commission.currency)}</p></div>
              <ReceiptText size={20} className="text-emerald-600" />
            </div>
            {commission.latestPayout && (
              <div className="rounded-2xl bg-dash-bg p-4">
                <p className="text-xs font-bold uppercase text-dash-subtle">Latest payout</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-dash-text">{commission.latestPayout.payout_code}</p>
                    <p className="text-xs text-dash-muted">{dateText(commission.latestPayout.created_at)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(commission.latestPayout.status || "")}`}>{commission.latestPayout.status}</span>
                </div>
              </div>
            )}
            <Link href="/supplier/payouts" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
              <Banknote size={16} /> Request payout
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-black text-dash-text">Dashboard Filters</h2>
            <p className="mt-0.5 text-sm text-dash-muted">Filter tour and booking data by date range and status.</p>
          </div>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-bold text-dash-muted hover:bg-[#F3F8FC]">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1"><label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Start Date</label><input type="date" title="Start date" value={filters.start_date} onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))} className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-dash-body outline-none focus:border-dash-brand" /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-bold uppercase tracking-wide text-dash-muted">End Date</label><input type="date" title="End date" value={filters.end_date} onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))} className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-dash-body outline-none focus:border-dash-brand" /></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-bold uppercase tracking-wide text-dash-muted">Booking Status</label><select title="Booking status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-dash-body outline-none focus:border-dash-brand"><option value="">All Statuses</option><option value="confirmed">Confirmed</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <button type="button" onClick={() => setFilters({ start_date: "", end_date: "", status: "" })} className="rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-bold text-dash-muted hover:bg-[#F3F8FC]">Reset</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-dash-text">Recent Bookings</h2><Link href="/supplier/bookings" className="flex items-center gap-1 text-sm font-bold text-dash-brand hover:underline">View all <ArrowRight size={13} /></Link></div>
          {bookings.length === 0 ? <p className="py-6 text-center text-sm text-dash-muted">No bookings yet.</p> : <div className="space-y-3">{bookings.map((b) => <div key={b.id} className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3"><div><p className="font-semibold text-dash-text">{b.booking_code}</p><p className="text-xs text-dash-muted">{b.tour_name ?? "-"}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(b.booking_status)}`}>{b.booking_status.replaceAll("_", " ")}</span><Link href={`/supplier/bookings/${b.id}`} className="text-xs font-bold text-dash-brand hover:underline">View</Link></div></div>)}</div>}
        </div>

        <div className="rounded-3xl border border-dash-border/60 bg-white p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <h2 className="mb-4 font-black text-dash-text">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ href: "/supplier/tours/create", label: "Create Tour", icon: Plus }, { href: "/supplier/tours", label: "My Tours", icon: MapPinned }, { href: "/supplier/earnings", label: "Earnings", icon: CircleDollarSign }, { href: "/supplier/bookings", label: "Bookings", icon: CalendarCheck }].map(({ href, label, icon: Icon }) => <Link key={label} href={href} className="group flex items-center gap-3 rounded-2xl border border-dash-border/60 bg-white p-5 text-sm font-bold text-dash-body shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:border-dash-brand/30 hover:text-dash-brand hover:shadow-md"><Icon size={20} className="text-dash-brand" /> {label}</Link>)}
          </div>
        </div>
      </div>
    </div>
  );
}
