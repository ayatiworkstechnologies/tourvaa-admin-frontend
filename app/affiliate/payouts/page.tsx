"use client";

import { useEffect, useState } from "react";
import { LuBanknote as Banknote } from "react-icons/lu";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type Payout = { id: number; payout_code: string; total_amount: string; currency: string; payment_method: string; status: string; paid_at?: string; created_at?: string };

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (["paid"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending", "approved"].includes(v)) return "bg-amber-50 text-amber-700";
  return "bg-slate-50 text-slate-600";
}

export default function AffiliatePayoutsPage() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const affiliateId = (dashboard?.user as Record<string, unknown>)?.affiliate_id ?? dashboard?.user?.id;
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!affiliateId) return;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/affiliate-payouts", { params: { affiliate_id: affiliateId, limit: 30 } });
        setPayouts(res.data?.items ?? res.data?.data ?? []);
      } catch {
        toast.error("Could not load payout history.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [affiliateId]);

  const columns: DataTableColumn<Payout>[] = [
    { key: "payout_code", header: "Payout Code", className: "font-mono text-xs text-[#344054]", render: (p) => p.payout_code },
    { key: "amount", header: "Amount", className: "font-bold text-purple-700", render: (p) => `${p.currency} ${Number(p.total_amount).toLocaleString()}` },
    { key: "payment_method", header: "Payment Method", className: "text-xs capitalize text-[#667085]", render: (p) => p.payment_method },
    { key: "status", header: "Status", render: (p) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls(p.status)}`}>{p.status}</span> },
    { key: "date", header: "Date", className: "text-xs text-[#667085]", render: (p) => (p.paid_at || p.created_at) ? new Date(p.paid_at || p.created_at!).toLocaleDateString() : "—" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Payout History</h1>
        <p className="mt-1 text-sm text-[#667085]">Track your commission payout requests and payment status.</p>
      </div>

      <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm p-0">
        <DataTable
          ariaLabel="Payouts"
          columns={columns}
          rows={payouts}
          loading={loading}
          emptyTitle="No payouts yet"
          emptyDescription="Payout history will appear here once your commissions are processed."
        />
      </div>
    </div>
  );
}
