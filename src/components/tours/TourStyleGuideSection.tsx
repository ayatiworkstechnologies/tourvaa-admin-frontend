"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCarFront as Car, LuSave as Save, LuUserRound as UserRound } from "react-icons/lu";
import { getOverview, saveOverview, TourOverview, updateTourGroupSize } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";

const emptyOverview = (): TourOverview => ({
  duration_text: "", start_location: "", end_location: "", group_size: "", tour_type: "", vehicle_style: "", guide_style: "", physical_rating: "",
  why_choose_this_tour: "", ideal_for: "", best_season: "", tour_pace: "", transportation_summary: "", accommodation_summary: "", meal_summary: "",
});

export type TourStyleDraft = {
  overview: TourOverview;
  minGroupSize: string;
  maxGroupSize: string;
  hasStyleChanges: boolean;
  hasGroupSizeChanges: boolean;
};

const guideStyleOptions = [
  { value: "driver_guide", label: "Driver-guide (driver also acts as guide)" },
  { value: "dedicated_guide", label: "Dedicated guide and driver" },
  { value: "driver_only", label: "Driver only" },
] as const;

function groupSizeLabel(minBookingSize?: number | null, maxGroupSize?: number | null) {
  const min = Number(minBookingSize || 1);
  const max = Number(maxGroupSize || 0);
  return max ? `${min}-${max} travellers` : "Set maximum group size above";
}

export default function TourStyleGuideSection({ tourId, minBookingSize, maxGroupSize, tourLanguage, onSaved, onDraftChange }: {
  tourId?: string;
  minBookingSize?: number | null;
  maxGroupSize?: number | null;
  tourLanguage?: string | null;
  onSaved?: () => void;
  onDraftChange?: (draft: TourStyleDraft) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<TourStyleDraft>(() => ({
    overview: emptyOverview(),
    minGroupSize: String(minBookingSize ?? 1),
    maxGroupSize: String(maxGroupSize ?? ""),
    hasStyleChanges: false,
    hasGroupSizeChanges: false,
  }));
  const [loading, setLoading] = useState(Boolean(tourId));
  const [saving, setSaving] = useState(false);
  const { overview, minGroupSize, maxGroupSize: maxGroupSizeInput } = draft;

  const updateDraft = (change: Partial<TourStyleDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...change };
      onDraftChange?.(next);
      return next;
    });
  };

  const load = useCallback(async () => {
    if (!tourId) return;
    try {
      const saved = await getOverview(tourId);
      if (saved) {
        setDraft({
          overview: { ...emptyOverview(), ...saved },
          minGroupSize: String(minBookingSize ?? 1),
          maxGroupSize: String(maxGroupSize ?? ""),
          hasStyleChanges: false,
          hasGroupSizeChanges: false,
        });
      }
    } catch {
      toast.error("Failed to load tour and guide style.");
    } finally {
      setLoading(false);
    }
  }, [maxGroupSize, minBookingSize, tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!tourId) {
      toast.info("These styles will be saved when you create the tour.");
      return;
    }
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
      setDraft({
        overview: { ...emptyOverview(), ...saved },
        minGroupSize: String(groupSize.min_booking_size),
        maxGroupSize: String(groupSize.max_group_size),
        hasStyleChanges: false,
        hasGroupSizeChanges: false,
      });
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
      <div>
        <div>
          <h2 className="text-lg font-black text-dash-text">Tour Style &amp; Guide Style</h2>
          <p className="mt-1 text-sm text-dash-subtle">Set the travel experience shown to travellers. Tour style and booking group size are configured separately.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-dash-subtle"><UserRound size={15} className="text-dash-brand" /> Group size</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input type="number" min={1} value={minGroupSize} disabled={loading} onChange={(event) => updateDraft({ minGroupSize: event.target.value, hasGroupSizeChanges: true })} aria-label="Minimum group size" placeholder="Min"
              className="w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
            <input type="number" min={1} value={maxGroupSizeInput} disabled={loading} onChange={(event) => updateDraft({ maxGroupSize: event.target.value, hasGroupSizeChanges: true })} aria-label="Maximum group size" placeholder="Max"
              className="w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
          </div>
          <p className="mt-2 text-xs text-dash-subtle">Min / max travellers. Current: {groupSizeLabel(Number(minGroupSize), Number(maxGroupSizeInput))}</p>
        </div>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-dash-subtle">Tour type</span>
          <input value={overview.tour_type ?? ""} disabled={loading} onChange={(event) => updateDraft({ overview: { ...overview, tour_type: event.target.value }, hasStyleChanges: true })}
            placeholder="e.g. Relaxed, Luxury, Adventure"
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
        </label>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-dash-subtle"><Car size={15} className="text-dash-brand" /> Vehicle style</span>
          <input value={overview.vehicle_style ?? ""} disabled={loading} onChange={(event) => updateDraft({ overview: { ...overview, vehicle_style: event.target.value }, hasStyleChanges: true })}
            placeholder="e.g. Mini cab, Minivan, Coach"
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60" />
          <p className="mt-1 text-xs text-dash-subtle">Shown to travellers as transport / vehicle.</p>
        </label>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-dash-subtle"><UserRound size={15} className="text-dash-brand" /> Guide style</span>
          <select value={overview.guide_style ?? ""} disabled={loading} onChange={(event) => updateDraft({ overview: { ...overview, guide_style: event.target.value as TourOverview["guide_style"] }, hasStyleChanges: true })}
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select guide style</option>
            {guideStyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {tourLanguage && <p className="mt-2 text-xs text-dash-subtle">Guided in {tourLanguage}</p>}
        </label>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-dash-subtle">Tour pace</span>
          <select value={overview.tour_pace ?? ""} disabled={loading} onChange={(event) => updateDraft({ overview: { ...overview, tour_pace: event.target.value }, hasStyleChanges: true })}
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select pace</option>
            <option value="relaxed">Relaxed</option>
            <option value="moderate">Moderate</option>
            <option value="fast">Fast</option>
          </select>
        </label>
        <label className="rounded-xl border border-blue-100 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-wide text-dash-subtle">Physical rating</span>
          <select value={overview.physical_rating ?? ""} disabled={loading} onChange={(event) => updateDraft({ overview: { ...overview, physical_rating: event.target.value as TourOverview["physical_rating"] }, hasStyleChanges: true })}
            className="mt-2 w-full rounded-lg border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-text outline-none focus:border-dash-brand disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Select physical rating</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Serious</option>
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end border-t border-blue-100 pt-4">
        <button type="button" onClick={() => void save()} disabled={saving || loading || !tourId}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          <Save size={15} /> {!tourId ? "Saved with tour" : saving ? "Saving..." : "Save styles"}
        </button>
      </div>
    </section>
  );
}
