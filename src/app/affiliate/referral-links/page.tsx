"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCheck as Check, LuCopy as Copy, LuLink2 as Link2, LuPlus as Plus } from "react-icons/lu";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { createOwnAffiliateLink, getOwnAffiliateLinks, type AffiliateLink } from "@/lib/api/services/affiliateService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

export default function ReferralLinksPage() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const affiliateId = dashboard?.user?.affiliate_id ?? null;

  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ campaign_name: "", destination_url: "", custom_alias: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://tourvaa.com";

  const load = useCallback(async () => {
    if (!affiliateId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getOwnAffiliateLinks(affiliateId);
      setLinks(data);
    } catch {
      toast.error("Could not load referral links.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateId]);

  useEffect(() => { void load(); }, [load]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliateId || !form.destination_url.trim()) return;
    setSaving(true);
    try {
      await createOwnAffiliateLink(affiliateId, {
        link_type: "custom",
        destination_url: form.destination_url.trim(),
        campaign_name: form.campaign_name.trim() || null,
        custom_alias: form.custom_alias.trim() || null,
      });
      toast.success("Referral link created.");
      setForm({ campaign_name: "", destination_url: "", custom_alias: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Could not create link.");
    } finally {
      setSaving(false);
    }
  }

  function shortUrl(link: AffiliateLink) {
    return `${origin}/r/${link.custom_alias || link.ref_code}`;
  }

  function copyLink(link: AffiliateLink) {
    navigator.clipboard.writeText(shortUrl(link)).then(() => {
      setCopied(link.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-dash-text">My Links</h1>
          <p className="mt-1 text-sm text-dash-muted">Create and manage your unique referral links to earn commissions.</p>
        </div>
        <button type="button" onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
          <Plus size={16} /> New Link
        </button>
      </div>

      {showForm && (
        <form onSubmit={createLink} className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h3 className="mb-4 font-bold text-purple-800">Create New Referral Link</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-dash-body">Campaign Name</label>
              <input value={form.campaign_name} onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
                placeholder="e.g. Instagram Bio"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dash-body">Destination Path <span className="text-red-500">*</span></label>
              <input required value={form.destination_url} onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))}
                placeholder="/tours"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dash-body">Custom Alias (optional)</label>
              <input value={form.custom_alias} onChange={e => setForm(f => ({ ...f, custom_alias: e.target.value.toLowerCase() }))}
                placeholder="my-instagram-link"
                className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
              {saving ? "Creating…" : "Create Link"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl border border-dash-border bg-white h-20" />)}</div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D0D5DD] bg-white py-20 text-center">
          <Link2 size={40} className="text-[#D0D5DD]" />
          <p className="mt-4 font-bold text-dash-text">No referral links yet</p>
          <p className="mt-1 text-sm text-dash-muted">Create a referral link to start earning commissions.</p>
          <button type="button" onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
            <Plus size={15} /> Create first link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => {
            const fullUrl = shortUrl(link);
            return (
              <div key={link.id} className="rounded-xl border border-dash-border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-dash-text">{link.campaign_name || link.label || link.ref_code}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${link.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {link.status === "active" ? "Active" : link.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-dash-muted">{link.tour_title || link.destination_url}</p>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
                      <span className="flex-1 truncate font-mono text-xs text-dash-body">{fullUrl}</span>
                      <button type="button" onClick={() => copyLink(link)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-purple-600 hover:bg-purple-50">
                        {copied === link.id ? <Check size={12} /> : <Copy size={12} />}
                        {copied === link.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-dash-muted">
                      <span><strong className="text-dash-text">{link.total_clicks}</strong> clicks</span>
                      <span><strong className="text-dash-text">{link.total_conversions}</strong> bookings</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
