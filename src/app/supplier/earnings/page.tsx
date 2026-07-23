"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuBanknote as Banknote, LuCircleCheckBig as CheckCircle2, LuClock3 as Clock3, LuLoaderCircle as Loader2, LuReceiptText as ReceiptText, LuRefreshCw as RefreshCw, LuTrendingDown as TrendingDown, LuTrendingUp as TrendingUp, LuWallet as Wallet } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";

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

function money(v: number | string | undefined, cur = "USD") {
  return `${cur} ${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateText(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

const inputCls = "w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-muted";

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
      if (ledgerRes.status === "rejected" || payoutRes.status === "rejected") setError("Some finance data could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const summary = useMemo(() => {
    const currency = entries.find((e) => e.currency)?.currency ?? payouts.find((p) => p.currency)?.currency ?? "USD";
    const gross = entries.reduce((sum, e) => sum + Number(e.gross_amount ?? 0), 0);
    const commission = entries.reduce((sum, e) => sum + Number(e.commission_amount ?? 0), 0);
    const net = entries.reduce((sum, e) => sum + Number(e.net_payable ?? 0), 0);
    const paid = entries.reduce((sum, e) => sum + Number(e.amount_paid ?? 0), 0);
    const available = entries
      .filter((e) => ["pending", "partial"].includes((e.status || "").toLowerCase()))
      .reduce((sum, e) => sum + Number(e.amount_pending ?? 0), 0);
    const reserved = entries
      .filter((e) => (e.status || "").toLowerCase() === "reserved")
      .reduce((sum, e) => sum + Number(e.amount_pending ?? 0), 0);
    const avgCommission = gross > 0 ? (commission / gross) * 100 : 0;
    const pendingPayouts = payouts.filter((p) => ["pending", "approved"].includes((p.status || "").toLowerCase()));
    const paidPayouts = payouts.filter((p) => (p.status || "").toLowerCase() === "paid");
    return {
      currency,
      gross,
      commission,
      net,
      paid,
      pending: available,
      reserved,
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
    { label: "Reserved in Requests", value: money(summary.reserved, summary.currency), icon: ReceiptText, color: "text-indigo-600 bg-indigo-50" },
  ];

  const columns: DataTableColumn<LedgerEntry>[] = [
    { key: "date", header: "Date", className: "whitespace-nowrap text-xs text-dash-muted", render: (e) => dateText(e.created_at) },
    {
      key: "booking",
      header: "Booking",
      render: (e) => <><p className="font-semibold text-dash-text">{e.booking_code ?? `Booking #${e.booking_id ?? e.id}`}</p>{e.notes && <p className="text-xs text-dash-subtle">{e.notes}</p>}</>,
    },
    { key: "gross", header: "Gross", className: "text-right font-semibold text-dash-text", render: (e) => money(e.gross_amount, e.currency ?? summary.currency) },
    { key: "commission", header: "Commission", className: "text-right font-semibold text-amber-600", render: (e) => `-${money(e.commission_amount, e.currency ?? summary.currency)}` },
    { key: "net", header: "Net Payable", className: "text-right font-black text-emerald-700", render: (e) => money(e.net_payable, e.currency ?? summary.currency) },
    { key: "pending", header: "Pending", className: "text-right font-bold text-rose-600", render: (e) => money(e.amount_pending, e.currency ?? summary.currency) },
    { key: "status", header: "Status", render: (e) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusColors(e.status ?? "")}`}>{e.status ?? "-"}</span> },
  ];

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Earnings & Commission" description="Understand every booking value, Tourvaa commission deduction, net earning, and payout balance." icon={Wallet} eyebrow="Supplier Finance">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-[#657C6F]">Ledger values remain in their original booking currency.</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#D5E6DB] bg-white px-4 py-2.5 text-xs font-black text-[#526C5D] hover:bg-[#F0F8F3] disabled:opacity-60">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button type="button" onClick={openAutoRequest} disabled={summary.pending <= 0} className="inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#117331] disabled:opacity-50">
              <Banknote size={16} /> Auto Request Payout
            </button>
          </div>
        </div>
      </SupplierPageHeader>

      {requestSuccess && <div className="mt-4 mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {requestSuccess}</div>}
      {requestError && <div className="mt-4 mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><AlertCircle size={16} /> {requestError}</div>}

      {requestOpen && (
        <div className="mt-4 mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-dash-text">Auto payout request</h2>
              <p className="mt-0.5 text-sm text-dash-muted">Available balance: <strong>{money(summary.pending, summary.currency)}</strong></p>
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
            <button type="button" onClick={() => setRequestOpen(false)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg-muted">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-4 mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-black tracking-tight text-dash-text">{value}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase text-dash-muted">Average Commission</p><p className="mt-2 text-2xl font-black text-dash-text">{summary.avgCommission.toFixed(2)}%</p></div>
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase text-dash-muted">Payouts In Progress</p><p className="mt-2 text-2xl font-black text-dash-text">{money(summary.pendingPayoutTotal, summary.currency)}</p></div>
        <div className="rounded-2xl border border-transparent bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase text-dash-muted">Released Payouts</p><p className="mt-2 text-2xl font-black text-dash-text">{money(summary.paidPayoutTotal, summary.currency)}</p></div>
      </div>

      {error && <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={load} className="text-xs font-bold underline">Retry</button></div>}

      {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl border border-dash-border bg-white" />)}</div> : !error && <div className="rounded-xl border border-dash-border bg-white p-0 shadow-sm"><div className="border-b border-dash-border px-5 py-4"><h2 className="font-black text-dash-text">Ledger Entries</h2><p className="mt-0.5 text-sm text-dash-muted">Each row shows gross value, commission deduction, net payable, and remaining payout balance.</p></div><DataTable ariaLabel="Earnings table" columns={columns} rows={entries} emptyTitle="No ledger entries yet" emptyDescription="Earnings from confirmed bookings will appear here." /></div>}
    </SupplierPageShell>
  );
}
