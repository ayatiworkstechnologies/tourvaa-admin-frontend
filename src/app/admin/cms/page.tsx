"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuPencil as Pencil, LuX as X, LuCheck as Check, LuGlobe as Globe, LuRefreshCw as RefreshCw } from "react-icons/lu";
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

function renderImagePreview(key: string, label: string) {
  return (item: CmsItem) => {
    const src = getStringValue(item, key);
    if (!src) {
      return <span className="text-xs font-semibold text-dash-subtle">No image</span>;
    }

    return (
      <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-dash-border bg-dash-bg">
        <Image src={src} alt={label} fill unoptimized className="object-cover" sizes="96px" />
      </div>
    );
  };
}
// ---- tab definitions -----------------------------------------------------
type FieldOption = string | { value: string; label: string };

type TabConfig = {
  key: string;
  label: string;
  endpoint: string;
  columns: { key: string; header: string; render?: (item: CmsItem) => React.ReactNode; className?: string }[];
  formFields: { key: string; label: string; type: "text" | "textarea" | "select" | "url" | "number" | "asset"; options?: FieldOption[]; required?: boolean }[];
  createMethod?: "post" | "put";
  updateMethod?: "put" | "patch";
  updatePath?: "item" | "collection";
  canEdit?: boolean;
  canDelete?: boolean;
};


const TAB_DESCRIPTIONS: Record<string, string> = {
  banners: "Hero banners and homepage calls to action.",
  "popular-destinations": "Featured destination blocks shown on the website.",
  "popular-tours": "Pinned tours for high-visibility website sections.",
  "tours-on-deals": "Deal labels and sorted promotional tour lists.",
  blogs: "Editorial content, publishing status, and featured images.",
  "customer-reviews": "Customer testimonials and display ordering.",
  "help-centre": "Support questions grouped by help category.",
  policies: "Legal and policy pages used by the public website.",
  "promotional-popups": "Popup campaigns, timing, and call-to-action content.",
  "external-links": "Footer, header, social, and support links.",
};
const TABS: TabConfig[] = [
  {
    key: "banners",
    label: "Banners",
    endpoint: "/cms/homepage-banners",
    columns: [
      { key: "image", header: "Preview", render: renderImagePreview("image", "Banner image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "subtitle", header: "Subtitle" },
      { key: "is_active", header: "Active", render: (item) => (item.is_active ? "Yes" : "No") },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "image", label: "Image", type: "asset", required: true },
      { key: "cta_url", label: "CTA URL", type: "url" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-destinations",
    label: "Destinations",
    endpoint: "/cms/popular-destinations",
    columns: [
      { key: "image", header: "Preview", render: renderImagePreview("image", "Destination image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "country_id", header: "Country ID" },
      { key: "city_id", header: "City ID" },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "country_id", label: "Country ID", type: "number" },
      { key: "image", label: "Image", type: "asset" },
      { key: "city_id", label: "City ID", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-tours",
    label: "Popular Tours",
    endpoint: "/cms/popular-tours",
    canEdit: false,
    columns: [
      { key: "tour_title", header: "Tour" },
      { key: "tour_code", header: "Code" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour", type: "select", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "tours-on-deals",
    label: "Deals",
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
    key: "blogs",
    label: "Blogs",
    endpoint: "/cms/blogs",
    columns: [
      { key: "featured_image", header: "Preview", render: renderImagePreview("featured_image", "Blog image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "slug", header: "Slug" },
      { key: "status", header: "Status" },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published"] },
      { key: "tags", label: "Tags (comma-separated)", type: "text" },
      { key: "featured_image", label: "Featured Image", type: "asset" },
    ],
  },
  {
    key: "customer-reviews",
    label: "Reviews",
    endpoint: "/cms/customer-reviews",
    columns: [
      { key: "reviewer_image", header: "Photo", render: renderImagePreview("reviewer_image", "Reviewer image"), className: "w-32" },
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
    label: "Help Centre",
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
  {
    key: "policies",
    label: "Policies",
    endpoint: "/cms/policies",
    createMethod: "put",
    updateMethod: "put",
    updatePath: "collection",
    canDelete: false,
    columns: [
      { key: "slug", header: "Slug" },
      { key: "title", header: "Title" },
    ],
    formFields: [
      { key: "slug", label: "Slug", type: "select", options: ["terms-and-conditions", "cookie-policy", "cancellation-policy", "privacy-policy"], required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea", required: true },
    ],
  },
  {
    key: "promotional-popups",
    label: "Popups",
    endpoint: "/cms/promotional-popups",
    columns: [
      { key: "image", header: "Preview", render: renderImagePreview("image", "Popup image"), className: "w-32" },
      { key: "title", header: "Title" },
      { key: "is_active", header: "Active", render: (item) => (item.is_active ? "Yes" : "No") },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea" },
      { key: "image", label: "Image", type: "asset" },
      { key: "cta_url", label: "CTA URL", type: "url" },
      { key: "cta_text", label: "CTA Text", type: "text" },
      { key: "display_after_seconds", label: "Display After Seconds", type: "number" },
      { key: "display_frequency", label: "Display Frequency", type: "select", options: ["once", "daily", "always"] },
    ],
  },
  {
    key: "external-links",
    label: "External Links",
    endpoint: "/cms/external-links",
    columns: [
      { key: "label", header: "Label" },
      { key: "url", header: "URL" },
      { key: "location", header: "Location" },
    ],
    formFields: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "url", label: "URL", type: "url", required: true },
      { key: "location", label: "Location", type: "select", options: ["footer", "header", "social", "support"] },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
];

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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(tab.endpoint);
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      toast.error(`Could not load ${tab.label}.`);
    } finally {
      setLoading(false);
    }
  }, [tab.endpoint, tab.label, toast]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);
  useEffect(() => {
    if (tab.key !== "popular-tours" && tab.key !== "tours-on-deals") return;

    let cancelled = false;
    api.get("/tours", { params: { page: 1, limit: 200 } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data?.items ?? res.data ?? [];
        const rows = Array.isArray(data) ? data : data.items ?? [];
        setTourOptions(rows.map((tour: CmsItem) => {
          const id = String(tour.id ?? "");
          const title = typeof tour.title === "string" ? tour.title : `Tour #${id}`;
          const code = typeof tour.tour_code === "string" && tour.tour_code ? `${tour.tour_code} - ` : "";
          return { value: id, label: `${code}${title}` };
        }).filter((option: { value: string }) => option.value));
      })
      .catch(() => {
        if (!cancelled) setTourOptions([]);
      });

    return () => { cancelled = true; };
  }, [tab.key]);

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

  const columns: DataTableColumn<CmsItem>[] = tab.columns.map((col) => ({
    key: col.key,
    header: col.header,
    className: col.className ? `${col.className} text-dash-body` : "text-dash-body",
    render: (item) => col.render ? col.render(item) : (
      <span className="line-clamp-2">
        {item[col.key] != null ? String(item[col.key]) : "-"}
      </span>
    ),
  }));

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
              <div key={f.key} className={f.type === "textarea" || f.type === "asset" ? "sm:col-span-2" : ""}>
                {f.type !== "asset" && (
                  <label className="mb-1 block text-xs font-bold uppercase text-dash-muted">
                    {f.label}{f.required && " *"}
                  </label>
                )}
                {f.type === "asset" ? (
                  <AdminAssetUpload
                    label={`${f.label}${f.required ? " *" : ""}`}
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
                ) : f.type === "select" ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-dash-border px-3 py-2.5 text-sm outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10"
                  >
                    <option value="">Select...</option>
                    {(f.key === "tour_id" ? tourOptions : f.options)?.map(opt => {
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
          rows={items}
          loading={loading}
          emptyTitle={`No ${tab.label.toLowerCase()} yet`}
          emptyDescription={`Add ${tab.label.toLowerCase()} to publish content into this website section.`}
          actions={(item) => (
            <div className="flex items-center justify-end gap-2">
              {tab.canEdit !== false && (
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-body hover:bg-dash-bg"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
              {tab.canDelete !== false && (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteItem(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 size={12} /> Delete
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
