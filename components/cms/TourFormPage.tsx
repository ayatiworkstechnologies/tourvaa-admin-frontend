"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { createCms, getCms, listCms, updateCms } from "@/lib/services/cmsService";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

type Props = {
  tourId?: string;
};

type DropdownOption = { id: number; label: string };

const textFields: [string, string][] = [
  ["title", "Tour title *"],
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

const simpleNumberFields: [string, string][] = [
  ["price_start_per_person", "Price from"],
  ["number_of_days", "Days"],
  ["number_of_hours", "Hours"],
];

export default function TourFormPage({ tourId }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, string>>({
    currency: "USD",
    status: "draft",
    number_of_days: "1",
  });
  const [loading, setLoading] = useState(Boolean(tourId));
  const [saving, setSaving] = useState(false);

  const [countries, setCountries] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);

  // Load dropdown data
  useEffect(() => {
    listCms("/countries", { limit: 200 })
      .then((r) => setCountries((r.items ?? []).map((c) => ({ id: c.id as number, label: String(c.country_name) }))))
      .catch(() => {});

    listCms("/tour-categories", { limit: 200 })
      .then((r) => setCategories((r.items ?? []).map((c) => ({ id: c.id as number, label: String(c.category_name) }))))
      .catch(() => {});

    api
      .get("/suppliers/", { params: { limit: 200 } })
      .then((r) => {
        const items: Record<string, unknown>[] = r.data?.items ?? r.data?.data ?? [];
        setSuppliers(items.map((s) => ({ id: s.id as number, label: String(s.supplier_name ?? s.name ?? s.id) })));
      })
      .catch(() => {});
  }, []);

  // Reload cities when country changes
  useEffect(() => {
    const countryId = form.country_id;
    if (!countryId) {
      setCities([]);
      return;
    }
    listCms("/cities", { limit: 200, country_id: countryId })
      .then((r) => setCities((r.items ?? []).map((c) => ({ id: c.id as number, label: String(c.city_name) }))))
      .catch(() => {});
  }, [form.country_id]);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;
    setLoading(true);
    try {
      const data = await getCms("/tours", tourId);
      setForm(
        Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(",") : String(value ?? ""),
          ])
        )
      );
    } catch {
      toast.error("Could not load tour.");
    } finally {
      setLoading(false);
    }
  }, [toast, tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title?.trim()) {
      toast.error("Tour title is required.");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = { status: form.status || "draft" };

    for (const [key] of textFields) payload[key] = form[key]?.trim() ?? "";
    payload.banner_image = form.banner_image?.trim() ?? "";
    payload.map_image = form.map_image?.trim() ?? "";

    // Simple number fields — use default if blank
    payload.price_start_per_person = form.price_start_per_person ? Number(form.price_start_per_person) : 0;
    payload.number_of_days = form.number_of_days ? Number(form.number_of_days) : 1;
    payload.number_of_hours = form.number_of_hours ? Number(form.number_of_hours) : null;

    // FK fields — null when not selected
    payload.supplier_id = form.supplier_id ? Number(form.supplier_id) : null;
    payload.country_id = form.country_id ? Number(form.country_id) : null;
    payload.city_id = form.city_id ? Number(form.city_id) : null;
    payload.category_id = form.category_id ? Number(form.category_id) : null;

    payload.subcategory_ids = (form.subcategory_ids || "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter(Boolean);

    try {
      if (tourId) await updateCms("/tours", tourId, payload);
      else await createCms("/tours", payload);
      toast.success("Tour saved successfully.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not save tour.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModuleWrapper
      title={tourId ? "Edit Tour" : "Create Tour"}
      requiredPermission={tourId ? "tours.edit" : "tours.create"}
    >
      {loading ? (
        <Loader label="Loading tour..." />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#238DD7]"
            >
              <ArrowLeft size={16} /> Back to tours
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#43A9F6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2F9FE9] disabled:opacity-60"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save Tour"}
            </button>
          </div>

          {/* Basic details */}
          <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
            <h2 className="text-xl font-bold text-[#121826]">Basic tour details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {textFields.map(([key, label]) => (
                <label key={key} className={key.includes("description") ? "md:col-span-2" : ""}>
                  <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
                  {key.includes("description") ? (
                    <textarea
                      value={form[key] ?? ""}
                      onChange={(e) => update(key, e.target.value)}
                      className="min-h-28 w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    />
                  ) : (
                    <input
                      value={form[key] ?? ""}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                    />
                  )}
                </label>
              ))}

              <AdminAssetUpload
                label="Banner image"
                value={form.banner_image ?? ""}
                onChange={(value) => update("banner_image", value)}
              />
              <AdminAssetUpload
                label="Map image"
                value={form.map_image ?? ""}
                onChange={(value) => update("map_image", value)}
              />

              {simpleNumberFields.map(([key, label]) => (
                <label key={key}>
                  <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">{label}</span>
                  <input
                    type="number"
                    value={form[key] ?? ""}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Location & classification */}
          <section className="rounded-xl border border-[#E7EAF0] bg-white p-6">
            <h2 className="text-xl font-bold text-[#121826]">Location &amp; classification</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">

              {/* Supplier */}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Supplier</span>
                <select
                  value={form.supplier_id ?? ""}
                  onChange={(e) => update("supplier_id", e.target.value)}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                >
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.label}</option>
                  ))}
                </select>
              </label>

              {/* Category */}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Tour category</span>
                <select
                  value={form.category_id ?? ""}
                  onChange={(e) => update("category_id", e.target.value)}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                >
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.label}</option>
                  ))}
                </select>
              </label>

              {/* Country */}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Country</span>
                <select
                  value={form.country_id ?? ""}
                  onChange={(e) => {
                    update("country_id", e.target.value);
                    update("city_id", "");
                  }}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                >
                  <option value="">— None —</option>
                  {countries.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.label}</option>
                  ))}
                </select>
              </label>

              {/* City */}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">City</span>
                <select
                  value={form.city_id ?? ""}
                  onChange={(e) => update("city_id", e.target.value)}
                  disabled={!form.country_id}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">— {form.country_id ? "Select city" : "Select country first"} —</option>
                  {cities.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.label}</option>
                  ))}
                </select>
              </label>

              {/* Subcategory IDs */}
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">
                  Subcategory IDs <span className="normal-case font-normal">(comma-separated)</span>
                </span>
                <input
                  value={form.subcategory_ids ?? ""}
                  onChange={(e) => update("subcategory_ids", e.target.value)}
                  placeholder="e.g. 1,2,3"
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                />
              </label>

              {/* Status */}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-[#98A2B3]">Status</span>
                <select
                  value={form.status ?? "draft"}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm outline-none focus:border-[#43A9F6]"
                >
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
