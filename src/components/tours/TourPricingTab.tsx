"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { PricingSlab, getPricing, createPricing, updatePricing, deletePricing } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import CurrencySelect from "@/components/ui/CurrencySelect";
import api from "@/lib/api/client";

// Revenue-share model: the price entered below IS the full customer-facing
// total (no separate markup layered on top). Tourvaa's cut is a single
// global commission rate (Admin Settings -> Tourvaa Commission %, applies to
// every supplier/tour) carved out of that total - this mirrors exactly what
// services.tours._apply_pricing_computation computes server-side; this
// preview just lets the price be checked before saving.
function supplierReceives(price: number, commissionPercent: number): number {
  return Math.max(0, Math.round(price * (1 - commissionPercent / 100) * 100) / 100);
}

// Formats a raw slab amount in the slab's own currency, without running it
// through useCurrency's FX conversion -- these are the actual entered
// prices, not amounts to be displayed in the viewer's preferred currency.
function formatSlabAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const empty = (): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  supplier_price: 0, markup_type: "percentage", markup_value: 0, final_price: 0,
  admin_markup_type: "percentage", admin_markup_value: 0,
  currency: "USD", status: "active",
});

export default function TourPricingTab({ tourId }: { tourId: string; role?: "admin" | "supplier" }) {
  const toast = useToast();
  const [items, setItems] = useState<PricingSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PricingSlab | null>(null);
  const [saving, setSaving] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState(10);

  useEffect(() => {
    api.get("/settings/public")
      .then((res) => {
        const value = Number(res.data?.data?.supplier_commission_percentage);
        if (Number.isFinite(value)) setCommissionPercent(value);
      })
      .catch(() => {});
  }, []);

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
      if (editing.id) {
        const updated = await updatePricing(tourId, editing.id, editing);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      } else {
        const created = await createPricing(tourId, editing);
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
      <input type="number" value={(editing as Record<string, unknown>)?.[key] as number ?? 0}
        onChange={(e) => setEditing((p) => p ? { ...p, [key]: Number(e.target.value) } : p)}
        className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
    </label>
  );

  if (loading) return <Loader label="Loading pricing..." />;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dash-text">Tour Pricing</h2>
            <p className="text-sm text-dash-subtle">Price per pax-range slab. This is the full price the customer pays - Tourvaa&apos;s commission ({commissionPercent}%, set once in Admin Settings) is deducted automatically when settling the supplier.</p>
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
                { key: "adult_price", header: "Adult Price (customer pays)", render: (item) => formatSlabAmount(item.adult_price, item.currency) },
                { key: "child_price", header: "Child Price (customer pays)", render: (item) => formatSlabAmount(item.child_price, item.currency) },
                {
                  key: "commission",
                  header: "Tourvaa Commission",
                  className: "text-dash-subtle",
                  render: () => `${commissionPercent}%`,
                },
                {
                  key: "supplier_receives",
                  header: "Supplier Receives",
                  className: "font-bold text-dash-brand",
                  render: (item) => formatSlabAmount(item.supplier_final_adult_price ?? supplierReceives(item.adult_price, commissionPercent), item.currency),
                },
                { key: "currency", header: "Currency" },
              ]}
              rows={items}
              actions={(item) => (
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditing({ ...item })} aria-label="Edit pricing slab" title="Edit pricing slab" className="rounded-lg border border-dash-border p-1.5 hover:bg-[#F2F4F7]"><Pencil size={13} /></button>
                  <button type="button" onClick={() => remove(item.id!)} aria-label="Delete pricing slab" title="Delete pricing slab" className="rounded-lg border border-[#FFCDD2] p-1.5 text-red-500"><Trash2 size={13} /></button>
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
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
                <CurrencySelect value={editing.currency} onChange={(code) => setEditing((p) => p ? { ...p, currency: code } : p)} />
              </label>
              {numField("adult_price", "Adult price (customer pays)")}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier receives</span>
                <input type="text" disabled value={formatSlabAmount(supplierReceives(editing.adult_price, commissionPercent), editing.currency)}
                  className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-subtle" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tourvaa commission ({commissionPercent}%)</span>
                <input type="text" disabled value={formatSlabAmount(editing.adult_price - supplierReceives(editing.adult_price, commissionPercent), editing.currency)}
                  className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-subtle" />
              </label>
              {numField("child_price", "Child price (customer pays)")}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier receives</span>
                <input type="text" disabled value={formatSlabAmount(supplierReceives(editing.child_price, commissionPercent), editing.currency)}
                  className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm text-dash-subtle" />
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
              <strong className="text-dash-body">Note:</strong> Adult/Child price above is the full price shown to customers at checkout. Tourvaa&apos;s commission ({commissionPercent}%) is applied automatically at settlement - no separate markup entry is needed.
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
