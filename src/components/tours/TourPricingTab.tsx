"use client";

import { ErrorSummary, FormField, fieldClass, focusField } from "@/components/tours/FormKit";
import { validatePricingSlab, type FieldErrors } from "@/lib/tours/tourValidation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuBadgeDollarSign as BadgeDollarSign, LuInfo as Info, LuPencil as Pencil, LuPercent as Percent, LuPlus as Plus, LuSave as Save, LuSparkles as Sparkles, LuTrash2 as Trash2, LuX as X } from "react-icons/lu";
import { PricingSlab, TourDiscount, getPricing, getDiscounts, createPricing, updatePricing, deletePricing } from "@/lib/api/services/tourDetailService";
import api from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import CurrencySelect from "@/components/ui/CurrencySelect";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

const STATUSES = ["active", "inactive"];

const emptySlab = (defaults: { currency: string; commission: number }): PricingSlab => ({
  passenger_from: 1, passenger_to: 4, adult_price: 0, child_price: 0,
  commission_percentage: defaults.commission,
  // New slabs follow the platform default markup (Settings) until an admin
  // sets a slab-specific one.
  admin_markup_value: null,
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
  const [supplierDiscountPercent, setSupplierDiscountPercent] = useState<number | null>(null);
  const [tourvaaDiscountPercent, setTourvaaDiscountPercent] = useState<number | null>(null);

  const loadDiscountPreview = useCallback(async (startingPrice = 0) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const discounts = await getDiscounts(tourId);
      const active = discounts
        .filter((item) => {
          if (item.status !== "active") return false;
          if (item.start_date && new Date(item.start_date) > now) return false;
          if (item.end_date && new Date(item.end_date) < today) return false;
          if (item.usage_limit != null && Number(item.used_count ?? 0) >= Number(item.usage_limit)) return false;
          return true;
        });
      const percent = (item: TourDiscount) => Math.min(90, item.discount_type === "percentage"
        ? Number(item.discount_value)
        : startingPrice > 0 ? (Number(item.discount_value) / startingPrice) * 100 : 0);
      const supplier = active.filter((item) => item.added_by === "supplier" || (!item.added_by && item.funded_by !== "TOURVAA")).map(percent).filter((v) => Number.isFinite(v) && v > 0);
      const tourvaa = active.filter((item) => item.added_by === "admin" || (!item.added_by && item.funded_by === "TOURVAA")).map(percent).filter((v) => Number.isFinite(v) && v > 0);
      setSupplierDiscountPercent(supplier.length ? Math.max(...supplier) : null);
      setTourvaaDiscountPercent(tourvaa.length ? Math.max(...tourvaa) : null);
    } catch {
      // Non-fatal: pricing remains usable if discount preview loading fails.
    }
  }, [tourId]);

  const loadCommissionFloor = useCallback(async () => {
    try {
      const tourRes = await api.get(`/tours/${tourId}`);
      const activeDiscount = tourRes.data?.data?.active_discount;
      setSupplierDiscountPercent(activeDiscount?.supplier_discount_percentage ?? null);
      setTourvaaDiscountPercent(activeDiscount?.tourvaa_discount_percentage ?? null);
      void loadDiscountPreview(Number(tourRes.data?.data?.price_start_per_person ?? 0));
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
  }, [tourId, isSupplier, loadDiscountPreview]);

  useEffect(() => { void loadCommissionFloor(); }, [loadCommissionFloor]);

  useEffect(() => {
    const refreshDiscountPreview = (event: Event) => {
      const detail = (event as CustomEvent<{ tourId?: string }>).detail;
      if (!detail?.tourId || detail.tourId === tourId) void loadCommissionFloor();
    };
    window.addEventListener("tourvaa:discounts-changed", refreshDiscountPreview);
    return () => window.removeEventListener("tourvaa:discounts-changed", refreshDiscountPreview);
  }, [tourId, loadCommissionFloor]);

  // Admin-only markup (never loaded for suppliers). Order: slab > tour >
  // platform default (services/markup.py). tourMarkup null = the tour uses
  // the default.
  const [defaultMarkup, setDefaultMarkup] = useState(0);
  const [tourMarkup, setTourMarkup] = useState<number | null>(null);
  const [tourMarkupDraft, setTourMarkupDraft] = useState<{ useDefault: boolean; value: string }>({ useDefault: true, value: "" });
  const [tourMarkupSaving, setTourMarkupSaving] = useState(false);
  const applyTourMarkupResponse = useCallback((data: { admin_markup_percentage: number | string | null; default_markup_percentage: number | string }) => {
    const tour = data.admin_markup_percentage == null ? null : Number(data.admin_markup_percentage);
    setDefaultMarkup(Number(data.default_markup_percentage ?? 0));
    setTourMarkup(tour);
    setTourMarkupDraft({ useDefault: tour == null, value: tour == null ? "" : String(tour) });
  }, []);
  useEffect(() => {
    if (isSupplier) return;
    api.get(`/tours/${tourId}/markup`).then((res) => {
      if (res.data?.data) applyTourMarkupResponse(res.data.data);
    }).catch(() => {
      // Non-fatal -- previews fall back to 0% until the markup loads.
    });
  }, [isSupplier, tourId, applyTourMarkupResponse]);

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
  // What a slab without its own markup inherits: the tour's, else the default.
  const inheritedMarkup = tourMarkup ?? defaultMarkup;
  const inheritedLabel = tourMarkup != null ? `tour markup (${tourMarkup}%)` : `default (${defaultMarkup}%)`;
  // The markup actually applied to a slab.
  const effectiveMarkup = (slab: PricingSlab) => (slab.admin_markup_value ?? inheritedMarkup);
  const afterSupplierDiscount = (price: number | null | undefined) => Number(price ?? 0) * (1 - Number(supplierDiscountPercent ?? 0) / 100);

  const saveTourMarkup = async () => {
    const value = tourMarkupDraft.useDefault ? null : Number(tourMarkupDraft.value);
    if (value != null && (!Number.isFinite(value) || value < 0 || value > 100 || tourMarkupDraft.value.trim() === "")) {
      toast.error("Tour markup must be between 0% and 100%.");
      return;
    }
    setTourMarkupSaving(true);
    try {
      const res = await api.put(`/tours/${tourId}/markup`, { admin_markup_percentage: value });
      applyTourMarkupResponse(res.data.data);
      await load(); // storefront prices were re-priced server-side
      toast.success(value == null ? "Tour now uses the default markup." : `Tour markup set to ${value}%.`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setTourMarkupSaving(false);
    }
  };

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
        // null = follow the Settings default markup.
        admin_markup_value: isSupplier ? undefined : editing.admin_markup_value == null ? null : sanitizeNumber(editing.admin_markup_value),
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
      description="Supplier discount is applied first, then TourVaa markup, then any TourVaa storefront discount. This section never changes the Supplier Price to Tourvaa table."
    >
      {/* Tour-level markup */}
      <div className="mb-4 rounded-xl border border-dash-border bg-dash-bg px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-dash-text">Markup for this tour</span>
          <label className="flex items-center gap-2 text-xs font-semibold text-dash-body">
            <input type="radio" name="tour-markup-mode" checked={tourMarkupDraft.useDefault}
              onChange={() => setTourMarkupDraft((d) => ({ ...d, useDefault: true }))} className="h-4 w-4" />
            Use default ({defaultMarkup}%)
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-dash-body">
            <input type="radio" name="tour-markup-mode" checked={!tourMarkupDraft.useDefault}
              onChange={() => setTourMarkupDraft((d) => ({ useDefault: false, value: d.value || String(tourMarkup ?? defaultMarkup) }))} className="h-4 w-4" />
            Custom for this tour
          </label>
          {!tourMarkupDraft.useDefault && (
            <span className="relative">
              <input type="number" min={0} max={100} step="0.01" value={tourMarkupDraft.value} aria-label="Tour markup percentage"
                onChange={(e) => setTourMarkupDraft((d) => ({ ...d, value: e.target.value }))}
                className="w-28 rounded-lg border border-dash-border bg-white px-3 py-1.5 pr-7 text-sm outline-none focus:border-dash-brand" />
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-bold text-dash-muted">%</span>
            </span>
          )}
          <button type="button" onClick={() => void saveTourMarkup()} disabled={tourMarkupSaving}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-black text-white disabled:opacity-60 ${accent.solidBtn}`}>
            <Save size={13} /> {tourMarkupSaving ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-dash-subtle">
          Now applying: <strong className="text-dash-body">{tourMarkup != null ? `${tourMarkup}% (this tour)` : `${defaultMarkup}% (default)`}</strong> to every slab without its own markup.
          {" "}Default is set in <Link href="/admin/settings#pricing" className="font-bold text-dash-brand hover:underline">Settings</Link>; use a row&apos;s edit button for a slab-only markup.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-dash-border-soft shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-dash-border-soft bg-dash-bg/75 text-[11px] font-black uppercase tracking-wider text-dash-subtle">
              <th rowSpan={2} className="px-4 py-3 align-middle">Pax Range</th>
              <th colSpan={2} className="border-x border-dash-border-soft px-4 py-2 text-center">
                Supplier Cost (To TourVaa)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-center align-middle">Markup</th>
              <th colSpan={2} className="border-x border-dash-border-soft px-4 py-2 text-center text-emerald-800">
                Customer Price (Storefront)
              </th>
              <th rowSpan={2} className="px-4 py-3 text-right align-middle">Actions</th>
            </tr>
            <tr className="border-b border-dash-border-soft bg-dash-bg/40 text-[10px] font-bold uppercase tracking-wider">
              <th className="border-l border-dash-border-soft px-4 py-1.5 text-blue-600">Adult</th>
              <th className="border-r border-dash-border-soft px-4 py-1.5 text-violet-600">Child</th>
              <th className="border-l border-dash-border-soft px-4 py-1.5 text-emerald-700">Adult</th>
              <th className="border-r border-dash-border-soft px-4 py-1.5 text-emerald-600">Child</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-border-soft/70 bg-white">
            {slabs.map((r, idx) => {
              const adultOrig = Number(r.adult_price ?? 0);
              const childOrig = Number(r.child_price ?? 0);
              const adultToTourvaa = afterSupplierDiscount(adultOrig);
              const childToTourvaa = afterSupplierDiscount(childOrig);
              const mkp = effectiveMarkup(r);
              const adultStorefront = withMarkup(adultToTourvaa, mkp);
              const childStorefront = withMarkup(childToTourvaa, mkp);
              const tvDisc = Number(tourvaaDiscountPercent ?? 0) / 100;
              const adultFinal = adultStorefront * (1 - tvDisc);
              const childFinal = childStorefront * (1 - tvDisc);
              return (
                <tr key={r.id ?? idx} className="transition-colors hover:bg-dash-bg/40">
                  <td className="px-4 py-3.5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${accent.chip}`}>
                      {r.passenger_from}–{r.passenger_to} pax
                    </span>
                  </td>
                  {/* Adult Cost to TourVaa */}
                  <td className="border-l border-dash-border-soft/60 px-4 py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-dash-text">
                        {fmt(adultToTourvaa, r.currency)}
                      </span>
                      {supplierDiscountPercent ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-dash-subtle">
                          <span className="line-through">{fmt(adultOrig, r.currency)}</span>
                          <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700">-{supplierDiscountPercent}%</span>
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {/* Child Cost to TourVaa */}
                  <td className="border-r border-dash-border-soft/60 px-4 py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-dash-muted">
                        {fmt(childToTourvaa, r.currency)}
                      </span>
                      {supplierDiscountPercent ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-dash-subtle">
                          <span className="line-through">{fmt(childOrig, r.currency)}</span>
                          <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700">-{supplierDiscountPercent}%</span>
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {/* Markup */}
                  <td className="px-4 py-3.5 text-center align-middle">
                    <div className="inline-flex flex-col items-center">
                      <span className="inline-flex items-center gap-1 rounded-full border border-dash-border bg-dash-bg px-2.5 py-0.5 text-xs font-bold text-dash-body">
                        <Percent size={10} />{Number(mkp)}%
                      </span>
                      <span className={`mt-0.5 text-[10px] font-semibold ${r.admin_markup_value != null ? "text-amber-600" : tourMarkup != null ? "text-dash-brand" : "text-dash-subtle"}`}>
                        {r.admin_markup_value != null ? "This slab" : tourMarkup != null ? "Tour" : "Default"}
                      </span>
                    </div>
                  </td>
                  {/* Adult Final Customer Price */}
                  <td className="border-l border-dash-border-soft/60 px-4 py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-emerald-700">
                        {fmt(adultFinal, r.currency)}
                      </span>
                      {tourvaaDiscountPercent ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-dash-subtle">
                          <span className="line-through">{fmt(adultStorefront, r.currency)}</span>
                          <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700">-{tourvaaDiscountPercent}%</span>
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {/* Child Final Customer Price */}
                  <td className="border-r border-dash-border-soft/60 px-4 py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-emerald-600">
                        {fmt(childFinal, r.currency)}
                      </span>
                      {tourvaaDiscountPercent ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-dash-subtle">
                          <span className="line-through">{fmt(childStorefront, r.currency)}</span>
                          <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700">-{tourvaaDiscountPercent}%</span>
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {/* Edit Button */}
                  <td className="px-4 py-3.5 text-right align-middle">
                    <button type="button" onClick={() => setEditing({ ...r })} aria-label="Edit markup" title="Edit markup"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:border-dash-brand/40 hover:bg-sky-50 hover:text-dash-brand-hover">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );

  return (
    <div className="space-y-6">
      <SectionCard
        icon={BadgeDollarSign}
        iconTone={isSupplier ? "emerald" : "brand"}
        title={isSupplier ? "Your Price to TourVaa" : "Supplier Price to TourVaa"}
        description={isSupplier
          ? "Your original price, offer discount, final price to TourVaa, commission, and resulting payout."
          : "Supplier original price, supplier offer discount, final price to TourVaa, commission, and supplier payout."}
        action={addButton}
      >
        {isSupplier && isLiveTour && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>Saving takes this price live immediately. Admin will also be notified to review the change.</span>
          </div>
        )}

        {(tourvaaDiscountPercent || supplierDiscountPercent) && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            <Percent size={16} className="mt-0.5 shrink-0" />
            <span>
              An automatic {tourvaaDiscountPercent ? "TourVaa" : "supplier"} discount of {tourvaaDiscountPercent ?? supplierDiscountPercent}% is live on the storefront for its duration.
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
          <div className="overflow-x-auto rounded-2xl border border-dash-border-soft shadow-sm">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-dash-border-soft bg-dash-bg/75 text-[11px] font-black uppercase tracking-wider text-dash-subtle">
                  <th rowSpan={2} className="px-4 py-3 align-middle">Pax Range</th>
                  <th colSpan={2} className="border-x border-dash-border-soft px-4 py-2 text-center">
                    Supplier Price {supplierDiscountPercent ? "(Offer Applied)" : ""}
                  </th>
                  <th rowSpan={2} className="px-4 py-3 text-center align-middle">TourVaa Commission</th>
                  <th colSpan={2} className="border-x border-dash-border-soft px-4 py-2 text-center text-emerald-800">
                    Supplier Receives
                  </th>
                  <th rowSpan={2} className="px-4 py-3 text-right align-middle">Actions</th>
                </tr>
                <tr className="border-b border-dash-border-soft bg-dash-bg/40 text-[10px] font-bold uppercase tracking-wider">
                  <th className="border-l border-dash-border-soft px-4 py-1.5 text-blue-600">Adult</th>
                  <th className="border-r border-dash-border-soft px-4 py-1.5 text-violet-600">Child</th>
                  <th className="border-l border-dash-border-soft px-4 py-1.5 text-emerald-700">Adult</th>
                  <th className="border-r border-dash-border-soft px-4 py-1.5 text-emerald-600">Child</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border-soft/70 bg-white">
                {slabs.map((r, idx) => {
                  const adultPrice = Number(r.adult_price ?? 0);
                  const childPrice = Number(r.child_price ?? 0);
                  const adultToTourvaa = afterSupplierDiscount(adultPrice);
                  const childToTourvaa = afterSupplierDiscount(childPrice);
                  const commission = Number(r.commission_percentage ?? commissionFloor ?? 0);
                  const adultReceives = adultToTourvaa * (1 - commission / 100);
                  const childReceives = childToTourvaa * (1 - commission / 100);
                  return (
                    <tr key={r.id ?? idx} className="transition-colors hover:bg-dash-bg/40">
                      <td className="px-4 py-3.5 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${accent.chip}`}>
                          {r.passenger_from}–{r.passenger_to} pax
                        </span>
                      </td>
                      {/* Adult Price */}
                      <td className="border-l border-dash-border-soft/60 px-4 py-3.5 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-dash-text">
                            {fmt(supplierDiscountPercent ? adultToTourvaa : adultPrice, r.currency)}
                          </span>
                          {supplierDiscountPercent ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-dash-subtle">
                              <span className="line-through">{fmt(adultPrice, r.currency)}</span>
                              <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700">-{supplierDiscountPercent}%</span>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      {/* Child Price */}
                      <td className="border-r border-dash-border-soft/60 px-4 py-3.5 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-dash-muted">
                            {fmt(supplierDiscountPercent ? childToTourvaa : childPrice, r.currency)}
                          </span>
                          {supplierDiscountPercent ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-dash-subtle">
                              <span className="line-through">{fmt(childPrice, r.currency)}</span>
                              <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700">-{supplierDiscountPercent}%</span>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      {/* Commission */}
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="inline-flex items-center gap-1 rounded-full border border-dash-border bg-dash-bg px-2.5 py-0.5 text-xs font-bold text-dash-body">
                          <Percent size={10} />{commission}%
                        </span>
                      </td>
                      {/* Adult Receives */}
                      <td className="border-l border-dash-border-soft/60 px-4 py-3.5 align-middle">
                        <span className="text-sm font-black text-emerald-700">
                          {fmt(adultReceives, r.currency)}
                        </span>
                      </td>
                      {/* Child Receives */}
                      <td className="border-r border-dash-border-soft/60 px-4 py-3.5 align-middle">
                        <span className="text-sm font-black text-emerald-600">
                          {fmt(childReceives, r.currency)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right align-middle">
                        <ActionButtons onEdit={() => setEditing({ ...r })} onDelete={() => removeSlab(r.id!)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              ? "Adult/child price is the price supplied to Tourvaa. Tourvaa commission is deducted to calculate what you receive; an active discount is shown as a crossed-out original and its discounted price."
              : "Tourvaa commission is deducted from the adult/child price to calculate what the supplier receives. An active discount is shown against both amounts; the storefront price below adds Tourvaa's markup."}
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
                <FormField name="admin_markup_value" label="Tourvaa markup %" error={errors.admin_markup_value}
                  hint={editing.admin_markup_value == null
                    ? `Using the ${inheritedLabel}. It updates automatically when that changes.`
                    : "Markup for this slab only. Enter 0 for no markup. Suppliers never see it."}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-dash-body">
                      <input type="checkbox" checked={editing.admin_markup_value == null}
                        onChange={(e) => { setEditing((p) => p ? { ...p, admin_markup_value: e.target.checked ? null : inheritedMarkup } : p); clearError("admin_markup_value"); }}
                        className="h-4 w-4" />
                      Use {inheritedLabel}
                    </label>
                    {editing.admin_markup_value != null && (
                      <input id="admin_markup_value" name="admin_markup_value" type="number" min={0} max={100} step="0.01" value={numberInputValue(editing.admin_markup_value)}
                        onChange={(e) => { setEditing((p) => p ? { ...p, admin_markup_value: parseNumberInput(e.target.value) } : p); clearError("admin_markup_value"); }}
                        className={fieldClass(errors.admin_markup_value)} />
                    )}
                  </div>
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
                    {fmt(withMarkup(sanitizeNumber(editing.adult_price), effectiveMarkup(editing)), editing.currency)}
                  </p>
                </div>
              )}
              {!isSupplier && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-dash-subtle">Storefront price (child)</p>
                  <p className="mt-1 text-xl font-black text-blue-700">
                    {fmt(withMarkup(sanitizeNumber(editing.child_price), effectiveMarkup(editing)), editing.currency)}
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
