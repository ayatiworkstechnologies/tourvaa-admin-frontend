"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import { useToast } from "@/hooks/useToast";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/lib/api/client";
import { createAffiliateLink } from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

type AffiliateOption = { id: number; name: string; affiliate_code: string; email: string; status: string; approval_status: string };
type TourOption = { id: number; title: string; slug: string; status: string };

const inputCls = "w-full rounded-xl border border-dash-border bg-white px-3 py-2.5 text-sm outline-none focus:border-dash-brand";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-muted";

export default function NewAffiliateLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const preselectedAffiliateId = searchParams.get("affiliate_id");

  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedAffiliateSearch = useDebounce(affiliateSearch);
  const [affiliateOptions, setAffiliateOptions] = useState<AffiliateOption[]>([]);
  const [affiliateId, setAffiliateId] = useState<number | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateOption | null>(null);

  const [linkType, setLinkType] = useState<"tour" | "custom">("custom");
  const [tourSearch, setTourSearch] = useState("");
  const debouncedTourSearch = useDebounce(tourSearch);
  const [tourOptions, setTourOptions] = useState<TourOption[]>([]);
  const [tourId, setTourId] = useState<number | null>(null);
  const [selectedTour, setSelectedTour] = useState<TourOption | null>(null);
  const [destinationUrl, setDestinationUrl] = useState("");

  const [campaignName, setCampaignName] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  const [useOverride, setUseOverride] = useState(false);
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">("percentage");
  const [commissionValue, setCommissionValue] = useState("");

  const [attributionModel, setAttributionModel] = useState("last_click");
  const [attributionWindow, setAttributionWindow] = useState(30);

  const [customAlias, setCustomAlias] = useState("");

  useEffect(() => {
    if (!preselectedAffiliateId) return;
    api.get(`/affiliates/${preselectedAffiliateId}`)
      .then((res) => {
        const a = res.data?.data;
        if (a) pickAffiliate({ id: a.id, name: a.name, affiliate_code: a.affiliate_code, email: a.email, status: a.status, approval_status: a.approval_status });
      })
      .catch(() => {});
  }, [preselectedAffiliateId]);

  useEffect(() => {
    if (!debouncedAffiliateSearch.trim()) { setAffiliateOptions([]); return; }
    let cancelled = false;
    api.get("/affiliates", { params: { search: debouncedAffiliateSearch, approval_status: "approved", limit: 8 } })
      .then((res) => { if (!cancelled) setAffiliateOptions(res.data?.items ?? res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setAffiliateOptions([]); });
    return () => { cancelled = true; };
  }, [debouncedAffiliateSearch]);

  useEffect(() => {
    if (linkType !== "tour") { setTourOptions([]); return; }
    let cancelled = false;
    api.get("/tours", { params: { search: debouncedTourSearch, status: "published", limit: 8 } })
      .then((res) => { if (!cancelled) setTourOptions(res.data?.items ?? res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setTourOptions([]); });
    return () => { cancelled = true; };
  }, [linkType, debouncedTourSearch]);

  function pickAffiliate(a: AffiliateOption) {
    setSelectedAffiliate(a);
    setAffiliateId(a.id);
    setAffiliateSearch(a.name);
    setAffiliateOptions([]);
  }

  function pickTour(t: TourOption) {
    setSelectedTour(t);
    setTourId(t.id);
    setTourSearch(t.title);
    setTourOptions([]);
  }

  const previewCode = customAlias.trim() || "{auto-generated}";
  const previewUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${previewCode}` : `/r/${previewCode}`;
  const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-]{2,59}$/;
  const aliasError = customAlias.trim() && !ALIAS_PATTERN.test(customAlias.trim())
    ? "Alias must be 3-60 lowercase letters, numbers or hyphens, starting with a letter or number."
    : "";

  function setAlias(raw: string) {
    setCustomAlias(raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliateId) { toast.error("Select an affiliate."); return; }
    if (linkType === "tour" && !tourId) { toast.error("Select a tour for a TOUR link."); return; }
    if (linkType === "custom" && !destinationUrl.trim()) { toast.error("Enter a destination path for a CUSTOM link."); return; }
    if (aliasError) { toast.error(aliasError); return; }

    setSaving(true);
    try {
      const link = await createAffiliateLink({
        affiliate_id: affiliateId,
        link_type: linkType,
        tour_id: linkType === "tour" ? tourId : null,
        destination_url: linkType === "custom" ? destinationUrl.trim() : null,
        campaign_name: campaignName.trim() || null,
        utm_source: utmSource.trim() || null,
        utm_medium: utmMedium.trim() || null,
        utm_campaign: utmCampaign.trim() || null,
        custom_alias: customAlias.trim() || null,
        commission_type_override: useOverride ? commissionType : null,
        commission_percentage_override: useOverride && commissionType === "percentage" ? commissionValue : null,
        commission_fixed_override: useOverride && commissionType === "fixed" ? commissionValue : null,
        attribution_model: attributionModel,
        attribution_window_days: attributionWindow,
      });
      toast.success(`Link generated: /r/${link.custom_alias || link.ref_code}`);
      router.push(`/admin/affiliates/links/${link.id}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e) || "Could not generate affiliate link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModuleWrapper title="Generate Affiliate Link" requiredPermission="affiliate_links.create">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-dash-brand">Affiliates</p>
          <h1 className="mt-1 text-2xl font-black text-dash-text">Generate Affiliate Link</h1>
        </div>

        <section className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-dash-text">Basic</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative sm:col-span-2">
              <label className={labelCls}>Affiliate *</label>
              <input value={affiliateSearch} onChange={(e) => { setAffiliateSearch(e.target.value); setAffiliateId(null); setSelectedAffiliate(null); }}
                placeholder="Search approved affiliates by name or email" className={inputCls} />
              {affiliateOptions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-dash-border bg-white shadow-lg">
                  {affiliateOptions.map((a) => (
                    <button type="button" key={a.id} onClick={() => pickAffiliate(a)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-dash-bg-muted">
                      <span className="font-bold text-dash-text">{a.name} <span className="font-mono text-xs text-dash-subtle">{a.affiliate_code}</span></span>
                      <span className="text-xs text-dash-subtle">{a.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedAffiliate && <p className="mt-1.5 text-xs font-semibold text-emerald-700">Selected: {selectedAffiliate.name} ({selectedAffiliate.affiliate_code})</p>}
            </div>

            <div>
              <label className={labelCls}>Link Type *</label>
              <select value={linkType} onChange={(e) => setLinkType(e.target.value as "tour" | "custom")} className={inputCls}>
                <option value="custom">Custom</option>
                <option value="tour">Tour</option>
              </select>
            </div>

            {linkType === "tour" ? (
              <div className="relative">
                <label className={labelCls}>Tour *</label>
                <input value={tourSearch} onChange={(e) => { setTourSearch(e.target.value); setTourId(null); setSelectedTour(null); }}
                  placeholder="Search published tours" className={inputCls} />
                {tourOptions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-dash-border bg-white shadow-lg">
                    {tourOptions.map((t) => (
                      <button type="button" key={t.id} onClick={() => pickTour(t)} className="block w-full px-3 py-2 text-left text-sm font-semibold text-dash-text hover:bg-dash-bg-muted">
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
                {selectedTour && <p className="mt-1.5 text-xs font-semibold text-emerald-700">Selected: {selectedTour.title}</p>}
              </div>
            ) : (
              <div>
                <label className={labelCls}>Destination Path *</label>
                <input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="/tours/sri-lanka-honeymoon" className={inputCls} />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-dash-text">Campaign</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className={labelCls}>Campaign Name</label>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Instagram August" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>UTM Source</label>
              <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="instagram" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>UTM Medium</label>
              <input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="social" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>UTM Campaign</label>
              <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="aug_2026" className={inputCls} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-dash-text">Commission</h2>
            <label className="flex items-center gap-2 text-xs font-bold text-dash-muted">
              <input type="checkbox" checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)} />
              Override default commission
            </label>
          </div>
          {useOverride && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Type</label>
                <select value={commissionType} onChange={(e) => setCommissionType(e.target.value as "percentage" | "fixed")} className={inputCls}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Value</label>
                <input value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} placeholder={commissionType === "percentage" ? "8" : "40"} className={inputCls} />
              </div>
            </div>
          )}
          {!useOverride && <p className="text-sm text-dash-muted">Uses the affiliate&apos;s default rate or the applicable commission rule.</p>}
        </section>

        <section className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-dash-text">Attribution</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Attribution Model</label>
              <select value={attributionModel} onChange={(e) => setAttributionModel(e.target.value)} className={inputCls}>
                <option value="last_click">Last Click</option>
                <option value="first_click">First Click</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Attribution Window (days)</label>
              <input type="number" min={1} value={attributionWindow} onChange={(e) => setAttributionWindow(Number(e.target.value) || 30)} className={inputCls} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-dash-text">URL</h2>
          <label className={labelCls}>Custom Alias (optional)</label>
          <input value={customAlias} onChange={(e) => setAlias(e.target.value)} placeholder="john-srilanka-august" className={inputCls} maxLength={60} />
          <p className="mt-2 rounded-lg bg-dash-bg-muted px-3 py-2 font-mono text-xs text-dash-subtle">{previewUrl}</p>
          {aliasError ? (
            <p className="mt-1.5 text-xs font-semibold text-red-600">{aliasError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-dash-subtle">3-60 lowercase letters, numbers, or hyphens. Leave blank to auto-generate.</p>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-dash-border bg-white px-5 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg-muted">Cancel</button>
          <button type="submit" disabled={saving || Boolean(aliasError)} className="rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60">
            {saving ? "Generating…" : "Generate & Activate"}
          </button>
        </div>
      </form>
    </ModuleWrapper>
  );
}
