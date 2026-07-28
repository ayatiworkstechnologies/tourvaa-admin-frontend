"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReviewDetailPage from "@/components/operations/ReviewDetailPage";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import api from "@/lib/api/client";

type Click = { id: number; ref_code?: string; ip_address?: string; referrer?: string; created_at?: string };
type Conversion = { id: number; booking_id?: number; commission_amount?: string; status?: string; created_at?: string };
type Payout = { id: number; total_amount?: string; currency?: string; status?: string; created_at?: string };
type Commissions = { total_earned?: string; total_paid?: string; total_pending?: string; currency?: string };

const TABS = [
  { key: "clicks", label: "Clicks" },
  { key: "conversions", label: "Conversions" },
  { key: "payouts", label: "Payouts" },
] as const;

export default function AffiliateDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("conversions");
  const [clicks, setClicks] = useState<Click[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissions, setCommissions] = useState<Commissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    Promise.allSettled([
      api.get(`/affiliates/${params.id}/clicks`, { params: { limit: 20 } }),
      api.get(`/affiliates/${params.id}/conversions`, { params: { limit: 20 } }),
      api.get("/affiliate-payouts", { params: { affiliate_id: params.id, limit: 20 } }),
      api.get(`/affiliates/${params.id}/commissions`),
    ]).then(([clicksRes, conversionsRes, payoutsRes, commissionsRes]) => {
      if (clicksRes.status === "fulfilled") setClicks(clicksRes.value.data?.items ?? clicksRes.value.data?.data ?? []);
      if (conversionsRes.status === "fulfilled") setConversions(conversionsRes.value.data?.items ?? conversionsRes.value.data?.data ?? []);
      if (payoutsRes.status === "fulfilled") setPayouts(payoutsRes.value.data?.items ?? payoutsRes.value.data?.data ?? []);
      if (commissionsRes.status === "fulfilled") setCommissions(commissionsRes.value.data?.data ?? null);
    }).finally(() => setLoading(false));
  }, [params.id]);

  const clickColumns: DataTableColumn<Click>[] = [
    { key: "ref_code", header: "Ref Code", render: (c) => c.ref_code || "-" },
    { key: "ip_address", header: "IP", render: (c) => c.ip_address || "-" },
    { key: "referrer", header: "Referrer", className: "max-w-xs truncate", render: (c) => c.referrer || "-" },
    { key: "created_at", header: "When", render: (c) => (c.created_at ? new Date(c.created_at).toLocaleString() : "-") },
  ];

  const conversionColumns: DataTableColumn<Conversion>[] = [
    { key: "booking_id", header: "Booking", render: (c) => (c.booking_id ? `#${c.booking_id}` : "-") },
    { key: "commission_amount", header: "Commission", render: (c) => c.commission_amount || "-" },
    { key: "status", header: "Status", render: (c) => c.status || "-" },
    { key: "created_at", header: "When", render: (c) => (c.created_at ? new Date(c.created_at).toLocaleString() : "-") },
  ];

  const payoutColumns: DataTableColumn<Payout>[] = [
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
              <p className="mt-1 text-lg font-black text-dash-text">{commissions.total_earned ?? "0"} {commissions.currency ?? ""}</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-white p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Total Paid</p>
              <p className="mt-1 text-lg font-black text-dash-text">{commissions.total_paid ?? "0"} {commissions.currency ?? ""}</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-white p-4">
              <p className="text-xs font-bold uppercase text-dash-subtle">Pending</p>
              <p className="mt-1 text-lg font-black text-dash-text">{commissions.total_pending ?? "0"} {commissions.currency ?? ""}</p>
            </div>
          </div>
        )}

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

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          {activeTab === "clicks" && <DataTable ariaLabel="Affiliate clicks" columns={clickColumns} rows={clicks} loading={loading} emptyTitle="No clicks recorded" />}
          {activeTab === "conversions" && <DataTable ariaLabel="Affiliate conversions" columns={conversionColumns} rows={conversions} loading={loading} emptyTitle="No conversions recorded" />}
          {activeTab === "payouts" && <DataTable ariaLabel="Affiliate payouts" columns={payoutColumns} rows={payouts} loading={loading} emptyTitle="No payouts yet" />}
        </div>
      </div>
    </>
  );
}
