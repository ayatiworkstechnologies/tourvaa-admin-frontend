"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuPencil as Pencil, LuX as X, LuCheck as Check, LuGlobe as Globe, LuRefreshCw as RefreshCw, LuChevronDown as ChevronDown } from "react-icons/lu";
import api from "@/lib/api/client";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import AdminAssetUpload from "@/components/operations/AdminAssetUpload";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";

// ---- generic item type ---------------------------------------------------
type CmsItem = Record<string, unknown> & { id: number };

function getStringValue(item: CmsItem, key: string) {
  const value = item[key];
  return typeof value === "string" ? value : "";
}

function renderImagePreview(item: CmsItem, key: string, label: string) {
  const src = getStringValue(item, key);
  if (!src) {
    return <span className="text-xs font-semibold text-dash-subtle">No image</span>;
  }

  return (
    <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-dash-border bg-dash-bg">
      <Image src={src} alt={label} fill unoptimized className="object-cover" sizes="96px" />
    </div>
  );
}
// ---- tab definitions -----------------------------------------------------
type FieldOption = string | { value: string; label: string };

type TabConfig = {
  key: string;
  label: string;
  endpoint: string;
  columns: { key: string; header: string; render?: (item: CmsItem) => React.ReactNode; className?: string }[];
  formFields: { key: string; label: string; type: "text" | "textarea" | "select" | "url" | "number" | "asset" | "video"; options?: FieldOption[]; required?: boolean }[];
  createMethod?: "post" | "put";
  updateMethod?: "put" | "patch";
  updatePath?: "item" | "collection";
  canEdit?: boolean;
  canDelete?: boolean;
};


const TAB_DESCRIPTIONS: Record<string, string> = {
  banners: "Hero banners and homepage calls to action.",
  "tours-on-deals": "Tours shown in the homepage Top Deals section, with deal labels and sort order.",
  "popular-tours": "Tours shown in the homepage Trending Tour Packages section. Only tours with an active discount can be picked. Shares its list with Handpicked Tours.",
  "handpicked-tours": "Tours shown in the homepage Handpicked Tours for You section. Shares the same pinned-tours list as Trending Tour Packages (no separate backend list exists yet) - only tours with an active discount can be picked.",
  "popular-destinations": "Country images shown in Countries Worth Exploring (the country list itself is calculated automatically from real tour counts).",
  "customer-reviews": "Customer testimonials shown in the homepage Testimonials section.",
  "help-centre": "Questions and answers shown in the homepage FAQ section.",
};
const TABS: TabConfig[] = [
  {
    key: "banners",
    label: "Banners",
    endpoint: "/cms/homepage-banners",
    columns: [
      { key: "image", header: "Preview", render: (item) => renderImagePreview(item, "image", "Banner image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "subtitle", header: "Subtitle" },
      { key: "video", header: "Video", render: (item) => (getStringValue(item, "video") ? "Yes" : "-") },
      { key: "is_active", header: "Active" },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "image", label: "Image (add this or a video below - at least one is required)", type: "asset" },
      { key: "video", label: "Video (add this or an image above - plays instead of the image when set)", type: "video" },
      { key: "cta_url", label: "CTA URL", type: "url" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-tours",
    label: "Trending Tour Packages",
    endpoint: "/cms/popular-tours",
    canEdit: false,
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour (discounted only)", type: "select", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "handpicked-tours",
    label: "Handpicked",
    endpoint: "/cms/popular-tours",
    canEdit: false,
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour (discounted only)", type: "select", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "tours-on-deals",
    label: "Top Deals",
    endpoint: "/cms/tours-on-deals",
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "deal_label", header: "Deal Label" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour", type: "select", required: true },
      { key: "deal_label", label: "Deal Label", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-destinations",
    label: "Countries",
    endpoint: "/cms/popular-destinations",
    columns: [
      { key: "image", header: "Preview", render: (item) => renderImagePreview(item, "image", "Destination image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "country_id", header: "Country ID" },
      { key: "city_id", header: "City ID" },
    ],
    formFields: [
      { key: "title", label: "Title (must match country name)", type: "text", required: true },
      { key: "country_id", label: "Country", type: "number" },
      { key: "image", label: "Image", type: "asset" },
      { key: "city_id", label: "City", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "customer-reviews",
    label: "Testimonials",
    endpoint: "/cms/customer-reviews",
    columns: [
      { key: "reviewer_image", header: "Photo", render: (item) => renderImagePreview(item, "reviewer_image", "Reviewer image"), className: "w-32" },
      { key: "reviewer_name", header: "Reviewer" },
      { key: "rating", header: "Rating" },
      { key: "review_text", header: "Review" },
    ],
    formFields: [
      { key: "reviewer_name", label: "Reviewer Name", type: "text", required: true },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "review_text", label: "Review Text", type: "textarea" },
      { key: "reviewer_image", label: "Reviewer Image", type: "asset" },
      { key: "tour_name", label: "Tour Name", type: "text" },
    ],
  },
  {
    key: "help-centre",
    label: "FAQ",
    endpoint: "/cms/help-centre",
    columns: [
      { key: "question", header: "Question" },
      { key: "category", header: "Category" },
    ],
    formFields: [
      { key: "question", label: "Question", type: "text", required: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
      { key: "category", label: "Category", type: "text", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
];

// ---- TourPickerSelect ------------------------------------------------------
// A native <select> can't render an image per <option>, so the "Tour" field
// on tour-picker tabs (Trending/Handpicked/Top Deals) uses this custom
// dropdown instead, showing each tour's banner thumbnail next to its title.
function TourPickerSelect({
  options,
  images,
  value,
  onChange,
}: {
  options: FieldOption[];
  images: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find((opt) => (typeof opt === "string" ? opt : opt.value) === value);
  const selectedLabel = selected ? (typeof selected === "string" ? selected : selected.label) : "Select...";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-dash-border px-3 py-2.5 text-left text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
      >
        <span className={value ? "text-dash-text" : "text-dash-subtle"}>{selectedLabel}</span>
        <ChevronDown size={16} className={`shrink-0 text-dash-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-dash-border bg-white p-1.5 shadow-lg">
          {options.length === 0 && <p className="px-3 py-2 text-xs text-dash-muted">No tours available.</p>}
          {options.map((opt) => {
            const optValue = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            const src = images[optValue];
            return (
              <button
                key={optValue}
                type="button"
                onClick={() => {
                  onChange(optValue);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                  optValue === value ? "bg-[#EDF5FF] font-bold text-[#0369A1]" : "text-dash-body hover:bg-dash-bg"
                }`}
              >
                {src ? (
                  <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-dash-border bg-dash-bg">
                    <Image src={src} alt="" fill unoptimized className="object-cover" sizes="56px" />
                  </span>
                ) : (
                  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-dash-border bg-dash-bg text-[9px] font-semibold text-dash-subtle">
                    No img
                  </span>
                )}
                <span className="line-clamp-2">{optLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- CmsTabPanel ---------------------------------------------------------
function CmsTabPanel({ tab }: { tab: TabConfig }) {
  const toast = useToast();
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tourOptions, setTourOptions] = useState<FieldOption[]>([]);
  const [tourImages, setTourImages] = useState<Record<string, string>>({});
  const [countryOptions, setCountryOptions] = useState<{ id: number; name: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isDestinationTab = tab.endpoint === "/cms/popular-destinations";
  const selectedCountryId = formValues.country_id ?? "";

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(tab.endpoint);
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : data.items ?? []);
      setPage(1);
    } catch {
      toast.error(`Could not load ${tab.label}.`);
    } finally {
      setLoading(false);
    }
  }, [tab.endpoint, tab.label, toast]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);
  useEffect(() => {
    if (tab.endpoint !== "/cms/popular-tours" && tab.endpoint !== "/cms/tours-on-deals") return;

    let cancelled = false;
    api.get("/tours", { params: { page: 1, limit: 200 } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data?.items ?? res.data ?? [];
        const rows: CmsItem[] = Array.isArray(data) ? data : data.items ?? [];
        // "Trending Tour Packages" and "Handpicked" both share /cms/popular-tours
        // and are only ever filled with discounted tours.
        const filteredRows = tab.endpoint === "/cms/popular-tours"
          ? rows.filter((tour) => typeof tour.discount_percentage === "number" && tour.discount_percentage > 0)
          : rows;
        setTourOptions(filteredRows.map((tour: CmsItem) => {
          const id = String(tour.id ?? "");
          const title = typeof tour.title === "string" ? tour.title : `Tour #${id}`;
          const code = typeof tour.tour_code === "string" && tour.tour_code ? `${tour.tour_code} - ` : "";
          const discount = typeof tour.discount_percentage === "number" && tour.discount_percentage > 0 ? ` (-${tour.discount_percentage}%)` : "";
          return { value: id, label: `${code}${title}${discount}` };
        }).filter((option: { value: string }) => option.value));
        setTourImages(Object.fromEntries(
          rows
            .filter((tour) => typeof tour.banner_image === "string" && tour.banner_image)
            .map((tour) => [String(tour.id ?? ""), tour.banner_image as string])
        ));
      })
      .catch(() => {
        if (!cancelled) {
          setTourOptions([]);
          setTourImages({});
        }
      });

    return () => { cancelled = true; };
  }, [tab.endpoint]);

  useEffect(() => {
    if (!isDestinationTab) return;
    let cancelled = false;
    api.get("/geo/countries")
      .then((res) => { if (!cancelled) setCountryOptions(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setCountryOptions([]); });
    return () => { cancelled = true; };
  }, [isDestinationTab]);

  useEffect(() => {
    if (!isDestinationTab) return;
    if (!selectedCountryId) { setCityOptions([]); return; }
    let cancelled = false;
    api.get("/geo/cities", { params: { country_id: selectedCountryId } })
      .then((res) => { if (!cancelled) setCityOptions(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setCityOptions([]); });
    return () => { cancelled = true; };
  }, [isDestinationTab, selectedCountryId]);

  const openCreate = () => {
    setEditingItem(null);
    setFormValues(Object.fromEntries(tab.formFields.map(f => [f.key, ""])));
    setShowForm(true);
  };

  const openEdit = (item: CmsItem) => {
    setEditingItem(item);
    setFormValues(Object.fromEntries(tab.formFields.map(f => [f.key, item[f.key] != null ? String(item[f.key]) : ""])));
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingItem(null); setFormValues({}); };

  const save = async () => {
    const required = tab.formFields.filter(f => f.required);
    for (const f of required) {
      if (!formValues[f.key]?.trim()) {
        toast.error(`${f.label} is required.`);
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      for (const f of tab.formFields) {
        if (formValues[f.key] !== "") {
          body[f.key] = f.key === "tags"
            ? formValues[f.key].split(",").map((tag) => tag.trim()).filter(Boolean)
            : f.type === "number" || f.key.endsWith("_id") ? Number(formValues[f.key]) : formValues[f.key];
        }
      }
      if (editingItem) {
        const method = tab.updateMethod ?? "put";
        const url = tab.updatePath === "collection" ? tab.endpoint : `${tab.endpoint}/${editingItem.id}`;
        await api[method](url, body);
        toast.success(`${tab.label} updated.`);
      } else {
        const method = tab.createMethod ?? "post";
        await api[method](tab.endpoint, body);
        toast.success(`${tab.label} created.`);
      }
      closeForm();
      void fetchItems();
    } catch (error: unknown) {
      const message = typeof error === "object" && error !== null && "response" in error
        ? String((error as { response?: { data?: { message?: string; detail?: string } } }).response?.data?.message ?? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? `Could not save ${tab.label}.`)
        : `Could not save ${tab.label}.`;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm("Delete this item?")) return;
    setDeletingId(id);
    try {
      await api.delete(`${tab.endpoint}/${id}`);
      toast.success("Item deleted.");
      setItems(prev => prev.filter(x => x.id !== id));
    } catch {
      toast.error("Could not delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (item: CmsItem) => {
    const nextState = !item.is_active;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, is_active: nextState } : x))
    );
    try {
      await api.put(`${tab.endpoint}/${item.id}`, {
        ...item,
        is_active: nextState,
      });
      toast.success(`${getStringValue(item, "title") || tab.label} is now ${nextState ? "Active" : "Inactive"}.`);
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, is_active: item.is_active } : x))
      );
      toast.error("Could not update status.");
    }
  };

  const isTourPickerTab = tab.endpoint === "/cms/popular-tours" || tab.endpoint === "/cms/tours-on-deals";

  const columns: DataTableColumn<CmsItem>[] = [
    {
      key: "no",
      header: "No",
      className: "w-20 font-bold text-dash-muted",
      render: (_row, index) => (page - 1) * pageSize + index + 1,
    },
    ...(isTourPickerTab
      ? [
          {
            key: "tour_image",
            header: "Preview",
            className: "w-32",
            render: (item: CmsItem) => {
              const src = tourImages[String(item.tour_id ?? "")];
              return src ? (
                <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-dash-border bg-dash-bg">
                  <Image src={src} alt={getStringValue(item, "tour_title") || "Tour"} fill unoptimized className="object-cover" sizes="96px" />
                </div>
              ) : (
                <span className="text-xs font-semibold text-dash-subtle">No image</span>
              );
            },
          },
        ]
      : []),
    ...tab.columns.map((col) => ({
      key: col.key,
      header: col.header,
      className: col.className ? `${col.className} text-dash-body` : "text-dash-body",
      render: (item: CmsItem) => {
        if (col.key === "is_active") {
          const isActive = Boolean(item.is_active);
          return (
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={(e) => {
                e.stopPropagation();
                void toggleActive(item);
              }}
              className={`group inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <span
                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </span>
              <span>{isActive ? "Active" : "Inactive"}</span>
            </button>
          );
        }
        return col.render ? col.render(item) : (
          <span className="line-clamp-2">
            {item[col.key] != null ? String(item[col.key]) : "-"}
          </span>
        );
      },
    })),
  ];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  const description = TAB_DESCRIPTIONS[tab.key] ?? "Manage this website content section.";
  const visibleFieldCount = tab.formFields.length;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-dash-border bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-dash-text">{tab.label}</h3>
              <span className="rounded-full bg-[#EDF5FF] px-2.5 py-1 text-xs font-bold text-[#0369A1]">
                {loading ? "Loading" : `${items.length} item${items.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <p className="mt-1 text-sm text-dash-muted">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchItems()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1]"
            >
              <Plus size={15} /> Add {tab.label}
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <section className="rounded-xl border border-dash-border bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <div className="mb-5 flex flex-col gap-3 border-b border-dash-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-dash-text">{editingItem ? `Edit ${tab.label}` : `New ${tab.label}`}</h3>
              <p className="mt-1 text-sm text-dash-muted">{visibleFieldCount} fields in this section. Required fields are marked.</p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-3 py-2 text-sm font-semibold text-dash-muted hover:bg-dash-bg"
            >
              <X size={14} /> Close
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tab.formFields.map(f => (
              <div key={f.key} className={f.type === "textarea" || f.type === "asset" || f.type === "video" ? "sm:col-span-2" : ""}>
                {f.type !== "asset" && f.type !== "video" && (
                  <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                    {f.label}{f.required && " *"}
                  </label>
                )}
                {f.type === "asset" || f.type === "video" ? (
                  <AdminAssetUpload
                    label={`${f.label}${f.required ? " *" : ""}`}
                    kind={f.type}
                    value={formValues[f.key] ?? ""}
                    onChange={(value) => setFormValues(v => ({ ...v, [f.key]: value }))}
                  />
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={5}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  />
                ) : f.type === "select" && f.key === "tour_id" ? (
                  <TourPickerSelect
                    options={tourOptions}
                    images={tourImages}
                    value={formValues[f.key] ?? ""}
                    onChange={(value) => setFormValues(v => ({ ...v, [f.key]: value }))}
                  />
                ) : f.key === "country_id" && isDestinationTab ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, country_id: e.target.value, city_id: "" }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">Select a country...</option>
                    {countryOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : f.key === "city_id" && isDestinationTab ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    disabled={!selectedCountryId}
                    onChange={e => setFormValues(v => ({ ...v, city_id: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 disabled:cursor-not-allowed disabled:bg-dash-bg disabled:text-dash-subtle"
                  >
                    <option value="">{selectedCountryId ? "Select a city..." : "Select a country first"}</option>
                    {cityOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : f.type === "select" ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(opt => {
                      const value = typeof opt === "string" ? opt : opt.value;
                      const label = typeof opt === "string" ? opt : opt.label;
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-dash-border pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
            >
              <Check size={14} /> {saving ? "Saving..." : editingItem ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold text-dash-muted hover:bg-dash-bg"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-dash-border bg-white p-4">
        <DataTable
          ariaLabel={`${tab.label} table`}
          columns={columns}
          rows={paginatedItems}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={items.length}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyTitle={`No ${tab.label.toLowerCase()} yet`}
          emptyDescription={`Add ${tab.label.toLowerCase()} to publish content into this website section.`}
          actions={(item) => (
            <div className="flex items-center justify-end gap-2">
              {tab.canEdit !== false && (
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  aria-label="Edit"
                  title="Edit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-sky-50 hover:text-dash-brand-hover"
                >
                  <Pencil size={15} />
                </button>
              )}
              {tab.canDelete !== false && (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteItem(item.id)}
                  aria-label="Delete"
                  title="Delete"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        />
      </section>
    </div>
  );
}

// ---- Main Page -----------------------------------------------------------
export default function CmsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const currentTab = TABS.find(t => t.key === activeTab) ?? TABS[0];

  return (
    <ModuleWrapper title="CMS Management" requiredPermission="website_cms.view">
      <div className="space-y-5">
        <section className="rounded-xl border border-dash-border bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF5FF] text-[#0284C7]">
                  <Globe size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-dash-text">Website CMS</h2>
                  <p className="mt-1 text-sm text-dash-muted">Manage homepage, content, policies, links, and promotional website sections.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-xl border border-dash-border px-4 py-3">
                <span className="block text-xs font-bold uppercase text-dash-muted">Sections</span>
                <span className="mt-1 block text-lg font-bold text-dash-text">{TABS.length}</span>
              </div>
              <div className="rounded-xl border border-dash-border px-4 py-3">
                <span className="block text-xs font-bold uppercase text-dash-muted">Active</span>
                <span className="mt-1 block text-lg font-bold text-[#0284C7]">{currentTab.label}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dash-border bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-20 rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-[#0284C7] bg-[#EDF5FF] shadow-sm"
                      : "border-dash-border bg-white hover:border-[#9CCFF0] hover:bg-[#F7FBFF]"
                  }`}
                >
                  <span className={`block text-sm font-bold ${active ? "text-[#0369A1]" : "text-dash-text"}`}>{tab.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-dash-muted">{TAB_DESCRIPTIONS[tab.key]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <CmsTabPanel key={currentTab.key} tab={currentTab} />
      </div>
    </ModuleWrapper>
  );
}
