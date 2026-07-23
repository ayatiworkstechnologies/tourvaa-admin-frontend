"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuAlignLeft as AlignLeft,
  LuArrowLeft as ArrowLeft,
  LuFileText as FileText,
  LuImage as ImageIcon,
  LuMapPinned as MapPinned,
  LuSave as Save,
  LuSearch as Search,
  LuTags as Tags,
} from "react-icons/lu";

import Loader from "@/components/ui/Loader";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import {
  TourWorkspaceHeader,
  TourWorkspaceProgress,
} from "@/components/tours/TourWorkspace";
import { createCms, getCms, listCms, updateCms } from "@/lib/api/services/cmsService";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api/client";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type Props = {
  tourId?: string;
  embedded?: boolean;
  role?: "admin" | "supplier";
  onSaved?: () => void | Promise<void>;
  initialData?: Record<string, unknown>;
};

type DropdownOption = { id: number; label: string };
type SubcategoryOption = { id: number; label: string; category_id: number | null };

function normalizeTourForm(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(",") : String(value ?? ""),
    ])
  );
}

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
  role,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  role: "admin" | "supplier";
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DCE6F3] bg-white shadow-[0_12px_34px_-29px_rgba(28,83,160,.7)]">
      <div className="flex items-center gap-3 border-b border-[#E8EDF5] px-5 py-4 sm:px-6">
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
          role === "supplier" ? "bg-emerald-50 text-emerald-700" : "bg-[#EDF5FF] text-dash-brand-hover"
        }`}>
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-black text-dash-text">{title}</h2>
          {description && <p className="text-xs font-medium text-dash-subtle">{description}</p>}
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function TourFormPage({
  tourId,
  embedded = false,
  role = "admin",
  onSaved,
  initialData,
}: Props) {
  const toast = useToast();
  const isSupplier = role === "supplier";
  const inputClass = `w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition ${
    isSupplier
      ? "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      : "focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10"
  }`;
  const saveButtonClass = isSupplier
    ? "bg-[#16833A] text-white shadow-[0_4px_12px_rgba(22,131,58,.2)] hover:bg-[#117331]"
    : "bg-dash-brand text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] hover:bg-dash-brand-hover";
  const [form, setForm] = useState<Record<string, string>>(() =>
    initialData
      ? normalizeTourForm(initialData)
      : {
          currency: "USD",
          status: "draft",
          number_of_days: "1",
        }
  );
  const [loading, setLoading] = useState(Boolean(tourId && !initialData));
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
        let categoryItems: Array<Record<string, unknown>> = [];
        let subcategoryItems: Array<Record<string, unknown>> = [];
        let supplierItems: Array<{ id: number; supplier_name?: string; name?: string }> = [];

        if (isSupplier) {
          const [categoryResponse, subcategoryResponse] = await Promise.all([
            api.get("/tours/categories", { params: { limit: 200 } }),
            api.get("/public/subcategories"),
          ]);
          categoryItems = categoryResponse.data?.items ?? categoryResponse.data?.data ?? [];
          subcategoryItems = subcategoryResponse.data?.items ?? subcategoryResponse.data?.data ?? [];
        } else {
          const [categoryResponse, subcategoryResponse, supplierResponse] = await Promise.all([
            listCms("/tour-categories", { limit: 200 }),
            listCms("/tour-subcategories", { limit: 500 }),
            api.get("/suppliers/", { params: { limit: 200 } }),
          ]);
          categoryItems = (categoryResponse.items ?? []) as Array<Record<string, unknown>>;
          subcategoryItems = (subcategoryResponse.items ?? []) as Array<Record<string, unknown>>;
          supplierItems = supplierResponse.data?.items ?? supplierResponse.data?.data ?? [];
        }

        if (!shouldUpdateState) return;

        setCategories(
          categoryItems.map((category) => ({
            id: Number(category.id),
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
          subcategoryItems.map((subcategory) => ({
            id: Number(subcategory.id),
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
  }, [isSupplier, toast]);

  const fetchTour = useCallback(async () => {
    if (!tourId || initialData) return;
    setLoading(true);
    try {
      const data = await getCms("/tours", tourId);
      setForm(normalizeTourForm(data));
    } catch {
      toast.error("Could not load tour.");
    } finally {
      setLoading(false);
    }
  }, [initialData, toast, tourId]);

  useEffect(() => {
    void fetchTour();
  }, [fetchTour]);

  useEffect(() => {
    if (initialData) setForm(normalizeTourForm(initialData));
  }, [initialData]);

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

  const setupStages = useMemo(
    () => [
      {
        label: "Basic Details",
        note: "Title, duration and pricing",
        complete: Boolean(form.title?.trim() && form.number_of_days),
      },
      {
        label: "Location & Owner",
        note: "Supplier and classification",
        complete: Boolean(form.supplier_id && form.country_id && form.category_id),
      },
      {
        label: "Content & Media",
        note: "Descriptions and imagery",
        complete: Boolean(form.short_description?.trim() && form.banner_image?.trim()),
      },
      {
        label: "SEO & Publish",
        note: "Search data and status",
        complete: Boolean(form.seo_title?.trim() && form.status),
      },
    ],
    [form]
  );

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
      await onSaved?.();
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
      {!embedded && (
        <TourWorkspaceHeader
          role="admin"
          title="Create New Tour"
          description="Build the complete tour record, assign its supplier and location, add media, then choose when it should be published."
          icon={MapPinned}
          eyebrow="Admin Tour Builder"
          actions={[{ label: "Back to Tours", href: "/admin/tours", icon: ArrowLeft, variant: "secondary" }]}
        >
          <TourWorkspaceProgress role="admin" stages={setupStages} />
        </TourWorkspaceHeader>
      )}

      {loading ? (
        <div className={embedded ? "" : "mt-4"}>
          <Loader label="Loading tour..." />
        </div>
      ) : (
        <form onSubmit={submit} className={`${embedded ? "" : "mx-auto mt-4 max-w-6xl"} space-y-4`}>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE6F3] bg-white px-4 py-3 shadow-[0_10px_30px_-28px_rgba(28,83,160,.8)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-dash-text">{tourId ? "Tour essentials" : "Tour setup"}</p>
              <p className="mt-0.5 text-[11px] text-dash-subtle">
                {tourId ? "Update the main tour record, then continue through the editor sections." : "Complete the sections below. You can refine itinerary and pricing after creation."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#DDE6F2] bg-[#F7F9FC] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-dash-muted">
                {form.status || "draft"}
              </span>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-60 ${saveButtonClass}`}
              >
                <Save size={16} /> {saving ? "Saving..." : isSupplier ? "Save Changes" : "Save Tour"}
              </button>
            </div>
          </div>

          <FormSection role={role} icon={FileText} title="Basic tour details" description="Title, pricing, and duration.">
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
              <select
                value={form.status ?? "draft"}
                onChange={(e) => update("status", e.target.value)}
                disabled={isSupplier}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </FormSection>

          <FormSection role={role} icon={AlignLeft} title="Descriptions" description="Shown on the public tour page.">
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

          <FormSection role={role} icon={ImageIcon} title="Media" description="Banner and map images for the tour listing.">
            <AdminAssetUpload label="Banner image" value={form.banner_image ?? ""} onChange={(value) => update("banner_image", value)} />
            <AdminAssetUpload label="Map image" value={form.map_image ?? ""} onChange={(value) => update("map_image", value)} />
          </FormSection>

          <FormSection
            role={role}
            icon={MapPinned}
            title="Location & supplier"
            description={isSupplier ? "Choose the tour location. The tour remains assigned to your supplier account." : "Where the tour happens and who runs it."}
          >
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier</span>
              <select
                value={form.supplier_id ?? ""}
                onChange={(e) => update("supplier_id", e.target.value)}
                disabled={isSupplier}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`}
              >
                <option value="">{isSupplier ? "Your supplier account" : "- None -"}</option>
                {isSupplier && form.supplier_id && (
                  <option value={form.supplier_id}>Your supplier account</option>
                )}
                {!isSupplier && suppliers.map((s) => (
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
            role={role}
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

          <FormSection role={role} icon={Search} title="SEO" description="Metadata for search engines and social sharing.">
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

          <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE6F3] bg-white px-5 py-4 shadow-[0_10px_30px_-28px_rgba(28,83,160,.8)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-dash-text">Ready to save this tour?</p>
              <p className="mt-0.5 text-[11px] text-dash-subtle">
                {isSupplier
                  ? "Your current publishing status is preserved. Submit the tour for approval from the editor header."
                  : "Your status selection controls whether the tour is immediately visible."}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-60 ${saveButtonClass}`}
            >
              <Save size={16} /> {saving ? "Saving..." : isSupplier ? "Save Changes" : "Save Tour"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
