"use client";

import { useEffect, useState } from "react";
import { LuBanknote as Banknote, LuCircleAlert as AlertCircle, LuCalendarDays as CalendarDays } from "react-icons/lu";
import api from "@/lib/api/client";
import { SupplierPageHeader, SupplierPageShell } from "@/components/supplier/SupplierPage";
import { useCurrency } from "@/hooks/useCurrency";

type Payout = {
  id: number;
  payout_code?: string;
  amount?: number | string;
  total_amount?: number | string;
  currency?: string;
  status?: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  paid_at?: string;
};

function monthEndPayoutDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function statusColors(status: string) {
  const value = status.toLowerCase();
  if (["paid", "completed", "settled"].includes(value)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "processing", "approved"].includes(value)) return "bg-amber-50 text-amber-700";
  if (["failed", "rejected", "cancelled"].includes(value)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function PayoutsPage() {
  const { formatExact: money } = useCurrency();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nextPayoutDate = monthEndPayoutDate();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/supplier-payouts", { params: { limit: 20 } });
      setPayouts(response.data?.items ?? response.data?.data ?? response.data ?? []);
    } catch {
      setError("Failed to load payout history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Payouts" description="Track your monthly payout schedule and payment history." icon={Banknote} eyebrow="Supplier Finance" />

      <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><CalendarDays size={20} /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-emerald-800">Next payout date</p>
            <p className="mt-1 text-xl font-black text-emerald-950">{nextPayoutDate}</p>
            <p className="mt-1 text-sm text-emerald-800">Payouts are scheduled for processing at the end of every month. No action is required from you.</p>
          </div>
        </div>
      </section>

      {error && <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={load} className="text-xs font-bold underline">Retry</button></div>}
      {loading && <div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl border border-dash-border bg-white" />)}</div>}
      {!loading && !error && payouts.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] py-16 text-center"><Banknote size={36} className="mx-auto text-[#D0D5DD]" /><p className="mt-4 text-base font-bold text-dash-muted">No payouts yet</p><p className="mt-1 text-sm text-dash-subtle">Processed monthly payouts will appear here.</p></div>}
      {!loading && payouts.length > 0 && <div className="mt-4 space-y-3">
        {payouts.map((payout) => <div key={payout.id} className="flex flex-col gap-3 rounded-xl border border-dash-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><Banknote size={18} className="text-emerald-600" /></span><div><p className="font-bold text-dash-text">{payout.payout_code ?? `Payout #${payout.id}`}</p><p className="text-xs text-dash-muted">{payout.payment_method?.replace(/_/g, " ") ?? "Bank transfer"}</p><p className="mt-0.5 text-xs text-dash-subtle">Processed: {(payout.paid_at ?? payout.created_at ?? "").split("T")[0] || "-"}</p></div></div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="font-black text-dash-text">{money(payout.total_amount ?? payout.amount, payout.currency)}</p>{payout.notes && <p className="max-w-[160px] truncate text-xs text-dash-subtle">{payout.notes}</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors(payout.status ?? "")}`}>{payout.status ?? "pending"}</span></div>
        </div>)}
      </div>}
    </SupplierPageShell>
  );
}
