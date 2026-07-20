"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LuPercent as Percent, LuPencil as Pencil, LuPlus as Plus, LuSave as Save, LuTag as Tag, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import TourPicker from "@/components/tours/TourPicker";
import DatePicker from "@/components/ui/DatePicker";
import { listCms } from "@/lib/api/services/cmsService";
import { useGeoCountries } from "@/hooks/useGeo";
import { useToast } from "@/hooks/useToast";
import {
  deleteGlobalDiscount,
  createGlobalDiscount,
  GlobalDiscount,
  listAllDiscounts,
  updateGlobalDiscount,
} from "@/lib/api/services/discountService";

type CategoryOption = { id: number; label: string };

const SCOPES: { value: GlobalDiscount["discount_scope"]; label: string }[] = [
  { value: "all_tours", label: "All Tours" },
  { value: "category", label: "Category" },
  { value: "country", label: "Country" },
  { value: "tour", label: "Specific Tour" },
];

const empty = (): GlobalDiscount => ({
  discount_name: "",
  discount_code: null,
  discount_type: "percentage",
  discount_value: 10,
  discount_scope: "all_tours",
  tour_id: null,
  category_id: null,
  country_id: null,
  start_date: null,
  end_date: null,
  usage_limit: null,
  minimum_booking_amount: 0,
  status: "active",
});

const inputClass =
  "w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10";

function scopeLabel(discount: GlobalDiscount) {
  switch (discount.discount_scope) {
    case "all_tours":
      return "All Tours";
    case "category":
      return discount.category_name || "Category";
    case "country":
      return discount.country_name || "Country";
    case "tour":
      return discount.tour_title || "Specific Tour";
    default:
      return discount.discount_scope;
  }
}

export default function DiscountsPage() {
  const toast = useToast();
  const { countries } = useGeoCountries();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [items, setItems] = useState<GlobalDiscount[]>([]);
  const [scopeFilter, setScopeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GlobalDiscount | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAllDiscounts({ scope: scopeFilter }));
    } catch {
      toast.error("Failed to load discounts.");
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listCms("/tour-categories", { limit: 200 })
      .then((response) =>
        setCategories(
          (response.items ?? []).map((category) => ({
            id: category.id as number,
            label: String(category.category_name),
          }))
        )
      )
      .catch(() => setCategories([]));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateGlobalDiscount(editing.id, editing);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createGlobalDiscount(editing);
        setItems((prev) => [created, ...prev]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this discount?")) return;
    try {
      await deleteGlobalDiscount(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const scopeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) counts[item.discount_scope] = (counts[item.discount_scope] ?? 0) + 1;
    return counts;
  }, [items]);

  return (
    <ModuleWrapper title="Discounts" requiredPermission="tours.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[28px] font-black tracking-tight text-dash-text">Discounts</h2>
            <p className="mt-1 text-sm font-medium text-dash-muted">
              Manage promo codes scoped to a specific tour, a category, a country, or all tours at once.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(empty())}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-5 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] transition-all hover:-translate-y-0.5 hover:bg-dash-brand-hover sm:w-auto"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Discount
          </button>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-dash-border bg-white p-1.5">
          <button
            type="button"
            onClick={() => setScopeFilter("")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              scopeFilter === "" ? "bg-dash-brand text-white shadow-sm" : "text-dash-body hover:bg-[#F2F4F7]"
            }`}
          >
            All ({items.length})
          </button>
          {SCOPES.map((scope) => (
            <button
              key={scope.value}
              type="button"
              onClick={() => setScopeFilter(scope.value)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                scopeFilter === scope.value ? "bg-dash-brand text-white shadow-sm" : "text-dash-body hover:bg-[#F2F4F7]"
              }`}
            >
              {scope.label} ({scopeCounts[scope.value] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <Loader label="Loading discounts..." />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">
            No discounts found for this filter.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-dash-border-soft bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-dash-text">{item.discount_name}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#F0F3F8] px-2.5 py-0.5 text-xs font-bold text-dash-muted">
                      <Tag size={11} /> {scopeLabel(item)}
                    </span>
                    {item.discount_code && (
                      <span className="ml-1.5 mt-1.5 inline-block rounded-full bg-[#EEF8FF] px-2.5 py-0.5 text-xs font-bold text-dash-brand">
                        {item.discount_code}
                      </span>
                    )}
                    <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-dash-body">
                      <Percent size={13} className="text-dash-subtle" />
                      {item.discount_value}
                      {item.discount_type === "percentage" ? "%" : ""} off
                      {item.minimum_booking_amount > 0 ? ` - min. ${item.minimum_booking_amount}` : ""}
                    </p>
                    {(item.start_date || item.end_date) && (
                      <p className="text-xs text-dash-subtle">
                        {item.start_date?.slice(0, 10)} → {item.end_date?.slice(0, 10)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-dash-subtle">
                      Used: {item.used_count ?? 0}
                      {item.usage_limit ? ` / ${item.usage_limit}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => setEditing({ ...item })} className="rounded-lg border border-dash-border p-1.5 hover:bg-[#F2F4F7]">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => void remove(item.id!)} className="rounded-lg border border-[#FFCDD2] p-1.5 text-red-500 hover:bg-[#FFF0F0]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <form
              onSubmit={save}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-dash-text">{editing.id ? "Edit Discount" : "New Discount"}</h3>
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-dash-muted hover:bg-dash-bg">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Discount name *</span>
                  <input
                    value={editing.discount_name}
                    onChange={(e) => setEditing((p) => (p ? { ...p, discount_name: e.target.value } : p))}
                    className={inputClass}
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Scope *</span>
                  <select
                    value={editing.discount_scope}
                    onChange={(e) =>
                      setEditing((p) =>
                        p
                          ? {
                              ...p,
                              discount_scope: e.target.value as GlobalDiscount["discount_scope"],
                              tour_id: null,
                              category_id: null,
                              country_id: null,
                            }
                          : p
                      )
                    }
                    className={inputClass}
                  >
                    {SCOPES.map((scope) => (
                      <option key={scope.value} value={scope.value}>
                        {scope.label}
                      </option>
                    ))}
                  </select>
                </label>

                {editing.discount_scope === "tour" && (
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tour *</span>
                    <TourPicker value={editing.tour_id ?? null} onChange={(id) => setEditing((p) => (p ? { ...p, tour_id: id } : p))} />
                  </label>
                )}

                {editing.discount_scope === "category" && (
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Category *</span>
                    <select
                      value={editing.category_id ?? ""}
                      onChange={(e) => setEditing((p) => (p ? { ...p, category_id: e.target.value ? Number(e.target.value) : null } : p))}
                      className={inputClass}
                    >
                      <option value="">- Select -</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {editing.discount_scope === "country" && (
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Country *</span>
                    <select
                      value={editing.country_id ?? ""}
                      onChange={(e) => setEditing((p) => (p ? { ...p, country_id: e.target.value ? Number(e.target.value) : null } : p))}
                      className={inputClass}
                    >
                      <option value="">- Select -</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Promo code</span>
                  <input
                    value={editing.discount_code ?? ""}
                    onChange={(e) => setEditing((p) => (p ? { ...p, discount_code: e.target.value || null } : p))}
                    placeholder="Leave blank for auto discount"
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Type</span>
                  <select
                    value={editing.discount_type}
                    onChange={(e) => setEditing((p) => (p ? { ...p, discount_type: e.target.value as "percentage" | "fixed" } : p))}
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Value</span>
                  <input
                    type="number"
                    value={editing.discount_value}
                    onChange={(e) => setEditing((p) => (p ? { ...p, discount_value: Number(e.target.value) } : p))}
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Min. booking amount</span>
                  <input
                    type="number"
                    value={editing.minimum_booking_amount}
                    onChange={(e) => setEditing((p) => (p ? { ...p, minimum_booking_amount: Number(e.target.value) } : p))}
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Usage limit</span>
                  <input
                    type="number"
                    value={editing.usage_limit ?? ""}
                    onChange={(e) => setEditing((p) => (p ? { ...p, usage_limit: e.target.value ? Number(e.target.value) : null } : p))}
                    placeholder="Unlimited"
                    className={inputClass}
                  />
                </label>
                <DatePicker label="Start date" value={editing.start_date?.slice(0, 10) ?? ""} maxDate={editing.end_date?.slice(0, 10) || undefined} onChange={(date) => setEditing((previous) => previous ? { ...previous, start_date: date || null } : previous)} />
                <DatePicker label="End date" value={editing.end_date?.slice(0, 10) ?? ""} minDate={editing.start_date?.slice(0, 10) || undefined} onChange={(date) => setEditing((previous) => previous ? { ...previous, end_date: date || null } : previous)} />
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
                  <select value={editing.status} onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value } : p))} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save Discount"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ModuleWrapper>
  );
}
