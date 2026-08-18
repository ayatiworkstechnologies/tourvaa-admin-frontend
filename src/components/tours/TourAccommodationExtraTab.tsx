"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuSave as Save, LuX as X } from "react-icons/lu";
import {
  AccommodationExtra,
  getAccommodationExtras,
  createAccommodationExtra,
  updateAccommodationExtra,
  deleteAccommodationExtra,
} from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import { ADDON_CATEGORIES, addonCategoryLabel } from "@/lib/constants/addonCategories";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): AccommodationExtra => ({
  accommodation_name: "",
  description: "",
  extra_price: 0,
  price_type: "per_person",
  image: "",
  category: "room_upgrade",
  is_default: false,
  status: "active",
});

export default function TourAccommodationExtraTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<AccommodationExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AccommodationExtra | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getAccommodationExtras(tourId));
    } catch {
      toast.error("Failed to load accommodation options.");
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
      const payload = { ...editing, extra_price: sanitizeNumber(editing.extra_price) };
      if (editing.id) {
        const updated = await updateAccommodationExtra(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createAccommodationExtra(tourId, payload);
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
    if (!confirm("Delete this accommodation option?")) return;
    try {
      await deleteAccommodationExtra(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return <Loader label="Loading accommodation options..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Accommodation</h2>
          <p className="text-sm text-dash-subtle">Hotel/room upgrade options travellers can add to this tour.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} /> Add Option
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">
          No accommodation options yet.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-dash-border bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2"><p className="font-semibold text-dash-text">{item.accommodation_name}</p><span className="rounded-full bg-[var(--portal-soft)] px-2 py-0.5 text-[10px] font-bold text-dash-brand">{addonCategoryLabel(item.category)}</span></div>
              {item.is_default && (
                <span className="rounded-full bg-[#EDF5FF] px-2 py-0.5 text-[10px] font-bold uppercase text-dash-brand-hover">Default</span>
              )}
            </div>
            <p className="mt-1 text-sm text-dash-subtle">{item.description}</p>
            <p className="mt-2 text-sm font-bold text-dash-text">
              +{item.extra_price} <span className="font-normal text-dash-subtle">({item.price_type === "per_person" ? "per person" : "per booking"})</span>
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border px-3 py-1.5 text-xs font-semibold hover:bg-[#F2F4F7]">Edit</button>
              <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-[#FFF0F0]">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dash-text">{editing.id ? "Edit Option" : "New Option"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <AdminAssetUpload
                label="Image"
                value={editing.image ?? ""}
                onChange={(value) => setEditing((p) => (p ? { ...p, image: value } : p))}
              />
            </div>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Name *</span>
              <input
                value={editing.accommodation_name}
                onChange={(e) => setEditing((p) => (p ? { ...p, accommodation_name: e.target.value } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Extra price</span>
              <input
                type="number"
                value={numberInputValue(editing.extra_price)}
                onChange={(e) => setEditing((p) => (p ? { ...p, extra_price: parseNumberInput(e.target.value) } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Price type</span>
              <select
                value={editing.price_type}
                onChange={(e) => setEditing((p) => (p ? { ...p, price_type: e.target.value as AccommodationExtra["price_type"] } : p))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
              >
                <option value="per_person">Per person</option>
                <option value="per_booking">Per booking</option>
              </select>
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
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={editing.is_default}
                onChange={(e) => setEditing((p) => (p ? { ...p, is_default: e.target.checked } : p))}
              />
              <span className="text-sm font-semibold text-dash-body">Included by default</span>
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
              <Save size={14} /> {saving ? "Saving..." : "Save Option"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
