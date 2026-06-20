"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getOverview, saveOverview, TourOverview } from "@/lib/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";

const RATINGS = ["easy", "moderate", "hard"] as const;

const empty: TourOverview = {
  duration_text: "", start_location: "", end_location: "",
  group_size: "", tour_type: "", physical_rating: "easy",
};

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

  const field = (key: keyof TourOverview, label: string) => (
    <label key={key}>
      <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
      <input
        value={(form[key] as string) ?? ""}
        onChange={(e) => update(key, e.target.value)}
        className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
        <h2 className="text-xl font-bold text-[#121826]">Tour Overview</h2>
        <p className="mt-1 text-sm text-[#98A2B3]">Quick tour details shown on the listing page</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {field("duration_text", "Duration")}
          {field("start_location", "Start location")}
          {field("end_location", "End location")}
          {field("group_size", "Group size")}
          {field("tour_type", "Tour type")}
          <label>
            <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Physical rating</span>
            <select
              value={form.physical_rating}
              onChange={(e) => update("physical_rating", e.target.value)}
              className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
            >
              {RATINGS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9] disabled:opacity-60">
          <Save size={16} /> {saving ? "Saving..." : "Save Overview"}
        </button>
      </div>
    </form>
  );
}
