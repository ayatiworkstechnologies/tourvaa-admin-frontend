"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPlus as Plus, LuPencil as Pencil, LuTrash2 as Trash2, LuSave as Save, LuX as X } from "react-icons/lu";
import { PricingSlab, getPricing, createPricing, updatePricing, deletePricing } from "@/lib/api/services/tourDetailService";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import CurrencySelect from "@/components/ui/CurrencySelect";

const empty = (): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  supplier_price: 0, markup_type: "percentage", markup_value: 0, final_price: 0,
  admin_markup_type: "percentage", admin_markup_value: 0,
  currency: "USD", status: "active",
});

export default function TourPricingTab({ tourId, role = "supplier" }: { tourId: string; role?: "admin" | "supplier" }) {
  const toast = useToast();
  const [items, setItems] = useState<PricingSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PricingSlab | null>(null);
  const [saving, setSaving] = useState(false);
  const [adminEditingId, setAdminEditingId] = useState<number | null>(null);
  const [adminMarkup, setAdminMarkup] = useState({ admin_markup_type: "percentage", admin_markup_value: 0 });
  const [adminSaving, setAdminSaving] = useState(false);

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
    } catch {
      toast.error("Failed to save.");
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

  const startAdminEdit = (item: PricingSlab) => {
    setAdminEditingId(item.id ?? null);
    setAdminMarkup({ admin_markup_type: item.admin_markup_type, admin_markup_value: item.admin_markup_value });
  };

  const saveAdminMarkup = async (item: PricingSlab) => {
    if (!item.id) return;
    setAdminSaving(true);
    try {
      const updated = await updatePricing(tourId, item.id, { ...item, ...adminMarkup });
      setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setAdminEditingId(null);
      toast.success("Tourvaa markup saved.");
    } catch {
      toast.error("Failed to save Tourvaa markup.");
    } finally {
      setAdminSaving(false);
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
            <h2 className="text-xl font-bold text-dash-text">Supplier Pricing</h2>
            <p className="text-sm text-dash-subtle">Your price per pax-range slab. Commission is fixed by admin and included automatically.</p>
          </div>
          <button type="button" onClick={() => setEditing({ ...empty() })}
            className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Add Slab
          </button>
        </div>

        {items.length === 0 && !editing && (
          <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No pricing slabs yet.</div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border border-dash-border bg-white p-0">
            <DataTable
              ariaLabel="Supplier pricing slabs"
              columns={[
                {
                  key: "pax_range",
                  header: "Pax Range",
                  className: "font-semibold",
                  render: (item) => `${item.passenger_from}–${item.passenger_to}`,
                },
                { key: "adult_price", header: "Adult Price" },
                { key: "child_price", header: "Child Price" },
                {
                  key: "markup",
                  header: "Commission",
                  render: (item) => `${item.markup_value}${item.markup_type === "percentage" ? "%" : " fixed"}`,
                },
                {
                  key: "final_price",
                  header: "Your Price (with commission)",
                  className: "font-bold text-dash-brand",
                  render: (item) => item.supplier_final_adult_price ?? item.final_price,
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
              {numField("adult_price", "Adult price")}
              {numField("child_price", "Child price")}
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
                <CurrencySelect value={editing.currency} onChange={(code) => setEditing((p) => p ? { ...p, currency: code } : p)} />
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
            <p className="mt-3 text-xs text-dash-subtle">
              Commission ({editing.markup_value}{editing.markup_type === "percentage" ? "%" : " fixed"}) is fixed by admin and applied automatically — it is not editable here.
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

      {role === "admin" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-dash-text">Tourvaa Pricing</h2>
            <p className="text-sm text-dash-subtle">Admin-only markup added on top of the supplier price, to cover fees and maintenance. This is the price shown at the storefront.</p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-dash-border p-10 text-center text-sm text-dash-subtle">No pricing slabs yet.</div>
          ) : (
            <div className="rounded-xl border border-dash-border bg-white p-0">
              <DataTable
                ariaLabel="Tourvaa pricing markup"
                columns={[
                  {
                    key: "pax_range",
                    header: "Pax Range",
                    className: "font-semibold",
                    render: (item) => `${item.passenger_from}–${item.passenger_to}`,
                  },
                  {
                    key: "supplier_final",
                    header: "Supplier Price",
                    render: (item) => item.supplier_final_adult_price ?? item.final_price,
                  },
                  {
                    key: "admin_markup",
                    header: "Tourvaa Markup",
                    render: (item) =>
                      adminEditingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={adminMarkup.admin_markup_type}
                            onChange={(e) => setAdminMarkup((m) => ({ ...m, admin_markup_type: e.target.value }))}
                            className="rounded-lg border border-dash-border px-2 py-1 text-xs outline-none focus:border-dash-brand"
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">Fixed</option>
                          </select>
                          <input
                            type="number"
                            value={adminMarkup.admin_markup_value}
                            onChange={(e) => setAdminMarkup((m) => ({ ...m, admin_markup_value: Number(e.target.value) }))}
                            className="w-20 rounded-lg border border-dash-border px-2 py-1 text-xs outline-none focus:border-dash-brand"
                          />
                        </div>
                      ) : (
                        `${item.admin_markup_value}${item.admin_markup_type === "percentage" ? "%" : " fixed"}`
                      ),
                  },
                  {
                    key: "storefront_price",
                    header: "Storefront Price",
                    className: "font-bold text-emerald-700",
                    render: (item) => item.storefront_adult_price ?? item.adult_price,
                  },
                  { key: "currency", header: "Currency" },
                ]}
                rows={items}
                actions={(item) =>
                  adminEditingId === item.id ? (
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => saveAdminMarkup(item)} disabled={adminSaving} className="rounded-lg bg-dash-brand px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                        {adminSaving ? "Saving..." : "Save"}
                      </button>
                      <button type="button" onClick={() => setAdminEditingId(null)} className="rounded-lg border border-dash-border p-1.5 hover:bg-[#F2F4F7]"><X size={13} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => startAdminEdit(item)} aria-label="Edit Tourvaa markup" title="Edit Tourvaa markup" className="rounded-lg border border-dash-border p-1.5 hover:bg-[#F2F4F7]"><Pencil size={13} /></button>
                    </div>
                  )
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
