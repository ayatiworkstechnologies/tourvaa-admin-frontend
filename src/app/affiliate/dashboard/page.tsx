"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuBanknote as Banknote,
  LuCircleAlert as AlertCircle,
  LuCoins as Coins,
  LuFileCheck as FileCheck,
  LuHeadphones as Headphones,
  LuLink2 as Link2,
  LuLock as Lock,
  LuLogOut as LogOut,
  LuMailCheck as MailCheck,
  LuMegaphone as Megaphone,
  LuMousePointerClick as MousePointerClick,
  LuPlus as Plus,
  LuTrendingUp as TrendingUp,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { affiliateApprovalStatus, isApprovedAffiliate } from "@/lib/auth/affiliateAccess";

type Summary = { total_conversions?: number; total_commission?: string; pending_commission?: string };
type AffLink = { id: number; ref_code: string; label: string; destination_url: string; is_active: boolean; total_clicks?: number; total_conversions?: number };
type Conversion = { id: number; booking_code?: string; commission_amount: string; currency: string; status: string; converted_at?: string };

function statusCls(s: string) {
  const v = (s || "").toLowerCase();
  if (["approved", "paid", "active"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["pending"].includes(v)) return "bg-amber-50 text-amber-700";
  if (["rejected"].includes(v)) return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

export default function AffiliateDashboardPage() {
  const { user } = useAuthContext();
  return isApprovedAffiliate(user) ? <ApprovedAffiliateDashboard /> : <PendingAffiliateDashboard />;
}

type PendingAffiliateProfile = {
  name?: string;
  business_type?: string;
  country_id?: number;
  city_id?: number;
  marketing_info?: unknown;
  documents?: Array<{ id: number; status?: string }>;
};

function PendingAffiliateDashboard() {
  const { user, logout } = useAuthContext();
  const [profile, setProfile] = useState<PendingAffiliateProfile>({});

  useEffect(() => {
    api.get("/affiliates/me")
      .then((response) => setProfile(response.data?.data ?? {}))
      .catch(() => setProfile({}));
  }, []);

  const checks = [
    Boolean(profile.name),
    Boolean(profile.country_id),
    Boolean(profile.marketing_info),
    Boolean(profile.documents?.length),
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const missingDocuments = !profile.documents?.length;
  const status = affiliateApprovalStatus(user);
  const lockedModules = ["Referral Links", "Payout Methods", "Payouts", "Wallet"];

  return (
    <div className="min-h-screen bg-[#FAF5FF] px-4 py-6 sm:px-6 xl:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B0764] via-[#6D28D9] to-[#9333EA] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold"><MailCheck size={15} /> Email verified</span>
              <h1 className="mt-4 text-2xl font-black sm:text-3xl">Welcome, {user?.name?.split(" ")[0] || "Affiliate"}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-purple-50/80">Your account is active. Tourvaa is reviewing your affiliate profile before unlocking referral tools.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-purple-100">Approval status</p>
              <p className="mt-2 text-xl font-black">{status.replaceAll("_", " ")}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#3B0764]">Complete your affiliate profile</h2>
                <p className="mt-1 text-sm text-slate-500">A complete profile helps the review team approve you faster.</p>
              </div>
              <span className="text-2xl font-black text-purple-700">{completion}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-purple-100"><div className="h-full rounded-full bg-purple-600" style={{ width: `${completion}%` }} /></div>
            {missingDocuments && <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800"><AlertCircle size={17} /> Verification documents are still missing.</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/affiliate/profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white"><Megaphone size={16} /> Complete profile</Link>
              <Link href="/affiliate/profile?tab=documents" className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 px-5 py-3 text-sm font-bold text-purple-700"><FileCheck size={16} /> Upload documents</Link>
              <Link href="/affiliate/messages" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"><Headphones size={16} /> Contact support</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#3B0764]">What happens next?</h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600">
              <li><b className="text-slate-900">1. Submit details.</b> Complete your profile and documents.</li>
              <li><b className="text-slate-900">2. Tourvaa reviews.</b> We may request more information.</li>
              <li><b className="text-slate-900">3. Referral tools unlock.</b> You will receive an email and notification.</li>
            </ol>
          </section>
        </div>

        <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#3B0764]">Operational modules</h2>
          <p className="mt-1 text-sm text-slate-500">These features unlock automatically after approval.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lockedModules.map((module) => <div key={module} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500"><Lock size={16} className="text-amber-500" /> {module}</div>)}
          </div>
          <button type="button" onClick={() => logout()} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-rose-600"><LogOut size={16} /> Sign out</button>
        </section>
      </div>
    </div>
  );
}

function ApprovedAffiliateDashboard() {
  const { dashboard } = useAuthContext();
  const { formatCompact, format } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [links, setLinks] = useState<AffLink[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  const affiliateId = dashboard?.user?.affiliate_id ?? null;

  useEffect(() => {
    if (!affiliateId) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      try {
        const [sumRes, linksRes, convRes] = await Promise.allSettled([
          api.get(`/affiliates/${affiliateId}/commissions`),
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
    { label: "Total Clicks", value: links.reduce((total, link) => total + Number(link.total_clicks || 0), 0), icon: MousePointerClick, color: "text-blue-600 bg-blue-50" },
    { label: "Conversions", value: summary.total_conversions ?? conversions.length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Commission", value: formatCompact(summary.total_commission), icon: Coins, color: "text-purple-600 bg-purple-50" },
    { label: "Pending Payout", value: formatCompact(summary.pending_commission), icon: Banknote, color: "text-amber-600 bg-amber-50" },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-dash-border bg-white p-5 h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-text">Affiliate Dashboard</h1>
        <p className="mt-1 text-sm text-dash-muted">Track your referrals, clicks, conversions, and commissions.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-dash-muted">{label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon size={17} /></div>
            </div>
            <p className="mt-3 text-2xl font-black text-dash-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Link href="/affiliate/referral-links" className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700 hover:bg-purple-100">
          <Plus size={16} /> Create Referral Link
        </Link>
        <Link href="/affiliate/conversions" className="flex items-center justify-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-3 text-sm font-bold text-dash-body hover:bg-dash-bg-muted">
          <TrendingUp size={16} /> View Conversions
        </Link>
        <Link href="/affiliate/payouts" className="flex items-center justify-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-3 text-sm font-bold text-dash-body hover:bg-dash-bg-muted">
          <Banknote size={16} /> Payout History
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-dash-text">My Referral Links</h2>
            <Link href="/affiliate/referral-links" className="text-sm font-bold text-purple-600 hover:underline">Manage <ArrowRight size={13} className="inline" /></Link>
          </div>
          {links.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] py-10 text-center">
              <Link2 size={28} className="mx-auto text-[#D0D5DD]" />
              <p className="mt-3 text-sm font-semibold text-dash-muted">No referral links yet</p>
              <Link href="/affiliate/referral-links" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700">
                <Plus size={13} /> Create first link
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {links.slice(0, 4).map(link => (
                <div key={link.id} className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3">
                  <div>
                    <p className="font-semibold text-dash-text">{link.label || link.ref_code}</p>
                    <p className="text-xs font-mono text-dash-muted">{link.ref_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.total_clicks !== undefined && <span className="text-xs text-dash-subtle">{link.total_clicks} clicks</span>}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${link.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>
                      {link.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-dash-text">Recent Conversions</h2>
            <Link href="/affiliate/conversions" className="text-sm font-bold text-purple-600 hover:underline">View all <ArrowRight size={13} className="inline" /></Link>
          </div>
          {conversions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] py-10 text-center">
              <TrendingUp size={28} className="mx-auto text-[#D0D5DD]" />
              <p className="mt-3 text-sm font-semibold text-dash-muted">No conversions yet</p>
              <p className="mt-1 text-xs text-dash-subtle">Share your referral links to start earning.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversions.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-dash-border px-4 py-3">
                  <div>
                    <p className="font-semibold text-dash-text">{c.booking_code || `Conversion #${c.id}`}</p>
                    <p className="text-xs text-dash-muted">{c.converted_at ? new Date(c.converted_at).toLocaleDateString() : ""}</p>
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
