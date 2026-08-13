"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuCirclePause as PauseCircle, LuCirclePlay as PlayCircle, LuCopy as Copy, LuLoaderCircle as Loader2, LuPlus as Plus, LuRefreshCw as RefreshCw } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/useToast";
import {
  activateAffiliateLink,
  disableAffiliateLink,
  duplicateAffiliateLink,
  getAffiliateLinks,
  type AffiliateLink,
} from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

function statusCls(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (v === "draft") return "border-slate-200 bg-slate-50 text-slate-600";
  if (v === "disabled") return "border-amber-200 bg-amber-50 text-amber-700";
  if (v === "expired" || v === "deleted") return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function shortUrl(refCode: string, customAlias: string | null) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r/${customAlias || refCode}`;
}

export default function AdminAffiliateLinksPage() {
  const toast = useToast();
  const pagination = usePagination(15);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAffiliateLinks({ page: pagination.page, limit: pagination.limit, search: pagination.debouncedSearch, status: statusFilter || undefined });
      setLinks(res.items ?? []);
      pagination.setTotal(res.total ?? 0);
      pagination.setTotalPages(res.total_pages ?? 1);
    } catch (e) {
      setError(getApiErrorMessage(e) || "Could not load affiliate links.");
      setLinks([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, pagination.debouncedSearch, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(link: AffiliateLink) {
    setActing(link.id);
    try {
      if (link.status === "active") {
        await disableAffiliateLink(link.id);
        toast.success("Link disabled.");
      } else {
        await activateAffiliateLink(link.id);
        toast.success("Link activated.");
      }
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update link status.");
    } finally {
      setActing(null);
    }
  }

  async function duplicate(link: AffiliateLink) {
    setActing(link.id);
    try {
      const copy = await duplicateAffiliateLink(link.id);
      toast.success(`Link duplicated as ${copy.ref_code}.`);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not duplicate link.");
    } finally {
      setActing(null);
    }
  }

  function copyLink(link: AffiliateLink) {
    navigator.clipboard?.writeText(shortUrl(link.ref_code, link.custom_alias));
    toast.success("Link copied to clipboard.");
  }

  const columns: DataTableColumn<AffiliateLink>[] = [
    {
      key: "link",
      header: "Link",
      render: (l) => (
        <div>
          <Link href={`/admin/affiliates/links/${l.id}`} className="text-sm font-bold text-dash-brand hover:underline">
            {l.campaign_name || l.label || l.ref_code}
          </Link>
          <p className="mt-0.5 font-mono text-xs text-dash-subtle">/r/{l.custom_alias || l.ref_code}</p>
        </div>
      ),
    },
    { key: "affiliate", header: "Affiliate", className: "text-sm text-dash-text", render: (l) => `#${l.affiliate_id}` },
    { key: "target", header: "Tour / Destination", className: "text-sm text-dash-muted", render: (l) => l.tour_title || l.destination_url || "-" },
    { key: "clicks", header: "Clicks", className: "text-sm font-bold text-dash-text", render: (l) => l.total_clicks },
    { key: "conversions", header: "Bookings", className: "text-sm font-bold text-dash-text", render: (l) => l.total_conversions },
    {
      key: "status",
      header: "Status",
      render: (l) => <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusCls(l.status)}`}>{l.status}</span>,
    },
  ];

  return (
    <ModuleWrapper title="Affiliate Links" requiredPermission="affiliate_links.view">
      <div>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-dash-brand">Affiliates</p>
            <h1 className="mt-1 text-2xl font-black text-dash-text">Affiliate Links</h1>
            <p className="mt-1 text-sm text-dash-muted">Generate and manage referral links for any affiliate.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void load()} disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg-muted disabled:opacity-50">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link href="/admin/affiliates/links/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover">
              <Plus size={15} /> Generate Link
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-dash-border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-dash-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-bold text-dash-text">Links</h2>
              <p className="mt-0.5 text-xs text-dash-subtle">{pagination.total} matching records</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input value={pagination.search} onChange={(e) => pagination.setSearch(e.target.value)} placeholder="Search links, campaigns, alias"
                className="w-full rounded-xl border border-dash-border bg-white px-3 py-2 text-sm outline-none focus:border-dash-brand sm:w-64" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); pagination.setPage(1); }}
                className="rounded-xl border border-dash-border bg-white px-3 py-2 text-sm font-bold text-dash-body">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="p-5">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <DataTable
              ariaLabel="Affiliate Links"
              columns={columns}
              rows={links}
              loading={loading}
              error={error}
              page={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              emptyTitle="No affiliate links found"
              emptyDescription="Generate a link to start tracking affiliate referrals."
              actions={(l) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => copyLink(l)} title="Copy link"
                    className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg-muted">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => duplicate(l)} disabled={acting === l.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg-muted disabled:opacity-50">
                    {acting === l.id ? <Loader2 className="animate-spin" size={12} /> : "Duplicate"}
                  </button>
                  {l.status !== "deleted" && (
                    <button onClick={() => toggleStatus(l)} disabled={acting === l.id}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-50 ${l.status === "active" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                      {l.status === "active" ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                      {l.status === "active" ? "Disable" : "Activate"}
                    </button>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </ModuleWrapper>
  );
}
