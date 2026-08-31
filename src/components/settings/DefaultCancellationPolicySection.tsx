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

// Platform-wide fallback cancellation/refund tiers - same RefundRule rows a
// tour's own CancellationPolicySection writes, just with tour_id left null.
// A tour with its own rules always overrides these (see
// services.cancellations._calculate_refund_percentage and
// routers.public's tour detail, which prefers tour-specific rows and only
// falls back to these when a tour has none of its own).
export default function DefaultCancellationPolicySection() {
  const toast = useToast();
  const [rules, setRules] = useState<RefundRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // The list endpoint has no way to filter to "global only" server-side
      // (tour_id=0 and omitted both mean "no filter") - fetch everything and
      // keep just the rows with no tour_id.
      const res = await api.get<{ data: RefundRule[] }>("/refund-rules");
      setRules((res.data.data ?? []).filter((r) => r.tour_id == null));
    } catch {
      toast.error("Failed to load the default cancellation policy.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

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
        await api.put(`/refund-rules/${editingId}`, body);
        toast.success("Default cancellation rule updated.");
      } else {
        await api.post("/refund-rules", body);
        toast.success("Default cancellation rule added.");
      }
      await load();
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch {
      toast.error(editingId ? "Could not update rule." : "Could not add rule.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this default cancellation rule?")) return;
    try {
      await api.delete(`/refund-rules/${id}`);
      await load();
    } catch {
      toast.error("Could not delete rule.");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-dash-border bg-white p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-dash-text">Default Cancellation &amp; Refund Policy</h3>
          <p className="mt-1 text-sm text-dash-muted">
            Platform-wide fallback refund tiers, used only for tours where the supplier hasn&apos;t set their own cancellation policy (Tour Wizard &gt; Policies). Set <b>Refund % = 0</b> for the non-refundable window closest to departure.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white hover:bg-dash-brand-hover"
        >
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {loading ? (
        <Loader label="Loading default cancellation policy..." />
      ) : (
        <>
          {rules.length === 0 && !showForm && (
            <div className="rounded-xl border border-dashed border-dash-border p-8 text-center text-sm text-dash-subtle">
              No default cancellation rules yet - customers cancelling a tour with no policy of its own get a 0% refund.
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
        </>
      )}

      {showForm && (
        <form onSubmit={save} className="mt-4 rounded-xl border-2 border-dash-brand bg-white p-6">
          <h4 className="mb-4 font-bold text-dash-text">{editingId ? "Edit Default Rule" : "New Default Rule"}</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Min days before *</span>
              <input
                type="number"
                value={form.days_before_tour_min}
                onChange={(e) => setForm((f) => ({ ...f, days_before_tour_min: e.target.value }))}
                placeholder="e.g. 7"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Max days before</span>
              <input
                type="number"
                value={form.days_before_tour_max}
                onChange={(e) => setForm((f) => ({ ...f, days_before_tour_max: e.target.value }))}
                placeholder="e.g. 30"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Refund % *</span>
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
              <span className="mb-1 block text-xs font-bold uppercase text-dash-muted">Notes</span>
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
    </section>
  );
}
