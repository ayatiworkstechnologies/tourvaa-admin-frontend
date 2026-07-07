"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuTrash2 as Trash2, LuPencil as Pencil, LuX as X, LuCheck as Check, LuGlobe as Globe, LuInbox as InboxIcon } from "react-icons/lu";
import api from "@/lib/api";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/useToast";

// ---- generic item type ---------------------------------------------------
type CmsItem = Record<string, unknown> & { id: number };

// ---- tab definitions -----------------------------------------------------
type TabConfig = {
  key: string;
  label: string;
  endpoint: string;
  columns: { key: string; header: string; render?: (item: CmsItem) => React.ReactNode }[];
  formFields: { key: string; label: string; type: "text" | "textarea" | "select" | "url" | "number"; options?: string[]; required?: boolean }[];
};

const TABS: TabConfig[] = [
  {
    key: "banners",
    label: "Banners",
    endpoint: "/cms/banners",
    columns: [
      { key: "title", header: "Title" },
      { key: "subtitle", header: "Subtitle" },
      { key: "is_active", header: "Active", render: (item) => (item.is_active ? "Yes" : "No") },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "image_url", label: "Image URL", type: "url" },
      { key: "link_url", label: "Link URL", type: "url" },
      { key: "button_text", label: "Button Text", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-destinations",
    label: "Destinations",
    endpoint: "/cms/popular-destinations",
    columns: [
      { key: "destination_name", header: "Name" },
      { key: "country_name", header: "Country" },
      { key: "tour_count", header: "Tour Count" },
    ],
    formFields: [
      { key: "destination_name", label: "Destination Name", type: "text", required: true },
      { key: "country_name", label: "Country Name", type: "text" },
      { key: "image_url", label: "Image URL", type: "url" },
      { key: "tour_count", label: "Tour Count", type: "number" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "popular-tours",
    label: "Popular Tours",
    endpoint: "/cms/popular-tours",
    columns: [
      { key: "tour_id", header: "Tour ID" },
      { key: "tour_title", header: "Tour Title" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour ID", type: "number", required: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "tours-on-deals",
    label: "Deals",
    endpoint: "/cms/tours-on-deals",
    columns: [
      { key: "tour_id", header: "Tour ID" },
      { key: "discount_label", header: "Discount Label" },
      { key: "sort_order", header: "Sort" },
    ],
    formFields: [
      { key: "tour_id", label: "Tour ID", type: "number", required: true },
      { key: "discount_label", label: "Discount Label", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "blogs",
    label: "Blogs",
    endpoint: "/cms/blogs",
    columns: [
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
      { key: "cover_image_url", label: "Cover Image URL", type: "url" },
    ],
  },
  {
    key: "customer-reviews",
    label: "Reviews",
    endpoint: "/cms/customer-reviews",
    columns: [
      { key: "reviewer_name", header: "Reviewer" },
      { key: "rating", header: "Rating" },
      { key: "review_text", header: "Review" },
    ],
    formFields: [
      { key: "reviewer_name", label: "Reviewer Name", type: "text", required: true },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "review_text", label: "Review Text", type: "textarea" },
      { key: "avatar_url", label: "Avatar URL", type: "url" },
      { key: "tour_title", label: "Tour Title", type: "text" },
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
      { key: "category", label: "Category", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
    ],
  },
  {
    key: "policies",
    label: "Policies",
    endpoint: "/cms/policies",
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
      { key: "title", header: "Title" },
      { key: "is_active", header: "Active", render: (item) => (item.is_active ? "Yes" : "No") },
    ],
    formFields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea" },
      { key: "image_url", label: "Image URL", type: "url" },
      { key: "link_url", label: "Link URL", type: "url" },
      { key: "button_text", label: "Button Text", type: "text" },
    ],
  },
  {
    key: "external-links",
    label: "External Links",
    endpoint: "/cms/external-links",
    columns: [
      { key: "label", header: "Label" },
      { key: "url", header: "URL" },
      { key: "category", header: "Category" },
    ],
    formFields: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "url", label: "URL", type: "url", required: true },
      { key: "category", label: "Category", type: "text" },
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
        if (formValues[f.key] !== "") body[f.key] = f.type === "number" ? Number(formValues[f.key]) : formValues[f.key];
      }
      if (editingItem) {
        await api.patch(`${tab.endpoint}/${editingItem.id}`, body);
        toast.success(`${tab.label} updated.`);
      } else {
        await api.post(tab.endpoint, body);
        toast.success(`${tab.label} created.`);
      }
      closeForm();
      void fetchItems();
    } catch {
      toast.error(`Could not save ${tab.label}.`);
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
    className: "text-[#344054]",
    render: (item) => (
      <span className="line-clamp-2">
        {col.render ? col.render(item) : item[col.key] != null ? String(item[col.key]) : "—"}
      </span>
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1]"
        >
          <Plus size={15} /> Add {tab.label}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[#E7EAF0] bg-white p-6">
          <h3 className="mb-4 text-base font-bold text-[#121826]">{editingItem ? `Edit ${tab.label}` : `New ${tab.label}`}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {tab.formFields.map(f => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-bold uppercase text-[#667085]">
                  {f.label}{f.required && " *"}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={4}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                  />
                ) : f.type === "select" ? (
                  <select
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                  >
                    <option value="">Select...</option>
                    {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                    value={formValues[f.key] ?? ""}
                    onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-[#0284C7]"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
            >
              <Check size={14} /> {editingItem ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-4 py-2.5 text-sm font-semibold text-[#667085] hover:bg-[#F7F9FC]"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#E7EAF0] bg-white">
        <div className="p-0">
          <DataTable
            ariaLabel={`${tab.label} table`}
            columns={columns}
            rows={items}
            loading={loading}
            emptyTitle={`No ${tab.label.toLowerCase()} yet`}
            emptyDescription={`Click "Add ${tab.label}" to create one.`}
            actions={(item) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E7EAF0] px-3 py-1.5 text-xs font-bold text-[#344054] hover:bg-[#F7F9FC]"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteItem(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Main Page -----------------------------------------------------------
export default function CmsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const currentTab = TABS.find(t => t.key === activeTab) ?? TABS[0];

  return (
    <ModuleWrapper title="CMS Management" requiredPermission="settings.view">
      <div className="space-y-5">
        {/* Header */}
        <section className="flex items-center justify-between rounded-xl border border-[#E7EAF0] bg-white p-6">
          <div>
            <h2 className="text-2xl font-bold text-[#121826]">CMS Management</h2>
            <p className="mt-1 text-sm text-[#667085]">Manage all website content from one place.</p>
          </div>
          <Globe size={22} className="text-[#0284C7]" />
        </section>

        {/* Tab bar — scrollable horizontally on mobile */}
        <div className="overflow-x-auto rounded-xl border border-[#E7EAF0] bg-white">
          <div className="flex gap-1 p-1.5 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? "bg-[#0284C7] text-white shadow-sm"
                    : "text-[#667085] hover:bg-[#F3F8FC] hover:text-[#0284C7]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <CmsTabPanel key={currentTab.key} tab={currentTab} />
      </div>
    </ModuleWrapper>
  );
}
