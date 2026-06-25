"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, Coins, Link2, MousePointerClick, Plus, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";

type Summary = { total_clicks?: number; total_conversions?: number; total_commission?: number; pending_commission?: number; currency?: string };
type AffLink = { id: number; ref_code: string; label: string; destination_url: string; is_active: boolean; click_count?: number };
type Conversion = { id: number; booking_code?: string; commission_amount: string; currency: string; status: string; created_at?: string };

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (["approved", "paid", "active"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function AffiliateDashboardPage() {
  const { dashboard } = useAuthContext();
  const { formatCompact, format } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [links, setLinks] = useState<AffLink[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  const affiliateId = (dashboard?.user as Record<string, unknown>)?.affiliate_id ?? dashboard?.user?.id;

  useEffect(() => {
    if (!affiliateId) return;
    async function load() {
      setLoading(true);
      try {
        const [sumRes, linksRes, convRes] = await Promise.allSettled([
          api.get("/dashboard/summary"),
          api.get(`/affiliates/${affiliateId}/links`),
          api.get(`/affiliates/${affiliateId}/conversions`, { params: { limit: 5 } }),
        ]);
        if (sumRes.status === "fulfilled") setSummary(sumRes.value.data?.data ?? {});
        if (linksRes.status === "fulfilled") setLinks(linksRes.value.data?.data ?? linksRes.value.data ?? []);
        if (convRes.status === "fulfilled") setConversions(convRes.value.data?.data ?? convRes.value.data?.items ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [affiliateId]);

  const stats = [
    { label: "Total Clicks", value: summary.total_clicks ?? 0, icon: MousePointerClick, color: "text-blue-600 bg-blue-50" },
    { label: "Conversions", value: summary.total_conversions ?? conversions.length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Commission", value: formatCompact(summary.total_commission), icon: Coins, color: "text-purple-600 bg-purple-50" },
    { label: "Pending Payout", value: formatCompact(summary.pending_commission), icon: Banknote, color: "text-amber-600 bg-amber-50" },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[#E7EAF0] bg-white p-5 h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Affiliate Dashboard</h1>
        <p className="mt-1 text-sm text-[#667085]">Track your referrals, clicks, conversions, and commissions.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-[#667085]">{label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon size={17} /></div>
            </div>
            <p className="mt-3 text-2xl font-black text-[#121826]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Link href="/affiliate/referral-links" className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700 hover:bg-purple-100">
          <Plus size={16} /> Create Referral Link
        </Link>
        <Link href="/affiliate/conversions" className="flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-4 py-3 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA]">
          <TrendingUp size={16} /> View Conversions
        </Link>
        <Link href="/affiliate/payouts" className="flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-4 py-3 text-sm font-bold text-[#344054] hover:bg-[#F5F7FA]">
          <Banknote size={16} /> Payout History
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-[#121826]">My Referral Links</h2>
            <Link href="/affiliate/referral-links" className="text-sm font-bold text-purple-600 hover:underline">Manage <ArrowRight size={13} className="inline" /></Link>
          </div>
          {links.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] py-10 text-center">
              <Link2 size={28} className="mx-auto text-[#D0D5DD]" />
              <p className="mt-3 text-sm font-semibold text-[#667085]">No referral links yet</p>
              <Link href="/affiliate/referral-links" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700">
                <Plus size={13} /> Create first link
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {links.slice(0, 4).map(link => (
                <div key={link.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] px-4 py-3">
                  <div>
                    <p className="font-semibold text-[#121826]">{link.label || link.ref_code}</p>
                    <p className="text-xs font-mono text-[#667085]">{link.ref_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.click_count !== undefined && <span className="text-xs text-[#98A2B3]">{link.click_count} clicks</span>}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${link.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>
                      {link.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-[#121826]">Recent Conversions</h2>
            <Link href="/affiliate/conversions" className="text-sm font-bold text-purple-600 hover:underline">View all <ArrowRight size={13} className="inline" /></Link>
          </div>
          {conversions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] py-10 text-center">
              <TrendingUp size={28} className="mx-auto text-[#D0D5DD]" />
              <p className="mt-3 text-sm font-semibold text-[#667085]">No conversions yet</p>
              <p className="mt-1 text-xs text-[#98A2B3]">Share your referral links to start earning.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversions.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] px-4 py-3">
                  <div>
                    <p className="font-semibold text-[#121826]">{c.booking_code || `Conversion #${c.id}`}</p>
                    <p className="text-xs text-[#667085]">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700">{format(c.commission_amount)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCls(c.status)}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
