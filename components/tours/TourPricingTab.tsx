"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { PricingSlab, getPricing, createPricing, updatePricing, deletePricing } from "@/lib/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const empty = (): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  supplier_price: 0, markup_type: "percentage", markup_value: 0, final_price: 0,
  currency: "USD", status: "active",
});

export default function TourPricingTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<PricingSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PricingSlab | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getPricing(tourId)); }
    catch { toast.error("Failed to load pricing."); }
    finally { setLoading(false); }
  }, [tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updatePricing(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        setItems((prev) => [...prev, await createPricing(tourId, editing)]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this pricing slab?")) return;
    try { await deletePricing(tourId, id); setItems((prev) => prev.filter((i) => i.id !== id)); }
    catch { toast.error("Failed."); }
  };

  const numField = (key: keyof PricingSlab, lbl: string) => (
    <label key={key}>
      <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{lbl}</span>
      <input type="number" value={(editing as Record<string, unknown>)?.[key] as number ?? 0}
        onChange={(e) => setEditing((p) => p ? { ...p, [key]: Number(e.target.value) } : p)}
        className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
    </label>
  );

  if (loading) return <Loader label="Loading pricing..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#121826]">Passenger Pricing</h2>
        <button type="button" onClick={() => setEditing({ ...empty() })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Slab
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-[#E7EAF0] p-10 text-center text-sm text-[#98A2B3]">No pricing slabs yet.</div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E7EAF0] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E7EAF0] bg-[#F9FAFB]">
              <tr>{["Pax Range", "Adult Price", "Child Price", "Markup", "Final Price", "Currency", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-[#98A2B3]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#F2F4F7] last:border-0">
                  <td className="px-4 py-3 font-semibold">{item.passenger_from}–{item.passenger_to}</td>
                  <td className="px-4 py-3">{item.adult_price}</td>
                  <td className="px-4 py-3">{item.child_price}</td>
                  <td className="px-4 py-3">{item.markup_value}{item.markup_type === "percentage" ? "%" : " fixed"}</td>
                  <td className="px-4 py-3 font-bold text-[#43A9F6]">{item.final_price}</td>
                  <td className="px-4 py-3">{item.currency}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-[#E7EAF0] p-1.5 hover:bg-[#F2F4F7]"><Pencil size={13} /></button>
                      <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-1.5 text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-[#43A9F6] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Slab" : "New Pricing Slab"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {numField("passenger_from", "Pax from")}
            {numField("passenger_to", "Pax to")}
            {numField("adult_price", "Adult price")}
            {numField("child_price", "Child price")}
            {numField("supplier_price", "Supplier price")}
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Markup type</span>
              <select value={editing.markup_type} onChange={(e) => setEditing((p) => p ? { ...p, markup_type: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            {numField("markup_value", "Markup value")}
            {numField("final_price", "Final price")}
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Currency</span>
              <input value={editing.currency} onChange={(e) => setEditing((p) => p ? { ...p, currency: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Slab"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
