"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { createCms, getCms, updateCms } from "@/lib/services/cmsService";
import { useToast } from "@/hooks/useToast";

type Props = {
  tourId?: string;
};

const textFields = [
  ["title", "Tour title"],
  ["subtitle", "Subtitle"],
  ["currency", "Currency"],
  ["start_location", "Start location"],
  ["finish_location", "Finish location"],
  ["short_description", "Short description"],
  ["long_description", "Long description"],
  ["seo_title", "SEO title"],
  ["seo_description", "SEO description"],
  ["seo_keywords", "SEO keywords"],
  ["image_alt_text", "Image SEO / alt text"],
];

const numberFields = [
  ["supplier_id", "Supplier ID"],
  ["price_start_per_person", "Price from"],
  ["country_id", "Country ID"],
  ["city_id", "City ID"],
  ["category_id", "Category ID"],
  ["number_of_days", "Days"],
  ["number_of_hours", "Hours"],
];

export default function TourFormPage({ tourId }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, string>>({ currency: "USD", status: "draft", number_of_days: "1" });
  const [loading, setLoading] = useState(Boolean(tourId));
  const [saving, setSaving] = useState(false);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    setLoading(true);
    try {
      const data = await getCms("/tours", tourId);
      setForm(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value ?? "")])));
    } catch {
      toast.error("Could not load tour.");
    } finally {
      setLoading(false);
    }
  }, [toast, tourId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTour();
  }, [fetchTour]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = { status: form.status || "draft" };
    for (const [key] of textFields) payload[key] = form[key]?.trim() || "";
    payload.banner_image = form.banner_image?.trim() || "";
    payload.map_image = form.map_image?.trim() || "";
    for (const [key] of numberFields) payload[key] = form[key] ? Number(form[key]) : null;
    payload.subcategory_ids = (form.subcategory_ids || "").split(",").map((item) => Number(item.trim())).filter(Boolean);

    try {
      if (tourId) await updateCms("/tours", tourId, payload);
      else await createCms("/tours", payload);
      toast.success("Tour saved.");
    } catch {
      toast.error("Could not save tour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModuleWrapper title={tourId ? "Edit Tour" : "Create Tour"} requiredPermission={tourId ? "tours.edit" : "tours.create"}>
      {loading ? <Loader label="Loading tour..." /> : (
        <form onSubmit={submit} className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/tours" className="inline-flex items-center gap-2 text-sm font-bold text-[#238DD7]">
              <ArrowLeft size={16} /> Back to tours
            </Link>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9] disabled:opacity-60">
              <Save size={16} /> {saving ? "Saving..." : "Save Tour"}
            </button>
          </div>
          <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
            <h2 className="text-xl font-bold text-[#121826]">Basic tour details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {textFields.map(([key, label]) => (
                <label key={key} className={key.includes("description") ? "md:col-span-2" : ""}>
                  <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
                  {key.includes("description") ? (
                    <textarea value={form[key] || ""} onChange={(event) => update(key, event.target.value)} className="min-h-28 w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                  ) : (
                    <input value={form[key] || ""} onChange={(event) => update(key, event.target.value)} className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                  )}
                </label>
              ))}
              <AdminAssetUpload label="Banner image" value={form.banner_image || ""} onChange={(value) => update("banner_image", value)} />
              <AdminAssetUpload label="Map image" value={form.map_image || ""} onChange={(value) => update("map_image", value)} />
              {numberFields.map(([key, label]) => (
                <label key={key}>
                  <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
                  <input type="number" value={form[key] || ""} onChange={(event) => update(key, event.target.value)} className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
                </label>
              ))}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Sub-category IDs</span>
                <input value={form.subcategory_ids || ""} onChange={(event) => update("subcategory_ids", event.target.value)} placeholder="1,2,3" className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Status</span>
                <select value={form.status || "draft"} onChange={(event) => update("status", event.target.value)} className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            </div>
          </section>
        </form>
      )}
    </ModuleWrapper>
  );
}
