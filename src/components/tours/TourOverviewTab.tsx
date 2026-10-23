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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_-28px_rgba(15,23,42,.45)]">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/45 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm">
              <Compass size={19} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Trip Planning Details</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Help travellers quickly understand who this trip suits, when to go, and what the journey feels like.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">Optional details</span>
        </header>

        <div className="space-y-7 px-5 py-6 sm:px-6">
          <section aria-labelledby="guest-fit-heading">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <h3 id="guest-fit-heading" className="text-sm font-extrabold text-slate-900">Guest fit</h3>
                <p className="mt-0.5 text-xs text-slate-500">Set expectations before guests reach your itinerary and pricing.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Calendar size={14} className="text-emerald-600" /> Best season
                </span>
                <input
                  value={(form.best_season as string) ?? ""}
                  onChange={(e) => update("best_season", e.target.value)}
                  placeholder="October to March"
                  className={inputClass}
                />
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">Mention the weather, events, or sightings that make this period ideal.</span>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles size={14} className="text-amber-500" /> Ideal for
                </span>
                <input
                  value={(form.ideal_for as string) ?? ""}
                  onChange={(e) => update("ideal_for", e.target.value)}
                  placeholder="Couples, families, first-time visitors"
                  className={inputClass}
                />
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">Name the guests most likely to enjoy this itinerary.</span>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold text-slate-800">
                  <span>Why choose this tour</span>
                  <span className="font-medium text-slate-400">Your strongest booking reason</span>
                </span>
                <textarea
                  value={(form.why_choose_this_tour as string) ?? ""}
                  onChange={(e) => update("why_choose_this_tour", e.target.value)}
                  placeholder="Private guided departures, thoughtfully chosen stays, and authentic local experiences."
                  rows={3}
                  className={`min-h-24 resize-y ${inputClass}`}
                />
              </label>
            </div>
          </section>

          <section aria-labelledby="comfort-heading" className="rounded-xl border border-slate-200 bg-slate-50/75 p-4 sm:p-5">
            <div className="mb-4">
              <h3 id="comfort-heading" className="text-sm font-extrabold text-slate-900">Travel comfort</h3>
              <p className="mt-0.5 text-xs text-slate-500">A concise summary of how guests move, stay, and dine.</p>
            </div>
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
          </section>
        </div>
      </section>

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
