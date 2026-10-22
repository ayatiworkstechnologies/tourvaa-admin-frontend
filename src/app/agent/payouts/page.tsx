"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuCircleDollarSign as Banknote, LuRefreshCw as RefreshCw } from "react-icons/lu";
import api from "@/lib/api/client";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";
import { useCurrency } from "@/hooks/useCurrency";

type LedgerEntry = {
  id: number;
  booking_id?: number;
  booking_code?: string;
  tour_name?: string;
  commission_amount?: string | number;
  commission_percentage?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  currency?: string;
  status?: string;
};

function statusClass(status?: string) {
  const value = (status || "").toLowerCase();
  if (value === "paid") return "bg-emerald-50 text-emerald-700";
  if (["pending", "partial", "reserved"].includes(value)) return "bg-amber-50 text-amber-700";
  if (["refunded", "cancelled"].includes(value)) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-700";
}

export default function AgentPayoutsPage() {
  // Ledger values are settled commission records, not browse prices. Keep
  // their recorded currency instead of converting or default-labeling them.
  const { code: activeCurrency, formatExact: money } = useCurrency();
  const [earnings, setEarnings] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/agent-ledgers", { params: { page, limit } });
      setEarnings(response.data?.items ?? response.data?.data ?? []);
      setTotal(response.data?.total ?? 0);
    } catch {
      setEarnings([]);
      setTotal(0);
      setError("Earnings could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns: DataTableColumn<LedgerEntry>[] = [
    { key: "tour", header: "Tour", className: "font-bold text-dash-text", render: (entry) => entry.tour_name || "Tour booking" },
    { key: "booking", header: "Booking", render: (entry) => entry.booking_id ? <Link href={`/agent/bookings/${entry.booking_id}`} className="font-bold text-dash-brand hover:underline">{entry.booking_code || `Booking #${entry.booking_id}`}</Link> : "-" },
    { key: "rate", header: "Commission", className: "text-right", render: (entry) => `${entry.commission_percentage ?? 0}%` },
    { key: "earned", header: "Earned", className: "text-right font-bold text-dash-text", render: (entry) => money(entry.commission_amount || 0, entry.currency || activeCurrency) },
    { key: "paid", header: "Paid", className: "hidden text-right sm:table-cell", render: (entry) => money(entry.amount_paid || 0, entry.currency || activeCurrency) },
    { key: "outstanding", header: "Outstanding", className: "hidden text-right md:table-cell", render: (entry) => money(entry.amount_pending || 0, entry.currency || activeCurrency) },
    { key: "status", header: "Status", render: (entry) => <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(entry.status)}`}>{entry.status || "pending"}</span> },
  ];

  return (
    <AgentPageShell>
      <AgentPageHeader title="Earnings" description="Commission earned from each tour booking." icon={Banknote} eyebrow="Agent Finance" />
      <AgentSection className="mt-4" title="Tour earnings" description={`${total} booking${total === 1 ? "" : "s"} with commission`}>
        {error && <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm"><RefreshCw size={13} />Retry</button></div>}
        <DataTable ariaLabel="Tour earnings" columns={columns} rows={earnings} loading={loading} page={page} pageSize={limit} total={total} totalPages={Math.ceil(total / limit) || 1} onPageChange={setPage} emptyTitle="No earnings yet" emptyDescription="Commission earnings will appear here when you have tour bookings." />
      </AgentSection>
    </AgentPageShell>
  );
}
