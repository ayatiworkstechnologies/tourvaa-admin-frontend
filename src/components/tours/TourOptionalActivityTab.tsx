"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuSave as Save, LuX as X } from "react-icons/lu";
import {
  OptionalActivity,
  getOptionalActivities,
  createOptionalActivity,
  updateOptionalActivity,
  deleteOptionalActivity,
} from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { ADDON_CATEGORIES, addonCategoryLabel } from "@/lib/constants/addonCategories";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): OptionalActivity => ({
  activity_name: "",
  description: "",
  price_per_person: 0,
  image: "",
  category: "other",
  status: "active",
});

export default function TourOptionalActivityTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<OptionalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OptionalActivity | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getOptionalActivities(tourId));
    } catch {
      toast.error("Failed to load activities.");
    } finally {
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
      const payload = { ...editing, price_per_person: sanitizeNumber(editing.price_per_person) };
      if (editing.id) {
        const updated = await updateOptionalActivity(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createOptionalActivity(tourId, payload);
        setItems((prev) => [...prev, created]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await deleteOptionalActivity(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return <Loader label="Loading activities..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Activities & Add-ons</h2>
          <p className="text-sm text-dash-subtle">Optional paid activities travellers can add to this tour.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} /> Add Activity
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">
          No optional activities yet.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-dash-border bg-white overflow-hidden">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.activity_name} className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center gap-2"><p className="font-semibold text-dash-text">{item.activity_name}</p><span className="rounded-full bg-[var(--portal-soft)] px-2 py-0.5 text-[10px] font-bold text-dash-brand">{addonCategoryLabel(item.category)}</span></div>
              <p className="mt-1 text-sm text-dash-subtle">{item.description}</p>
              <p className="mt-2 text-sm font-bold text-dash-text">+{item.price_per_person} <span className="font-normal text-dash-subtle">per person</span></p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border px-3 py-1.5 text-xs font-semibold hover:bg-[#F2F4F7]">Edit</button>
                <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-[#FFF0F0]">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dash-text">{editing.id ? "Edit Activity" : "New Activity"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <AdminAssetUpload
                label="Image"
                value={editing.image}
                onChange={(value) => setEditing((p) => (p ? { ...p, image: value } : p))}
              />
            </div>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Activity name *</span>
              <input
                value={editing.activity_name}
                onChange={(e) => setEditing((p) => (p ? { ...p, activity_name: e.target.value } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Price per person</span>
              <input
                type="number"
                value={numberInputValue(editing.price_per_person)}
                onChange={(e) => setEditing((p) => (p ? { ...p, price_per_person: parseNumberInput(e.target.value) } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Category</span>
              <select
                value={editing.category}
                onChange={(e) => setEditing((p) => (p ? { ...p, category: e.target.value } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              >
                {ADDON_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select
                value={editing.status}
                onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Description</span>
              <textarea
                value={editing.description}
                rows={3}
                onChange={(e) => setEditing((p) => (p ? { ...p, description: e.target.value } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Activity"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
