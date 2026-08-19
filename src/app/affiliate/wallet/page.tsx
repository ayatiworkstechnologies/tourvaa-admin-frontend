"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { getWalletSummary, getWalletTransactions, type AffiliateWalletSummary, type AffiliateWalletTransaction } from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

function typeCls(type: string) {
  if (type.includes("CREDIT") || type === "PAYOUT_RELEASE") return "bg-emerald-50 text-emerald-700";
  if (type.includes("DEBIT") || type === "PAYOUT_HOLD") return "bg-amber-50 text-amber-700";
  return "bg-slate-50 text-slate-600";
}

export default function AffiliateWalletPage() {
  const toast = useToast();
  const { formatExact: money } = useCurrency();
  const [summary, setSummary] = useState<AffiliateWalletSummary | null>(null);
  const [transactions, setTransactions] = useState<AffiliateWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const load = useCallback(async (targetPage: number = page) => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([getWalletSummary(), getWalletTransactions({ page: targetPage, limit: pageSize })]);
      setSummary(s);
      setTransactions(t.items ?? []);
      setTotal(t.total ?? 0);
      setTotalPages(t.total_pages ?? 1);
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not load wallet.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const columns: DataTableColumn<AffiliateWalletTransaction>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * pageSize + index + 1,
    },
    { key: "type", header: "Type", render: (t) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeCls(t.transaction_type)}`}>{t.transaction_type.replaceAll("_", " ")}</span> },
    { key: "amount", header: "Amount", className: "font-bold text-dash-text", render: (t) => money(t.amount, t.currency) },
    { key: "description", header: "Description", className: "text-xs text-dash-muted", render: (t) => t.description || "-" },
    { key: "date", header: "Date", className: "text-xs text-dash-muted", render: (t) => new Date(t.created_at).toLocaleString() },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-text">Wallet</h1>
        <p className="mt-1 text-sm text-dash-muted">Your commission balance and transaction history.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Available Balance", value: summary?.available_balance, tone: "text-purple-700 bg-purple-50" },
          { label: "Held (Pending Payout)", value: summary?.pending_payout_balance, tone: "text-amber-700 bg-amber-50" },
          { label: "Paid Lifetime", value: summary?.paid_lifetime, tone: "text-emerald-700 bg-emerald-50" },
          { label: "Lifetime Earnings", value: summary?.lifetime_earnings, tone: "text-dash-brand bg-[#E7F5FF]" },
        ].map(({ label, value, tone }) => (
          <div key={label} className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-dash-muted">{label}</p>
            <p className={`mt-2 inline-flex rounded-lg px-2 py-1 text-xl font-black ${tone}`}>{loading ? "…" : money(value ?? "0")}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dash-border bg-white shadow-sm">
        <div className="border-b border-dash-border px-5 py-4">
          <h2 className="font-bold text-dash-text">Transaction History</h2>
        </div>
        <DataTable
          ariaLabel="Wallet transactions"
          columns={columns}
          rows={transactions}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(nextPage) => { setPage(nextPage); void load(nextPage); }}
          emptyTitle="No transactions yet"
        />
      </div>
    </div>
  );
}
