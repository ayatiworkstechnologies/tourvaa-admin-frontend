"use client";

import { ErrorSummary, FormField, fieldClass, focusField } from "@/components/tours/FormKit";
import { validatePricingSlab, type FieldErrors } from "@/lib/tours/tourValidation";
import { useCallback, useEffect, useState } from "react";
import { LuBadgeDollarSign as BadgeDollarSign, LuInfo as Info, LuPencil as Pencil, LuPercent as Percent, LuPlus as Plus, LuSave as Save, LuSparkles as Sparkles, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";
import { PricingSlab, getPricing, createPricing, updatePricing, deletePricing } from "@/lib/api/services/tourDetailService";
import api from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import CurrencySelect from "@/components/ui/CurrencySelect";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const STATUSES = ["active", "inactive"];

const emptySlab = (defaults: { currency: string; commission: number; markup: number }): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  commission_percentage: defaults.commission,
  admin_markup_value: defaults.markup,
  currency: defaults.currency, status: "active",
});

/** Storefront (customer) price = supplier price + Tourvaa markup -- same
 * formula as the backend (app.utils.money.apply_markup), used for live
 * previews in the slab editor before saving. */
function withMarkup(price: number | null | undefined, markupPercent: number | null | undefined) {
  return Math.round(Number(price ?? 0) * (1 + Number(markupPercent ?? 0) / 100) * 100) / 100;
}

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
  const { confirm, dialog } = useConfirm();
  const isSupplier = role === "supplier";
  const isLiveTour = ["active", "published"].includes((tourStatus ?? "").toLowerCase());
  const accent = isSupplier
    ? { solidBtn: "bg-[#16833A] hover:bg-[#117331] shadow-emerald-100", ring: "border-[#16833A]", chip: "bg-emerald-50 text-emerald-700" }
    : { solidBtn: "bg-dash-brand hover:bg-dash-brand-hover shadow-blue-100", ring: "border-dash-brand", chip: "bg-[#EDF5FF] text-dash-brand-hover" };

  const [slabs, setSlabs] = useState<PricingSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PricingSlab | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const clearError = (field: string) => setErrors((prev) => { if (!prev[field]) return prev; const next = { ...prev }; delete next[field]; return next; });

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
      // Pricing is always entered in the tour's own currency (see the
      // per-slab currency field on TourItinerary/tours.currency) -- suppliers
      // never chose this from the CurrencySelect below, it just fell through
      // to the initial "USD" state because this branch never set it.
      if (tourRes.data?.data?.currency) setDefaultCurrency(String(tourRes.data.data.currency));

      if (isSupplier) {
        const res = await api.get("/suppliers/me");
        const own = res.data?.data?.commission_percentage;
        if (own != null) { setCommissionFloor(Number(own)); return; }
      } else {
        const supplierId = tourRes.data?.data?.supplier_id;
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

  // Admin-only: the platform default markup (default_admin_markup_percentage)
  // pre-filled on a new slab. Suppliers never see or send a markup.
  const [defaultMarkup, setDefaultMarkup] = useState(0);
  useEffect(() => {
    if (isSupplier) return;
    api.get("/settings/").then((res) => {
      const items: Array<{ key: string; value: string | null }> = res.data?.data ?? [];
      const value = Number(items.find((s) => s.key === "default_admin_markup_percentage")?.value ?? 0);
      if (Number.isFinite(value)) setDefaultMarkup(value);
    }).catch(() => {
      // Non-fatal -- a new slab just starts at 0% markup.
    });
  }, [isSupplier]);

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

  const openNewSlab = () => setEditing(emptySlab({ currency: defaultCurrency, commission: resolvedFloor, markup: isSupplier ? 0 : defaultMarkup }));

  const saveSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const pFrom = sanitizeNumber(editing.passenger_from, 1);
    const pTo = sanitizeNumber(editing.passenger_to, 1);
    const adultPrice = sanitizeNumber(editing.adult_price);
    const childPrice = sanitizeNumber(editing.child_price);
    const found = validatePricingSlab(editing);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusField(Object.keys(found)[0]);
      return;
    }
    if (!isSupplier && editing.commission_percentage != null && editing.commission_percentage < resolvedFloor) {
      toast.error(`Commission % cannot be lower than the agreed rate of ${resolvedFloor}%.`);
      return;
    }
    setSaving(true);
    try {
      const payload: PricingSlab = {
        ...editing,
        passenger_from: pFrom,
        passenger_to: pTo,
        adult_price: adultPrice,
        child_price: childPrice,
        // Suppliers never choose the commission; the backend also ignores it
        // from a supplier (services.tours._apply_pricing_computation).
        commission_percentage: isSupplier || editing.commission_percentage == null ? null : sanitizeNumber(editing.commission_percentage, resolvedFloor),
        // Admin-only; never sent by a supplier (the backend ignores it from
        // suppliers anyway and keeps the admin-set markup).
        admin_markup_value: isSupplier ? undefined : sanitizeNumber(editing.admin_markup_value ?? 0),
      };
      if (editing.id) {
        const updated = await updatePricing(tourId, editing.id, payload);
        setSlabs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await createPricing(tourId, payload);
        setSlabs((prev) => [...prev, created].sort((a, b) => a.passenger_from - b.passenger_from));
      }
      setEditing(null);
      setErrors({});
      toast.success("Pricing slab saved.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const removeSlab = async (id: number) => {
    if (!(await confirm({ title: "Delete pricing slab", message: "Delete this pricing slab?", confirmLabel: "Delete", danger: true }))) return;
    try {
      await deletePricing(tourId, id);
      setSlabs((prev) => prev.filter((s) => s.id !== id));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const goToDiscounts = () => document.getElementById("tour-discounts-section")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) return <Loader label="Loading pricing..." />;

  const supplierGridClass = "grid-cols-[1fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_auto]";
  const publishableGridClass = "grid-cols-[1fr_1.2fr_1.2fr_0.8fr_1.2fr_1.2fr_0.6fr]";

  const addButton = (
    <button type="button" onClick={openNewSlab}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 ${accent.solidBtn}`}>
      <Plus size={15} /> {isSupplier ? "New Pricing Slab" : "Add Slab"}
    </button>
  );

  // Admin-only Publishable Price: supplier price + Tourvaa markup =
  // storefront price customers pay (services.tours._apply_pricing_computation).
  // Suppliers never see this section -- the API strips markup and
  // storefront fields for supplier users.
  const publishableSection = !isSupplier && slabs.length > 0 && (
        <SectionCard
          icon={Percent}
          iconTone="brand"
          title="Publishable Price"
          description="Admin-only markup added on top of the supplier's price to produce the storefront price. Suppliers never see this section. Edit a slab to change its markup."
        >
          <div className="overflow-x-auto rounded-2xl border border-dash-border-soft">
            <div className={`grid ${publishableGridClass} min-w-[900px] gap-3 border-b border-dash-border-soft bg-dash-bg/60 px-5 py-3`}>
              {["PAX RANGE", "SUPPLIER PRICE (ADULT)", "SUPPLIER PRICE (CHILD)", "TOURVAA MARKUP", "STOREFRONT PRICE (ADULT)", "STOREFRONT PRICE (CHILD)", "CURRENCY"].map((h) => (
                <span key={h} className="text-[10px] font-black uppercase tracking-wider text-dash-subtle">{h}</span>
              ))}
            </div>
            {slabs.map((r, idx) => (
              <div key={r.id ?? idx} className={`grid ${publishableGridClass} min-w-[900px] items-center gap-3 border-b border-dash-border-soft/60 px-5 py-4 last:border-0`}>
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-black ${accent.chip}`}>
                  {r.passenger_from}–{r.passenger_to} pax
                </span>
                <PriceCell value={Number(r.adult_price)} currency={r.currency} discountPercent={discountPercent} valueClassName="font-semibold text-dash-text text-sm" />
                <PriceCell value={Number(r.child_price)} currency={r.currency} discountPercent={discountPercent} valueClassName="font-semibold text-dash-text text-sm" />
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-dash-border px-2 py-0.5 text-xs font-bold text-dash-body">
                  <Percent size={10} />{Number(r.admin_markup_value ?? 0)}
                </span>
                <PriceCell value={Number(r.storefront_adult_price ?? withMarkup(r.adult_price, r.admin_markup_value))} currency={r.currency} discountPercent={discountPercent} valueClassName="font-black text-emerald-700 text-sm" />
                <PriceCell value={Number(r.storefront_child_price ?? withMarkup(r.child_price, r.admin_markup_value))} currency={r.currency} discountPercent={discountPercent} valueClassName="font-black text-emerald-700 text-sm" />
                <span className="text-xs font-semibold text-dash-subtle">{r.currency}</span>
              </div>
            ))}
          </div>
        </SectionCard>
  );

  return (
    <div className="space-y-6">
      <SectionCard
        icon={BadgeDollarSign}
        iconTone={isSupplier ? "emerald" : "brand"}
        title={isSupplier ? "Supplier Pricing" : "Supplier Price to Tourvaa"}
        description={isSupplier
          ? "Your 1-pax price and the supplier get price (after your agreed commission is applied), per pax-range slab."
          : "The supplier's 1-pax price, the supplier get price after commission, and the agreed commission, per pax-range slab."}
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
            <span>
              An automatic discount of {discountPercent}% is live on the storefront for its duration.
              {isSupplier ? " See the Discounts section below for its effect on your price." : " Its effect is shown in the Publishable Price table below."}
            </span>
          </div>
        )}

        {/* Supplier Pricing Table */}
        {slabs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dash-border bg-dash-bg/30 p-12 text-center">
            <p className="text-sm font-bold text-dash-text">No pricing slabs yet</p>
            <p className="mt-1 text-xs text-dash-subtle">Add a pricing slab so this tour becomes bookable.</p>
            <button type="button" onClick={openNewSlab}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md ${accent.solidBtn}`}>
              <Plus size={15} /> {isSupplier ? "New Pricing Slab" : "Add Slab"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-dash-border-soft">
            {/* Table header */}
            <div className={`grid ${supplierGridClass} min-w-[980px] gap-3 border-b border-dash-border-soft bg-dash-bg/60 px-5 py-3`}>
              {["PAX RANGE", "SUPPLIER PRICE (ADULT)", "SUPPLIER GET PRICE (ADULT)", "SUPPLIER PRICE (CHILD)", "SUPPLIER GET PRICE (CHILD)", "COMMISSION", "ACTIONS"].map((h) => (
                <span key={h} className="text-[10px] font-black uppercase tracking-wider text-dash-subtle">{h}</span>
              ))}
            </div>

            {/* Rows */}
            {slabs.map((r, idx) => (
              <div key={r.id ?? idx}
                className={`grid ${supplierGridClass} min-w-[980px] items-center gap-3 border-b border-dash-border-soft/60 px-5 py-4 last:border-0 transition hover:bg-dash-bg/30`}
              >
                {/* Pax range badge */}
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-black ${accent.chip}`}>
                  {r.passenger_from}–{r.passenger_to} pax
                </span>

                {/* Adult price (1-pax price to Tourvaa) */}
                <PriceCell value={r.adult_price} currency={r.currency} discountPercent={null} valueClassName="font-semibold text-dash-text text-sm" />

                {/* Supplier discounted price -- adult_price after commission is deducted.
                    Never re-apply the storefront promo % here: that coupon (TourDiscount)
                    is a separate mechanism from what actually drives supplier payouts
                    (TourGroupDiscountTier, see services.bookings._resolve_group_discount),
                    so stacking it on top of the commission-net figure would show a number
                    the backend never actually pays out. */}
                <PriceCell value={r.supplier_final_adult_price} currency={r.currency} discountPercent={null} valueClassName="font-bold text-emerald-700 text-sm" />

                {/* Child price (1-pax price to Tourvaa) */}
                <PriceCell value={r.child_price} currency={r.currency} discountPercent={null} valueClassName="font-semibold text-dash-text text-sm" />

                {/* Supplier discounted price -- child_price after commission is deducted (see note above) */}
                <PriceCell value={r.supplier_final_child_price} currency={r.currency} discountPercent={null} valueClassName="font-bold text-emerald-700 text-sm" />

                {/* Commission badge */}
                <span className="inline-flex items-center gap-1 rounded-full border border-dash-border px-2 py-0.5 text-xs font-bold text-dash-body">
                  <Percent size={10} />{r.commission_percentage ?? commissionFloor ?? "…"}
                </span>

                {/* Actions */}
                <ActionButtons onEdit={() => setEditing({ ...r })} onDelete={() => removeSlab(r.id!)} />
              </div>
            ))}
          </div>
        )}

        {isSupplier && (
          <label className="mt-4 flex items-center gap-2.5 rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-sm font-semibold text-dash-body">
            <input type="checkbox" onChange={(e) => e.target.checked && goToDiscounts()} className="h-4 w-4 accent-[#16833A]" />
            Do you wish to add a discount?
          </label>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-dash-border bg-dash-bg p-3 text-xs text-dash-subtle">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-dash-subtle" />
          <span>
            <strong className="text-dash-body">Note:</strong>{" "}
            {isSupplier
              ? "The prices entered above are your net supplier prices. Tourvaa commission is deducted from them to calculate what you receive."
              : "Tourvaa commission is deducted from the supplier price to calculate the supplier get price. The storefront price (below) adds Tourvaa's markup on top."}
          </span>
        </p>
      </SectionCard>

      {publishableSection}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/35 px-4 py-8" role="dialog" aria-modal="true">
          <form onSubmit={saveSlab} noValidate className={`w-full max-w-2xl rounded-2xl border-2 bg-white p-6 shadow-2xl ${accent.ring}`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-dash-text">
                <BadgeDollarSign size={18} className={isSupplier ? "text-emerald-700" : "text-dash-brand-hover"} />
                {editing.id ? "Edit Pricing Slab" : "New Pricing Slab"}
              </h3>
              <button type="button" onClick={() => { setEditing(null); setErrors({}); }} aria-label="Close" className="text-dash-subtle hover:text-dash-text"><X size={18} /></button>
            </div>
            <ErrorSummary errors={errors} />
            <div className="grid gap-4 md:grid-cols-3">
              <FormField name="passenger_from" label="Travellers from" required error={errors.passenger_from} hint="Smallest group this price applies to.">
                <input id="passenger_from" name="passenger_from" type="number" min={1} value={numberInputValue(editing.passenger_from)}
                  onChange={(e) => { setEditing((p) => p ? { ...p, passenger_from: parseNumberInput(e.target.value) } : p); clearError("passenger_from"); }}
                  className={fieldClass(errors.passenger_from)} placeholder="1" />
              </FormField>
              <FormField name="passenger_to" label="Travellers to" required error={errors.passenger_to} hint="Largest group this price applies to.">
                <input id="passenger_to" name="passenger_to" type="number" min={1} value={numberInputValue(editing.passenger_to)}
                  onChange={(e) => { setEditing((p) => p ? { ...p, passenger_to: parseNumberInput(e.target.value) } : p); clearError("passenger_to"); }}
                  className={fieldClass(errors.passenger_to)} placeholder="4" />
              </FormField>
              {isSupplier ? (
                <div>
                  <span className="mb-1 block text-xs font-bold uppercase text-slate-600">Tourvaa Commission</span>
                  <p className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                    {editing.commission_percentage ?? resolvedFloor}%
                  </p>
                  <span className="mt-1 block text-[11px] text-slate-400">Read-only -- set by Tourvaa. Contact admin to discuss your rate.</span>
                </div>
              ) : (
                <FormField name="commission_percentage" label="Tourvaa Commission %" error={errors.commission_percentage} hint={`Minimum ${resolvedFloor}% (supplier or platform rate).`}>
                  <input id="commission_percentage" name="commission_percentage" type="number" min={resolvedFloor} max={100} step="0.01" value={numberInputValue(editing.commission_percentage ?? resolvedFloor)}
                    onChange={(e) => { setEditing((p) => p ? { ...p, commission_percentage: parseNumberInput(e.target.value) } : p); clearError("commission_percentage"); }}
                    className={fieldClass(errors.commission_percentage)} />
                </FormField>
              )}

              <FormField name="adult_price" label={`Supplier price - adult (${editing.currency})`} required error={errors.adult_price} hint="Tourvaa commission is deducted from this amount for settlement.">
                <input id="adult_price" name="adult_price" type="number" min={0} step="0.01" value={numberInputValue(editing.adult_price)}
                  onChange={(e) => { setEditing((p) => p ? { ...p, adult_price: parseNumberInput(e.target.value) } : p); clearError("adult_price"); }}
                  className={fieldClass(errors.adult_price)} placeholder="0.00" />
              </FormField>
              <FormField name="child_price" label={`Supplier price - child (${editing.currency})`} error={errors.child_price} hint="Leave 0 if children are free.">
                <input id="child_price" name="child_price" type="number" min={0} step="0.01" value={numberInputValue(editing.child_price)}
                  onChange={(e) => { setEditing((p) => p ? { ...p, child_price: parseNumberInput(e.target.value) } : p); clearError("child_price"); }}
                  className={fieldClass(errors.child_price)} placeholder="0.00" />
              </FormField>
              {!isSupplier && (
                <FormField name="admin_markup_value" label="Tourvaa markup %" required error={errors.admin_markup_value} hint="Admin-only. Added on top of the supplier price. Enter 0 for no markup. Suppliers never see it.">
                  <input id="admin_markup_value" name="admin_markup_value" type="number" min={0} max={100} step="0.01" value={numberInputValue(editing.admin_markup_value ?? 0)}
                    onChange={(e) => { setEditing((p) => p ? { ...p, admin_markup_value: parseNumberInput(e.target.value) } : p); clearError("admin_markup_value"); }}
                    className={fieldClass(errors.admin_markup_value)} />
                </FormField>
              )}
              {isSupplier ? (
                <div>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
                  <p className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-body">
                    {editing.currency}
                  </p>
                  <span className="mt-1 block text-[11px] text-dash-subtle">Read-only -- set from your profile currency. Contact admin to change it.</span>
                </div>
              ) : (
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
                  <CurrencySelect value={editing.currency} onChange={(code) => setEditing((p) => p ? { ...p, currency: code } : p)} />
                </label>
              )}
            </div>

            <div className={`mt-4 grid gap-3 rounded-xl bg-dash-bg p-4 ${isSupplier ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Supplier get price (adult)</p>
                <p className="mt-1 text-xl font-black text-emerald-700">
                  {fmt(sanitizeNumber(editing.adult_price) * (1 - (editing.commission_percentage ?? resolvedFloor) / 100), editing.currency)}
                </p>
              </div>
              {!isSupplier && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Storefront price (adult)</p>
                  <p className="mt-1 text-xl font-black text-blue-700">
                    {fmt(withMarkup(sanitizeNumber(editing.adult_price), editing.admin_markup_value), editing.currency)}
                  </p>
                </div>
              )}
              {!isSupplier && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Storefront price (child)</p>
                  <p className="mt-1 text-xl font-black text-blue-700">
                    {fmt(withMarkup(sanitizeNumber(editing.child_price), editing.admin_markup_value), editing.currency)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Supplier get price (child)</p>
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

      {dialog}
    </div>
  );
}
