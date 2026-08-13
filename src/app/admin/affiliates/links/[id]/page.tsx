"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuCircleAlert as AlertCircle, LuCirclePause as PauseCircle, LuCirclePlay as PlayCircle, LuCopy as Copy } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import { useToast } from "@/hooks/useToast";
import {
  activateAffiliateLink,
  disableAffiliateLink,
  duplicateAffiliateLink,
  getAffiliateLink,
  updateAffiliateLink,
  type AffiliateLink,
} from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

const inputCls = "w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-dash-brand";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-muted";

function statusCls(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (v === "disabled") return "border-amber-200 bg-amber-50 text-amber-700";
  if (v === "expired" || v === "deleted") return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AdminAffiliateLinkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [link, setLink] = useState<AffiliateLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const [form, setForm] = useState({
    campaign_name: "", utm_source: "", utm_medium: "", utm_campaign: "",
    commission_type_override: "", commission_percentage_override: "", commission_fixed_override: "",
    attribution_window_days: 30,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAffiliateLink(params.id);
      setLink(data);
      setForm({
        campaign_name: data.campaign_name ?? "",
        utm_source: data.utm_source ?? "",
        utm_medium: data.utm_medium ?? "",
        utm_campaign: data.utm_campaign ?? "",
        commission_type_override: data.commission_type_override ?? "",
        commission_percentage_override: data.commission_percentage_override ?? "",
        commission_fixed_override: data.commission_fixed_override ?? "",
        attribution_window_days: data.attribution_window_days,
      });
    } catch (e) {
      setError(getApiErrorMessage(e) || "Could not load affiliate link.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!link) return;
    setSaving(true);
    try {
      const updated = await updateAffiliateLink(link.id, {
        campaign_name: form.campaign_name || null,
        utm_source: form.utm_source || null,
        utm_medium: form.utm_medium || null,
        utm_campaign: form.utm_campaign || null,
        commission_type_override: form.commission_type_override || null,
        commission_percentage_override: form.commission_type_override === "percentage" ? form.commission_percentage_override || null : null,
        commission_fixed_override: form.commission_type_override === "fixed" ? form.commission_fixed_override || null : null,
        attribution_window_days: form.attribution_window_days,
      });
      setLink(updated);
      toast.success("Link updated.");
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update link.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!link) return;
    setActing(true);
    try {
      const updated = link.status === "active" ? await disableAffiliateLink(link.id) : await activateAffiliateLink(link.id);
      setLink(updated);
      toast.success(link.status === "active" ? "Link disabled." : "Link activated.");
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not update link status.");
    } finally {
      setActing(false);
    }
  }

  async function duplicate() {
    if (!link) return;
    setActing(true);
    try {
      const copy = await duplicateAffiliateLink(link.id);
      toast.success(`Duplicated as ${copy.ref_code}.`);
      router.push(`/admin/affiliates/links/${copy.id}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not duplicate link.");
    } finally {
      setActing(false);
    }
  }

  function copyUrl() {
    if (!link) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard?.writeText(`${origin}/r/${link.custom_alias || link.ref_code}`);
    toast.success("Link copied to clipboard.");
  }

  return (
    <ModuleWrapper title="Affiliate Link Details" requiredPermission="affiliate_links.view">
      <div className="mx-auto max-w-3xl">
        {loading && <p className="text-sm text-dash-muted">Loading…</p>}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {link && (
          <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-dash-text">{link.campaign_name || link.label || link.ref_code}</h1>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusCls(link.status)}`}>{link.status}</span>
                </div>
                <p className="mt-1 font-mono text-sm text-dash-subtle">/r/{link.custom_alias || link.ref_code}</p>
                <p className="mt-1 text-sm text-dash-muted">Affiliate #{link.affiliate_id} · {link.tour_title || link.destination_url || "-"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyUrl} className="inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-bold text-dash-body hover:bg-dash-bg-muted">
                  <Copy size={14} /> Copy
                </button>
                <button onClick={duplicate} disabled={acting} className="rounded-xl border border-dash-border bg-white px-3 py-2 text-xs font-bold text-dash-body hover:bg-dash-bg-muted disabled:opacity-50">
                  Duplicate
                </button>
                {link.status !== "deleted" && (
                  <button onClick={toggleStatus} disabled={acting}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50 ${link.status === "active" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                    {link.status === "active" ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    {link.status === "active" ? "Disable" : "Activate"}
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Clicks", value: link.total_clicks },
                { label: "Bookings", value: link.total_conversions },
                { label: "Attribution Window", value: `${link.attribution_window_days}d` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-dash-border bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase text-dash-muted">{label}</p>
                  <p className="mt-1.5 text-xl font-black text-dash-text">{value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-dash-text">Campaign</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Campaign Name</label>
                  <input value={form.campaign_name} onChange={(e) => setForm((f) => ({ ...f, campaign_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>UTM Source</label>
                  <input value={form.utm_source} onChange={(e) => setForm((f) => ({ ...f, utm_source: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>UTM Medium</label>
                  <input value={form.utm_medium} onChange={(e) => setForm((f) => ({ ...f, utm_medium: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>UTM Campaign</label>
                  <input value={form.utm_campaign} onChange={(e) => setForm((f) => ({ ...f, utm_campaign: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <h2 className="mb-4 mt-6 font-bold text-dash-text">Commission Override</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.commission_type_override} onChange={(e) => setForm((f) => ({ ...f, commission_type_override: e.target.value }))} className={inputCls}>
                    <option value="">Use default</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                {form.commission_type_override === "percentage" && (
                  <div>
                    <label className={labelCls}>Percentage</label>
                    <input value={form.commission_percentage_override} onChange={(e) => setForm((f) => ({ ...f, commission_percentage_override: e.target.value }))} className={inputCls} />
                  </div>
                )}
                {form.commission_type_override === "fixed" && (
                  <div>
                    <label className={labelCls}>Fixed Amount</label>
                    <input value={form.commission_fixed_override} onChange={(e) => setForm((f) => ({ ...f, commission_fixed_override: e.target.value }))} className={inputCls} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Attribution Window (days)</label>
                  <input type="number" min={1} value={form.attribution_window_days} onChange={(e) => setForm((f) => ({ ...f, attribution_window_days: Number(e.target.value) || 30 }))} className={inputCls} />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={save} disabled={saving} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </ModuleWrapper>
  );
}
