"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { PricingSlab, getPricing, createPricing, updatePricing, deletePricing } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import CurrencySelect from "@/components/ui/CurrencySelect";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const MIN_ADMIN_MARKUP = 5;
const MAX_ADMIN_MARKUP = 15;

// Tourvaa pays the supplier their own adult_price/child_price in full - no
// commission is deducted from it. Tourvaa's entire commission is an
// admin-only retail markup (5-15%) added ON TOP of the supplier's price to
// produce the storefront/customer price (mirrors services.tours._apply_markup).
// Never shown to a supplier.
function storefrontPrice(price: number, markupPercent: number): number {
  return Math.max(0, Math.round(price * (1 + markupPercent / 100) * 100) / 100);
}

// Formats a raw slab amount in the slab's own currency, without running it
// through useCurrency's FX conversion -- these are the actual entered
// prices, not amounts to be displayed in the viewer's preferred currency.
function formatSlabAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const empty = (): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  supplier_price: 0, final_price: 0,
  admin_markup_value: MIN_ADMIN_MARKUP,
  currency: "USD", status: "active",
});

export default function TourPricingTab({ tourId, role = "admin" }: { tourId: string; role?: "admin" | "supplier" }) {
  const toast = useToast();
  const isSupplier = role === "supplier";
  const [items, setItems] = useState<PricingSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PricingSlab | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pricingItems = await getPricing(tourId);
      setItems(pricingItems);
    } catch {
      toast.error("Failed to load pricing.");
    }
    finally {
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
        passenger_from: sanitizeNumber(editing.passenger_from, 1),
        passenger_to: sanitizeNumber(editing.passenger_to, 1),
        adult_price: sanitizeNumber(editing.adult_price),
        child_price: sanitizeNumber(editing.child_price),
        admin_markup_value: Math.min(MAX_ADMIN_MARKUP, Math.max(MIN_ADMIN_MARKUP, sanitizeNumber(editing.admin_markup_value))),
      };
      if (editing.id) {
        const updated = await updatePricing(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createPricing(tourId, payload);
        setItems((prev) => [...prev, created]);
      }
      setEditing(null);
      toast.success("Saved.");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this pricing slab?")) return;
    try {
      await deletePricing(tourId, id);
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    }
    catch {
      toast.error("Failed.");
    }
  };

  const numField = (key: keyof PricingSlab, lbl: string) => (
    <label key={key}>
      <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">{lbl}</span>
      <input type="number" value={numberInputValue((editing as Record<string, unknown>)?.[key] as number)}
        onChange={(e) => setEditing((p) => p ? { ...p, [key]: parseNumberInput(e.target.value) } : p)}
        className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
    </label>
  );

  if (loading) return <Loader label="Loading pricing..." />;

  const editingMarkup = sanitizeNumber(editing?.admin_markup_value) || MIN_ADMIN_MARKUP;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dash-text">{isSupplier ? "Supplier Pricing" : "Tour Pricing"}</h2>
            <p className="text-sm text-dash-subtle">
              {isSupplier
                ? "Your price per pax-range slab. Tourvaa pays you this price in full - there is no commission deducted. Tourvaa adds its own retail markup separately before publishing your tour."
                : `Admin-only commission (${MIN_ADMIN_MARKUP}-${MAX_ADMIN_MARKUP}%) added on top of the supplier's price. This is the price shown at the storefront; the supplier is paid their own price in full.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(empty())}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white"
          >
            <Plus size={16} /> Add Slab
          </button>
        </div>

        {items.length === 0 && !editing && (
          <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No pricing slabs yet.</div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border border-dash-border bg-white p-0">
            <DataTable
              ariaLabel="Tour pricing slabs"
              columns={[
                {
                  key: "pax_range",
                  header: "Pax Range",
                  className: "font-semibold",
                  render: (item) => `${item.passenger_from}–${item.passenger_to}`,
                },
                { key: "adult_price", header: isSupplier ? "Adult Price" : "Supplier Price (Adult)", render: (item) => formatSlabAmount(item.adult_price, item.currency) },
                { key: "child_price", header: isSupplier ? "Child Price" : "Supplier Price (Child)", render: (item) => formatSlabAmount(item.child_price, item.currency) },
                ...(isSupplier
                  ? []
                  : [
                      {
                        key: "markup",
                        header: "Tourvaa Commission",
                        className: "text-dash-subtle",
                        render: (item: PricingSlab) => `${item.admin_markup_value}%`,
                      },
                      {
                        key: "storefront",
                        header: "Storefront Price",
                        className: "font-bold text-green-700",
                        render: (item: PricingSlab) => formatSlabAmount(item.storefront_adult_price ?? storefrontPrice(item.adult_price, item.admin_markup_value), item.currency),
                      },
                    ]),
                { key: "currency", header: "Currency" },
              ]}
              rows={items}
              actions={(item) => (
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setEditing({ ...item })} aria-label="Edit pricing slab" title="Edit pricing slab" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-sky-50 hover:text-dash-brand-hover"><Pencil size={15} /></button>
                  <button type="button" onClick={() => remove(item.id!)} aria-label="Delete pricing slab" title="Delete pricing slab" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              )}
            />
          </div>
        )}

        {editing && (
          <form onSubmit={save} className="rounded-xl border-2 border-dash-brand bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">{editing.id ? "Edit Slab" : "New Pricing Slab"}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close pricing slab form" title="Close pricing slab form"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {numField("passenger_from", "Pax from")}
              {numField("passenger_to", "Pax to")}
              {!isSupplier && (
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tourvaa Commission % ({MIN_ADMIN_MARKUP}-{MAX_ADMIN_MARKUP})</span>
                  <input type="number" min={MIN_ADMIN_MARKUP} max={MAX_ADMIN_MARKUP} value={numberInputValue(editing.admin_markup_value)}
                    onChange={(e) => setEditing((p) => p ? { ...p, admin_markup_value: parseNumberInput(e.target.value) } : p)}
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
                </label>
              )}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
                <CurrencySelect value={editing.currency} onChange={(code) => setEditing((p) => p ? { ...p, currency: code } : p)} />
              </label>
              {numField("adult_price", isSupplier ? "Adult price" : "Supplier price (adult)")}
              {!isSupplier && (
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Storefront price</span>
                  <input type="text" disabled
                    value={formatSlabAmount(storefrontPrice(editing.adult_price, editingMarkup), editing.currency)}
                    className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-subtle" />
                </label>
              )}
              {numField("child_price", isSupplier ? "Child price" : "Supplier price (child)")}
              {!isSupplier && (
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Storefront price</span>
                  <input type="text" disabled
                    value={formatSlabAmount(storefrontPrice(editing.child_price, editingMarkup), editing.currency)}
                    className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-subtle" />
                </label>
              )}
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
              {isSupplier ? (
                <><strong className="text-dash-body">Note:</strong> The prices entered above are what Tourvaa pays you in full - no commission is deducted. Tourvaa adds its own retail markup separately before publishing your tour.</>
              ) : (
                <><strong className="text-dash-body">Note:</strong> This commission is only visible in the Admin Portal and is added on top of the supplier&apos;s price to produce the storefront price shown to customers. The supplier is always paid their own price in full.</>
              )}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                <Save size={14} /> {saving ? "Saving..." : "Save Slab"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
