"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import {
  TourItem,
  getInclusions, createInclusion, updateInclusion, deleteInclusion,
  getExclusions, createExclusion, updateExclusion, deleteExclusion,
} from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const APIs = {
  inclusions: { list: getInclusions, create: createInclusion, update: updateInclusion, delete: deleteInclusion },
  exclusions: { list: getExclusions, create: createExclusion, update: updateExclusion, delete: deleteExclusion },
};

const empty = (): TourItem => ({ icon: "", title: "", description: "", display_order: 0, status: "active" });

function isIconUrl(icon: string) {
  return /^https?:\/\//i.test(icon);
}

export default function TourItemsTab({ tourId, segment, label }: { tourId: string; segment: "inclusions" | "exclusions"; label: string }) {
  const toast = useToast();
  const api = APIs[segment];
  const [items, setItems] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const segmentItems = await api.list(tourId);
      setItems(segmentItems);
    } catch {
      toast.error(`Failed to load ${segment}.`);
    }
    finally {
      setLoading(false);
    }
  }, [tourId, api, segment, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await api.update(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await api.create(tourId, editing);
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
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    try {
      await api.delete(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return <Loader label={`Loading ${segment}...`} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Tour {segment.charAt(0).toUpperCase() + segment.slice(1)}</h2>
        <button type="button" onClick={() => setEditing({ ...empty(), display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add {label}
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">
          No {segment} yet.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-dash-border-soft bg-white p-4 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {item.icon &&
                  (isIconUrl(item.icon) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.icon} alt={item.title || "Item icon"} className="h-8 w-8 flex-none rounded-lg object-cover" />
                  ) : (
                    <span className="text-lg">{item.icon}</span>
                  ))}
                <div className="min-w-0">
                  <p className="font-semibold text-dash-text">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-sm text-dash-subtle">{item.description}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setEditing({ ...item })} aria-label={`Edit ${item.title}`} title="Edit" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dash-border hover:bg-[#F2F4F7]"><Pencil size={13} /></button>
                <button type="button" onClick={() => remove(item.id!)} aria-label={`Delete ${item.title}`} title="Delete" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#FFCDD2] text-red-500 hover:bg-[#FFF0F0]"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dash-text">{editing.id ? `Edit ${label}` : `New ${label}`}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[["icon", "Icon (emoji or URL)"], ["title", "Title *"], ["display_order", "Order"]].map(([key, lbl]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{lbl}</span>
                <input
                  type={key === "display_order" ? "number" : "text"}
                  value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, [key]: key === "display_order" ? Number(e.target.value) : e.target.value } : prev)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                />
              </label>
            ))}
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Description</span>
              <textarea value={editing.description} onChange={(e) => setEditing((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                rows={3} className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : `Save ${label}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
