"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { TourDiscount, getDiscounts, createDiscount, updateDiscount, deleteDiscount } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DatePicker from "@/components/ui/DatePicker";

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
    try {
      const discounts = await getDiscounts(tourId);
      setItems(discounts);
    } catch {
      toast.error("Failed to load discounts.");
    }
    finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateDiscount(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createDiscount(tourId, editing);
        setItems((prev) => [...prev, created]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this discount?")) return;
    try {
      await deleteDiscount(tourId, id);
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    }
    catch {
      toast.error("Failed.");
    }
  };

  if (loading) return <Loader label="Loading discounts..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Discounts &amp; Promo Codes</h2>
        <button type="button" onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Discount
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No discounts yet.</div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-dash-border bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-dash-text">{item.discount_name}</p>
                {item.discount_code && (
                  <span className="mt-1 inline-block rounded-full bg-[#EEF8FF] px-2.5 py-0.5 text-xs font-bold text-dash-brand">{item.discount_code}</span>
                )}
                <p className="mt-1.5 text-sm text-dash-body">
                  {item.discount_value}{item.discount_type === "percentage" ? "%" : ""} off
                  {item.minimum_booking_amount > 0 ? ` - min. ${item.minimum_booking_amount}` : ""}
                </p>
                {(item.start_date || item.end_date) && (
                  <p className="text-xs text-dash-subtle">
                    {item.start_date?.slice(0, 10)} → {item.end_date?.slice(0, 10)}
                  </p>
                )}
                <p className="mt-1 text-xs text-dash-subtle">Used: {item.used_count ?? 0}{item.usage_limit ? ` / ${item.usage_limit}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" aria-label="Edit discount" title="Edit discount" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border p-2 hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
                <button type="button" aria-label="Delete discount" title="Delete discount" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-2 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Discount" : "New Discount"}</h3>
            <button type="button" aria-label="Close editor" title="Close editor" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Discount name *</span>
              <input value={editing.discount_name} onChange={(e) => setEditing((p) => p ? { ...p, discount_name: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Promo code</span>
              <input value={editing.discount_code ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, discount_code: e.target.value || null } : p)}
                placeholder="Leave blank for auto discount"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Type</span>
              <select value={editing.discount_type} onChange={(e) => setEditing((p) => p ? { ...p, discount_type: e.target.value as "percentage" | "fixed" } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Value</span>
              <input type="number" value={editing.discount_value} onChange={(e) => setEditing((p) => p ? { ...p, discount_value: Number(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Min. booking amount</span>
              <input type="number" value={editing.minimum_booking_amount} onChange={(e) => setEditing((p) => p ? { ...p, minimum_booking_amount: Number(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Usage limit</span>
              <input type="number" value={editing.usage_limit ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, usage_limit: e.target.value ? Number(e.target.value) : null } : p)}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <DatePicker label="Start date" value={editing.start_date?.slice(0, 10) ?? ""} maxDate={editing.end_date?.slice(0, 10) || undefined} onChange={(date) => setEditing((previous) => previous ? { ...previous, start_date: date || null } : previous)} />
            <DatePicker label="End date" value={editing.end_date?.slice(0, 10) ?? ""} minDate={editing.start_date?.slice(0, 10) || undefined} onChange={(date) => setEditing((previous) => previous ? { ...previous, end_date: date || null } : previous)} />
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Discount"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
