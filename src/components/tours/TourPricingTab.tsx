"use client";

import { useCallback, useEffect, useState } from "react";
import { LuBadgeDollarSign as BadgeDollarSign, LuInfo as Info, LuPencil as Pencil, LuPercent as Percent, LuPlus as Plus, LuSave as Save, LuSparkles as Sparkles, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";
import { PricingSlab, getPricing, createPricing, updatePricing, deletePricing } from "@/lib/api/services/tourDetailService";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import DataTable from "@/components/ui/DataTable";
import CurrencySelect from "@/components/ui/CurrencySelect";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const STATUSES = ["active", "inactive"];

const emptySlab = (defaults: { currency: string; commission: number }): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  commission_percentage: defaults.commission,
  currency: defaults.currency, status: "active",
});

function fmt(n: number | null | undefined, currency: string) {
  const value = n ?? 0;
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/** Strikes through the original price and shows the discounted price below
 * it when the tour has an active discount - same discount_percentage the
 * public storefront applies (Tour.active_discount, see services/cms.py
 * _active_discount), reused here so every price a supplier/admin sees
 * matches what the customer actually pays. */
function PriceCell({
  value,
  currency,
  discountPercent,
  valueClassName,
}: {
  value: number | null | undefined;
  currency: string;
  discountPercent: number | null;
  valueClassName: string;
}) {
  if (!discountPercent) {
    return <span className={valueClassName}>{fmt(value, currency)}</span>;
  }
  const original = value ?? 0;
  const discounted = original * (1 - discountPercent / 100);
  return (
    <div className="flex flex-col items-start gap-0.5 leading-tight">
      <span className="text-xs font-medium text-dash-subtle line-through decoration-red-400 decoration-2">{fmt(original, currency)}</span>
      <span className={valueClassName}>{fmt(discounted, currency)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Price after discount</span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  iconTone,
  title,
  description,
  action,
  children,
}: {
  icon: React.ElementType;
  iconTone: "brand" | "emerald";
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dash-border-soft px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-[#EDF5FF] text-dash-brand-hover"}`}>
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-lg font-black text-dash-text">{title}</h2>
            <p className="text-xs font-medium text-dash-subtle">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={onEdit} aria-label="Edit" title="Edit" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:border-dash-brand/40 hover:bg-sky-50 hover:text-dash-brand-hover">
        <Pencil size={15} />
      </button>
      <button type="button" onClick={onDelete} aria-label="Delete" title="Delete" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function TourPricingTab({
  tourId,
  role = "admin",
  tourStatus,
}: {
  tourId: string;
  role?: "admin" | "supplier";
  /** Live tour status, passed down from the wizard's already-loaded tour
   * record -- used only to show the repricing notice inline; the actual
   * behavior is entirely backend-driven (services.tours._apply_pricing_computation). */
  tourStatus?: string;
}) {
  const toast = useToast();
  const isSupplier = role === "supplier";
  const isLiveTour = ["active", "published"].includes((tourStatus ?? "").toLowerCase());
  const accent = isSupplier
    ? { solidBtn: "bg-[#16833A] hover:bg-[#117331] shadow-emerald-100", ring: "border-[#16833A]", chip: "bg-emerald-50 text-emerald-700" }
    : { solidBtn: "bg-dash-brand hover:bg-dash-brand-hover shadow-blue-100", ring: "border-dash-brand", chip: "bg-[#EDF5FF] text-dash-brand-hover" };

  const [slabs, setSlabs] = useState<PricingSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PricingSlab | null>(null);
  const [markupEditing, setMarkupEditing] = useState<PricingSlab | null>(null);

  // Read-only -- the supplier's agreed commission floor (this slab-level
  // rate can be raised, never lowered below it) is set on the supplier's
  // profile, or the platform minimum if they have no rate of their own.
  // See services.bookings.resolve_effective_commission_percentage, the
  // same resolution order applied server-side per slab.
  const [commissionFloor, setCommissionFloor] = useState<number | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  // Same active_discount the public storefront computes (see
  // services/cms.py _active_discount) - reused here so the strikethrough
  // price shown to admin/supplier matches what the customer actually pays.
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  const loadCommissionFloor = useCallback(async () => {
    try {
      const tourRes = await api.get(`/tours/${tourId}`);
      const activeDiscount = tourRes.data?.data?.active_discount;
      setDiscountPercent(activeDiscount?.discount_percentage ?? null);

      if (isSupplier) {
        const res = await api.get("/suppliers/me");
        const own = res.data?.data?.commission_percentage;
        if (own != null) { setCommissionFloor(Number(own)); return; }
      } else {
        const supplierId = tourRes.data?.data?.supplier_id;
        if (tourRes.data?.data?.currency) setDefaultCurrency(String(tourRes.data.data.currency));
        if (supplierId) {
          const supplierRes = await api.get(`/suppliers/${supplierId}`);
          const own = supplierRes.data?.data?.commission_percentage;
          if (own != null) { setCommissionFloor(Number(own)); return; }
        }
      }
      const settingsRes = await api.get("/settings/public");
      const min = settingsRes.data?.data?.supplier_commission_percentage;
      if (min !== undefined) setCommissionFloor(Number(min));
    } catch {
      // Non-fatal -- the price form itself is the primary content of this tab.
    }
  }, [tourId, isSupplier]);

  useEffect(() => { void loadCommissionFloor(); }, [loadCommissionFloor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getPricing(tourId);
      setSlabs(rows.sort((a, b) => a.passenger_from - b.passenger_from));
    } catch {
      toast.error("Failed to load pricing.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => { void load(); }, [load]);

  // Falls back to 0 only for math/validation before the real floor has
  // resolved -- the table badge (below) shows a loading placeholder
  // instead of a misleading "0" in that brief window.
  const resolvedFloor = commissionFloor ?? 0;

  const openNewSlab = () => setEditing(emptySlab({ currency: defaultCurrency, commission: resolvedFloor }));

  const saveSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.commission_percentage != null && editing.commission_percentage < resolvedFloor) {
      toast.error(`Commission % cannot be lower than your agreed rate of ${resolvedFloor}%.`);
      return;
    }
    setSaving(true);
    try {
      const payload: PricingSlab = {
        ...editing,
        passenger_from: sanitizeNumber(editing.passenger_from, 1),
        passenger_to: sanitizeNumber(editing.passenger_to, 1),
        adult_price: sanitizeNumber(editing.adult_price),
        child_price: sanitizeNumber(editing.child_price),
        commission_percentage: editing.commission_percentage == null ? null : sanitizeNumber(editing.commission_percentage, resolvedFloor),
      };
      if (editing.id) {
        const updated = await updatePricing(tourId, editing.id, payload);
        setSlabs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await createPricing(tourId, payload);
        setSlabs((prev) => [...prev, created].sort((a, b) => a.passenger_from - b.passenger_from));
      }
      setEditing(null);
      toast.success("Pricing slab saved.");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      toast.error(message?.detail || message?.message || "Failed to save pricing slab.");
    } finally {
      setSaving(false);
    }
  };

  const removeSlab = async (id: number) => {
    if (!confirm("Delete this pricing slab?")) return;
    try {
      await deletePricing(tourId, id);
      setSlabs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const saveMarkup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markupEditing?.id) return;
    setSaving(true);
    try {
      const updated = await updatePricing(tourId, markupEditing.id, markupEditing);
      setSlabs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setMarkupEditing(null);
      toast.success("Publishable price updated.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const goToDiscounts = () => document.getElementById("tour-discounts-section")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) return <Loader label="Loading pricing..." />;

  const rangeBadge = (r: PricingSlab) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${accent.chip}`}>{r.passenger_from}–{r.passenger_to} pax</span>
  );

  const supplierColumns = [
    { key: "range", header: "Pax Range", render: rangeBadge },
    { key: "adult", header: "Adult Price (Tourvaa)", render: (r: PricingSlab) => <PriceCell value={r.adult_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-semibold text-dash-text" /> },
    { key: "adult_net", header: "Supplier Receives (You)", render: (r: PricingSlab) => <PriceCell value={r.supplier_final_adult_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-bold text-emerald-700" /> },
    { key: "child", header: "Child Price (Tourvaa)", render: (r: PricingSlab) => <PriceCell value={r.child_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-semibold text-dash-text" /> },
    { key: "child_net", header: "Supplier Receives (You)", render: (r: PricingSlab) => <PriceCell value={r.supplier_final_child_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-bold text-emerald-700" /> },
    { key: "commission", header: "Tourvaa Commission", render: (r: PricingSlab) => <span className="inline-flex items-center gap-1 rounded-full border border-dash-border px-2 py-0.5 text-xs font-bold text-dash-body"><Percent size={10} />{r.commission_percentage ?? commissionFloor ?? "…"}</span> },
    { key: "currency", header: "Currency", render: (r: PricingSlab) => <span className="text-dash-subtle">{r.currency}</span> },
  ];

  const addButton = (
    <button type="button" onClick={openNewSlab}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 ${accent.solidBtn}`}>
      <Plus size={15} /> {isSupplier ? "New Pricing Slab" : "Add Slab"}
    </button>
  );

  return (
    <div className="space-y-6">
      <SectionCard
        icon={BadgeDollarSign}
        iconTone={isSupplier ? "emerald" : "brand"}
        title={isSupplier ? "Supplier Pricing" : "Supplier Price to Tourvaa"}
        description={isSupplier
          ? "Your price per pax-range slab. Your agreed commission is applied automatically."
          : "The supplier's own price and agreed commission, per pax-range slab."}
        action={addButton}
      >
        {isSupplier && isLiveTour && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>Saving takes this price live immediately. Admin will also be notified to review the change.</span>
          </div>
        )}

        {discountPercent != null && discountPercent > 0 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            <Percent size={16} className="mt-0.5 shrink-0" />
            <span>An active discount of {discountPercent}% is applied for its duration. Original prices are struck through; the discounted price is shown below each.</span>
          </div>
        )}

        <DataTable
          ariaLabel="Supplier pricing"
          columns={supplierColumns}
          rows={slabs}
          actions={(r) => <ActionButtons onEdit={() => setEditing({ ...r })} onDelete={() => removeSlab(r.id!)} />}
          emptyTitle="No pricing slabs yet"
          emptyDescription="Add a pricing slab so this tour becomes bookable."
          emptyAction={
            <button type="button" onClick={openNewSlab} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md ${accent.solidBtn}`}>
              <Plus size={15} /> {isSupplier ? "New Pricing Slab" : "Add Slab"}
            </button>
          }
        />

        {isSupplier && (
          <label className="mt-4 flex items-center gap-2.5 rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-sm font-semibold text-dash-body">
            <input type="checkbox" onChange={(e) => e.target.checked && goToDiscounts()} className="h-4 w-4 accent-[#16833A]" />
            Do you wish to add a discount?
          </label>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-dash-border bg-dash-bg p-3 text-xs text-dash-subtle">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-dash-subtle" />
          <span><strong className="text-dash-body">Note:</strong> The prices entered above are your net supplier prices. Tourvaa will apply a retail markup before publishing your tour to cover agent commissions, transaction fees, marketing, and operating costs.</span>
        </p>
      </SectionCard>

      {!isSupplier && (
        <SectionCard
          icon={Percent}
          iconTone="brand"
          title="Publishable Price"
          description="Admin-only markup added on top of the supplier's price to produce the storefront price. Suppliers never see this section."
        >
          <DataTable
            ariaLabel="Publishable price"
            columns={[
              { key: "range", header: "Pax Range", render: rangeBadge },
              { key: "adult", header: "Supplier Price (Adult)", render: (r: PricingSlab) => <PriceCell value={r.adult_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-semibold text-dash-text" /> },
              { key: "child", header: "Supplier Price (Child)", render: (r: PricingSlab) => <PriceCell value={r.child_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-semibold text-dash-text" /> },
              { key: "markup", header: "Tourvaa Commission", render: (r: PricingSlab) => <span className="inline-flex items-center gap-1 rounded-full border border-dash-border px-2 py-0.5 text-xs font-bold text-dash-body"><Percent size={10} />{r.admin_markup_value ?? 0}</span> },
              { key: "storefront", header: "Storefront Price", render: (r: PricingSlab) => <PriceCell value={r.storefront_adult_price} currency={r.currency} discountPercent={discountPercent} valueClassName="font-black text-emerald-700" /> },
              { key: "currency", header: "Currency", render: (r: PricingSlab) => <span className="text-dash-subtle">{r.currency}</span> },
            ]}
            rows={slabs}
            actions={(r) => <ActionButtons onEdit={() => setMarkupEditing({ ...r })} onDelete={() => removeSlab(r.id!)} />}
            emptyTitle="No pricing slabs yet"
            emptyDescription="Add a pricing slab in Supplier Price to Tourvaa above first."
          />
        </SectionCard>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-8" role="dialog" aria-modal="true">
          <form onSubmit={saveSlab} className={`w-full max-w-2xl rounded-2xl border-2 bg-white p-6 shadow-2xl ${accent.ring}`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-dash-text">
                <BadgeDollarSign size={18} className={isSupplier ? "text-emerald-700" : "text-dash-brand-hover"} />
                {editing.id ? "Edit Pricing Slab" : "New Pricing Slab"}
              </h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-dash-subtle hover:text-dash-text"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Pax From</span>
                <input type="number" min={1} value={numberInputValue(editing.passenger_from)} onChange={(e) => setEditing((p) => p ? { ...p, passenger_from: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Pax To</span>
                <input type="number" min={1} value={numberInputValue(editing.passenger_to)} onChange={(e) => setEditing((p) => p ? { ...p, passenger_to: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Commission %</span>
                <input type="number" min={resolvedFloor} step="0.01" value={numberInputValue(editing.commission_percentage)} onChange={(e) => setEditing((p) => p ? { ...p, commission_percentage: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
                <span className="mt-1 block text-[11px] text-dash-subtle">Agreed rate ({resolvedFloor}%) applies automatically -- raise it, never lower it.</span>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Adult Price (your price to Tourvaa)</span>
                <input type="number" value={numberInputValue(editing.adult_price)} onChange={(e) => setEditing((p) => p ? { ...p, adult_price: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Child Price (your price to Tourvaa)</span>
                <input type="number" value={numberInputValue(editing.child_price)} onChange={(e) => setEditing((p) => p ? { ...p, child_price: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
                <CurrencySelect value={editing.currency} onChange={(code) => setEditing((p) => p ? { ...p, currency: code } : p)} />
              </label>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-dash-bg p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Supplier receives (adult)</p>
                <p className="mt-1 text-xl font-black text-emerald-700">
                  {fmt(sanitizeNumber(editing.adult_price) * (1 - (editing.commission_percentage ?? resolvedFloor) / 100), editing.currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Supplier receives (child)</p>
                <p className="mt-1 text-xl font-black text-emerald-700">
                  {fmt(sanitizeNumber(editing.child_price) * (1 - (editing.commission_percentage ?? resolvedFloor) / 100), editing.currency)}
                </p>
              </div>
            </div>

            <label className="mt-4 block max-w-xs">
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
              <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-3 border-t border-dash-border pt-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg">Cancel</button>
              <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${accent.solidBtn}`}>
                <Save size={14} /> {saving ? "Saving..." : "Save Slab"}
              </button>
            </div>
          </form>
        </div>
      )}

      {markupEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <form onSubmit={saveMarkup} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-dash-text"><Percent size={16} className="text-dash-brand-hover" /> Edit Slab</h3>
              <button type="button" onClick={() => setMarkupEditing(null)} aria-label="Close" className="text-dash-subtle hover:text-dash-text"><X size={18} /></button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Pax From</span>
                <p className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-body">{markupEditing.passenger_from}</p>
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Pax To</span>
                <p className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-body">{markupEditing.passenger_to}</p>
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier Price (Adult)</span>
                <p className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-body">{fmt(markupEditing.adult_price, markupEditing.currency)}</p>
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Supplier Price (Child)</span>
                <p className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-body">{fmt(markupEditing.child_price, markupEditing.currency)}</p>
              </div>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Tourvaa Commission %</span>
                <input type="number" step="0.01" value={numberInputValue(markupEditing.admin_markup_value)} onChange={(e) => setMarkupEditing((p) => p ? { ...p, admin_markup_value: parseNumberInput(e.target.value) } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10" />
              </label>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Storefront Price (Adult)</span>
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700">
                  {fmt(sanitizeNumber(markupEditing.adult_price) * (1 + sanitizeNumber(markupEditing.admin_markup_value) / 100), markupEditing.currency)}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-dash-border bg-dash-bg p-3 text-xs text-dash-subtle">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>No minimum or maximum for this Commission %. Only visible in the Admin Portal, added on top of the supplier&apos;s price to produce the storefront price shown to customers.</span>
            </p>
            <button type="submit" disabled={saving} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-dash-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Slab"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
