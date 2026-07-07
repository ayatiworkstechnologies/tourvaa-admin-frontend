"use client";

import { useCallback, useEffect, useState } from "react";
import { LuArrowDown as ArrowDown, LuArrowUp as ArrowUp, LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import {
  getItineraries, createItinerary, updateItinerary, deleteItinerary, reorderItineraries, ItineraryDay,
} from "@/lib/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";

const empty = (): ItineraryDay => ({
  day_number: 1, day_title: "", location_name: "",
  short_description: "", long_description: "", activities: "",
  image: "", image_alt_text: "", display_order: 0, status: "active",
});

export default function TourItineraryTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ItineraryDay | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const itineraryItems = await getItineraries(tourId);
      setItems(itineraryItems);
    } catch {
      toast.error("Failed to load itinerary.");
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
        const updated = await updateItinerary(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createItinerary(tourId, editing);
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
    if (!confirm("Delete this itinerary day?")) return;
    try {
      await deleteItinerary(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setItems(reordered);
    try {
      await reorderItineraries(tourId, reordered.map((item) => item.id!));
    } catch {
      toast.error("Failed to reorder.");
      void load();
    }
  };

  if (loading) return <Loader label="Loading itinerary..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#121826]">Day-wise Itinerary</h2>
        <button
          type="button"
          onClick={() => setEditing({ ...empty(), day_number: items.length + 1, display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} /> Add Day
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-[#E7EAF0] p-10 text-center text-sm text-[#98A2B3]">
          No itinerary days yet. Click &quot;Add Day&quot; to begin.
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-[#43A9F6]">Day {item.day_number}</span>
              <h3 className="mt-0.5 font-semibold text-[#121826]">{item.day_title || "-"}</h3>
              {item.location_name && <p className="text-sm text-[#98A2B3]">{item.location_name}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void move(index, -1)} disabled={index === 0} className="rounded-lg border border-[#E7EAF0] p-2 hover:bg-[#F2F4F7] disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => void move(index, 1)} disabled={index === items.length - 1} className="rounded-lg border border-[#E7EAF0] p-2 hover:bg-[#F2F4F7] disabled:opacity-30"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-[#E7EAF0] p-2 hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
              <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-2 text-red-500 hover:bg-[#FFF0F0]"><Trash2 size={14} /></button>
            </div>
          </div>
          {item.short_description && <p className="mt-2 text-sm text-[#344054]">{item.short_description}</p>}
        </div>
      ))}

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-[#43A9F6] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-[#121826]">{editing.id ? "Edit Day" : "New Day"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["day_number", "Day number", "number"],
              ["day_title", "Day title", "text"],
              ["location_name", "Location", "text"],
              ["display_order", "Display order", "number"],
            ].map(([key, label, type]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
                <input
                  type={type}
                  value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, [key]: type === "number" ? Number(e.target.value) : e.target.value } : prev)}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              </label>
            ))}
            {(["short_description", "long_description", "activities"] as const).map((key) => (
              <label key={key} className="md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{key.replace(/_/g, " ")}</span>
                <textarea
                  value={editing[key] ?? ""}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, [key]: e.target.value } : prev)}
                  rows={3}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              </label>
            ))}
            <div className="md:col-span-2">
              <AdminAssetUpload
                label="Day image"
                value={editing.image ?? ""}
                onChange={(value) => setEditing((prev) => (prev ? { ...prev, image: value } : prev))}
              />
            </div>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Status</span>
              <select
                value={editing.status}
                onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Day"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


