"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuAlignLeft as AlignLeft, LuArrowLeft as ArrowLeft, LuFileText as FileText, LuImage as ImageIcon, LuMapPinned as MapPinned, LuSave as Save, LuSearch as Search, LuTags as Tags } from "react-icons/lu";

import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { createCms, getCms, listCms, updateCms } from "@/lib/api/services/cmsService";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api/client";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type Props = {
  tourId?: string;
};

type DropdownOption = { id: number; label: string };
type SubcategoryOption = { id: number; label: string; category_id: number | null };

const textFields: [string, string][] = [
  ["title", "Tour title *"],
  ["subtitle", "Subtitle"],
  ["currency", "Currency"],
  ["start_location", "Start location"],
  ["finish_location", "Finish location"],
];

const descriptionFields: [string, string][] = [
  ["short_description", "Short description"],
  ["long_description", "Long description"],
];

const seoFields: [string, string][] = [
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

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dash-border-soft bg-white p-6 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#EDF5FF] text-dash-brand-hover">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-black text-dash-text">{title}</h2>
          {description && <p className="text-xs font-medium text-dash-subtle">{description}</p>}
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

const inputClass =
  "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10";

export default function TourFormPage({ tourId }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, string>>({
    currency: "USD",
    status: "draft",
    number_of_days: "1",
  });
  const [loading, setLoading] = useState(Boolean(tourId));
  const [saving, setSaving] = useState(false);

  const [selectedStateId, setSelectedStateId] = useState("");
  const { countries } = useGeoCountries();
  const { states } = useGeoStates(form.country_id ? Number(form.country_id) : null);
  const { cities } = useGeoCities(
    selectedStateId ? Number(selectedStateId) : null,
    form.country_id ? Number(form.country_id) : null
  );
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);

  useEffect(() => {
    let shouldUpdateState = true;

    async function loadDropdownOptions() {
      try {
        const [categoryResponse, supplierResponse, subcategoryResponse] = await Promise.all([
          listCms("/tour-categories", { limit: 200 }),
          api.get("/suppliers/", { params: { limit: 200 } }),
          listCms("/tour-subcategories", { limit: 500 }),
        ]);

        if (!shouldUpdateState) return;

        const supplierItems: Array<{ id: number; supplier_name?: string; name?: string }> =
          supplierResponse.data?.items ?? supplierResponse.data?.data ?? [];

        setCategories(
          (categoryResponse.items ?? []).map((category) => ({
            id: category.id as number,
            label: String(category.category_name),
          }))
        );
        setSuppliers(
          supplierItems.map((supplier) => ({
            id: supplier.id,
            label: String(supplier.supplier_name ?? supplier.name ?? supplier.id),
          }))
        );
        setSubcategories(
          (subcategoryResponse.items ?? []).map((subcategory) => ({
            id: subcategory.id as number,
            label: String(subcategory.subcategory_name ?? subcategory.id),
            category_id: subcategory.category_id != null ? Number(subcategory.category_id) : null,
          }))
        );
      } catch {
        if (shouldUpdateState) toast.error("Could not load tour form options.");
      }
    }

    void loadDropdownOptions();

    return () => {
      shouldUpdateState = false;
    };
  }, [toast]);

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

  const selectedSubcategoryIds = useMemo(
    () =>
      (form.subcategory_ids || "")
        .split(",")
        .map((item) => Number(item.trim()))
        .filter(Boolean),
    [form.subcategory_ids]
  );

  const toggleSubcategory = (id: number) => {
    const next = selectedSubcategoryIds.includes(id)
      ? selectedSubcategoryIds.filter((existing) => existing !== id)
      : [...selectedSubcategoryIds, id];
    update("subcategory_ids", next.join(","));
  };

  const visibleSubcategories = useMemo(() => {
    if (!form.category_id) return subcategories;
    const categoryId = Number(form.category_id);
    return subcategories.filter((subcategory) => subcategory.category_id === categoryId);
  }, [subcategories, form.category_id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title?.trim()) {
      toast.error("Tour title is required.");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = { status: form.status || "draft" };

    for (const [key] of [...textFields, ...descriptionFields, ...seoFields]) {
      payload[key] = form[key]?.trim() ?? "";
    }
    payload.banner_image = form.banner_image?.trim() ?? "";
    payload.map_image = form.map_image?.trim() ?? "";

    // Simple number fields - use default if blank
    payload.price_start_per_person = form.price_start_per_person ? Number(form.price_start_per_person) : 0;
    payload.number_of_days = form.number_of_days ? Number(form.number_of_days) : 1;
    payload.number_of_hours = form.number_of_hours ? Number(form.number_of_hours) : null;

    // FK fields - null when not selected
    payload.supplier_id = form.supplier_id ? Number(form.supplier_id) : null;
    payload.country_id = form.country_id ? Number(form.country_id) : null;
    payload.city_id = form.city_id ? Number(form.city_id) : null;
    payload.category_id = form.category_id ? Number(form.category_id) : null;

    payload.subcategory_ids = selectedSubcategoryIds;

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
    <div className="animate-in fade-in zoom-in-95 duration-200">
      {loading ? (
        <Loader label="Loading tour..." />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            {!tourId && (
              <Link
                href="/admin/tours"
                className="inline-flex items-center gap-2 text-sm font-bold text-dash-muted hover:text-dash-text"
              >
                <ArrowLeft size={16} /> Back to tours
              </Link>
            )}
            <div className={tourId ? "w-full flex justify-end" : ""}>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition hover:-translate-y-0.5 hover:bg-dash-brand-hover disabled:opacity-60"
              >
                <Save size={16} /> {saving ? "Saving..." : "Save Tour"}
              </button>
            </div>
          </div>

          <FormSection icon={FileText} title="Basic tour details" description="Title, pricing, and duration.">
            {textFields.map(([key, label]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                <input value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)} className={inputClass} />
              </label>
            ))}

            {simpleNumberFields.map(([key, label]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                <input
                  type="number"
                  value={form[key] ?? ""}
                  onChange={(e) => update(key, e.target.value)}
                  className={inputClass}
                />
              </label>
            ))}

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={form.status ?? "draft"} onChange={(e) => update("status", e.target.value)} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </FormSection>

          <FormSection icon={AlignLeft} title="Descriptions" description="Shown on the public tour page.">
            {descriptionFields.map(([key, label]) => (
              <label key={key} className="md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                <textarea
                  value={form[key] ?? ""}
                  onChange={(e) => update(key, e.target.value)}
                  className={`min-h-28 ${inputClass}`}
                />
              </label>
            ))}
          </FormSection>

          <FormSection icon={ImageIcon} title="Media" description="Banner and map images for the tour listing.">
            <AdminAssetUpload label="Banner image" value={form.banner_image ?? ""} onChange={(value) => update("banner_image", value)} />
            <AdminAssetUpload label="Map image" value={form.map_image ?? ""} onChange={(value) => update("map_image", value)} />
          </FormSection>

          <FormSection icon={MapPinned} title="Location & supplier" description="Where the tour happens and who runs it.">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier</span>
              <select value={form.supplier_id ?? ""} onChange={(e) => update("supplier_id", e.target.value)} className={inputClass}>
                <option value="">- None -</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour category</span>
              <select
                value={form.category_id ?? ""}
                onChange={(e) => update("category_id", e.target.value)}
                className={inputClass}
              >
                <option value="">- None -</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Country</span>
              <select
                value={form.country_id ?? ""}
                onChange={(e) => {
                  update("country_id", e.target.value);
                  setSelectedStateId("");
                  update("city_id", "");
                }}
                className={inputClass}
              >
                <option value="">- None -</option>
                {countries.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">State</span>
              <select
                value={selectedStateId}
                onChange={(e) => {
                  setSelectedStateId(e.target.value);
                  update("city_id", "");
                }}
                disabled={!form.country_id}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">- {form.country_id ? "Select state" : "Select country first"} -</option>
                {states.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">City</span>
              <select
                value={form.city_id ?? ""}
                onChange={(e) => update("city_id", e.target.value)}
                disabled={!form.country_id}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">- {form.country_id ? "Select city" : "Select country first"} -</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </label>
          </FormSection>

          <FormSection
            icon={Tags}
            title="Subcategories"
            description={
              form.category_id
                ? "Showing subcategories for the selected category."
                : "Select a category above to narrow this list, or pick from all subcategories."
            }
          >
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {visibleSubcategories.length === 0 ? (
                <p className="text-sm text-dash-subtle">No subcategories available.</p>
              ) : (
                visibleSubcategories.map((subcategory) => {
                  const active = selectedSubcategoryIds.includes(subcategory.id);
                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => toggleSubcategory(subcategory.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? "border-dash-brand bg-[#EDF5FF] text-dash-brand-hover"
                          : "border-dash-border text-dash-muted hover:bg-dash-bg"
                      }`}
                    >
                      {subcategory.label}
                    </button>
                  );
                })
              )}
            </div>
          </FormSection>

          <FormSection icon={Search} title="SEO" description="Metadata for search engines and social sharing.">
            {seoFields.map(([key, label]) => (
              <label key={key} className={key === "seo_description" ? "md:col-span-2" : ""}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                {key === "seo_description" ? (
                  <textarea value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)} className={`min-h-20 ${inputClass}`} />
                ) : (
                  <input value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)} className={inputClass} />
                )}
              </label>
            ))}
          </FormSection>
        </form>
      )}
    </div>
  );
}
