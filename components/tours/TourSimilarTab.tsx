"use client";

import { useCallback, useEffect, useState } from "react";
import { LuMapPin as MapPin, LuPlus as Plus, LuTrash2 as Trash2 } from "react-icons/lu";
import { getSimilarTours, addSimilarTour, deleteSimilarTour, SimilarTour } from "@/lib/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/error-handler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import TourPicker from "@/components/tours/TourPicker";

export default function TourSimilarTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<SimilarTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getSimilarTours(tourId));
    } catch {
      toast.error("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const created = await addSimilarTour(tourId, selectedId);
      setItems((prev) => [...prev, created]);
      setSelectedId(null);
      setPickerKey((key) => key + 1);
      toast.success("Added.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this similar tour?")) return;
    try {
      await deleteSimilarTour(tourId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to remove.");
    }
  };

  if (loading) return <Loader label="Loading similar tours..." />;

  const existingIds = [Number(tourId), ...items.map((i) => i.similar_tour_id)];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#121826]">Similar Tours</h2>

      <div className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <p className="mb-3 text-sm font-semibold text-[#344054]">Add a similar tour</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <TourPicker key={pickerKey} value={selectedId} onChange={(id) => setSelectedId(id)} excludeIds={existingIds} />
          </div>
          <button
            type="button"
            onClick={() => void add()}
            disabled={!selectedId || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            <Plus size={16} /> {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E7EAF0] p-8 text-center text-sm text-[#98A2B3]">
          No similar tours selected.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-[#E9EDF3] bg-white p-4 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-[#121826]">
                <MapPin size={14} className="text-[#98A2B3]" />
                {item.similar_tour_title || `Tour #${item.similar_tour_id}`}
              </span>
              <button
                type="button"
                onClick={() => void remove(item.id!)}
                title="Remove similar tour"
                aria-label="Remove similar tour"
                className="rounded-lg border border-[#FFCDD2] p-2 text-red-500 hover:bg-[#FFF0F0]"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
