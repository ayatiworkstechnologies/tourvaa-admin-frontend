"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LuPlus as Plus } from "react-icons/lu";
import api from "@/lib/api/client";
import { updateReviewRecord } from "@/lib/api/services/operationsService";
import ReviewDetailPage from "@/components/operations/ReviewDetailPage";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import {
  AffiliateClick,
  AffiliateCommissionSummary,
  AffiliateConversion,
  AffiliateLink,
  AffiliatePayout,
  getAffiliateClicks,
  getAffiliateCommissions,
  getAffiliateConversions,
  getAffiliateLinks,
  getAffiliatePayouts,
} from "@/lib/api/services/affiliateService";

const TABS = [
  { key: "links", label: "Links" },
  { key: "clicks", label: "Clicks" },
  { key: "conversions", label: "Conversions" },
  { key: "payouts", label: "Payouts" },
] as const;

const PAGE_SIZE = 10;

export default function AffiliateDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("links");

  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [linksPage, setLinksPage] = useState(1);
  const [linksTotal, setLinksTotal] = useState(0);
  const [linksTotalPages, setLinksTotalPages] = useState(1);

  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  const [clicksPage, setClicksPage] = useState(1);
  const [clicksTotal, setClicksTotal] = useState(0);
  const [clicksTotalPages, setClicksTotalPages] = useState(1);

  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  const [conversionsPage, setConversionsPage] = useState(1);
  const [conversionsTotal, setConversionsTotal] = useState(0);
  const [conversionsTotalPages, setConversionsTotalPages] = useState(1);

  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotal, setPayoutsTotal] = useState(0);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);

  const [commissions, setCommissions] = useState<AffiliateCommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [commissionRate, setCommissionRate] = useState<string | null>(null);
  const [maxCommissionRate, setMaxCommissionRate] = useState<number | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState("");

  const [calcAmount, setCalcAmount] = useState("");
  const [calcResult, setCalcResult] = useState<{ gross_amount: string; commission_amount: string; commission_percentage: string | null } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const loadCommissionRate = useCallback(async () => {
    if (!params.id) return;
    try {
      const [affiliateRes, settingsRes] = await Promise.allSettled([
        api.get(`/affiliates/${params.id}`),
        api.get("/settings/public"),
      ]);
      if (affiliateRes.status === "fulfilled") setCommissionRate(affiliateRes.value.data?.data?.commission_percentage ?? null);
      if (settingsRes.status === "fulfilled") {
        const raw = settingsRes.value.data?.data?.affiliate_commission_max_percentage;
        if (raw !== undefined) setMaxCommissionRate(Number(raw));
      }
    } catch {
      // Non-fatal - the tabs below are the primary content of this page.
    }
  }, [params.id]);

  useEffect(() => { void loadCommissionRate(); }, [loadCommissionRate]);

  async function saveCommissionRate() {
    const value = Number(rateInput);
    if (!rateInput || Number.isNaN(value)) {
      setRateError("Enter a valid commission percentage.");
      return;
    }
    if (maxCommissionRate !== null && value > maxCommissionRate) {
      setRateError(`Commission cannot exceed the platform maximum of ${maxCommissionRate}%.`);
      return;
    }
    setRateSaving(true);
    setRateError("");
    try {
      await updateReviewRecord("affiliates", params.id as string, { commission_percentage: value });
      await loadCommissionRate();
      setRateInput("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setRateError(typeof msg === "string" ? msg : "Failed to update commission.");
    } finally {
      setRateSaving(false);
    }
  }

  async function runCommissionCalculator() {
    const amount = Number(calcAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !params.id) return;
    setCalcLoading(true);
    try {
      const res = await api.get(`/affiliates/${params.id}/commission-calculator`, { params: { amount } });
      setCalcResult(res.data?.data ?? null);
    } catch {
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  }

  const fetchLinks = useCallback(async (page: number) => {
    if (!params.id) return;
    const res = await getAffiliateLinks({ affiliate_id: Number(params.id), page, limit: PAGE_SIZE });
    setLinks(res.items ?? []);
    setLinksTotal(res.total ?? 0);
    setLinksTotalPages(res.total_pages ?? 1);
  }, [params.id]);

  const fetchClicks = useCallback(async (page: number) => {
    if (!params.id) return;
    const res = await getAffiliateClicks(params.id, { page, limit: PAGE_SIZE });
    setClicks(res.items ?? []);
    setClicksTotal(res.total ?? 0);
    setClicksTotalPages(res.total_pages ?? 1);
  }, [params.id]);

  const fetchConversions = useCallback(async (page: number) => {
    if (!params.id) return;
    const res = await getAffiliateConversions(params.id, { page, limit: PAGE_SIZE });
    setConversions(res.items ?? []);
    setConversionsTotal(res.total ?? 0);
    setConversionsTotalPages(res.total_pages ?? 1);
  }, [params.id]);

  const fetchPayouts = useCallback(async (page: number) => {
    if (!params.id) return;
    const res = await getAffiliatePayouts({ affiliate_id: Number(params.id), page, limit: PAGE_SIZE });
    setPayouts(res.items ?? []);
    setPayoutsTotal(res.total ?? 0);
    setPayoutsTotalPages(res.total_pages ?? 1);
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    Promise.allSettled([
      fetchLinks(1),
      fetchClicks(1),
      fetchConversions(1),
      fetchPayouts(1),
      getAffiliateCommissions(params.id),
    ]).then(([, , , , commissionsRes]) => {
      if (commissionsRes.status === "fulfilled") setCommissions(commissionsRes.value);
    }).finally(() => setLoading(false));
  }, [params.id, fetchLinks, fetchClicks, fetchConversions, fetchPayouts]);

  const linkColumns: DataTableColumn<AffiliateLink>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (linksPage - 1) * PAGE_SIZE + index + 1,
    },
    { key: "link", header: "Link", render: (l) => <Link href={`/admin/affiliates/links/${l.id}`} className="font-bold text-dash-brand hover:underline">{l.campaign_name || l.label || l.ref_code}</Link> },
    { key: "target", header: "Tour / Destination", render: (l) => l.tour_title || l.destination_url || "-" },
    { key: "clicks", header: "Clicks", render: (l) => l.total_clicks },
    { key: "bookings", header: "Bookings", render: (l) => l.total_conversions },
    { key: "status", header: "Status", className: "capitalize", render: (l) => l.status },
  ];

  const clickColumns: DataTableColumn<AffiliateClick>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (clicksPage - 1) * PAGE_SIZE + index + 1,
    },
    { key: "link_id", header: "Link", render: (c) => `#${c.link_id}` },
    { key: "ip_address", header: "IP", render: (c) => c.ip_address || "-" },
    { key: "referrer", header: "Referrer", className: "max-w-xs truncate", render: (c) => c.referrer || "-" },
    { key: "clicked_at", header: "When", render: (c) => (c.clicked_at ? new Date(c.clicked_at).toLocaleString() : "-") },
  ];

  const conversionColumns: DataTableColumn<AffiliateConversion>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (conversionsPage - 1) * PAGE_SIZE + index + 1,
    },
    { key: "booking_id", header: "Booking", render: (c) => (c.booking_code || (c.booking_id ? `#${c.booking_id}` : "-")) },
    { key: "commission_amount", header: "Commission", render: (c) => c.commission_amount || "-" },
    { key: "status", header: "Status", render: (c) => c.status || "-" },
    { key: "converted_at", header: "When", render: (c) => (c.converted_at ? new Date(c.converted_at).toLocaleString() : "-") },
  ];

  const payoutColumns: DataTableColumn<AffiliatePayout>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (payoutsPage - 1) * PAGE_SIZE + index + 1,
    },
    { key: "total_amount", header: "Amount", render: (p) => `${p.total_amount ?? "-"} ${p.currency ?? ""}`.trim() },
    { key: "status", header: "Status", render: (p) => p.status || "-" },
    { key: "created_at", header: "Requested", render: (p) => (p.created_at ? new Date(p.created_at).toLocaleString() : "-") },
  ];

  return (
    <>
      <ReviewDetailPage module="affiliates" id={params.id} title="Affiliate Detail" requiredPermission="affiliates.view" />

      <div className="mt-6 space-y-4 px-6 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-dash-border bg-white p-4">
          <div>
            <p className="text-xs font-bold uppercase text-dash-subtle">Base Commission Rate</p>
            <p className="mt-1 text-lg font-black text-dash-text">{commissionRate ?? "0"}%</p>
            <p className="mt-1 text-xs text-dash-muted">Used when no more specific commission rule matches. {maxCommissionRate !== null && <>Platform maximum: <strong>{maxCommissionRate}%</strong>.</>}</p>
          </div>
          <div className="flex items-end gap-2">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">New rate (%)</span>
              <input type="number" min={0} max={maxCommissionRate ?? 100} step="0.01" value={rateInput} onChange={(e) => setRateInput(e.target.value)} className="w-32 rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand" />
            </label>
            <button type="button" onClick={() => void saveCommissionRate()} disabled={rateSaving} className="rounded-xl bg-dash-brand px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{rateSaving ? "Saving..." : "Update Rate"}</button>
          </div>
          {rateError && <p className="w-full text-xs font-semibold text-red-600">{rateError}</p>}

          <div className="w-full border-t border-dash-border pt-3">
            <p className="mb-2 text-xs font-bold uppercase text-dash-subtle">Commission Calculator</p>
            <div className="flex flex-wrap items-end gap-2">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Booking amount</span>
                <input type="number" min={0} step="0.01" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} className="w-40 rounded-xl border border-dash-border px-3 py-2 text-sm outline-none focus:border-dash-brand" />
              </label>
              <button type="button" onClick={() => void runCommissionCalculator()} disabled={calcLoading} className="rounded-xl border border-dash-border px-4 py-2.5 text-xs font-bold text-dash-body hover:bg-dash-bg-muted disabled:opacity-60">{calcLoading ? "Calculating..." : "Calculate"}</button>
              {calcResult && (
                <p className="text-sm text-dash-body">
                  Tourvaa would pay <strong className="text-emerald-700">{calcResult.commission_amount}</strong>
                  {calcResult.commission_percentage ? ` (${calcResult.commission_percentage}%)` : ""} on a {calcResult.gross_amount} booking.
                </p>
              )}
            </div>
          </div>
        </div>

        {commissions && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-dash-border bg-white p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Total Earned</p>
              <p className="mt-1 text-lg font-black text-dash-text">{commissions.total_commission ?? "0"}</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-white p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Total Paid</p>
              <p className="mt-1 text-lg font-black text-dash-text">{commissions.paid_commission ?? "0"}</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-white p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Pending</p>
              <p className="mt-1 text-lg font-black text-dash-text">{commissions.pending_commission ?? "0"}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-dash-border p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === tab.key ? "bg-dash-brand text-white" : "text-dash-muted hover:bg-dash-bg"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === "links" && (
            <Link href={`/admin/affiliates/links/new?affiliate_id=${params.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover">
              <Plus size={15} /> Generate Link
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          {activeTab === "links" && (
            <DataTable
              ariaLabel="Affiliate links"
              columns={linkColumns}
              rows={links}
              loading={loading}
              page={linksPage}
              pageSize={PAGE_SIZE}
              total={linksTotal}
              totalPages={linksTotalPages}
              onPageChange={(page) => { setLinksPage(page); void fetchLinks(page); }}
              emptyTitle="No links generated yet"
            />
          )}
          {activeTab === "clicks" && (
            <DataTable
              ariaLabel="Affiliate clicks"
              columns={clickColumns}
              rows={clicks}
              loading={loading}
              page={clicksPage}
              pageSize={PAGE_SIZE}
              total={clicksTotal}
              totalPages={clicksTotalPages}
              onPageChange={(page) => { setClicksPage(page); void fetchClicks(page); }}
              emptyTitle="No clicks recorded"
            />
          )}
          {activeTab === "conversions" && (
            <DataTable
              ariaLabel="Affiliate conversions"
              columns={conversionColumns}
              rows={conversions}
              loading={loading}
              page={conversionsPage}
              pageSize={PAGE_SIZE}
              total={conversionsTotal}
              totalPages={conversionsTotalPages}
              onPageChange={(page) => { setConversionsPage(page); void fetchConversions(page); }}
              emptyTitle="No conversions recorded"
            />
          )}
          {activeTab === "payouts" && (
            <DataTable
              ariaLabel="Affiliate payouts"
              columns={payoutColumns}
              rows={payouts}
              loading={loading}
              page={payoutsPage}
              pageSize={PAGE_SIZE}
              total={payoutsTotal}
              totalPages={payoutsTotalPages}
              onPageChange={(page) => { setPayoutsPage(page); void fetchPayouts(page); }}
              emptyTitle="No payouts yet"
            />
          )}
        </div>
      </div>
    </>
  );
}
