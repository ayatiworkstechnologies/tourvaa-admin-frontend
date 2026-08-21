"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { GroupDiscountTier, PricingSlab, getGroupDiscountTiers, createGroupDiscountTier, updateGroupDiscountTier, deleteGroupDiscountTier, getPricing } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): GroupDiscountTier => ({
  min_pax: 2, max_pax: 4, discount_type: "percentage", discount_value: 5, status: "active",
});

// A tier's discount is defined against the base (1-person) price set on
// the Pricing tab - this computes what a traveller in that tier actually
// pays per person, so the price shown here always matches what the
// booking engine will charge (services.bookings._resolve_group_discount).
function discountedPerPersonPrice(basePrice: number, tier: GroupDiscountTier): number {
  const raw = tier.discount_type === "percentage"
    ? basePrice * (1 - tier.discount_value / 100)
    : basePrice - tier.discount_value;
  return Math.max(0, Math.round(raw * 100) / 100);
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function TourGroupDiscountTab({ tourId }: { tourId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<GroupDiscountTier[]>([]);
  const [basePrice, setBasePrice] = useState<PricingSlab | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GroupDiscountTier | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tiers, slabs] = await Promise.all([getGroupDiscountTiers(tourId), getPricing(tourId)]);
      setItems(tiers);
      const active = slabs.filter((s) => s.status === "active").sort((a, b) => a.passenger_from - b.passenger_from);
      setBasePrice(active[0] ?? null);
    } catch {
      toast.error("Failed to load group discount tiers.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        min_pax: sanitizeNumber(editing.min_pax, 1),
        max_pax: sanitizeNumber(editing.max_pax, 1),
        discount_value: sanitizeNumber(editing.discount_value),
      };
      if (editing.id) {
        const updated = await updateGroupDiscountTier(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createGroupDiscountTier(tourId, payload);
        setItems((prev) => [...prev, created]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this group discount tier?")) return;
    try {
      await deleteGroupDiscountTier(tourId, id);
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    } catch {
      toast.error("Failed.");
    }
  };

  if (loading) return <Loader label="Loading group discount tiers..." />;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dash-text">Group Discounts</h2>
            <p className="text-sm text-dash-subtle">
              This is how group pricing works: the base price on the Pricing tab is for 1 person. Add a tier below for each traveller-count range (e.g. 2-4, 5-10) with a percentage or fixed discount off that base price - no separate price to type in per group size.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(empty())}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
          >
            <Plus size={16} /> Add Tier
          </button>
        </div>

        {items.length === 0 && !editing && (
          <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No group discount tiers yet. Larger group bookings will be charged at full price until you add one.</div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border border-dash-border bg-white p-0">
            <DataTable
              ariaLabel="Group discount tiers"
              columns={[
                {
                  key: "pax_range",
                  header: "Traveller Range",
                  className: "font-semibold",
                  render: (item) => `${item.min_pax}–${item.max_pax}`,
                },
                {
                  key: "discount",
                  header: "Discount",
                  render: (item) => `${item.discount_value}${item.discount_type === "percentage" ? "%" : ""} off`,
                },
                {
                  key: "adult_price",
                  header: "Price (Adult)",
                  className: "font-bold text-green-700",
                  render: (item) => basePrice ? formatAmount(discountedPerPersonPrice(basePrice.adult_price, item), basePrice.currency) : "Set a base price first",
                },
                {
                  key: "child_price",
                  header: "Price (Child)",
                  className: "font-bold text-green-700",
                  render: (item) => basePrice ? formatAmount(discountedPerPersonPrice(basePrice.child_price, item), basePrice.currency) : "-",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (item) => (
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-dash-bg text-dash-subtle"}`}>{item.status}</span>
                  ),
                },
              ]}
              rows={items}
              actions={(item) => (
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setEditing({ ...item })} aria-label="Edit tier" title="Edit tier" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-sky-50 hover:text-dash-brand-hover"><Pencil size={15} /></button>
                  <button type="button" onClick={() => remove(item.id!)} aria-label="Delete tier" title="Delete tier" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{editing.id ? "Edit Tier" : "New Group Discount Tier"}</h3>
            <button type="button" aria-label="Close editor" title="Close editor" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Min travellers</span>
              <input type="number" min={1} value={numberInputValue(editing.min_pax)} onChange={(e) => setEditing((p) => p ? { ...p, min_pax: parseNumberInput(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Max travellers</span>
              <input type="number" min={1} value={numberInputValue(editing.max_pax)} onChange={(e) => setEditing((p) => p ? { ...p, max_pax: parseNumberInput(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Type</span>
              <select value={editing.discount_type} onChange={(e) => setEditing((p) => p ? { ...p, discount_type: e.target.value as "percentage" | "fixed" } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Value</span>
              <input type="number" value={numberInputValue(editing.discount_value)} onChange={(e) => setEditing((p) => p ? { ...p, discount_value: parseNumberInput(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <p className="mt-4 rounded-xl bg-dash-bg p-3 text-xs text-dash-subtle">
            <strong className="text-dash-body">Note:</strong> This discount is scoped to the whole tour. It is applied automatically to any booking whose traveller count falls in this range, regardless of which pricing slab covers that traveller count - you cannot set a different group discount per slab.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Tier"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
