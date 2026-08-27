"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X, LuUsers as Users, LuTag as Tag } from "react-icons/lu";
import { GroupDiscountTier, PricingSlab, getGroupDiscountTiers, createGroupDiscountTier, updateGroupDiscountTier, deleteGroupDiscountTier, getPricing } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const empty = (): GroupDiscountTier => ({
  min_pax: 2, max_pax: 4, discount_type: "percentage", discount_value: 5, status: "active",
});

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

  useEffect(() => { void load(); }, [load]);

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
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error("Failed.");
    }
  };

  if (loading) return <Loader label="Loading group discount tiers..." />;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Users size={18} />
          </span>
          <div>
            <h2 className="text-lg font-black text-dash-text">Group Discounts</h2>
            <p className="text-xs font-medium text-dash-subtle max-w-xl">
              The base price on the Pricing tab is for 1 person. Add a tier for each traveller-count range with a % or fixed discount — no separate price to type in per group size.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(empty())}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          <Plus size={15} /> Add Tier
        </button>
      </div>

      {/* ── Empty ── */}
      {items.length === 0 && !editing && (
        <div className="rounded-2xl border border-dashed border-dash-border bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Tag size={26} />
          </span>
          <p className="mt-3 text-sm font-bold text-dash-text">No group discount tiers yet</p>
          <p className="mt-1 text-xs text-dash-subtle">Larger group bookings will be charged at full price until you add one.</p>
          <button type="button" onClick={() => setEditing(empty())}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700">
            <Plus size={14} /> Add First Tier
          </button>
        </div>
      )}

      {/* ── Tier Table ── */}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-dash-border-soft bg-dash-bg/60 px-5 py-3">
            {["TRAVELLER RANGE", "DISCOUNT", "PRICE (ADULT)", "PRICE (CHILD)", "STATUS", "ACTIONS"].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-wider text-dash-subtle">{h}</span>
            ))}
          </div>

          {/* Table Rows */}
          {items.map((item, idx) => {
            const adultPrice = basePrice ? discountedPerPersonPrice(basePrice.adult_price, item) : null;
            const childPrice = basePrice ? discountedPerPersonPrice(basePrice.child_price, item) : null;
            return (
              <div
                key={item.id ?? idx}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-dash-border-soft/70 px-5 py-4 last:border-0 transition hover:bg-dash-bg/30"
              >
                {/* Range */}
                <span className="text-sm font-black text-dash-text">{item.min_pax}–{item.max_pax}</span>

                {/* Discount */}
                <span className="text-sm font-semibold text-dash-body">
                  {item.discount_value}{item.discount_type === "percentage" ? "%" : ""} off
                </span>

                {/* Adult Price */}
                <div>
                  {adultPrice != null ? (
                    <div className="flex flex-col items-start gap-0.5 leading-tight">
                      <span className="text-xs font-medium text-dash-subtle line-through decoration-red-400 decoration-2">{formatAmount(basePrice!.adult_price, basePrice!.currency)}</span>
                      <span className="text-sm font-bold text-emerald-700">{formatAmount(adultPrice, basePrice!.currency)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-dash-subtle italic">Set base price first</span>
                  )}
                </div>

                {/* Child Price */}
                <div>
                  {childPrice != null ? (
                    <div className="flex flex-col items-start gap-0.5 leading-tight">
                      <span className="text-xs font-medium text-dash-subtle line-through decoration-red-400 decoration-2">{formatAmount(basePrice!.child_price, basePrice!.currency)}</span>
                      <span className="text-sm font-bold text-emerald-700">{formatAmount(childPrice, basePrice!.currency)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-dash-subtle">—</span>
                  )}
                </div>

                {/* Status */}
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${item.status === "active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"}`}>
                  {item.status}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditing({ ...item })} aria-label="Edit tier"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition hover:border-sky-200 hover:bg-sky-50 hover:text-dash-brand-hover">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => remove(item.id!)} aria-label="Delete tier"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Form Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="w-full max-w-lg rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-black text-dash-text">
                <Users size={16} className="text-emerald-600" />
                {editing.id ? "Edit Group Discount Tier" : "New Group Discount Tier"}
              </h3>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="rounded-lg p-1 text-dash-subtle hover:text-dash-text">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-subtle">Min Travellers</span>
                <input type="number" min={1} value={numberInputValue(editing.min_pax)}
                  onChange={(e) => setEditing((p) => p ? { ...p, min_pax: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-subtle">Max Travellers</span>
                <input type="number" min={1} value={numberInputValue(editing.max_pax)}
                  onChange={(e) => setEditing((p) => p ? { ...p, max_pax: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-subtle">Discount Type</span>
                <select value={editing.discount_type}
                  onChange={(e) => setEditing((p) => p ? { ...p, discount_type: e.target.value as "percentage" | "fixed" } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-subtle">
                  Discount Value {editing.discount_type === "percentage" ? "(%)" : `(${basePrice?.currency ?? ""})`}
                </span>
                <input type="number" value={numberInputValue(editing.discount_value)}
                  onChange={(e) => setEditing((p) => p ? { ...p, discount_value: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-subtle">Status</span>
                <select value={editing.status}
                  onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            {/* Live preview */}
            {basePrice && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Price Preview (Adult)</p>
                  <p className="mt-1 text-lg font-black text-emerald-800">
                    {formatAmount(discountedPerPersonPrice(basePrice.adult_price, editing), basePrice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Price Preview (Child)</p>
                  <p className="mt-1 text-lg font-black text-emerald-800">
                    {formatAmount(discountedPerPersonPrice(basePrice.child_price, editing), basePrice.currency)}
                  </p>
                </div>
              </div>
            )}

            <p className="mt-4 rounded-xl border border-dash-border bg-dash-bg p-3 text-xs text-dash-subtle">
              <strong className="text-dash-body">Note:</strong> This discount applies to any booking in this traveller-count range, regardless of the pricing slab.
            </p>

            <div className="mt-5 flex justify-end gap-3 border-t border-dash-border pt-4">
              <button type="button" onClick={() => setEditing(null)}
                className="rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60">
                <Save size={14} /> {saving ? "Saving..." : "Save Tier"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
