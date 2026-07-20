"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { TourExtension, getExtensions, createExtension, updateExtension, deleteExtension } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import TourPicker from "@/components/tours/TourPicker";

const empty = (): TourExtension => ({
  extension_tour_id: 0, extension_title: "", extension_note: "",
  extra_price: 0, display_order: 0, status: "active",
});

const inputClass =
  "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10";

export default function TourExtensionsTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<TourExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourExtension | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getExtensions(tourId));
    } catch {
      toast.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.extension_tour_id) {
      toast.error("Select an extension tour.");
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateExtension(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createExtension(tourId, editing);
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
    if (!confirm("Delete this extension?")) return;
    try {
      await deleteExtension(tourId, id);
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    }
    catch {
      toast.error("Failed.");
    }
  };

  if (loading) return <Loader label="Loading extensions..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Tour Extensions</h2>
          <p className="text-xs text-dash-subtle">Bolt-on trips guests can add to this tour for an extra price.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...empty(), display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} /> Add Extension
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-2xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No extensions yet.</div>
      )}

      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-dash-text">{item.extension_title || item.extension_tour_title || `Tour #${item.extension_tour_id}`}</p>
              {item.extension_note && <p className="text-sm text-dash-subtle">{item.extension_note}</p>}
              <p className="mt-1 text-sm font-semibold text-dash-brand">Extra: {item.extra_price}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border p-2 hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
              <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-2 text-red-500 hover:bg-[#FFF0F0]"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}

      {editing && (
        <form onSubmit={save} className="rounded-2xl border-2 border-dash-brand bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Extension" : "New Extension"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Extension Tour *</span>
              <TourPicker
                value={editing.extension_tour_id || null}
                onChange={(id, title) =>
                  setEditing((p) =>
                    p
                      ? {
                          ...p,
                          extension_tour_id: id ?? 0,
                          extension_title: p.extension_title || title,
                        }
                      : p
                  )
                }
                excludeIds={[Number(tourId)]}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">
                Custom title <span className="normal-case font-normal">(optional - defaults to the tour name above)</span>
              </span>
              <input
                value={editing.extension_title ?? ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, extension_title: e.target.value } : p))}
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Extra price</span>
              <input
                type="number"
                value={editing.extra_price ?? ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, extra_price: Number(e.target.value) } : p))}
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Order</span>
              <input
                type="number"
                value={editing.display_order ?? ""}
                onChange={(e) => setEditing((p) => (p ? { ...p, display_order: Number(e.target.value) } : p))}
                className={inputClass}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value } : p))} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Extension note</span>
              <textarea
                value={editing.extension_note}
                rows={2}
                onChange={(e) => setEditing((p) => (p ? { ...p, extension_note: e.target.value } : p))}
                className={inputClass}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
