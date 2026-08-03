"use client";

import { useCallback, useEffect, useState } from "react";
import { getOverview, saveOverview, TourOverview } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";

const RATINGS = ["easy", "moderate", "hard"] as const;

const empty: TourOverview = {
  duration_text: "", start_location: "", end_location: "",
  group_size: "", tour_type: "", physical_rating: "easy",
};

export default function PhysicalRatingField({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [overview, setOverview] = useState<TourOverview>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOverview(tourId);
      if (data) setOverview(data);
    } catch {
      toast.error("Failed to load physical rating.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (value: string) => {
    const next = { ...overview, physical_rating: value as TourOverview["physical_rating"] };
    setOverview(next);
    setSaving(true);
    try {
      await saveOverview(tourId, next);
      toast.success("Physical rating saved.");
    } catch {
      toast.error("Failed to save physical rating.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <label className="block max-w-xs">
      <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Physical rating</span>
      <select
        value={overview.physical_rating}
        onChange={(e) => void update(e.target.value)}
        disabled={saving}
        className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
      >
        {RATINGS.map((r) => (
          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
        ))}
      </select>
    </label>
  );
}
