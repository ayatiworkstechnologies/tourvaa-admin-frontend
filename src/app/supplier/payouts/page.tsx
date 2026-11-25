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

type LedgerEntry = {
  status?: string;
  booking_status?: string;
  amount_pending?: number | string;
  payout_eligible?: boolean;
  payout_eligible_at?: string | null;
};

function payoutEligibilityLabel(entries: LedgerEntry[]) {
  const outstanding = entries.filter((entry) => ["pending", "partial"].includes((entry.status || "").toLowerCase()) && Number(entry.amount_pending || 0) > 0);
  if (outstanding.some((entry) => entry.payout_eligible)) return "Eligible now";
  const upcoming = outstanding
    .map((entry) => entry.payout_eligible_at ? new Date(entry.payout_eligible_at) : null)
    .filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() > Date.now()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  if (upcoming) return upcoming.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
  if (outstanding.some((entry) => entry.booking_status === "completed" && !entry.payout_eligible_at)) return "Completion date unavailable";
  if (outstanding.length) return "After tour completion";
  return "No pending balance";
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
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [eligibilityUnavailable, setEligibilityUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nextPayoutDate = eligibilityUnavailable ? "Eligibility unavailable" : payoutEligibilityLabel(ledgerEntries);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/supplier-payouts", { params: { limit: 20 } });
      setPayouts(response.data?.items ?? response.data?.data ?? response.data ?? []);
      try {
        const ledgerResponse = await api.get("/supplier-ledgers", { params: { limit: 1000 } });
        setLedgerEntries(ledgerResponse.data?.items ?? ledgerResponse.data?.data ?? []);
        setEligibilityUnavailable(false);
      } catch {
        setLedgerEntries([]);
        setEligibilityUnavailable(true);
      }
    } catch {
      setError("Failed to load payout history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <SupplierPageShell>
      <SupplierPageHeader title="Payouts" description="Track payout eligibility and payment history." icon={Banknote} eyebrow="Supplier Finance" />

      <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><CalendarDays size={20} /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-emerald-800">Next payout eligibility</p>
            <p className="mt-1 text-xl font-black text-emerald-950">{nextPayoutDate}</p>
            <p className="mt-1 text-sm text-emerald-800">Earnings become eligible 7 days after tour completion. Eligible payouts still require admin review and manual payment.</p>
          </div>
        </div>
      </section>

      {error && <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span><button type="button" onClick={load} className="text-xs font-bold underline">Retry</button></div>}
      {loading && <div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl border border-dash-border bg-white" />)}</div>}
      {!loading && !error && payouts.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-[#D0D5DD] py-16 text-center"><Banknote size={36} className="mx-auto text-[#D0D5DD]" /><p className="mt-4 text-base font-bold text-dash-muted">No payouts yet</p><p className="mt-1 text-sm text-dash-subtle">Eligible balances appear here after admin payout batches are created.</p></div>}
      {!loading && payouts.length > 0 && <div className="mt-4 space-y-3">
        {payouts.map((payout) => <div key={payout.id} className="flex flex-col gap-3 rounded-xl border border-dash-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><Banknote size={18} className="text-emerald-600" /></span><div><p className="font-bold text-dash-text">{payout.payout_code ?? `Payout #${payout.id}`}</p><p className="text-xs text-dash-muted">{payout.payment_method?.replace(/_/g, " ") ?? "Bank transfer"}</p><p className="mt-0.5 text-xs text-dash-subtle">Processed: {(payout.paid_at ?? payout.created_at ?? "").split("T")[0] || "-"}</p></div></div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="font-black text-dash-text">{money(payout.total_amount ?? payout.amount, payout.currency)}</p>{payout.notes && <p className="max-w-[160px] truncate text-xs text-dash-subtle">{payout.notes}</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors(payout.status ?? "")}`}>{payout.status ?? "pending"}</span></div>
        </div>)}
      </div>}
    </SupplierPageShell>
  );
}
