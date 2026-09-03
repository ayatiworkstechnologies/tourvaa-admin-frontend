"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuHistory as History, LuSave as Save, LuX as X } from "react-icons/lu";
import { TourDiscount, DiscountHistoryEntry, getDiscounts, createDiscount, amendDiscount, getDiscountHistory, getPricing } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DatePicker from "@/components/ui/DatePicker";
import api from "@/lib/api/client";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";
import { todayLocalDateStr } from "@/lib/utils/date";

function fmt(n: number, currency: string) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/** Preview of this discount's real effect on the tour's starting price -
 * same struck-through-original/discounted-below treatment used in the
 * pricing table (TourPricingTab.tsx), so a discount rule's actual impact is
 * visible right here instead of just its abstract "10% off" text. */
function discountedValue(item: TourDiscount, basePrice: number): number | null {
  if (basePrice <= 0) return null;
  const discounted = item.discount_type === "percentage"
    ? basePrice * (1 - item.discount_value / 100)
    : Math.max(0, basePrice - item.discount_value);
  return discounted < basePrice ? discounted : null;
}

function DiscountPricePreview({ item, basePrice, currency }: { item: TourDiscount; basePrice: number; currency: string }) {
  const discounted = discountedValue(item, basePrice);
  if (discounted == null) return null;

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-dash-bg px-3 py-2">
      <span className="text-xs font-medium text-dash-subtle line-through decoration-red-400 decoration-2">{fmt(basePrice, currency)}</span>
      <span className="text-sm font-black text-emerald-700">{fmt(discounted, currency)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">after discount</span>
    </div>
  );
}

/** Admin sees the 1-pax supplier price (for reference) alongside the
 * discount applied to the 1-pax publishable/storefront price -- the
 * markup-inclusive price customers actually pay after the discount. */
function AdminDiscountPricePreview({ item, supplierBasePrice, storefrontBasePrice, currency }: { item: TourDiscount; supplierBasePrice: number; storefrontBasePrice: number; currency: string }) {
  const discounted = discountedValue(item, storefrontBasePrice);
  if (discounted == null && supplierBasePrice <= 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 rounded-lg bg-dash-bg px-3 py-2">
      {supplierBasePrice > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Supplier price</p>
          <span className="text-sm font-bold text-dash-text">{fmt(supplierBasePrice, currency)}</span>
        </div>
      )}
      {discounted != null && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Discount price</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-dash-subtle line-through decoration-red-400 decoration-2">{fmt(storefrontBasePrice, currency)}</span>
            <span className="text-sm font-black text-emerald-700">{fmt(discounted, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const empty = (): TourDiscount => ({
  discount_name: "", discount_code: null, discount_type: "percentage",
  discount_value: 10, discount_scope: "tour", start_date: null, end_date: null,
  usage_limit: null, minimum_booking_amount: 0, status: "active",
});

export default function TourDiscountsTab({ tourId, role = "admin" }: { tourId: string; role?: "admin" | "supplier" }) {
  const isSupplier = role === "supplier";
  const toast = useToast();
  const [items, setItems] = useState<TourDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourDiscount | null>(null);
  const [saving, setSaving] = useState(false);
  // 1-pax tier prices the discount preview is computed from: the supplier's
  // own net price, and the markup-inclusive storefront/publishable price.
  const [supplierBasePrice, setSupplierBasePrice] = useState(0);
  const [storefrontBasePrice, setStorefrontBasePrice] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [amending, setAmending] = useState<TourDiscount | null>(null);
  const [amendValue, setAmendValue] = useState("");
  const [amendEndDate, setAmendEndDate] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [historyFor, setHistoryFor] = useState<TourDiscount | null>(null);
  const [history, setHistory] = useState<DiscountHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const discounts = await getDiscounts(tourId);
      setItems(discounts);
    } catch {
      toast.error("Failed to load discounts.");
    }
    finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let fallbackStorefront = 0;
    api.get(`/tours/${tourId}`).then((res) => {
      const tour = res.data?.data;
      if (tour?.price_start_per_person != null) fallbackStorefront = Number(tour.price_start_per_person);
      if (tour?.currency) setCurrency(String(tour.currency));
      setStorefrontBasePrice((prev) => prev || fallbackStorefront);
    }).catch(() => {
      // Non-fatal -- the discount list itself is the primary content of this tab.
    });

    getPricing(tourId).then((rows) => {
      // The 1-pax tier -- the slab whose range covers a single traveller --
      // is the price basis the discount preview should match, same as the
      // per-pax-range pricing table above this card (TourPricingTab.tsx).
      const sorted = [...rows].sort((a, b) => a.passenger_from - b.passenger_from);
      const onePaxSlab = sorted.find((s) => s.passenger_from <= 1 && s.passenger_to >= 1) ?? sorted[0];
      if (!onePaxSlab) return;
      setSupplierBasePrice(Number(onePaxSlab.adult_price ?? 0));
      const storefront = onePaxSlab.storefront_adult_price;
      if (storefront != null) setStorefrontBasePrice(Number(storefront));
      if (onePaxSlab.currency) setCurrency(onePaxSlab.currency);
    }).catch(() => {
      // Non-fatal -- falls back to the tour's price_start_per_person above.
    });
  }, [tourId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { ...editing, discount_value: sanitizeNumber(editing.discount_value), minimum_booking_amount: sanitizeNumber(editing.minimum_booking_amount) };
      const created = await createDiscount(tourId, payload);
      setItems((prev) => [...prev, created]);
      setEditing(null);
      toast.success("Discount created.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openAmend = (item: TourDiscount) => {
    setAmending(item);
    setAmendValue(String(item.discount_value));
    setAmendEndDate(item.end_date?.slice(0, 10) ?? "");
    setAmendReason("");
  };

  const submitAmend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amending?.id) return;
    const newValue = Number(amendValue);
    const valueChanged = amending.discount_value !== newValue;
    const newEndDate = amendEndDate ? `${amendEndDate}T23:59:59` : null;
    const endDateChanged = newEndDate && newEndDate !== amending.end_date;
    if (!valueChanged && !endDateChanged) {
      toast.error("Change the percentage/value and/or extend the end date first.");
      return;
    }
    setSaving(true);
    try {
      const updated = await amendDiscount(tourId, amending.id, {
        new_discount_value: valueChanged ? newValue : null,
        new_end_date: endDateChanged ? newEndDate : null,
        reason: amendReason.trim() || null,
      });
      setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setAmending(null);
      toast.success("Discount amended -- a new history version was recorded.");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (item: TourDiscount) => {
    setHistoryFor(item);
    setHistoryLoading(true);
    try {
      setHistory(await getDiscountHistory(tourId, item.id!));
    } catch {
      toast.error("Failed to load discount history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <Loader label="Loading discounts..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Discounts &amp; Promo Codes</h2>
        <button type="button" onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white">
          <Plus size={16} /> Add Discount
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No discounts yet.</div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-dash-border bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-dash-text">{item.discount_name}</p>
                {item.discount_code && (
                  <span className="mt-1 inline-block rounded-full bg-[#EEF8FF] px-2.5 py-0.5 text-xs font-bold text-dash-brand">{item.discount_code}</span>
                )}
                <p className="mt-1.5 text-sm text-dash-body">
                  {item.discount_value}{item.discount_type === "percentage" ? "%" : ""} off
                  {item.minimum_booking_amount > 0 ? ` - min. ${item.minimum_booking_amount}` : ""}
                </p>
                {isSupplier ? (
                  <DiscountPricePreview item={item} basePrice={supplierBasePrice} currency={currency} />
                ) : (
                  <AdminDiscountPricePreview item={item} supplierBasePrice={supplierBasePrice} storefrontBasePrice={storefrontBasePrice} currency={currency} />
                )}
                {(item.start_date || item.end_date) && (
                  <p className="text-xs text-dash-subtle">
                    {item.start_date?.slice(0, 10)} → {item.end_date?.slice(0, 10)}
                  </p>
                )}
                <p className="mt-1 text-xs text-dash-subtle">Used: {item.used_count ?? 0}{item.usage_limit ? ` / ${item.usage_limit}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openHistory(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-3 py-2 text-xs font-bold text-dash-body hover:bg-[#F2F4F7]"><History size={14} /> History</button>
                <button type="button" onClick={() => openAmend(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-dash-brand px-3 py-2 text-xs font-bold text-white hover:bg-dash-brand-hover">Extend / Change %</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-dash-text">Discount History</h2>
        <p className="mt-1 text-xs text-dash-subtle">Every discount ever applied to this tour by the supplier -- view only.</p>
        {items.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-dash-border p-8 text-center text-sm text-dash-subtle">No discount history yet.</div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-dash-border-soft">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-dash-border-soft bg-dash-bg/60">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-dash-subtle">Discount name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-dash-subtle">Amount / percentage</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-dash-subtle">Dates applied</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-dash-subtle">Used</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-dash-subtle">Discount added</th>
                </tr>
              </thead>
              <tbody>
                {[...items]
                  .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
                  .map((item) => (
                    <tr key={item.id} className="border-b border-dash-border-soft/60 last:border-0">
                      <td className="px-4 py-3 font-semibold text-dash-text">
                        {item.discount_name}
                        {item.discount_code && <span className="ml-2 rounded-full bg-[#EEF8FF] px-2 py-0.5 text-[10px] font-bold text-dash-brand">{item.discount_code}</span>}
                      </td>
                      <td className="px-4 py-3 text-dash-body">{item.discount_value}{item.discount_type === "percentage" ? "%" : ` ${currency}`}</td>
                      <td className="px-4 py-3 text-dash-body">
                        {item.start_date || item.end_date ? `${item.start_date?.slice(0, 10) ?? "—"} → ${item.end_date?.slice(0, 10) ?? "—"}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-dash-body">{item.used_count ?? 0}{item.usage_limit ? ` / ${item.usage_limit}` : ""}</td>
                      <td className="px-4 py-3 text-dash-body">{item.created_at ? item.created_at.slice(0, 10) : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">New Discount</h3>
            <button type="button" aria-label="Close editor" title="Close editor" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Discount name *</span>
              <input value={editing.discount_name} onChange={(e) => setEditing((p) => p ? { ...p, discount_name: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Promo code</span>
              <input value={editing.discount_code ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, discount_code: e.target.value || null } : p)}
                placeholder="Leave blank for auto discount"
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
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Min. booking amount</span>
              <input type="number" value={numberInputValue(editing.minimum_booking_amount)} onChange={(e) => setEditing((p) => p ? { ...p, minimum_booking_amount: parseNumberInput(e.target.value) } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Usage limit</span>
              <input type="number" value={editing.usage_limit ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, usage_limit: e.target.value ? Number(e.target.value) : null } : p)}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <DatePicker label="Start date" value={editing.start_date?.slice(0, 10) ?? ""} minDate={todayLocalDateStr()} maxDate={editing.end_date?.slice(0, 10) || undefined} onChange={(date) => setEditing((previous) => previous ? { ...previous, start_date: date || null } : previous)} />
            <DatePicker label="End date" value={editing.end_date?.slice(0, 10) ?? ""} minDate={editing.start_date?.slice(0, 10) || undefined} onChange={(date) => setEditing((previous) => previous ? { ...previous, end_date: date || null } : previous)} />
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Discount"}
            </button>
          </div>
        </form>
      )}

      {amending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <form onSubmit={submitAmend} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dash-text">Extend validity / change percentage</h3>
              <button type="button" aria-label="Close" onClick={() => setAmending(null)}><X size={18} /></button>
            </div>
            <p className="mt-1 text-xs text-dash-subtle">{amending.discount_name} -- editing is disabled; this creates a new history version instead.</p>
            <div className="mt-4 grid gap-4">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{amending.discount_type === "percentage" ? "New percentage (%)" : "New amount"}</span>
                <input type="number" value={amendValue} onChange={(e) => setAmendValue(e.target.value)} className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
              </label>
              <DatePicker label="New end date (must be later)" value={amendEndDate} minDate={amending.end_date?.slice(0, 10) || undefined} onChange={setAmendEndDate} />
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Reason (optional)</span>
                <input value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="e.g. Peak-season extension" className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setAmending(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                <Save size={14} /> {saving ? "Saving..." : "Save Amendment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-dash-text"><History size={16} /> Discount history -- {historyFor.discount_name}</h3>
              <button type="button" aria-label="Close" onClick={() => setHistoryFor(null)}><X size={18} /></button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {historyLoading ? (
                <Loader label="Loading history..." />
              ) : history.length === 0 ? (
                <p className="text-sm text-dash-subtle">No history yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((v) => (
                    <div key={v.id} className="rounded-xl border border-dash-border p-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-dash-bg px-2.5 py-1 text-xs font-black text-dash-body">v{v.version_number} -- {v.change_type.replace(/_/g, " ")}</span>
                        <span className="text-xs text-dash-subtle">{v.created_at?.slice(0, 10)}{v.changed_by_name ? ` by ${v.changed_by_name}` : ""}</span>
                      </div>
                      <p className="mt-2 text-sm text-dash-body">
                        {v.discount_value}{v.discount_type === "percentage" ? "%" : ""} off
                        {v.end_date ? ` -- valid until ${v.end_date.slice(0, 10)}` : ""}
                      </p>
                      {v.reason && <p className="mt-1 text-xs text-dash-subtle">&quot;{v.reason}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
