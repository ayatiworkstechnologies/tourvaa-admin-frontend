"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { GalleryImage, getGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";

const IMAGE_TYPES = ["gallery", "itinerary", "highlight", "banner", "map"];
const empty = (): GalleryImage => ({ image_path: "", image_title: "", image_alt_text: "", image_caption: "", image_type: "gallery", display_order: 0, status: "active" });

export default function TourGalleryTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const galleryImages = await getGallery(tourId);
      setItems(galleryImages);
    } catch {
      toast.error("Failed to load gallery.");
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
        const updated = await updateGalleryImage(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createGalleryImage(tourId, editing);
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
    if (!confirm("Delete this image?")) return;
    try {
      await deleteGalleryImage(tourId, id);
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    }
    catch {
      toast.error("Failed.");
    }
  };

  if (loading) return <Loader label="Loading gallery..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Gallery &amp; Images</h2>
        <button type="button" onClick={() => setEditing({ ...empty(), display_order: items.length })}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Image
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No images yet.</div>
      )}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group relative rounded-xl border border-dash-border bg-white overflow-hidden">
            <div className="aspect-video bg-[#F2F4F7]">
              {item.image_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_path} alt={item.image_alt_text || item.image_title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-dash-text">{item.image_title || "Untitled"}</p>
              <span className="inline-block mt-1 rounded-full bg-[#F2F4F7] px-2 py-0.5 text-xs text-dash-subtle">{item.image_type}</span>
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg bg-white/90 p-1.5 shadow"><Pencil size={12} /></button>
              <button type="button" onClick={() => remove(item.id!)} className="rounded-lg bg-white/90 p-1.5 shadow text-red-500"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Image" : "Add Image"}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <AdminAssetUpload
                label="Image *"
                value={editing.image_path}
                onChange={(value) => setEditing((p) => (p ? { ...p, image_path: value } : p))}
              />
            </div>
            {[["image_title", "Title"], ["image_alt_text", "Alt text"]].map(([key, lbl]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{lbl}</span>
                <input value={(editing as Record<string, unknown>)[key] as string ?? ""}
                  onChange={(e) => setEditing((p) => p ? { ...p, [key]: e.target.value } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
              </label>
            ))}
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Image type</span>
              <select value={editing.image_type} onChange={(e) => setEditing((p) => p ? { ...p, image_type: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                {IMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Order</span>
              <input type="number" value={editing.display_order}
                onChange={(e) => setEditing((p) => p ? { ...p, display_order: Number(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Caption</span>
              <input value={editing.image_caption} onChange={(e) => setEditing((p) => p ? { ...p, image_caption: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Image"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
