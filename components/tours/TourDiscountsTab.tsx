"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { TourDiscount, getDiscounts, createDiscount, updateDiscount, deleteDiscount } from "@/lib/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const empty = (): TourDiscount => ({
  discount_name: "", discount_code: null, discount_type: "percentage",
  discount_value: 10, discount_scope: "tour", start_date: null, end_date: null,
  usage_limit: null, minimum_booking_amount: 0, status: "active",
});

export default function TourDiscountsTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<TourDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourDiscount | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getDiscounts(tourId)); }
    catch { toast.error("Failed to load discounts."); }
    finally { setLoading(false); }
  }, [tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateDiscount(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        setItems((prev) => [...prev, await createDiscount(tourId, editing)]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save.";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this discount?")) return;
    try { await deleteDiscount(tourId, id); setItems((prev) => prev.filter((i) => i.id !== id)); }
    catch { toast.error("Failed."); }
  };

  if (loading) return <Loader label="Loading discounts..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#121826]">Discounts &amp; Promo Codes</h2>
        <button type="button" onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Discount
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-[#E7EAF0] p-10 text-center text-sm text-[#98A2B3]">No discounts yet.</div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#E7EAF0] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-[#121826]">{item.discount_name}</p>
                {item.discount_code && (
                  <span className="mt-1 inline-block rounded-full bg-[#EEF8FF] px-2.5 py-0.5 text-xs font-bold text-[#43A9F6]">{item.discount_code}</span>
                )}
                <p className="mt-1.5 text-sm text-[#344054]">
                  {item.discount_value}{item.discount_type === "percentage" ? "%" : ""} off
                  {item.minimum_booking_amount > 0 ? ` — min. ${item.minimum_booking_amount}` : ""}
                </p>
                {(item.start_date || item.end_date) && (
                  <p className="text-xs text-[#98A2B3]">
                    {item.start_date?.slice(0, 10)} → {item.end_date?.slice(0, 10)}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#98A2B3]">Used: {item.used_count ?? 0}{item.usage_limit ? ` / ${item.usage_limit}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-[#E7EAF0] p-2 hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
                <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-2 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-[#43A9F6] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Discount" : "New Discount"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Discount name *</span>
              <input value={editing.discount_name} onChange={(e) => setEditing((p) => p ? { ...p, discount_name: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Promo code</span>
              <input value={editing.discount_code ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, discount_code: e.target.value || null } : p)}
                placeholder="Leave blank for auto discount"
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Type</span>
              <select value={editing.discount_type} onChange={(e) => setEditing((p) => p ? { ...p, discount_type: e.target.value as "percentage" | "fixed" } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Value</span>
              <input type="number" value={editing.discount_value} onChange={(e) => setEditing((p) => p ? { ...p, discount_value: Number(e.target.value) } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Min. booking amount</span>
              <input type="number" value={editing.minimum_booking_amount} onChange={(e) => setEditing((p) => p ? { ...p, minimum_booking_amount: Number(e.target.value) } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Usage limit</span>
              <input type="number" value={editing.usage_limit ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, usage_limit: e.target.value ? Number(e.target.value) : null } : p)}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Start date</span>
              <input type="date" value={editing.start_date?.slice(0, 10) ?? ""}
                onChange={(e) => setEditing((p) => p ? { ...p, start_date: e.target.value || null } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">End date</span>
              <input type="date" value={editing.end_date?.slice(0, 10) ?? ""}
                onChange={(e) => setEditing((p) => p ? { ...p, end_date: e.target.value || null } : p)}
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
              <Save size={14} /> {saving ? "Saving..." : "Save Discount"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
