"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type LedgerEntry = {
  id: number;
  booking_id?: number;
  booking_code?: string;
  supplier_name?: string;
  gross_amount?: number | string;
  commission_amount?: number | string;
  commission_percentage?: number | string;
  net_payable?: number | string;
  amount_paid?: number | string;
  amount_pending?: number | string;
  status?: string;
  currency?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
};

type Payout = {
  id: number;
  payout_code?: string;
  total_amount?: number | string;
  currency?: string;
  payment_method?: string;
  status?: string;
  created_at?: string;
  paid_at?: string;
  notes?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["settled", "paid", "completed"].includes(v)) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (["pending", "processing", "reserved", "partial", "approved"].includes(v)) return "bg-amber-50 text-amber-700 border border-amber-100";
  if (["failed", "cancelled", "rejected"].includes(v)) return "bg-red-50 text-red-600 border border-red-100";
  return "bg-slate-50 text-slate-600 border border-slate-100";
}

function money(v: number | string | undefined, cur = "AED") {
  return `${cur} ${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

const inputCls = "w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#667085]";

export default function EarningsPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ledgerRes, payoutRes] = await Promise.allSettled([
        api.get("/supplier-ledgers", { params: { limit: 50 } }),
        api.get("/supplier-payouts", { params: { limit: 20 } }),
      ]);
      if (ledgerRes.status === "fulfilled") setEntries(ledgerRes.value.data?.items ?? ledgerRes.value.data?.data ?? []);
      if (payoutRes.status === "fulfilled") setPayouts(payoutRes.value.data?.items ?? payoutRes.value.data?.data ?? []);
      if (ledgerRes.status === "rejected") setError("Failed to load earnings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const summary = useMemo(() => {
    const currency = entries.find((e) => e.currency)?.currency ?? payouts.find((p) => p.currency)?.currency ?? "AED";
    const gross = entries.reduce((sum, e) => sum + Number(e.gross_amount ?? 0), 0);
    const commission = entries.reduce((sum, e) => sum + Number(e.commission_amount ?? 0), 0);
    const net = entries.reduce((sum, e) => sum + Number(e.net_payable ?? 0), 0);
    const paid = entries.reduce((sum, e) => sum + Number(e.amount_paid ?? 0), 0);
    const pending = entries.reduce((sum, e) => sum + Number(e.amount_pending ?? 0), 0);
    const avgCommission = gross > 0 ? (commission / gross) * 100 : 0;
    const pendingPayouts = payouts.filter((p) => ["pending", "approved"].includes((p.status || "").toLowerCase()));
    const paidPayouts = payouts.filter((p) => (p.status || "").toLowerCase() === "paid");
    return {
      currency,
      gross,
      commission,
      net,
      paid,
      pending,
      avgCommission,
      pendingPayoutTotal: pendingPayouts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
      paidPayoutTotal: paidPayouts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0),
    };
  }, [entries, payouts]);

  function openAutoRequest() {
    setRequestOpen(true);
    setRequestError("");
    setRequestSuccess("");
    setRequestAmount(summary.pending > 0 ? summary.pending.toFixed(2) : "");
  }

  async function submitPayoutRequest() {
    const amount = Number(requestAmount);
    if (!amount || amount <= 0) {
      setRequestError("Enter a valid payout amount.");
      return;
    }
    if (amount > summary.pending) {
      setRequestError("Requested amount cannot exceed pending payable balance.");
      return;
    }
    setSubmitting(true);
    setRequestError("");
    setRequestSuccess("");
    try {
      await api.post("/supplier-payouts", {
        amount,
        currency: summary.currency,
        payment_method: paymentMethod,
        notes: notes || `Auto payout request from earnings for ${money(amount, summary.currency)}`,
      });
      setRequestSuccess("Payout request submitted successfully.");
      setRequestOpen(false);
      setRequestAmount("");
      setNotes("");
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to request payout.";
      setRequestError(typeof msg === "string" ? msg : "Failed to request payout.");
    } finally {
      setSubmitting(false);
    }
  }

  const summaryCards = [
    { label: "Gross Sales", value: money(summary.gross, summary.currency), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Tourvaa Commission", value: money(summary.commission, summary.currency), icon: TrendingDown, color: "text-amber-600 bg-amber-50" },
    { label: "Net Payable", value: money(summary.net, summary.currency), icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
    { label: "Paid", value: money(summary.paid, summary.currency), icon: Banknote, color: "text-purple-600 bg-purple-50" },
    { label: "Available Payout", value: money(summary.pending, summary.currency), icon: Clock3, color: "text-rose-600 bg-rose-50" },
  ];

  const columns: DataTableColumn<LedgerEntry>[] = [
    { key: "date", header: "Date", className: "whitespace-nowrap text-xs text-[#667085]", render: (e) => dateText(e.created_at) },
    {
      key: "booking",
      header: "Booking",
      render: (e) => <><p className="font-semibold text-[#121826]">{e.booking_code ?? `Booking #${e.booking_id ?? e.id}`}</p>{e.notes && <p className="text-xs text-[#98A2B3]">{e.notes}</p>}</>,
    },
    { key: "gross", header: "Gross", className: "text-right font-semibold text-[#121826]", render: (e) => money(e.gross_amount, e.currency ?? summary.currency) },
    { key: "commission", header: "Commission", className: "text-right font-semibold text-amber-600", render: (e) => `-${money(e.commission_amount, e.currency ?? summary.currency)}` },
    { key: "net", header: "Net Payable", className: "text-right font-black text-emerald-700", render: (e) => money(e.net_payable, e.currency ?? summary.currency) },
    { key: "pending", header: "Pending", className: "text-right font-bold text-rose-600", render: (e) => money(e.amount_pending, e.currency ?? summary.currency) },
    { key: "status", header: "Status", render: (e) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusColors(e.status ?? "")}`}>{e.status ?? "-"}</span> },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-xl shadow-emerald-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm">Supplier Finance</span>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl">Earnings & Commission</h1>
            <p className="mt-2 max-w-lg text-sm font-medium text-emerald-100">Track gross booking value, Tourvaa commission, net payable, and payout requests.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 disabled:opacity-60 transition-all">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button type="button" onClick={openAutoRequest} disabled={summary.pending <= 0} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50 transition-all">
              <Banknote size={16} /> Auto Request Payout
            </button>
          </div>
        </div>
      </div>

      {requestSuccess && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {requestSuccess}</div>}
      {requestError && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><AlertCircle size={16} /> {requestError}</div>}

      {requestOpen && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-[#121826]">Auto payout request</h2>
              <p className="mt-0.5 text-sm text-[#667085]">Available balance: <strong>{money(summary.pending, summary.currency)}</strong></p>
            </div>
            <Link href="/supplier/payouts" className="text-sm font-bold text-emerald-700 hover:underline">View payout history</Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label><span className={labelCls}>Amount</span><input type="number" min="0.01" max={summary.pending} step="0.01" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className={inputCls} /></label>
            <label><span className={labelCls}>Payment Method</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="online">Online Payment</option></select></label>
            <label><span className={labelCls}>Notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className={inputCls} /></label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={submitPayoutRequest} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Submit Request</button>
            <button type="button" onClick={() => setRequestOpen(false)} className="rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA]">Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-black tracking-tight text-[#121826]">{value}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase text-[#667085]">Average Commission</p><p className="mt-2 text-2xl font-black text-[#121826]">{summary.avgCommission.toFixed(2)}%</p></div>
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase text-[#667085]">Payouts In Progress</p><p className="mt-2 text-2xl font-black text-[#121826]">{money(summary.pendingPayoutTotal, summary.currency)}</p></div>
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase text-[#667085]">Released Payouts</p><p className="mt-2 text-2xl font-black text-[#121826]">{money(summary.paidPayoutTotal, summary.currency)}</p></div>
      </div>

      {error && <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={load} className="text-xs font-bold underline">Retry</button></div>}

      {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-[#E7EAF0] bg-white" />)}</div> : !error && <div className="rounded-xl border border-[#E7EAF0] bg-white p-0 shadow-sm"><div className="border-b border-[#E7EAF0] px-5 py-4"><h2 className="font-black text-[#121826]">Ledger Entries</h2><p className="mt-0.5 text-sm text-[#667085]">Each row shows gross value, commission deduction, net payable, and remaining payout balance.</p></div><DataTable ariaLabel="Earnings table" columns={columns} rows={entries} emptyTitle="No ledger entries yet" emptyDescription="Earnings from confirmed bookings will appear here." /></div>}
    </div>
  );
}
