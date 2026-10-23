"use client";

import { useCallback, useEffect, useState } from "react";
import { LuSave as Save, LuCalendar as Calendar, LuSparkles as Sparkles, LuCompass as Compass, LuBus as Bus, LuBed as Bed, LuUtensils as Utensils } from "react-icons/lu";
import { getOverview, saveOverview, TourOverview } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const empty: TourOverview = {
  duration_text: "", start_location: "", end_location: "",
  group_size: "", tour_type: "", vehicle_style: "", guide_style: "", physical_rating: "easy",
  why_choose_this_tour: "", ideal_for: "", best_season: "", tour_pace: "",
  transportation_summary: "", accommodation_summary: "", meal_summary: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition shadow-2xs hover:border-slate-300 hover:bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 text-slate-900";

/** `embedded`: rendered inside the tour editor, where the step's single Save
 * button submits this form (id `wizard-form-overview`), so its own button is hidden. */
export default function TourOverviewTab({ tourId, embedded = false, onSaved }: { tourId: string; embedded?: boolean; onSaved?: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<TourOverview>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOverview(tourId);
      if (data) setForm((prev) => ({ ...prev, ...data }));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        toast.error("Failed to load overview");
      }
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: keyof TourOverview, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveOverview(tourId, form);
      if (!embedded) toast.success("Overview saved.");
      onSaved?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading overview..." />;

  return (
    <form id="wizard-form-overview" onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 space-y-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Compass size={17} />
              </span>
              <h2 className="text-base font-black text-slate-900 sm:text-lg">Trip Planning Details</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Clear trip context, optimal seasons, target audiences, and comfort summaries to help guests make informed bookings.
            </p>
          </div>
        </div>

        {/* Section 1: Trip Suitability */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
              <Calendar size={13} className="text-blue-500" />
              Best season <span className="font-medium normal-case text-slate-400">(optional)</span>
            </span>
            <input
              value={(form.best_season as string) ?? ""}
              onChange={(e) => update("best_season", e.target.value)}
              placeholder="e.g. October to March (dry, pleasant weather)"
              className={inputClass}
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              When weather, wildlife sightings, or festivals are at their peak.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
              <Sparkles size={13} className="text-amber-500" />
              Ideal for <span className="font-medium normal-case text-slate-400">(optional)</span>
            </span>
            <input
              value={(form.ideal_for as string) ?? ""}
              onChange={(e) => update("ideal_for", e.target.value)}
              placeholder="e.g. Couples, families with teens, first-time visitors, photography lovers"
              className={inputClass}
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Who will enjoy this itinerary the most.
            </span>
          </label>

          <label className="md:col-span-2 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
              Why choose this tour <span className="font-medium normal-case text-slate-400">(optional)</span>
            </span>
            <textarea
              value={(form.why_choose_this_tour as string) ?? ""}
              onChange={(e) => update("why_choose_this_tour", e.target.value)}
              placeholder="e.g. Private guided departures, zero hidden fees, hand-picked boutique hotels, and authentic village immersion..."
              rows={3}
              className={`min-h-20 resize-y ${inputClass}`}
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              The primary differentiator and value proposition for booking this tour.
            </span>
          </label>
        </div>

        {/* Section 2: Logistics Summaries */}
        <div className="pt-2 border-t border-slate-100">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            Logistics &amp; Comfort Summaries
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                <Bus size={13} className="text-indigo-500" />
                Transportation summary
              </span>
              <textarea
                value={(form.transportation_summary as string) ?? ""}
                onChange={(e) => update("transportation_summary", e.target.value)}
                placeholder="e.g. Private air-conditioned SUV with licensed chauffeur..."
                rows={3}
                className={`min-h-20 resize-y ${inputClass}`}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                <Bed size={13} className="text-emerald-500" />
                Accommodation summary
              </span>
              <textarea
                value={(form.accommodation_summary as string) ?? ""}
                onChange={(e) => update("accommodation_summary", e.target.value)}
                placeholder="e.g. 4-star boutique heritage hotels and luxury desert camps..."
                rows={3}
                className={`min-h-20 resize-y ${inputClass}`}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                <Utensils size={13} className="text-amber-500" />
                Meal summary
              </span>
              <textarea
                value={(form.meal_summary as string) ?? ""}
                onChange={(e) => update("meal_summary", e.target.value)}
                placeholder="e.g. Daily buffet breakfast + 2 traditional regional dinners..."
                rows={3}
                className={`min-h-20 resize-y ${inputClass}`}
              />
            </label>
          </div>
        </div>
      </div>

      <div className={embedded ? "hidden" : "flex justify-end"}>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Overview"}
        </button>
      </div>
    </form>
  );
}
