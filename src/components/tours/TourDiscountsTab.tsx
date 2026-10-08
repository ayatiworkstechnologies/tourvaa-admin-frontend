"use client";

import { ErrorSummary, FormField, fieldClass, focusField } from "@/components/tours/FormKit";
import { validateDiscount, type FieldErrors } from "@/lib/tours/tourValidation";
import { useCallback, useEffect, useState } from "react";
import {
  LuPlus as Plus,
  LuHistory as History,
  LuPencil as Pencil,
  LuSave as Save,
  LuTrash2 as Trash2,
  LuTrendingUp as TrendingUp,
  LuX as X,
  LuTag as Tag,
  LuSparkles as Sparkles,
  LuCalendar as Calendar,
  LuUsers as Users,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuPower as Power,
} from "react-icons/lu";
import { TourDiscount, DiscountHistoryEntry, getDiscounts, createDiscount, updateDiscount, amendDiscount, deactivateDiscount, getDiscountHistory, getPricing } from "@/lib/api/services/tourDetailService";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import Loader from "@/components/ui/Loader";
import DatePicker from "@/components/ui/DatePicker";
import api from "@/lib/api/client";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";
import { todayLocalDateStr } from "@/lib/utils/date";
import { isTourvaaDiscount as isTourvaaOwnedDiscount } from "@/lib/tours/discountSource";

function fmt(n: number, currency: string) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatSchedule(value?: string | null, fallback = "Open") {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dateRangesOverlap(
  firstStart?: string | null,
  firstEnd?: string | null,
  secondStart?: string | null,
  secondEnd?: string | null,
) {
  // A blank start means immediately; a blank end means no expiry.
  // Date.getTime keeps the comparison consistent with the date/time controls.
  const start = (value?: string | null) => value ? new Date(value).getTime() : Number.NEGATIVE_INFINITY;
  const end = (value?: string | null) => value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return start(firstStart) <= end(secondEnd) && start(secondStart) <= end(firstEnd);
}

function discountedValue(item: TourDiscount, basePrice: number): number | null {
  if (basePrice <= 0) return null;
  const discounted = item.discount_type === "percentage"
    ? basePrice * (1 - item.discount_value / 100)
    : Math.max(0, basePrice - item.discount_value);
  return discounted < basePrice ? discounted : null;
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

function DiscountPricePreview({ item, adultPrice, childPrice, currency }: { item: TourDiscount; adultPrice: number; childPrice: number; currency: string }) {
  const discountedAdult = discountedValue(item, adultPrice);
  const discountedChild = discountedValue(item, childPrice);
  if (adultPrice <= 0 && childPrice <= 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-dash-border-soft bg-dash-bg/70 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-dash-subtle">
            Your Adult Price
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            {discountedAdult != null ? (
              <>
                <span className="text-xs text-dash-subtle line-through">{fmt(adultPrice, currency)}</span>
                <span className="text-sm font-black text-emerald-700">{fmt(discountedAdult, currency)}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-dash-text">{fmt(adultPrice, currency)}</span>
            )}
          </div>
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-dash-subtle">
            Your Child Price
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            {discountedChild != null ? (
              <>
                <span className="text-xs text-dash-subtle line-through">{fmt(childPrice, currency)}</span>
                <span className="text-sm font-black text-emerald-700">{fmt(discountedChild, currency)}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-dash-text">{fmt(childPrice, currency)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDiscountPricePreview({
  item, supplierOffer, supplierAdultPrice, supplierChildPrice, storefrontAdultPrice, currency,
}: {
  item: TourDiscount; supplierOffer?: TourDiscount; supplierAdultPrice: number; supplierChildPrice: number; storefrontAdultPrice: number; storefrontChildPrice: number; currency: string;
}) {
  if (supplierAdultPrice <= 0 && supplierChildPrice <= 0) return null;
  const isTourvaa = isTourvaaOwnedDiscount(item);
  // A TourVaa card must start from the supplier's already-discounted amount,
  // not from the raw supplier price. This makes the preview show the actual
  // stack: 100 -> 90 supplier offer -> 135 markup -> 108 TourVaa offer.
  const supplierStageOffer = isTourvaa ? supplierOffer : item;
  const supplierAdultAfter = supplierStageOffer
    ? (discountedValue(supplierStageOffer, supplierAdultPrice) ?? supplierAdultPrice)
    : supplierAdultPrice;
  const adultMarkupFactor = supplierAdultPrice > 0 ? storefrontAdultPrice / supplierAdultPrice : 1;
  const publishableAdult = supplierAdultAfter * adultMarkupFactor;
  const finalStorefrontAdult = isTourvaa ? (discountedValue(item, publishableAdult) ?? publishableAdult) : publishableAdult;

  if (isTourvaa) {
    return (
      <div className="mt-3 rounded-xl border border-dash-border-soft bg-dash-bg/70 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-dash-subtle">
              Customer Price (Storefront)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-dash-text">{fmt(publishableAdult, currency)}</span>
            </div>
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Discounted Price
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-black text-emerald-700">{fmt(finalStorefrontAdult, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-dash-border-soft bg-dash-bg/70 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-dash-subtle">
            Supplier Price to Tourvaa (1 Pax)
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-dash-text">{fmt(supplierAdultPrice, currency)}</span>
          </div>
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-800">
            Discounted Price to Tourvaa
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-sm font-black text-emerald-700">{fmt(supplierAdultAfter, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const empty = (): TourDiscount => ({
  discount_name: "", discount_code: null, discount_type: "percentage",
  discount_value: 10, discount_scope: "tour", start_date: null, end_date: null,
  usage_limit: null, minimum_booking_amount: 0, status: "active",
  // Admin always creates TourVaa storefront discounts; supplier creates supplier discounts.
  funded_by: "TOURVAA",
});

export default function TourDiscountsTab({ tourId, role = "admin" }: { tourId: string; role?: "admin" | "supplier" }) {
  const isSupplier = role === "supplier";
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<TourDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TourDiscount | null>(null);
  const [applicationMode, setApplicationMode] = useState<"automatic" | "code">("automatic");
  const [errors, setErrors] = useState<FieldErrors>({});
  const clearError = (field: string) => setErrors((prev) => { if (!prev[field]) return prev; const next = { ...prev }; delete next[field]; return next; });
  const [saving, setSaving] = useState(false);

  const [amending, setAmending] = useState<TourDiscount | null>(null);
  const [amendEndDate, setAmendEndDate] = useState("");
  const [amendValue, setAmendValue] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [amendSaving, setAmendSaving] = useState(false);

  const [onePaxAdultPrice, setOnePaxAdultPrice] = useState(0);
  const [onePaxChildPrice, setOnePaxChildPrice] = useState(0);
  const [storefrontAdultPrice, setStorefrontAdultPrice] = useState(0);
  const [storefrontChildPrice, setStorefrontChildPrice] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [historyFor, setHistoryFor] = useState<TourDiscount | null>(null);
  const [history, setHistory] = useState<DiscountHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const accent = isSupplier
    ? { solidBtn: "bg-[#16833A] hover:bg-[#117331] shadow-emerald-100", ring: "border-[#16833A]", chip: "bg-emerald-50 text-emerald-700" }
    : { solidBtn: "bg-dash-brand hover:bg-dash-brand-hover shadow-blue-100", ring: "border-dash-brand", chip: "bg-[#EDF5FF] text-dash-brand-hover" };

  const overlappingDiscount = editing?.status === "active"
    ? items.find((item) => (
      item.id !== editing.id
      && item.status === "active"
      && item.discount_scope === editing.discount_scope
      // Supplier and Tourvaa discounts intentionally stack as separate price
      // stages. Only another offer from the same owner is a duplicate.
      && (isSupplier ? !isTourvaaOwnedDiscount(item) : isTourvaaOwnedDiscount(item))
      && dateRangesOverlap(editing.start_date, editing.end_date, item.start_date, item.end_date)
    ))
    : undefined;
  const overlapMessage = overlappingDiscount
    ? `These dates overlap the active ${isSupplier ? "supplier" : "Tourvaa"} discount “${overlappingDiscount.discount_name}” (${formatSchedule(overlappingDiscount.start_date, "Immediate")} to ${formatSchedule(overlappingDiscount.end_date, "no expiry")}). Choose a different date range.`
    : "";

  useEffect(() => {
    if (!editing) return;
    setErrors((previous) => {
      if (overlapMessage) {
        return previous.start_date === overlapMessage ? previous : { ...previous, start_date: overlapMessage };
      }
      if (previous.start_date?.startsWith("These dates overlap the active")) {
        const next = { ...previous };
        delete next.start_date;
        return next;
      }
      return previous;
    });
  }, [editing, overlapMessage]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const discounts = await getDiscounts(tourId);
      // The server enforces this too. Keeping this client-side guard means a
      // supplier cannot briefly see a TourVaa storefront offer during a
      // rolling deployment with an older API instance.
      setItems(isSupplier ? discounts.filter((item) => !isTourvaaOwnedDiscount(item)) : discounts);
    } catch {
      toast.error("Failed to load discounts.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast, isSupplier]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api.get(`/tours/${tourId}`).then((res) => {
      const tour = res.data?.data;
      if (tour?.currency) setCurrency((prev) => prev || String(tour.currency));
    }).catch(() => {
      // Non-fatal
    });

    getPricing(tourId).then((rows) => {
      const sorted = [...rows].sort((a, b) => a.passenger_from - b.passenger_from);
      const onePaxSlab = sorted.find((s) => s.passenger_from <= 1 && s.passenger_to >= 1) ?? sorted[0];
      if (!onePaxSlab) return;
      const adult = Number(onePaxSlab.adult_price ?? 0);
      const child = Number(onePaxSlab.child_price ?? 0);
      setOnePaxAdultPrice(adult);
      setOnePaxChildPrice(child);
      setStorefrontAdultPrice(Number(onePaxSlab.storefront_adult_price ?? adult));
      setStorefrontChildPrice(Number(onePaxSlab.storefront_child_price ?? child));
      if (onePaxSlab.currency) setCurrency(onePaxSlab.currency);
    }).catch(() => {
      // Non-fatal
    });
  }, [tourId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const found = validateDiscount(editing);
    if (overlapMessage) found.start_date = overlapMessage;
    if (applicationMode === "code" && !editing.discount_code?.trim()) {
      found.discount_code = "Enter the promo code travellers must use.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusField(Object.keys(found)[0]);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        funded_by: isSupplier ? "SUPPLIER" : (editing.funded_by || "TOURVAA"),
        discount_code: applicationMode === "automatic" ? null : editing.discount_code?.trim().toUpperCase(),
        discount_value: sanitizeNumber(editing.discount_value),
        minimum_booking_amount: sanitizeNumber(editing.minimum_booking_amount),
      };
      if (editing.id) {
        const updated = await updateDiscount(tourId, editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success("Discount updated.");
      } else {
        const created = await createDiscount(tourId, payload);
        setItems((prev) => [...prev, created]);
        toast.success("Discount created.");
      }
      setEditing(null);
      setErrors({});
      window.dispatchEvent(new CustomEvent("tourvaa:discounts-changed", { detail: { tourId } }));
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message.toLowerCase().includes("overlaps an active discount")) {
        setErrors({ start_date: message });
        focusField("start_date");
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (item: TourDiscount) => {
    if (!item.id) return;
    const ok = await confirm({
      title: "Deactivate discount",
      message: `Deactivate "${item.discount_name}"? It will stop applying to new bookings, but its history is kept.`,
      confirmLabel: "Deactivate",
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await deactivateDiscount(tourId, item.id);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success("Discount deactivated.");
      window.dispatchEvent(new CustomEvent("tourvaa:discounts-changed", { detail: { tourId } }));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const activate = async (item: TourDiscount) => {
    if (!item.id) return;
    const ok = await confirm({
      title: "Activate discount",
      message: `Activate "${item.discount_name}" for new bookings?`,
      confirmLabel: "Activate",
    });
    if (!ok) return;
    try {
      const updated = await updateDiscount(tourId, item.id, {
        ...item,
        status: "active",
        // The server also enforces this. Sending it explicitly prevents an
        // old client response from accidentally changing calculation stage.
        funded_by: isSupplier ? "SUPPLIER" : (item.funded_by || "TOURVAA"),
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success("Discount activated.");
      window.dispatchEvent(new CustomEvent("tourvaa:discounts-changed", { detail: { tourId } }));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openAmend = (item: TourDiscount) => {
    setAmending(item);
    setAmendEndDate(item.end_date?.slice(0, 10) ?? "");
    setAmendValue(String(item.discount_value));
    setAmendReason("");
  };

  const saveAmend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amending?.id) return;
    setAmendSaving(true);
    try {
      const currentEndDate = amending.end_date?.slice(0, 10) ?? "";
      const newEndDate = amendEndDate && amendEndDate !== currentEndDate ? amendEndDate : undefined;
      const parsedValue = amendValue !== "" ? parseNumberInput(amendValue) : undefined;
      const newValue = parsedValue !== Number(amending.discount_value) ? parsedValue : undefined;
      const updated = await amendDiscount(tourId, amending.id, {
        new_end_date: newEndDate,
        new_discount_value: newValue,
        reason: amendReason || undefined,
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success("Discount extended/updated.");
      setAmending(null);
      window.dispatchEvent(new CustomEvent("tourvaa:discounts-changed", { detail: { tourId } }));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAmendSaving(false);
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

  const addButton = (
    <button
      type="button"
      onClick={() => { setApplicationMode("automatic"); setEditing(empty()); }}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 ${accent.solidBtn}`}
    >
      <Plus size={15} /> Add Discount
    </button>
  );

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Tag}
        iconTone={isSupplier ? "emerald" : "brand"}
        title="Discounts & Promo Codes"
        description={
          isSupplier
            ? "Offer special discounts or promo codes to boost bookings for your tour."
            : "Manage automatic discounts, seasonal promotions, and customer promo codes for this tour."
        }
        action={addButton}
      >
        {(() => {
          // Suppliers must only see their own discounts — Tourvaa-funded offers are hidden.
          const visibleItems = isSupplier
            ? items.filter((d) => !isTourvaaOwnedDiscount(d))
            : items;
          return visibleItems.length === 0 && !editing ? (
          <div className="rounded-2xl border border-dashed border-dash-border bg-dash-bg/30 p-10 text-center">
            <Tag size={28} className="mx-auto mb-2 text-dash-subtle opacity-60" />
            <p className="text-sm font-bold text-dash-text">No active discounts or promo codes</p>
            <p className="mt-1 text-xs text-dash-subtle">Create an automatic discount or promo code to boost bookings for this tour.</p>
            <button
              type="button"
              onClick={() => { setApplicationMode("automatic"); setEditing(empty()); }}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md ${accent.solidBtn}`}
            >
              <Plus size={15} /> Add First Discount
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleItems.map((item) => {
              const supplierOffer = items.find((offer) =>
                !isTourvaaOwnedDiscount(offer) && offer.status === "active" && !offer.discount_code,
              );
              const isInactive = item.status === "inactive";
              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border transition-all ${
                    isInactive
                      ? "border-dash-border-soft bg-slate-50/70 opacity-75"
                      : "border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] hover:border-dash-brand/30 hover:shadow-md"
                  } p-5`}
                >
                  <div>
                    {/* Top Row: Tag / Code & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.discount_code ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-dash-brand/50 bg-[#EEF8FF] px-2.5 py-1 text-xs font-black tracking-wide text-dash-brand uppercase">
                            <Tag size={12} /> {item.discount_code}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                            <Sparkles size={12} /> Auto Applied
                          </span>
                        )}
                        {!isSupplier && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isTourvaaOwnedDiscount(item)
                              ? "bg-blue-50 text-dash-brand"
                              : "bg-amber-50 text-amber-800"
                          }`}>
                            {isTourvaaOwnedDiscount(item)
                              ? "TourVaa Discount"
                              : "Supplier Discount"}
                          </span>
                        )}
                        {item.discount_code && (
                          item.show_on_website !== false ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700" title="Visible on website for 1-click apply">
                              <Eye size={10} /> Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500" title="Private code only works when typed">
                              <EyeOff size={10} /> Private
                            </span>
                          )
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isInactive ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isInactive ? "bg-red-500" : "bg-emerald-500"}`} />
                        {isInactive ? "Inactive" : "Active"}
                      </span>
                    </div>

                    {/* Offer Name & Value */}
                    <div className="mt-3.5">
                      <h3 className="text-base font-bold text-dash-text">{item.discount_name}</h3>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-dash-text">
                          {item.discount_value}{item.discount_type === "percentage" ? "%" : ` ${currency}`}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-dash-subtle">
                          OFF
                        </span>
                        {item.minimum_booking_amount > 0 && (
                          <span className="rounded-md bg-dash-bg px-2 py-0.5 text-[11px] font-semibold text-dash-body">
                            Min. {fmt(item.minimum_booking_amount, currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price Preview */}
                    {isSupplier ? (
                      <DiscountPricePreview item={item} adultPrice={onePaxAdultPrice} childPrice={onePaxChildPrice} currency={currency} />
                    ) : (
                      <AdminDiscountPricePreview
                        item={item}
                        supplierOffer={supplierOffer}
                        supplierAdultPrice={onePaxAdultPrice}
                        supplierChildPrice={onePaxChildPrice}
                        storefrontAdultPrice={storefrontAdultPrice}
                        storefrontChildPrice={storefrontChildPrice}
                        currency={currency}
                      />
                    )}

                    {/* Metadata: Schedule & Usage */}
                    <div className="mt-4 space-y-1.5 text-xs text-dash-subtle">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="shrink-0 text-dash-subtle" />
                        <span>
                          {item.start_date || item.end_date
                            ? `${formatSchedule(item.start_date, "Immediate")} → ${formatSchedule(item.end_date, "No expiry")}`
                            : "Always active (no date limits)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={13} className="shrink-0 text-dash-subtle" />
                        <span>
                          Used {item.used_count ?? 0} {item.usage_limit ? `/ ${item.usage_limit} limit` : "times (unlimited)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-dash-border-soft pt-3">
                    <button
                      type="button"
                      onClick={() => openHistory(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border px-3 py-1.5 text-xs font-bold text-dash-body transition hover:bg-dash-bg"
                    >
                      <History size={13} /> History
                    </button>
                    <div className="flex items-center gap-2">
                      {isSupplier ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationMode(item.discount_code ? "code" : "automatic");
                              setEditing({ ...item });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16833A] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#117331]"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          {!isInactive && (
                            <button
                              type="button"
                              onClick={() => openAmend(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <TrendingUp size={13} /> Extend
                            </button>
                          )}
                          {isInactive ? (
                            <button
                              type="button"
                              onClick={() => activate(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <Power size={13} /> Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => deactivate(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                              title="Deactivate / delete this offer from new bookings"
                            >
                              <Trash2 size={13} /> Deactivate
                            </button>
                          )}
                        </>
                      ) : isTourvaaOwnedDiscount(item) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationMode(item.discount_code ? "code" : "automatic");
                              setEditing({ ...item });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-dash-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-dash-brand-hover"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          {item.status !== "inactive" && (
                            <button
                              type="button"
                              onClick={() => deactivate(item)}
                              aria-label="Deactivate discount"
                              title="Deactivate discount"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-dash-border bg-dash-bg px-3 py-1.5 text-xs font-bold text-dash-subtle">
                          Supplier Offer · Read-only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
        })()}
      </SectionCard>

      {/* Discount History Table */}
      <div className="overflow-hidden rounded-2xl border border-dash-border-soft bg-white shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <div className="border-b border-dash-border-soft px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-bg text-dash-body">
              <History size={16} />
            </span>
            <div>
              <h3 className="text-base font-black text-dash-text">Discount History &amp; Audit Log</h3>
              <p className="text-xs text-dash-subtle">Every discount applied to this tour, including inactive and expired offers.</p>
            </div>
          </div>
        </div>

        {(() => {
          const historyItems = isSupplier
            ? items.filter((d) => !isTourvaaOwnedDiscount(d))
            : items;
          return historyItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-dash-subtle">No discount records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-dash-border-soft bg-dash-bg/75 text-[11px] font-black uppercase tracking-wider text-dash-subtle">
                  <th className="px-5 py-3">Discount &amp; Code</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Validity Period</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Added By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Changelog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border-soft/70 bg-white text-sm">
                {[...historyItems]
                  .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
                  .map((item) => (
                    <tr key={item.id} className="transition hover:bg-dash-bg/40">
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-dash-text">{item.discount_name}</span>
                          <span className="mt-0.5 text-xs text-dash-subtle">
                            {item.discount_code ? (
                              <span className="font-mono font-bold text-dash-brand">CODE: {item.discount_code}</span>
                            ) : (
                              "Automatic Discount"
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle font-bold text-dash-text">
                        {item.discount_value}{item.discount_type === "percentage" ? "%" : ` ${currency}`}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-dash-body">
                        {item.start_date || item.end_date
                          ? `${formatSchedule(item.start_date, "Immediate")} → ${formatSchedule(item.end_date, "Open")}`
                          : "Always Active"}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-dash-body">
                        {item.used_count ?? 0}{item.usage_limit ? ` / ${item.usage_limit}` : ""}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.added_by === "supplier" ? "bg-emerald-50 text-emerald-700" : "bg-[#EDF5FF] text-dash-brand"
                        }`}>
                          {item.added_by === "supplier" ? "Supplier" : item.added_by === "admin" ? "TourVaa" : "Platform"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === "inactive" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.status === "inactive" ? "bg-red-500" : "bg-emerald-500"}`} />
                          {item.status === "inactive" ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => openHistory(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-dash-border px-2.5 py-1 text-xs font-semibold text-dash-body hover:bg-dash-bg"
                        >
                          <History size={12} /> Log
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );
        })()}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <form onSubmit={save} noValidate className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 bg-white p-6 shadow-2xl ${accent.ring}`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-dash-text">
                <Tag size={18} className={isSupplier ? "text-emerald-700" : "text-dash-brand-hover"} />
                {editing.id ? "Edit Discount" : "New Discount"}
              </h3>
              <button
                type="button"
                aria-label="Close editor"
                title="Close editor"
                onClick={() => { setEditing(null); setErrors({}); }}
                className="text-dash-subtle hover:text-dash-text"
              >
                <X size={18} />
              </button>
            </div>
            <ErrorSummary errors={errors} />
            <div className="grid gap-4 md:grid-cols-2">
              {!isSupplier && (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase text-dash-subtle">
                  Discount Type &amp; Funding
                </label>
                {/* Admin can only add TourVaa-funded storefront discounts.
                    Supplier discounts are managed exclusively by the supplier. */}
                <div
                  className="rounded-xl border-2 border-dash-brand bg-blue-50/60 p-3 text-left text-sm"
                  onClick={() => setEditing((p) => p ? { ...p, funded_by: "TOURVAA" } : p)}
                >
                  <span className="block font-bold text-dash-brand">TourVaa Storefront Discount</span>
                  <span className="mt-1 block text-xs text-dash-brand/80">
                    Funded by TourVaa margin, reduces customer price on website without touching supplier payout.
                  </span>
                </div>
              </div>
            )}
            <FormField name="discount_name" label="Discount name" required error={errors.discount_name} hint="Shown to travellers, e.g. Early bird 10% off." className="md:col-span-2" counter={{ value: (editing.discount_name ?? "").length, max: 255 }}>
                <input id="discount_name" name="discount_name" value={editing.discount_name}
                  onChange={(e) => { setEditing((p) => p ? { ...p, discount_name: e.target.value } : p); clearError("discount_name"); }}
                  className={fieldClass(errors.discount_name)} placeholder="e.g. Early Bird Offer" />
              </FormField>
              <fieldset className="md:col-span-2">
                <legend className="mb-2 text-xs font-bold uppercase text-dash-subtle">How customers receive it</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["automatic", "code"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => { setApplicationMode(mode); if (mode === "automatic") setEditing((p) => p ? { ...p, discount_code: null } : p); }}
                      className={`rounded-xl border p-3 text-left text-sm transition ${applicationMode === mode ? "border-dash-brand bg-blue-50 text-dash-brand" : "border-dash-border bg-white text-dash-body hover:bg-dash-bg"}`}>
                      <span className="block font-bold">{mode === "automatic" ? "Automatic discount" : "Promo code"}</span>
                      <span className="mt-1 block text-xs opacity-75">{mode === "automatic" ? "Applied automatically in the cart when eligible." : "Applied only after the customer enters the code."}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {applicationMode === "code" && (
                <FormField name="discount_code" label="Promo code" required error={errors.discount_code} hint="Customers enter this code in the cart. Codes are saved in uppercase.">
                  <input id="discount_code" name="discount_code" value={editing.discount_code ?? ""}
                    onChange={(e) => { setEditing((p) => p ? { ...p, discount_code: e.target.value.toUpperCase() } : p); clearError("discount_code"); }}
                    placeholder="e.g. SUMMER25" className={fieldClass(errors.discount_code)} />
                </FormField>
              )}
              {applicationMode === "code" && (
                <label className="flex items-start gap-2.5 rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-sm md:col-span-2">
                  <input type="checkbox" checked={editing.show_on_website ?? true}
                    onChange={(e) => setEditing((p) => p ? { ...p, show_on_website: e.target.checked } : p)}
                    className="mt-0.5 h-4 w-4" />
                  <span>
                    <span className="block font-semibold text-dash-text">Show this code on the website</span>
                    <span className="block text-xs text-dash-subtle">Listed under &quot;Available offers&quot; at checkout for one-click apply. Untick for a private code (newsletter, partner, agent) that only works when typed.</span>
                  </span>
                </label>
              )}
              <FormField name="discount_type" label="Type" required hint="Percentage takes a share off the price; Fixed takes a set amount off.">
                <select id="discount_type" name="discount_type" value={editing.discount_type}
                  onChange={(e) => { setEditing((p) => p ? { ...p, discount_type: e.target.value as "percentage" | "fixed" } : p); clearError("discount_value"); }}
                  className={fieldClass()}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </FormField>
              <FormField name="discount_value" label={editing.discount_type === "percentage" ? "Value (%)" : "Value (amount)"} required error={errors.discount_value}
                hint={editing.discount_type === "percentage" ? "Between 1 and 100." : `The amount taken off, in ${currency}.`}>
                <input id="discount_value" name="discount_value" type="number" min={0} step="0.01" value={numberInputValue(editing.discount_value)}
                  onChange={(e) => { setEditing((p) => p ? { ...p, discount_value: parseNumberInput(e.target.value) } : p); clearError("discount_value"); }}
                  className={fieldClass(errors.discount_value)} />
              </FormField>
              <FormField name="minimum_booking_amount" label="Min. booking amount" error={errors.minimum_booking_amount} hint="The discount only applies to bookings of at least this amount. 0 = no minimum.">
                <input id="minimum_booking_amount" name="minimum_booking_amount" type="number" min={0} step="0.01" value={numberInputValue(editing.minimum_booking_amount)}
                  onChange={(e) => { setEditing((p) => p ? { ...p, minimum_booking_amount: parseNumberInput(e.target.value) } : p); clearError("minimum_booking_amount"); }}
                  className={fieldClass(errors.minimum_booking_amount)} />
              </FormField>
              <FormField name="usage_limit" label="Usage limit" error={errors.usage_limit} hint="How many bookings can use it. Leave blank for unlimited.">
                <input id="usage_limit" name="usage_limit" type="number" min={1} value={editing.usage_limit ?? ""}
                  onChange={(e) => { setEditing((p) => p ? { ...p, usage_limit: e.target.value ? Number(e.target.value) : null } : p); clearError("usage_limit"); }}
                  placeholder="Unlimited" className={fieldClass(errors.usage_limit)} />
              </FormField>
              <FormField name="start_date" label="Starts at" error={errors.start_date} hint="Leave blank to start immediately.">
                <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
                  <DatePicker value={editing.start_date?.slice(0, 10) ?? ""} maxDate={editing.end_date?.slice(0, 10)}
                    onChange={(date) => { setEditing((previous) => previous ? { ...previous, start_date: date ? `${date}T${previous.start_date?.slice(11, 16) || "00:00"}` : null } : previous); clearError("end_date"); }} />
                  <input aria-label="Start time" type="time" value={editing.start_date?.slice(11, 16) || "00:00"}
                    onChange={(event) => setEditing((previous) => previous?.start_date ? { ...previous, start_date: `${previous.start_date.slice(0, 10)}T${event.target.value}` } : previous)} className={fieldClass()} />
                </div>
              </FormField>
              <div data-field="end_date">
                <FormField name="end_date" label="Ends at" error={errors.end_date} hint="Leave blank for no expiry.">
                  <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
                    <DatePicker value={editing.end_date?.slice(0, 10) ?? ""} minDate={editing.start_date?.slice(0, 10)}
                      onChange={(date) => { setEditing((previous) => previous ? { ...previous, end_date: date ? `${date}T${previous.end_date?.slice(11, 16) || "23:59"}` : null } : previous); clearError("end_date"); }} />
                    <input aria-label="End time" type="time" value={editing.end_date?.slice(11, 16) || "23:59"}
                      onChange={(event) => setEditing((previous) => previous?.end_date ? { ...previous, end_date: `${previous.end_date.slice(0, 10)}T${event.target.value}` } : previous)} className={fieldClass(errors.end_date)} />
                  </div>
                </FormField>
              </div>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Status</span>
                <select value={editing.status} onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-dash-border pt-4">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-bold text-dash-body hover:bg-dash-bg">Cancel</button>
              <button type="submit" disabled={saving} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-60 ${accent.solidBtn}`}>
                <Save size={14} /> {saving ? "Saving..." : editing.id ? "Save Changes" : "Save Discount"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Amend Modal */}
      {amending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <form onSubmit={saveAmend} className="w-full max-w-md rounded-2xl border-2 border-emerald-600 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-dash-text">
                <TrendingUp size={16} className="text-emerald-700" />
                Extend / Increase -- {amending.discount_name}
              </h3>
              <button type="button" aria-label="Close editor" title="Close editor" onClick={() => setAmending(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-dash-subtle">
              You can only extend this discount&apos;s validity to a later date and/or raise its {amending.discount_type === "percentage" ? "percentage" : "value"} -- every change is recorded in the discount history below.
            </p>
            <div className="grid gap-4">
              <DatePicker
                label="New end date"
                value={amendEndDate}
                minDate={amending.end_date?.slice(0, 10) || todayLocalDateStr()}
                onChange={(date) => setAmendEndDate(date || "")}
              />
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">
                  New value {amending.discount_type === "percentage" ? "(%)" : `(${currency})`}
                </span>
                <input
                  type="number"
                  min={amending.discount_value}
                  value={amendValue}
                  onChange={(e) => setAmendValue(e.target.value)}
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Reason (optional)</span>
                <input
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="e.g. extending for peak season"
                  className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3 border-t border-dash-border pt-4">
              <button type="button" onClick={() => setAmending(null)} className="rounded-xl border border-dash-border px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={amendSaving} className="inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#117331] disabled:opacity-60">
                <Save size={14} /> {amendSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {historyFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dash-border-soft pb-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-dash-text">
                <History size={16} className="text-dash-brand" />
                Discount History -- {historyFor.discount_name}
              </h3>
              <button type="button" aria-label="Close" onClick={() => setHistoryFor(null)} className="text-dash-subtle hover:text-dash-text">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {historyLoading ? (
                <Loader label="Loading history..." />
              ) : history.length === 0 ? (
                <p className="py-6 text-center text-sm text-dash-subtle">No changelog entries found.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((v) => (
                    <div key={v.id} className="rounded-xl border border-dash-border-soft bg-dash-bg/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-black text-dash-body shadow-sm">
                          v{v.version_number} -- {v.change_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-dash-subtle">{v.created_at?.slice(0, 10)}{v.changed_by_name ? ` by ${v.changed_by_name}` : ""}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-dash-body">
                        {v.discount_value}{v.discount_type === "percentage" ? "%" : ` ${currency}`} off
                        {v.end_date ? ` -- valid until ${v.end_date.slice(0, 10)}` : ""}
                      </p>
                      {v.reason && <p className="mt-1 text-xs italic text-dash-subtle">&quot;{v.reason}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
