"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuCheck as Check, LuChevronDown as ChevronDown, LuLoaderCircle as Loader2, LuMapPin as MapPin, LuPlus as Plus, LuSearch as Search, LuUser as User, LuX as X } from "react-icons/lu";
import PhoneInput from "@/components/ui/PhoneInput";
import api from "@/lib/api/client";
import { combinePhone } from "@/lib/utils/validators";

type Customer = {
  id: number;
  name?: string;
  full_name?: string;
  email: string;
  phone?: string;
};

type Tour = {
  id: number;
  title: string;
  price?: string | number;
  price_from?: string | number;
  currency?: string;
  duration?: string;
  duration_days?: number;
};

type NewCustomer = {
  full_name: string;
  email: string;
  phone: string;
};

function money(value: string | number | undefined, currency = "AED") {
  if (!value && value !== 0) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AgentCreateBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTourId = searchParams.get("tour_id");

  // Customer selection
  const [customerMode, setCustomerMode] = useState<"search" | "new">("search");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [newCustomerPhoneCountryCode, setNewCustomerPhoneCountryCode] = useState("+91");
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({ full_name: "", email: "", phone: "" });

  // Tour selection
  const [tourSearch, setTourSearch] = useState("");
  const [tourResults, setTourResults] = useState<Tour[]>([]);
  const [tourLoading, setTourLoading] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showTourDropdown, setShowTourDropdown] = useState(false);
  const tourRef = useRef<HTMLDivElement>(null);

  // Booking form
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const debouncedCustomerSearch = useDebounce(customerSearch, 350);
  const debouncedTourSearch = useDebounce(tourSearch, 350);

  // Search customers
  useEffect(() => {
    if (!debouncedCustomerSearch || customerMode !== "search") { setCustomerResults([]); return; }
    let active = true;
    setCustomerLoading(true);
    api.get("/customers", { params: { search: debouncedCustomerSearch, limit: 10 } })
      .then((res) => {
        if (!active) return;
        setCustomerResults(res.data?.items ?? res.data?.data ?? []);
      })
      .catch(() => { if (active) setCustomerResults([]); })
      .finally(() => { if (active) setCustomerLoading(false); });
    return () => { active = false; };
  }, [debouncedCustomerSearch, customerMode]);

  // Search tours
  useEffect(() => {
    if (!debouncedTourSearch && !prefillTourId) { setTourResults([]); return; }
    let active = true;
    setTourLoading(true);
    api.get("/tours", { params: { search: debouncedTourSearch || undefined, limit: 10 } })
      .then((res) => {
        if (!active) return;
        const items: Tour[] = res.data?.items ?? res.data?.data ?? [];
        setTourResults(items);
        // Auto-select if prefilled tour_id
        if (prefillTourId && !selectedTour) {
          const found = items.find((t) => String(t.id) === prefillTourId);
          if (found) { setSelectedTour(found); setTourSearch(found.title); }
        }
      })
      .catch(() => { if (active) setTourResults([]); })
      .finally(() => { if (active) setTourLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTourSearch, prefillTourId]);

  // Prefill tour on mount
  useEffect(() => {
    if (prefillTourId) setTourSearch(" ");
  }, [prefillTourId]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (tourRef.current && !tourRef.current.contains(e.target as Node)) {
        setShowTourDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totalPax = adults + children;
  const unitPrice = Number(selectedTour?.price ?? selectedTour?.price_from ?? 0);
  const estimatedTotal = unitPrice * adults;
  const currency = selectedTour?.currency ?? "AED";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedTour) { setError("Please select a tour."); return; }
    if (!travelDate) { setError("Please select a travel date."); return; }
    if (customerMode === "search" && !selectedCustomer) { setError("Please select a customer."); return; }
    if (customerMode === "new" && (!newCustomer.full_name || !newCustomer.email)) {
      setError("Please fill in the new customer's name and email.");
      return;
    }

    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.id;

      // Create customer inline if needed
      if (customerMode === "new") {
        const customerPhone = newCustomer.phone ? combinePhone(newCustomerPhoneCountryCode, newCustomer.phone) : "";
        const res = await api.post("/customers", { ...newCustomer, phone: customerPhone });
        customerId = res.data?.data?.id ?? res.data?.id;
      }

      const payload = {
        customer_id: customerId,
        tour_id: selectedTour.id,
        tour_date: travelDate,
        adults,
        children,
        notes,
        booking_source: "agent",
      };

      const res = await api.post("/bookings/", payload);
      const bookingId = res.data?.data?.id ?? res.data?.id;
      router.push(`/agent/bookings/${bookingId}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message ??
        (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.detail ??
        "Failed to create booking. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <Link href="/agent/bookings" className="mb-5 inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-sm font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-black leading-tight md:text-3xl">Create Booking</h1>
          <p className="mt-1 text-sm font-medium text-orange-100">Book a tour on behalf of your customer.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Customer Section */}
          <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-dash-text">Customer</h2>
            <p className="mt-1 text-xs text-dash-muted">Search an existing customer or create a new one.</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => { setCustomerMode("search"); setSelectedCustomer(null); }}
                className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                  customerMode === "search"
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-dash-border text-dash-muted hover:bg-dash-bg-muted"
                }`}
              >
                Search existing
              </button>
              <button
                type="button"
                onClick={() => { setCustomerMode("new"); setSelectedCustomer(null); }}
                className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                  customerMode === "new"
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-dash-border text-dash-muted hover:bg-dash-bg-muted"
                }`}
              >
                <Plus size={14} className="mr-1 inline" /> New customer
              </button>
            </div>

            {customerMode === "search" ? (
              <div className="mt-4" ref={customerRef}>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-xl border border-orange-300 bg-orange-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-xs font-black text-white">
                        {(selectedCustomer.name ?? selectedCustomer.full_name ?? "C")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-dash-text">{selectedCustomer.name ?? selectedCustomer.full_name}</p>
                        <p className="text-xs text-dash-muted">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                      className="rounded-lg p-1.5 text-dash-muted hover:bg-white hover:text-rose-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
                    <input
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search by name or email…"
                      className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                    />
                    {showCustomerDropdown && (customerLoading || customerResults.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-dash-border bg-white shadow-lg">
                        {customerLoading ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-sm text-dash-muted">
                            <Loader2 size={14} className="animate-spin" /> Searching…
                          </div>
                        ) : (
                          customerResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setShowCustomerDropdown(false); }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-dash-bg-muted"
                            >
                              <User size={14} className="text-dash-muted" />
                              <div>
                                <p className="font-bold text-dash-text">{c.name ?? c.full_name}</p>
                                <p className="text-xs text-dash-muted">{c.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-dash-muted">Full Name *</span>
                  <input
                    value={newCustomer.full_name}
                    onChange={(e) => setNewCustomer((c) => ({ ...c, full_name: e.target.value }))}
                    placeholder="Customer full name"
                    className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-dash-muted">Email *</span>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))}
                    placeholder="Email address"
                    className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                  />
                </label>
                <PhoneInput
                  countryCode={newCustomerPhoneCountryCode}
                  number={newCustomer.phone}
                  onCountryCodeChange={setNewCustomerPhoneCountryCode}
                  onNumberChange={(value) => setNewCustomer((c) => ({ ...c, phone: value }))}
                  label="Phone"
                />
              </div>
            )}
          </div>

          {/* Tour Section */}
          <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-dash-text">Tour</h2>
            <p className="mt-1 text-xs text-dash-muted">Search and select a tour to book.</p>

            <div className="mt-4" ref={tourRef}>
              {selectedTour ? (
                <div className="flex items-center justify-between rounded-xl border border-orange-300 bg-orange-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-orange-50">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-dash-text">{selectedTour.title}</p>
                      <p className="text-xs text-dash-muted">
                        {selectedTour.duration ?? (selectedTour.duration_days ? `${selectedTour.duration_days} days` : "")}
                        {unitPrice > 0 && ` Â· From ${money(unitPrice, currency)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedTour(null); setTourSearch(""); }}
                    className="rounded-lg p-1.5 text-dash-muted hover:bg-white hover:text-rose-600"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
                  <input
                    value={tourSearch}
                    onChange={(e) => { setTourSearch(e.target.value); setShowTourDropdown(true); }}
                    onFocus={() => setShowTourDropdown(true)}
                    placeholder="Search tours…"
                    className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                  />
                  {showTourDropdown && (tourLoading || tourResults.length > 0) && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-dash-border bg-white shadow-lg">
                      {tourLoading ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-dash-muted">
                          <Loader2 size={14} className="animate-spin" /> Searching tours…
                        </div>
                      ) : (
                        tourResults.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => { setSelectedTour(t); setTourSearch(""); setShowTourDropdown(false); }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-dash-bg-muted"
                          >
                            <MapPin size={14} className="text-dash-muted" />
                            <div>
                              <p className="font-bold text-dash-text">{t.title}</p>
                              <p className="text-xs text-dash-muted">
                                {t.duration ?? (t.duration_days ? `${t.duration_days} days` : "")}
                                {(t.price || t.price_from) && ` Â· From ${money(t.price ?? t.price_from, t.currency ?? "AED")}`}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Travel Details */}
          <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-dash-text">Travel Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-3">
                <span className="text-xs font-bold uppercase text-dash-muted">Travel Date *</span>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-dash-muted">Adults *</span>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                  />
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-dash-muted">Children</span>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                />
              </label>
              <div className="flex items-end pb-1">
                <p className="text-sm text-dash-muted">
                  <span className="font-bold text-dash-text">{totalPax}</span> total pax
                </p>
              </div>
              <label className="block sm:col-span-3">
                <span className="text-xs font-bold uppercase text-dash-muted">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Special requests, dietary requirements, etc."
                  className="mt-1 w-full resize-none rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right column - Price Preview + Submit */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-dash-text">Price Preview</h2>
              {selectedTour && unitPrice > 0 ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dash-muted">Tour</span>
                    <span className="font-bold text-dash-text line-clamp-1 max-w-[160px] text-right">
                      {selectedTour.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dash-muted">Unit price</span>
                    <span className="font-bold text-dash-text">{money(unitPrice, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dash-muted">Adults Ã— {adults}</span>
                    <span className="font-bold text-dash-text">{money(unitPrice * adults, currency)}</span>
                  </div>
                  <div className="border-t border-dash-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-dash-text">Estimated Total</span>
                      <span className="text-xl font-black text-orange-600">{money(estimatedTotal, currency)}</span>
                    </div>
                    <p className="mt-1 text-xs text-dash-muted">Final pricing confirmed at checkout.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-dash-border p-4 text-center text-sm text-dash-muted">
                  Select a tour to see the price preview.
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating booking…</>
              ) : (
                <><Check size={16} /> Confirm Booking</>
              )}
            </button>
            <Link
              href="/agent/bookings"
              className="block w-full rounded-xl border border-dash-border bg-white py-3 text-center text-sm font-bold text-dash-muted transition hover:bg-dash-bg-muted"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}


