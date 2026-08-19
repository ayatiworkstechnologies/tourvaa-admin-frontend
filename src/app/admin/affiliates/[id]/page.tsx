"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LuPlus as Plus } from "react-icons/lu";
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
