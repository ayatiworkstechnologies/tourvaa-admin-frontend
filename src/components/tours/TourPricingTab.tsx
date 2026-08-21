"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPercent as Percent, LuSave as Save } from "react-icons/lu";
import { PricingSlab, getPricing, createPricing, updatePricing } from "@/lib/api/services/tourDetailService";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/ui/Loader";
import CurrencySelect from "@/components/ui/CurrencySelect";
import { numberInputValue, parseNumberInput, sanitizeNumber } from "@/lib/utils/numberInput";

// admin_markup_value is a legacy field the backend schema still accepts
// but no longer applies to pricing - the price entered below is exactly
// what the customer is charged (services.tours._apply_pricing_computation).
// Tourvaa's commission is deducted from that same price instead - see the
// Tourvaa Tour Commission card below and the supplier's profile. This
// constant is only used to keep sending a schema-valid value on save.
const DEFAULT_ADMIN_MARKUP = 10;

// A tour now has exactly ONE base price (for 1 person) rather than a
// separate absolute price per pax-range slab. Larger group sizes are
// priced as a percentage discount off this base price, set on the Group
// Discounts tab - covers every possible traveller count with one row.
const BASE_PAX_FROM = 1;
const BASE_PAX_TO = 999;

const empty = (): PricingSlab => ({
  passenger_from: BASE_PAX_FROM, passenger_to: BASE_PAX_TO, adult_price: 0, child_price: 0,
  admin_markup_value: DEFAULT_ADMIN_MARKUP,
  currency: "USD", status: "active",
});

export default function TourPricingTab({ tourId, role = "admin" }: { tourId: string; role?: "admin" | "supplier" }) {
  const toast = useToast();
  const isSupplier = role === "supplier";
  const [base, setBase] = useState<PricingSlab | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Read-only - the commission rate itself is set on the supplier's
  // profile (or the platform minimum if the supplier has no rate of their
  // own), not editable from here. This just shows what it means for the
  // prices entered below - see services.bookings.resolve_effective_commission_percentage
  // for the same resolution order.
  const [commissionRate, setCommissionRate] = useState<number | null>(null);

  const loadCommissionRate = useCallback(async () => {
    try {
      if (isSupplier) {
        const res = await api.get("/suppliers/me");
        const own = res.data?.data?.commission_percentage;
        if (own != null) { setCommissionRate(Number(own)); return; }
      } else {
        const tourRes = await api.get(`/tours/${tourId}`);
        const supplierId = tourRes.data?.data?.supplier_id;
        if (supplierId) {
          const supplierRes = await api.get(`/suppliers/${supplierId}`);
          const own = supplierRes.data?.data?.commission_percentage;
          if (own != null) { setCommissionRate(Number(own)); return; }
        }
      }
      const settingsRes = await api.get("/settings/public");
      const min = settingsRes.data?.data?.supplier_commission_percentage;
      if (min !== undefined) setCommissionRate(Number(min));
    } catch {
      // Non-fatal - the price form itself is the primary content of this tab.
    }
  }, [tourId, isSupplier]);

  useEffect(() => { void loadCommissionRate(); }, [loadCommissionRate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const slabs = await getPricing(tourId);
      // Any tour created before this single-base-price model may still have
      // several active rows - if so, treat the lowest pax_from as the base
      // (the "starting from 1 person" price), matching the one-time backend
      // consolidation that already ran for existing tours.
      const active = slabs.filter((s) => s.status === "active").sort((a, b) => a.passenger_from - b.passenger_from);
      setBase(active[0] ?? null);
    } catch {
      toast.error("Failed to load pricing.");
    } finally {
      setLoading(false);
    }
  }, [tourId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!base) return;
    setSaving(true);
    try {
      const payload: PricingSlab = {
        ...base,
        passenger_from: BASE_PAX_FROM,
        passenger_to: BASE_PAX_TO,
        adult_price: sanitizeNumber(base.adult_price),
        child_price: sanitizeNumber(base.child_price),
        admin_markup_value: DEFAULT_ADMIN_MARKUP,
      };
      const saved = base.id ? await updatePricing(tourId, base.id, payload) : await createPricing(tourId, payload);
      setBase(saved);
      toast.success("Saved.");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading pricing..." />;

  const form = base ?? empty();
  const rate = commissionRate ?? 0;
  const adultCommission = Math.round(form.adult_price * rate) / 100;
  const childCommission = Math.round(form.child_price * rate) / 100;
  const adultNet = Math.round((form.adult_price - adultCommission) * 100) / 100;
  const childNet = Math.round((form.child_price - childCommission) * 100) / 100;
  const fmt = (n: number) => `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${form.currency}`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-dash-text">{isSupplier ? "Supplier Pricing" : "Tour Pricing"}</h2>
          <p className="text-sm text-dash-subtle">
            One base price per person (for 1 traveller) - this is exactly what a solo customer is charged, with no markup added on top.
            For larger groups, set a percentage (or fixed) discount off this price on the <strong>Group Discounts</strong> tab, by traveller-count range - not a separate price to type in here.
          </p>
        </div>

        <form onSubmit={save} className="rounded-xl border border-dash-border bg-white p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Adult price (per person, charged to customer)</span>
              <input type="number" value={numberInputValue(form.adult_price)}
                onChange={(e) => setBase((p) => ({ ...(p ?? empty()), adult_price: parseNumberInput(e.target.value) }))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Child price (per person, charged to customer)</span>
              <input type="number" value={numberInputValue(form.child_price)}
                onChange={(e) => setBase((p) => ({ ...(p ?? empty()), child_price: parseNumberInput(e.target.value) }))}
                className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase text-dash-subtle">Currency</span>
              <CurrencySelect value={form.currency} onChange={(code) => setBase((p) => ({ ...(p ?? empty()), currency: code }))} />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving..." : "Save Base Price"}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-dash-border bg-dash-bg p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-dash-text"><Percent size={16} /> Tourvaa Commission (read-only)</h3>
          <p className="mt-1 text-xs text-dash-subtle">
            {isSupplier
              ? "This is your commission rate - set on your profile, not editable here."
              : "This is the supplier's commission rate - set on the supplier's profile, not editable here."} It shows what Tourvaa deducts from the prices above before payout.
          </p>
          <p className="mt-2 text-sm font-semibold text-dash-body">
            Rate: <strong>{commissionRate !== null ? `${commissionRate}%` : "-"}</strong>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs font-bold uppercase text-dash-subtle">Adult</p>
              <dl className="mt-1 space-y-1 text-xs text-dash-body">
                <div className="flex justify-between"><dt>Price</dt><dd className="font-semibold">{fmt(form.adult_price)}</dd></div>
                <div className="flex justify-between"><dt>Commission ({commissionRate ?? 0}%)</dt><dd className="font-semibold text-amber-600">-{fmt(adultCommission)}</dd></div>
                <div className="flex justify-between border-t border-dash-border pt-1"><dt className="font-bold">Supplier earns</dt><dd className="font-black text-emerald-700">{fmt(adultNet)}</dd></div>
              </dl>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs font-bold uppercase text-dash-subtle">Child</p>
              <dl className="mt-1 space-y-1 text-xs text-dash-body">
                <div className="flex justify-between"><dt>Price</dt><dd className="font-semibold">{fmt(form.child_price)}</dd></div>
                <div className="flex justify-between"><dt>Commission ({commissionRate ?? 0}%)</dt><dd className="font-semibold text-amber-600">-{fmt(childCommission)}</dd></div>
                <div className="flex justify-between border-t border-dash-border pt-1"><dt className="font-bold">Supplier earns</dt><dd className="font-black text-emerald-700">{fmt(childNet)}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
