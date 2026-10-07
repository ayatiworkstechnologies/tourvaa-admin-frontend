"use client";

import { useCallback, useEffect, useState } from "react";
import { LuSave as Save } from "react-icons/lu";
import { getOverview, saveOverview, TourOverview } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const empty: TourOverview = {
  duration_text: "", start_location: "", end_location: "",
  group_size: "", tour_type: "", guide_style: "", physical_rating: "easy",
  why_choose_this_tour: "", ideal_for: "", best_season: "", tour_pace: "",
  transportation_summary: "", accommodation_summary: "", meal_summary: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition shadow-2xs focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 text-slate-900";

const RATINGS = ["easy", "moderate", "hard"] as const;

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
      if (data) setForm(data);
    } catch {
      toast.error("Failed to load overview");
    }
    finally {
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
    setSaving(true);
    try {
      await saveOverview(tourId, form);
      toast.success("Overview saved.");
      onSaved?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading overview..." />;

  const field = (key: keyof TourOverview, label: string, placeholder?: string) => (
    <label key={key}>
      <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
      <input
        value={(form[key] as string) ?? ""}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );

  const textareaField = (key: keyof TourOverview, label: string, placeholder?: string) => (
    <label key={key} className="md:col-span-2 lg:col-span-3">
      <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
      <textarea
        value={(form[key] as string) ?? ""}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`min-h-20 ${inputClass}`}
      />
    </label>
  );

  return (
    <form id="wizard-form-overview" onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <h2 className="text-xl font-black text-dash-text">Trip Planning Details</h2>
        <p className="mt-1 text-sm text-dash-subtle">Helps travellers decide if this tour fits them.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Physical rating</span>
            <select
              value={form.physical_rating}
              onChange={(e) => update("physical_rating", e.target.value)}
              className={inputClass}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </label>
          {field("best_season", "Best season", "e.g. October to March")}
          {field("tour_pace", "Tour pace", "e.g. Relaxed, Moderate, Fast-paced")}
          {textareaField("ideal_for", "Ideal for", "e.g. Couples, families with teens, first-time visitors")}
          {textareaField("why_choose_this_tour", "Why choose this tour")}
          {textareaField("transportation_summary", "Transportation summary")}
          {textareaField("accommodation_summary", "Accommodation summary")}
          {textareaField("meal_summary", "Meal summary")}
        </div>
      </div>

      <div className={embedded ? "hidden" : "flex justify-end"}>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Overview"}
        </button>
      </div>
    </form>
  );
}
