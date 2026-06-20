"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { TourHighlight, getHighlights, createHighlight, updateHighlight, deleteHighlight } from "@/lib/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const empty = (): TourHighlight => ({ image: "", title: "", short_description: "", display_order: 0, status: "active" });

export default function TourHighlightsTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<TourHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourHighlight | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const highlights = await getHighlights(tourId);
      setItems(highlights);
    }
    catch {
      toast.error("Failed to load highlights.");
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
        const updated = await updateHighlight(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createHighlight(tourId, editing);
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
    if (!confirm("Delete this highlight?")) return;
    try {
      await deleteHighlight(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return <Loader label="Loading highlights..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#121826]">Tour Highlights</h2>
        <button type="button" onClick={() => setEditing({ ...empty(), display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Highlight
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-[#E7EAF0] p-10 text-center text-sm text-[#98A2B3]">No highlights yet.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#E7EAF0] bg-white overflow-hidden">
            {item.image && <img src={item.image} alt={item.title} className="h-36 w-full object-cover" />}
            <div className="p-4">
              <p className="font-semibold text-[#121826]">{item.title}</p>
              <p className="mt-1 text-sm text-[#98A2B3]">{item.short_description}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-xs font-semibold hover:bg-[#F2F4F7]">Edit</button>
                <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-[#FFF0F0]">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-[#43A9F6] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-[#121826]">{editing.id ? "Edit Highlight" : "New Highlight"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[["image", "Image URL"], ["title", "Title *"], ["display_order", "Order"]].map(([key, lbl]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{lbl}</span>
                <input type={key === "display_order" ? "number" : "text"}
                  value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={(e) => setEditing((p) => p ? { ...p, [key]: key === "display_order" ? Number(e.target.value) : e.target.value } : p)}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
              </label>
            ))}
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Short description</span>
              <textarea value={editing.short_description} rows={3}
                onChange={(e) => setEditing((p) => p ? { ...p, short_description: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Highlight"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
