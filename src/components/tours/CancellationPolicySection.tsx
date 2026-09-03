"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuPencil as Pencil } from "react-icons/lu";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

type RefundRule = {
  id: number;
  tour_id?: number | null;
  days_before_tour_min: number;
  days_before_tour_max?: number | null;
  refund_percentage: number;
  description?: string;
};

const emptyForm = { days_before_tour_min: "", days_before_tour_max: "", refund_percentage: "", description: "" };

export default function CancellationPolicySection({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [rules, setRules] = useState<RefundRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [defaultRules, setDefaultRules] = useState<RefundRule[]>([]);
  const [copyingDefaults, setCopyingDefaults] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: RefundRule[] }>("/refund-rules", { params: { tour_id: tourId } });
      setRules(res.data.data ?? []);
    } catch {
      toast.error("Failed to load cancellation policy.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // The platform-wide default policy (RefundRule rows with no tour_id) this
  // tour currently falls back to -- shown as a starting point when the tour
  // has none of its own, since an empty state here could otherwise look like
  // "no policy" when the default is actually already in effect.
  useEffect(() => {
    api.get<{ data: RefundRule[] }>("/refund-rules").then((res) => {
      setDefaultRules((res.data.data ?? []).filter((r) => r.tour_id == null));
    }).catch(() => {
      // Non-fatal -- the "copy defaults" convenience just won't offer itself.
    });
  }, []);

  const copyDefaults = async () => {
    setCopyingDefaults(true);
    try {
      for (const rule of defaultRules) {
        await api.post("/refund-rules", {
          tour_id: Number(tourId),
          days_before_tour_min: rule.days_before_tour_min,
          days_before_tour_max: rule.days_before_tour_max ?? null,
          refund_percentage: rule.refund_percentage,
          description: rule.description || null,
        });
      }
      toast.success("Platform default policy copied -- customize it as needed.");
      await load();
    } catch {
      toast.error("Could not copy the default policy.");
    } finally {
      setCopyingDefaults(false);
    }
  };

  const startEdit = (rule: RefundRule) => {
    setEditingId(rule.id);
    setForm({
      days_before_tour_min: String(rule.days_before_tour_min),
      days_before_tour_max: rule.days_before_tour_max != null ? String(rule.days_before_tour_max) : "",
      refund_percentage: String(rule.refund_percentage),
      description: rule.description ?? "",
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.days_before_tour_min || !form.refund_percentage) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        days_before_tour_min: Number(form.days_before_tour_min),
        refund_percentage: Number(form.refund_percentage),
        days_before_tour_max: form.days_before_tour_max ? Number(form.days_before_tour_max) : null,
        description: form.description || null,
      };
      if (editingId) {
        // Re-fetch after the mutation (rather than trusting the local
        // append/replace) so the stored record — including any
        // server-side recalculation from maybe_resubmit_for_review — is
        // what the UI reflects, and it survives a refresh identically.
        await api.put(`/refund-rules/${editingId}`, body);
        toast.success("Cancellation rule updated.");
      } else {
        await api.post("/refund-rules", { ...body, tour_id: Number(tourId) });
        toast.success("Cancellation rule added.");
      }
      await load();
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch {
      toast.error(editingId ? "Could not update cancellation rule." : "Could not add cancellation rule.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this cancellation rule?")) return;
    try {
      await api.delete(`/refund-rules/${id}`);
      await load();
    } catch {
      toast.error("Could not delete cancellation rule.");
    }
  };

  if (loading) return <Loader label="Loading cancellation policy..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cancellation Policy</h2>
          <p className="text-sm text-dash-subtle">Refund tiers based on days before departure. Rules with no match here fall back to the global policy.</p>
          <p className="mt-1 text-xs text-dash-subtle">Each rule is a refund-eligibility window with its own deduction: set <b>Refund % = 0</b> for the non-refundable period closest to departure, and a higher percentage for windows further out. Customers can cancel anytime; the refund they receive depends on which window their cancellation falls into.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {rules.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-dash-border p-6 text-center text-sm text-dash-subtle">
          <p>No tour-specific cancellation rules yet — the platform&apos;s default policy applies for now.</p>
          {defaultRules.length > 0 && (
            <>
              <div className="mx-auto mt-4 max-w-md space-y-1 text-left text-xs">
                {defaultRules.map((rule) => (
                  <p key={rule.id}>
                    <b className="text-dash-text">{rule.days_before_tour_min} – {rule.days_before_tour_max ?? "∞"} days</b> before departure: {rule.refund_percentage}% refund
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={copyDefaults}
                disabled={copyingDefaults}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dash-brand px-4 py-2 text-sm font-bold text-dash-brand hover:bg-[#F2F6FF] disabled:opacity-60"
              >
                {copyingDefaults ? "Copying..." : "Use these as my starting policy"}
              </button>
            </>
          )}
        </div>
      )}

      {rules.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dash-border">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F9FC] text-left text-xs font-bold uppercase text-dash-subtle">
              <tr>
                <th className="px-4 py-2.5">Days before departure</th>
                <th className="px-4 py-2.5">Refund</th>
                <th className="px-4 py-2.5">Notes</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-4 py-2.5 font-semibold text-dash-text">
                    {rule.days_before_tour_min} – {rule.days_before_tour_max ?? "∞"} days
                  </td>
                  <td className="px-4 py-2.5 font-bold text-dash-brand-hover">{rule.refund_percentage}%</td>
                  <td className="px-4 py-2.5 text-dash-subtle">{rule.description || "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => startEdit(rule)} className="rounded-lg border border-dash-border p-1.5 text-dash-subtle hover:bg-[#F7F9FC]">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => remove(rule.id)} className="rounded-lg border border-[#FFCDD2] p-1.5 text-red-500 hover:bg-[#FFF0F0]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <h3 className="mb-4 font-bold text-dash-text">{editingId ? "Edit Cancellation Rule" : "New Cancellation Rule"}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Min days before *</span>
              <input
                type="number"
                value={form.days_before_tour_min}
                onChange={(e) => setForm((f) => ({ ...f, days_before_tour_min: e.target.value }))}
                placeholder="e.g. 7"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Max days before</span>
              <input
                type="number"
                value={form.days_before_tour_max}
                onChange={(e) => setForm((f) => ({ ...f, days_before_tour_max: e.target.value }))}
                placeholder="e.g. 30"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Refund % *</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.refund_percentage}
                onChange={(e) => setForm((f) => ({ ...f, refund_percentage: e.target.value }))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Notes</span>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Rule"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
