"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, Coins } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type CommissionSummary = { total_commission?: number; paid_commission?: number; pending_commission?: number; currency?: string };

export default function CommissionsPage() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const affiliateId = (dashboard?.user as Record<string, unknown>)?.affiliate_id ?? dashboard?.user?.id;
  const [summary, setSummary] = useState<CommissionSummary>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!affiliateId) return;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/affiliates/${affiliateId}/commissions`);
        setSummary(res.data?.data ?? res.data ?? {});
      } catch {
        toast.error("Could not load commission data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [affiliateId]);

  const cur = summary.currency || "AED";
  const fmt = (v: number | undefined) => `${cur} ${Number(v || 0).toLocaleString()}`;

  const cards = [
    { label: "Total Commission Earned", value: fmt(summary.total_commission), color: "text-purple-700 bg-purple-50", icon: Coins },
    { label: "Commission Paid Out", value: fmt(summary.paid_commission), color: "text-emerald-700 bg-emerald-50", icon: Banknote },
    { label: "Pending Commission", value: fmt(summary.pending_commission), color: "text-amber-700 bg-amber-50", icon: Coins },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Commissions</h1>
        <p className="mt-1 text-sm text-[#667085]">Your commission earnings summary and breakdown.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse h-28 rounded-xl border border-[#E7EAF0] bg-white" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div>
              <p className="text-xs font-bold uppercase text-[#667085]">{label}</p>
              <p className="mt-2 text-2xl font-black text-[#121826]">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-[#E7EAF0] bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-[#121826]">Commission Structure</h2>
        <p className="text-sm text-[#667085]">Your commission rate is set by Tourvaa and applied to each qualifying booking made through your referral links. Commissions are reviewed and approved by the admin team before payout.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/affiliate/conversions" className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA]">
            View Conversions <ArrowRight size={14} />
          </Link>
          <Link href="/affiliate/payouts" className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
            Request Payout <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
