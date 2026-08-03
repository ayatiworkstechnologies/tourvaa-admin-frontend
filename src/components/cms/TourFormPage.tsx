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
import CurrencySelect from "@/components/ui/CurrencySelect";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import { TourWorkspaceHeader } from "@/components/tours/TourWorkspace";
import { createCms, getCms, listCms, updateCms } from "@/lib/api/services/cmsService";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api/client";
import { useGeoCities, useGeoCountries, useGeoStates } from "@/hooks/useGeo";

type Section = "basic" | "location" | "media-seo" | "pricing";

type Props = {
  tourId?: string;
  embedded?: boolean;
  role?: "admin" | "supplier";
  onSaved?: (saved?: Record<string, unknown>) => void | Promise<void>;
  initialData?: Record<string, unknown>;
  sections?: Section[];
};

const ALL_SECTIONS: Section[] = ["basic", "location", "media-seo", "pricing"];

const pricingNumberFields: [string, string][] = [
  ["offer_price", "Offer price"],
  ["infant_price", "Infant price"],
  ["single_supplement", "Single supplement"],
  ["tax_percentage", "Tax %"],
  ["service_fee", "Service fee"],
  ["booking_deposit", "Booking deposit"],
  ["balance_payment_deadline_days", "Balance due (days before departure)"],
];

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

const coreDetailFields: [string, string][] = [
  ["number_of_nights", "Nights"],
  ["max_group_size", "Max group size"],
  ["min_booking_size", "Min booking size"],
];

const newTextFields: [string, string][] = [
  ["tour_language", "Tour language"],
  ["suitable_age_range", "Suitable age range"],
  ["slug", "URL slug"],
  ["focus_keyword", "Focus keyword"],
  ["canonical_url", "Canonical URL"],
  ["tour_video_url", "Tour video URL"],
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
  sections = ALL_SECTIONS,
}: Props) {
  const toast = useToast();
  const showBasic = sections.includes("basic");
  const showLocation = sections.includes("location");
  const showMediaSeo = sections.includes("media-seo");
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

  useEffect(() => {
    if (form.state_id && !selectedStateId) setSelectedStateId(form.state_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state_id]);

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
    const payload: Record<string, unknown> = {};

    for (const [key] of [...textFields, ...descriptionFields, ...seoFields, ...newTextFields]) {
      payload[key] = form[key]?.trim() ?? "";
    }
    payload.banner_image = form.banner_image?.trim() ?? "";
    payload.map_image = form.map_image?.trim() ?? "";
    payload.mobile_cover_image = form.mobile_cover_image?.trim() ?? "";
    payload.open_graph_image = form.open_graph_image?.trim() ?? "";
    payload.brochure_pdf = form.brochure_pdf?.trim() ?? "";
    payload.currency = form.currency || "USD";
    payload.tour_visibility = form.tour_visibility || "public";
    payload.featured = form.featured === "true";
    payload.search_visibility = form.search_visibility !== "false";
    payload.requires_supplier_confirmation = form.requires_supplier_confirmation !== "false";

    // Simple number fields - use default if blank
    payload.price_start_per_person = form.price_start_per_person ? Number(form.price_start_per_person) : 0;
    payload.number_of_days = form.number_of_days ? Number(form.number_of_days) : 1;
    payload.number_of_hours = form.number_of_hours ? Number(form.number_of_hours) : null;
    payload.number_of_nights = form.number_of_nights ? Number(form.number_of_nights) : null;
    payload.max_group_size = form.max_group_size ? Number(form.max_group_size) : null;
    payload.min_booking_size = form.min_booking_size ? Number(form.min_booking_size) : null;
    payload.pricing_type = form.pricing_type || "per_person";
    for (const [key] of pricingNumberFields) {
      payload[key] = key === "balance_payment_deadline_days"
        ? (form[key] ? Number(form[key]) : null)
        : (form[key] ? Number(form[key]) : 0);
    }

    // FK fields - null when not selected
    payload.supplier_id = form.supplier_id ? Number(form.supplier_id) : null;
    payload.country_id = form.country_id ? Number(form.country_id) : null;
    payload.state_id = selectedStateId ? Number(selectedStateId) : null;
    payload.city_id = form.city_id ? Number(form.city_id) : null;
    payload.category_id = form.category_id ? Number(form.category_id) : null;

    payload.subcategory_ids = selectedSubcategoryIds;

    try {
      const saved = tourId
        ? await updateCms("/tours", tourId, payload)
        : await createCms("/tours", payload);
      toast.success("Tour saved successfully.");
      await onSaved?.(saved);
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
          role={role}
          title={tourId ? "Edit Tour" : "Create New Tour"}
          description={
            isSupplier
              ? "Start with the essentials, set your pricing, then continue in the full editor for itinerary, gallery, inclusions, and availability."
              : "Build the complete tour record, assign its supplier and location, add media, then choose when it should be published."
          }
          icon={MapPinned}
          eyebrow={isSupplier ? "Tour Builder" : "Admin Tour Builder"}
          actions={[{
            label: isSupplier ? "Back to My Tours" : "Back to Tours",
            href: isSupplier ? "/supplier/tours" : "/admin/tours",
            icon: ArrowLeft,
            variant: "secondary",
          }]}
        />
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

          {showBasic && (
          <FormSection role={role} icon={FileText} title="Basic tour details" description="Title, pricing, and duration.">
            {tourId && (
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour code</span>
                <input value={form.tour_code ?? "Assigned on save"} disabled className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`} />
              </label>
            )}
            {textFields.map(([key, label]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{label}</span>
                <input value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)} className={inputClass} />
              </label>
            ))}

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
              <CurrencySelect value={form.currency ?? "USD"} onChange={(code) => update("currency", code)} className={inputClass} />
            </label>

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

            {coreDetailFields.map(([key, label]) => (
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
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour language</span>
              <input value={form.tour_language ?? ""} onChange={(e) => update("tour_language", e.target.value)} className={inputClass} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Suitable age range</span>
              <input value={form.suitable_age_range ?? ""} onChange={(e) => update("suitable_age_range", e.target.value)} placeholder="e.g. 12+" className={inputClass} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Visibility</span>
              <select value={form.tour_visibility ?? "public"} onChange={(e) => update("tour_visibility", e.target.value)} className={inputClass}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.featured === "true"} onChange={(e) => update("featured", String(e.target.checked))} />
              <span className="text-sm font-semibold text-dash-body">Featured tour</span>
            </label>

            <label className="flex items-center gap-2 pt-6 md:col-span-2">
              <input type="checkbox" checked={form.requires_supplier_confirmation !== "false"} onChange={(e) => update("requires_supplier_confirmation", String(e.target.checked))} />
              <span className="text-sm font-semibold text-dash-body">Requires supplier confirmation before a paid booking is confirmed</span>
            </label>
            {form.requires_supplier_confirmation === "false" && (
              <p className="text-xs text-dash-subtle md:col-span-2">
                Off: a fully paid booking with an assigned supplier confirms immediately, without waiting on supplier acceptance.
              </p>
            )}
          </FormSection>
          )}

          {showBasic && (
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
          )}

          {showLocation && (
          <>
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
          </>
          )}

          {showMediaSeo && (
          <FormSection role={role} icon={ImageIcon} title="Media" description="Images and downloads for the tour listing.">
            <AdminAssetUpload label="Banner image" value={form.banner_image ?? ""} onChange={(value) => update("banner_image", value)} />
            <AdminAssetUpload label="Map image" value={form.map_image ?? ""} onChange={(value) => update("map_image", value)} />
            <AdminAssetUpload label="Mobile cover image" value={form.mobile_cover_image ?? ""} onChange={(value) => update("mobile_cover_image", value)} />
            <AdminAssetUpload label="Brochure (PDF)" value={form.brochure_pdf ?? ""} onChange={(value) => update("brochure_pdf", value)} />
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour video URL</span>
              <input value={form.tour_video_url ?? ""} onChange={(e) => update("tour_video_url", e.target.value)} className={inputClass} />
            </label>
          </FormSection>
          )}

          {showMediaSeo && (
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
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">URL slug</span>
              <input value={form.slug ?? ""} onChange={(e) => update("slug", e.target.value)} placeholder="Auto-generated from title if left blank" className={inputClass} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Focus keyword</span>
              <input value={form.focus_keyword ?? ""} onChange={(e) => update("focus_keyword", e.target.value)} className={inputClass} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Canonical URL</span>
              <input value={form.canonical_url ?? ""} onChange={(e) => update("canonical_url", e.target.value)} className={inputClass} />
            </label>
            <AdminAssetUpload label="Open Graph image" value={form.open_graph_image ?? ""} onChange={(value) => update("open_graph_image", value)} />
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.search_visibility !== "false"} onChange={(e) => update("search_visibility", String(e.target.checked))} />
              <span className="text-sm font-semibold text-dash-body">Visible to search engines</span>
            </label>
          </FormSection>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE6F3] bg-white px-5 py-4 shadow-[0_10px_30px_-28px_rgba(28,83,160,.8)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-dash-text">Ready to save this tour?</p>
              <p className="mt-0.5 text-[11px] text-dash-subtle">
                {isSupplier
                  ? "Your current publishing status is preserved. Submit the tour for approval from the editor header."
                  : "Publishing status is controlled by the Tour Approval workflow and the Publish/Disable toggle on the Tours list, not from this form."}
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
