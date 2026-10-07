"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCarFront as Car, LuSave as Save, LuUserRound as UserRound } from "react-icons/lu";
import { getOverview, saveOverview, TourOverview, updateTourGroupSize } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";

const emptyOverview = (): TourOverview => ({
  duration_text: "", start_location: "", end_location: "", group_size: "", tour_type: "", guide_style: "", physical_rating: "easy",
  why_choose_this_tour: "", ideal_for: "", best_season: "", tour_pace: "", transportation_summary: "", accommodation_summary: "", meal_summary: "",
});

const guideStyleOptions = [
  { value: "driver_guide", label: "Driver-guide (driver also acts as guide)" },
  { value: "dedicated_guide", label: "Dedicated guide and driver" },
  { value: "driver_only", label: "Driver only" },
] as const;

function vehicleStyle(maxGroupSize?: number | null) {
  const capacity = Number(maxGroupSize || 0);
  if (!capacity) return "Set maximum group size above";
  if (capacity <= 4) return `Private car - up to ${capacity} travellers`;
  if (capacity <= 6) return `Mini cab - up to ${capacity} travellers`;
  if (capacity <= 12) return `Minivan - up to ${capacity} travellers`;
  if (capacity <= 20) return `Mini coach - up to ${capacity} travellers`;
  return `Coach - up to ${capacity} travellers`;
}

function groupSizeLabel(minBookingSize?: number | null, maxGroupSize?: number | null) {
  const min = Number(minBookingSize || 1);
  const max = Number(maxGroupSize || 0);
  return max ? `${min}-${max} travellers` : "Set maximum group size above";
}

export default function TourStyleGuideSection({ tourId, minBookingSize, maxGroupSize, tourLanguage, onSaved }: {
  tourId: string;
  minBookingSize?: number | null;
  maxGroupSize?: number | null;
  tourLanguage?: string | null;
  onSaved?: () => void;
}) {
  const toast = useToast();
  const [overview, setOverview] = useState<TourOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minGroupSize, setMinGroupSize] = useState(String(minBookingSize ?? 1));
  const [maxGroupSizeInput, setMaxGroupSizeInput] = useState(String(maxGroupSize ?? ""));

  useEffect(() => { setMinGroupSize(String(minBookingSize ?? 1)); }, [minBookingSize]);
  useEffect(() => { setMaxGroupSizeInput(String(maxGroupSize ?? "")); }, [maxGroupSize]);

  const load = useCallback(async () => {
    try {
      const saved = await getOverview(tourId);
      if (saved) setOverview({ ...emptyOverview(), ...saved });
    } catch {
      toast.error("Failed to load tour and guide style.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    const min = Number(minGroupSize);
    const max = Number(maxGroupSizeInput);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
      toast.error("Enter a valid group size: minimum must be at least 1 and cannot exceed maximum.");
      return;
    }
    setSaving(true);
    try {
      const [saved, groupSize] = await Promise.all([
        saveOverview(tourId, overview),
        updateTourGroupSize(tourId, min, max),
      ]);
      setOverview({ ...emptyOverview(), ...saved });
      setMinGroupSize(String(groupSize.min_booking_size));
      setMaxGroupSizeInput(String(groupSize.max_group_size));
      toast.success("Tour and guide style saved.");
      onSaved?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-dash-text">Tour Style &amp; Guide Style</h2>
          <p className="mt-1 text-sm text-dash-subtle">Set the travel experience shown to travellers. Vehicle style is calculated from the group size above.</p>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          <Save size={15} /> {saving ? "Saving..." : "Save styles"}
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-dash-subtle"><UserRound size={15} className="text-dash-brand" /> Group size</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input type="number" min={1} value={minGroupSize} disabled={loading} onChange={(event) => setMinGroupSize(event.target.value)} aria-label="Minimum group size" placeholder="Min"
              className="w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
            <input type="number" min={1} value={maxGroupSizeInput} disabled={loading} onChange={(event) => setMaxGroupSizeInput(event.target.value)} aria-label="Maximum group size" placeholder="Max"
              className="w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
          </div>
          <p className="mt-2 text-xs text-dash-subtle">Min / max travellers. Current: {groupSizeLabel(Number(minGroupSize), Number(maxGroupSizeInput))}</p>
        </div>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-dash-subtle">Travel style</span>
          <input value={overview.tour_type ?? ""} disabled={loading} onChange={(event) => setOverview((current) => ({ ...current, tour_type: event.target.value }))}
            placeholder="e.g. Relaxed, Luxury, Adventure"
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
        </label>
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-dash-subtle"><Car size={15} className="text-dash-brand" /> Vehicle style</span>
          <p className="mt-2 text-sm font-bold text-dash-text">{vehicleStyle(Number(maxGroupSizeInput))}</p>
          <p className="mt-1 text-xs text-dash-subtle">Calculated automatically from the editable maximum group size.</p>
        </div>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-dash-subtle"><UserRound size={15} className="text-dash-brand" /> Guide style</span>
          <select value={overview.guide_style ?? ""} disabled={loading} onChange={(event) => setOverview((current) => ({ ...current, guide_style: event.target.value as TourOverview["guide_style"] }))}
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select guide style</option>
            {guideStyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {tourLanguage && <p className="mt-2 text-xs text-dash-subtle">Guided in {tourLanguage}</p>}
        </label>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-dash-subtle">Tour pace</span>
          <select value={overview.tour_pace ?? ""} disabled={loading} onChange={(event) => setOverview((current) => ({ ...current, tour_pace: event.target.value }))}
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select pace</option>
            <option value="relaxed">Relaxed</option>
            <option value="moderate">Moderate</option>
            <option value="fast">Fast</option>
          </select>
        </label>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-dash-subtle">Physical rating</span>
          <select value={overview.physical_rating} disabled={loading} onChange={(event) => setOverview((current) => ({ ...current, physical_rating: event.target.value as TourOverview["physical_rating"] }))}
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60">
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Serious</option>
          </select>
        </label>
      </div>
    </section>
  );
}
