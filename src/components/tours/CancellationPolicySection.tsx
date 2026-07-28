"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2 } from "react-icons/lu";
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
  const [saving, setSaving] = useState(false);

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.days_before_tour_min || !form.refund_percentage) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        tour_id: Number(tourId),
        days_before_tour_min: Number(form.days_before_tour_min),
        refund_percentage: Number(form.refund_percentage),
      };
      if (form.days_before_tour_max) body.days_before_tour_max = Number(form.days_before_tour_max);
      if (form.description) body.description = form.description;
      const res = await api.post<{ data: RefundRule }>("/refund-rules", body);
      setRules((prev) => [...prev, res.data.data]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Cancellation rule added.");
    } catch {
      toast.error("Could not add cancellation rule.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this cancellation rule?")) return;
    try {
      await api.delete(`/refund-rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
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
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">
          No tour-specific cancellation rules yet — the global policy applies.
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
                    <button type="button" onClick={() => remove(rule.id)} className="rounded-lg border border-[#FFCDD2] p-1.5 text-red-500 hover:bg-[#FFF0F0]">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <h3 className="mb-4 font-bold text-dash-text">New Cancellation Rule</h3>
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
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Add Rule"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
