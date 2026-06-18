"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { TourExtension, getExtensions, createExtension, updateExtension, deleteExtension } from "@/lib/services/tourDetailService";
import { listCms } from "@/lib/services/cmsService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const empty = (): TourExtension => ({
  extension_tour_id: 0, extension_title: "", extension_note: "",
  extra_price: 0, display_order: 0, status: "active",
});

export default function TourExtensionsTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<TourExtension[]>([]);
  const [allTours, setAllTours] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourExtension | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exts, tours] = await Promise.all([getExtensions(tourId), listCms("/tours", { limit: 200 })]);
      setItems(exts);
      setAllTours((tours.items ?? []).map((t) => ({ id: t.id as number, title: String(t.title) })));
    } catch { toast.error("Failed to load."); }
    finally { setLoading(false); }
  }, [tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.extension_tour_id) { toast.error("Select an extension tour."); return; }
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
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this extension?")) return;
    try { await deleteExtension(tourId, id); setItems((prev) => prev.filter((i) => i.id !== id)); }
    catch { toast.error("Failed."); }
  };

  if (loading) return <Loader label="Loading extensions..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#121826]">Tour Extensions</h2>
        <button type="button" onClick={() => setEditing({ ...empty(), display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Extension
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-[#E7EAF0] p-10 text-center text-sm text-[#98A2B3]">No extensions yet.</div>
      )}

      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-[#E7EAF0] bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-[#121826]">{item.extension_title || item.extension_tour_title || `Tour #${item.extension_tour_id}`}</p>
              {item.extension_note && <p className="text-sm text-[#98A2B3]">{item.extension_note}</p>}
              <p className="mt-1 text-sm font-semibold text-[#43A9F6]">Extra: {item.extra_price}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-[#E7EAF0] p-2 hover:bg-[#F2F4F7]"><Pencil size={14} /></button>
              <button type="button" onClick={() => remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-2 text-red-500 hover:bg-[#FFF0F0]"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      ))}

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-[#43A9F6] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Extension" : "New Extension"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Extension Tour *</span>
              <select value={String(editing.extension_tour_id || "")}
                onChange={(e) => setEditing((p) => p ? { ...p, extension_tour_id: Number(e.target.value) } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                <option value="">— Select —</option>
                {allTours.filter((t) => t.id !== Number(tourId)).map((t) => <option key={t.id} value={String(t.id)}>{t.title}</option>)}
              </select>
            </label>
            {[["extension_title", "Extension title"], ["extra_price", "Extra price"], ["display_order", "Order"]].map(([key, lbl]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{lbl}</span>
                <input type={["extra_price", "display_order"].includes(key) ? "number" : "text"}
                  value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={(e) => setEditing((p) => p ? { ...p, [key]: ["extra_price", "display_order"].includes(key) ? Number(e.target.value) : e.target.value } : p)}
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
              <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Extension note</span>
              <textarea value={editing.extension_note} rows={2}
                onChange={(e) => setEditing((p) => p ? { ...p, extension_note: e.target.value } : p)}
                className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
