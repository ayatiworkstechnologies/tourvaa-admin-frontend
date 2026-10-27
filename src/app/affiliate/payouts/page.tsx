"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import {
  getAffiliatePayouts,
  getWalletSummary,
  type AffiliatePayout,
  type AffiliateWalletSummary,
} from "@/lib/api/services/affiliateService";

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
  const [summary, setSummary] = useState<AffiliateWalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const load = useCallback(async (targetPage: number = page) => {
    setLoading(true);
    try {
      const [payoutsRes, summaryRes] = await Promise.all([
        getAffiliatePayouts({ page: targetPage, limit: pageSize }),
        getWalletSummary(),
      ]);
      setPayouts(payoutsRes.items ?? []);
      setTotal(payoutsRes.total ?? 0);
      setTotalPages(payoutsRes.total_pages ?? 1);
      setSummary(summaryRes);
    } catch {
      toast.error("Could not load payout data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => { void load(); }, [load]);

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
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusCls(p.status)}`}>{p.status}</span>
          {p.status === "rejected" && p.rejection_reason && (
            <p className="mt-1 max-w-50 text-[11px] text-red-600" title={p.rejection_reason}>{p.rejection_reason}</p>
          )}
        </div>
      ),
    },
    { key: "date", header: "Date", className: "text-xs text-dash-muted", render: (p) => (p.paid_at || p.created_at) ? new Date(p.paid_at || p.created_at).toLocaleDateString() : "-" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-black text-dash-text">Payouts</h1>
          <p className="mt-1 text-sm text-dash-muted">View your commission balance and Tourvaa-managed payout status.</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
        <p className="text-xs font-bold uppercase text-purple-700">Available Balance</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {loading ? <p className="text-2xl font-black text-purple-900">Loading...</p> : (summary?.available_balances ?? []).length > 0 ? (
            summary?.available_balances?.map((balance) => <span key={balance.currency} className="text-2xl font-black text-purple-900">{money(balance.amount, balance.currency)}</span>)
          ) : <p className="text-2xl font-black text-purple-900">{money("0")}</p>}
        </div>
      </div>

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
          emptyDescription="Payout history will appear here after Tourvaa records a payment."
        />
      </div>
    </div>
  );
}
