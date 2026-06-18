"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getSimilarTours, addSimilarTour, deleteSimilarTour, SimilarTour } from "@/lib/services/tourDetailService";
import { listCms } from "@/lib/services/cmsService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

export default function TourSimilarTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<SimilarTour[]>([]);
  const [allTours, setAllTours] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [similar, tours] = await Promise.all([
        getSimilarTours(tourId),
        listCms("/tours", { limit: 200 }),
      ]);
      setItems(similar);
      setAllTours(tours.items.map((t) => ({ id: t.id as number, title: String(t.title) })));
    } catch { toast.error("Failed to load."); }
    finally { setLoading(false); }
  }, [tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const created = await addSimilarTour(tourId, Number(selectedId));
      setItems((prev) => [...prev, created]);
      setSelectedId("");
      toast.success("Added.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to add.";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this similar tour?")) return;
    try {
      await deleteSimilarTour(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { toast.error("Failed to remove."); }
  };

  if (loading) return <Loader label="Loading similar tours..." />;

  const existingIds = new Set(items.map((i) => i.similar_tour_id));
  const available = allTours.filter((t) => t.id !== Number(tourId) && !existingIds.has(t.id));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#121826]">Similar Tours</h2>

      <div className="rounded-xl border border-[#E7EAF0] bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-[#344054]">Add a similar tour</p>
        <div className="flex gap-3">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
            <option value="">— Select a tour —</option>
            {available.map((t) => <option key={t.id} value={String(t.id)}>{t.title}</option>)}
          </select>
          <button type="button" onClick={add} disabled={!selectedId || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <Plus size={16} /> {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E7EAF0] p-8 text-center text-sm text-[#98A2B3]">No similar tours selected.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-4">
              <span className="font-semibold text-[#121826]">{item.similar_tour_title || `Tour #${item.similar_tour_id}`}</span>
              <button type="button" onClick={() => remove(item.id!)}
                className="rounded-lg border border-[#FFCDD2] p-2 text-red-500 hover:bg-[#FFF0F0]">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
