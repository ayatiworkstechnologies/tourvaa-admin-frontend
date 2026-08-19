"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuPlus as Plus } from "react-icons/lu";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import {
  getAffiliatePayouts,
  getPayoutMethods,
  getWalletSummary,
  requestPayout,
  type AffiliatePayout,
  type AffiliatePayoutMethod,
  type AffiliateWalletSummary,
} from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (["paid"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["requested", "pending", "approved", "processing"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected", "cancelled"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function AffiliatePayoutsPage() {
  const toast = useToast();
  const { formatExact: money } = useCurrency();
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [methods, setMethods] = useState<AffiliatePayoutMethod[]>([]);
  const [summary, setSummary] = useState<AffiliateWalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const load = useCallback(async (targetPage: number = page) => {
    setLoading(true);
    try {
      const [payoutsRes, methodsRes, summaryRes] = await Promise.all([
        getAffiliatePayouts({ page: targetPage, limit: pageSize }),
        getPayoutMethods(),
        getWalletSummary(),
      ]);
      setPayouts(payoutsRes.items ?? []);
      setTotal(payoutsRes.total ?? 0);
      setTotalPages(payoutsRes.total_pages ?? 1);
      setMethods(methodsRes);
      setSummary(summaryRes);
    } catch {
      toast.error("Could not load payout data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!methodId) { toast.error("Select a payout method."); return; }
    setSaving(true);
    try {
      await requestPayout({ amount, payout_method_id: methodId as number });
      toast.success("Payout requested. Admin will review it shortly.");
      setShowForm(false);
      setAmount("");
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not request payout.");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<AffiliatePayout>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * pageSize + index + 1,
    },
    { key: "payout_code", header: "Payout Code", className: "font-mono text-xs text-dash-body", render: (p) => p.payout_code },
    { key: "amount", header: "Amount", className: "font-bold text-purple-700", render: (p) => money(p.total_amount, p.currency) },
    { key: "payment_method", header: "Method", className: "text-xs capitalize text-dash-muted", render: (p) => (p.payment_method || "").replaceAll("_", " ") },
    { key: "status", header: "Status", render: (p) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusCls(p.status)}`}>{p.status}</span> },
    { key: "date", header: "Date", className: "text-xs text-dash-muted", render: (p) => (p.paid_at || p.created_at) ? new Date(p.paid_at || p.created_at).toLocaleDateString() : "-" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-dash-text">Payouts</h1>
          <p className="mt-1 text-sm text-dash-muted">Request a payout and track commission payment status.</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
          <Plus size={16} /> Request Payout
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
        <p className="text-xs font-bold uppercase text-purple-700">Available Balance</p>
        <p className="mt-1 text-2xl font-black text-purple-900">{loading ? "…" : money(summary?.available_balance ?? "0")}</p>
      </div>

      {showForm && (
        methods.length === 0 ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
            Add a payout method before requesting a payout. <Link href="/affiliate/payout-methods" className="underline">Add one now</Link>.
          </div>
        ) : (
          <form onSubmit={submitRequest} className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-dash-body">Amount</label>
                <input required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100"
                  className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-dash-body">Payout Method</label>
                <select required value={methodId} onChange={(e) => setMethodId(Number(e.target.value))}
                  className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100">
                  <option value="">Select method</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.method_type === "paypal" ? `PayPal — ${m.paypal_email}` : `${m.bank_name} — ${m.account_number_masked}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
                {saving ? "Submitting…" : "Submit Request"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-white">Cancel</button>
            </div>
          </form>
        )
      )}

      <div className="rounded-xl border border-dash-border bg-white shadow-sm p-0">
        <DataTable
          ariaLabel="Payouts"
          columns={columns}
          rows={payouts}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(nextPage) => { setPage(nextPage); void load(nextPage); }}
          emptyTitle="No payouts yet"
          emptyDescription="Payout history will appear here once you request a payout."
        />
      </div>
    </div>
  );
}
