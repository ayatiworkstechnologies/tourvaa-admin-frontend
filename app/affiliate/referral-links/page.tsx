"use client";

import { useEffect, useState } from "react";
import { LuCheck as Check, LuCopy as Copy, LuLink2 as Link2, LuPlus as Plus, LuToggleLeft as ToggleLeft, LuToggleRight as ToggleRight, LuTrash2 as Trash2 } from "react-icons/lu";
import api from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";

type AffLink = { id: number; ref_code: string; label: string; destination_url: string; is_active: boolean };

export default function ReferralLinksPage() {
  const toast = useToast();
  const { dashboard } = useAuthContext();
  const affiliateId = (dashboard?.user as Record<string, unknown>)?.affiliate_id ?? dashboard?.user?.id;

  const [links, setLinks] = useState<AffLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", destination_url: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://tourvaa.com";

  async function load() {
    if (!affiliateId) return;
    setLoading(true);
    try {
      const res = await api.get(`/affiliates/${affiliateId}/links`);
      setLinks(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Could not load referral links.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [affiliateId]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    if (!affiliateId || !form.destination_url.trim()) return;
    setSaving(true);
    try {
      await api.post(`/affiliates/${affiliateId}/links`, form);
      toast.success("Referral link created.");
      setForm({ label: "", destination_url: "" });
      setShowForm(false);
      await load();
    } catch {
      toast.error("Could not create link.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link: AffLink) {
    try {
      await api.patch(`/affiliates/${affiliateId}/links/${link.id}`, { is_active: !link.is_active });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
    } catch {
      toast.error("Could not update link.");
    }
  }

  async function deleteLink(id: number) {
    if (!confirm("Delete this referral link?")) return;
    try {
      await api.delete(`/affiliates/${affiliateId}/links/${id}`);
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success("Link deleted.");
    } catch {
      toast.error("Could not delete link.");
    }
  }

  function copyLink(link: AffLink) {
    const url = `${origin}/tours?ref=${link.ref_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(link.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#121826]">Referral Links</h1>
          <p className="mt-1 text-sm text-[#667085]">Create and manage your unique referral links to earn commissions.</p>
        </div>
        <button type="button" onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
          <Plus size={16} /> New Link
        </button>
      </div>

      {showForm && (
        <form onSubmit={createLink} className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h3 className="mb-4 font-bold text-purple-800">Create New Referral Link</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#344054]">Label</label>
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Blog Post, Instagram Bio"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#344054]">Destination URL <span className="text-red-500">*</span></label>
              <input required value={form.destination_url} onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))}
                placeholder="https://tourvaa.com/tours"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
              {saving ? "Creating…" : "Create Link"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#667085] hover:bg-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl border border-[#E7EAF0] bg-white h-20" />)}</div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D0D5DD] bg-white py-20 text-center">
          <Link2 size={40} className="text-[#D0D5DD]" />
          <p className="mt-4 font-bold text-[#121826]">No referral links yet</p>
          <p className="mt-1 text-sm text-[#667085]">Create a referral link to start earning commissions.</p>
          <button type="button" onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
            <Plus size={15} /> Create first link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => {
            const fullUrl = `${origin}/tours?ref=${link.ref_code}`;
            return (
              <div key={link.id} className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#121826]">{link.label || link.ref_code}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${link.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {link.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-purple-600">{link.ref_code}</p>
                    <p className="mt-1 truncate text-xs text-[#667085]">{link.destination_url}</p>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#E7EAF0] bg-[#F7F9FC] px-3 py-2">
                      <span className="flex-1 truncate font-mono text-xs text-[#344054]">{fullUrl}</span>
                      <button type="button" onClick={() => copyLink(link)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-purple-600 hover:bg-purple-50">
                        {copied === link.id ? <Check size={12} /> : <Copy size={12} />}
                        {copied === link.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleActive(link)} title={link.is_active ? "Deactivate" : "Activate"}
                      className="rounded-xl border border-[#E7EAF0] p-2 text-[#667085] hover:bg-[#F5F7FA]">
                      {link.is_active ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} />}
                    </button>
                    <button type="button" onClick={() => deleteLink(link.id)}
                      className="rounded-xl border border-red-100 p-2 text-red-400 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
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
