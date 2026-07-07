"use client";

import { useCallback, useEffect, useState } from "react";
import { LuSave as Save } from "react-icons/lu";
import { getOverview, saveOverview, TourOverview } from "@/lib/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const RATINGS = ["easy", "moderate", "hard"] as const;

const empty: TourOverview = {
  duration_text: "", start_location: "", end_location: "",
  group_size: "", tour_type: "", physical_rating: "easy",
};

const inputClass =
  "w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none transition focus:border-[#43A9F6] focus:ring-4 focus:ring-[#43A9F6]/10";

export default function TourOverviewTab({ tourId }: { tourId: string }) {
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
    } catch {
      toast.error("Failed to save overview.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading overview..." />;

  const field = (key: keyof TourOverview, label: string, placeholder?: string) => (
    <label key={key}>
      <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
      <input
        value={(form[key] as string) ?? ""}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-[#E9EDF3] bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <h2 className="text-xl font-black text-[#121826]">Tour Overview</h2>
        <p className="mt-1 text-sm text-[#98A2B3]">Quick tour details shown on the listing page.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {field("duration_text", "Duration", "e.g. 5 Days / 4 Nights")}
          {field("start_location", "Start location", "e.g. Cochin International Airport")}
          {field("end_location", "End location", "e.g. Cochin International Airport")}
          {field("group_size", "Group size", "e.g. 2–15 people")}
          {field("tour_type", "Tour type", "e.g. Adventure, Cultural, Luxury")}
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Physical rating</span>
            <select value={form.physical_rating} onChange={(e) => update("physical_rating", e.target.value)} className={inputClass}>
              {RATINGS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-[#2F9FE9] disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Overview"}
        </button>
      </div>
    </form>
  );
}
