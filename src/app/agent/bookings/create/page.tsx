"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuCheck as Check, LuChevronDown as ChevronDown, LuLoaderCircle as Loader2, LuMapPin as MapPin, LuPlus as Plus, LuSearch as Search, LuUser as User, LuX as X } from "react-icons/lu";
import PhoneInput from "@/components/ui/PhoneInput";
import api from "@/lib/api/client";
import { combinePhone } from "@/lib/utils/validators";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useAuthContext } from "@/providers/AuthProvider";
import DatePicker from "@/components/ui/DatePicker";

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
  tour_code?: string;
  short_description?: string;
  price_start_per_person?: string | number;
  currency?: string;
  number_of_days?: number;
  country_name?: string;
  city_name?: string;
  category_name?: string;
  banner_image?: string | null;
  calendar?: Array<{ id: number; date: string; slots: number; status: string }>;
};

type PriceQuote = {
  final_amount: string | number;
  base_amount: string | number;
  currency: string;
};

const TOUR_IMAGE_FALLBACK = "/images/tour-card-fallback.jpg";

function tourImage(tour: Tour) {
  return tour.banner_image ? mediaUrl(tour.banner_image) : TOUR_IMAGE_FALLBACK;
}

type NewCustomer = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address_line_1: string;
  address_line_2: string;
  postal_code: string;
};

type TravellerDraft = {
  traveller_type: "adult" | "child";
  full_name: string;
  age: string;
};

function money(value: string | number | undefined, currency = "USD") {
  if (!value && value !== 0) return "-";
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
  const prefillCustomerId = searchParams.get("customer_id");
  const { user, dashboard } = useAuthContext();

  // Customer selection
  const [customerMode, setCustomerMode] = useState<"search" | "new">("search");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [newCustomerPhoneCountryCode, setNewCustomerPhoneCountryCode] = useState("+91");
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    full_name: "", email: "", phone: "", country: "", state: "", city: "",
    address_line_1: "", address_line_2: "", postal_code: "",
  });

  // Tour selection
  const [tourSearch, setTourSearch] = useState("");
  const [tourResults, setTourResults] = useState<Tour[]>([]);
  const [tourLoading, setTourLoading] = useState(false);
  const [tourLoadError, setTourLoadError] = useState("");
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showTourDropdown, setShowTourDropdown] = useState(false);
  const tourRef = useRef<HTMLDivElement>(null);

  // Booking form
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState<"partial" | "full">("partial");
  const [travellers, setTravellers] = useState<TravellerDraft[]>([
    { traveller_type: "adult", full_name: "", age: "" },
  ]);
  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const debouncedCustomerSearch = useDebounce(customerSearch, 350);
  const debouncedTourSearch = useDebounce(tourSearch, 350);

  useEffect(() => {
    if (!prefillCustomerId) return;
    let active = true;
    api.get(`/customers/${prefillCustomerId}`)
      .then((res) => {
        if (!active) return;
        const customer = res.data?.data ?? res.data;
        setSelectedCustomer(customer);
        setCustomerSearch(customer?.full_name ?? customer?.name ?? customer?.email ?? "");
      })
      .catch(() => { if (active) setError("The selected customer could not be loaded."); });
    return () => { active = false; };
  }, [prefillCustomerId]);

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
    let active = true;
    setTourLoading(true);
    setTourLoadError("");
    api.get("/public/tours", {
      params: { search: debouncedTourSearch || undefined, limit: 20, page: 1 },
    })
      .then((res) => {
        if (!active) return;
        const items: Tour[] = res.data?.items ?? res.data?.data?.items ?? res.data?.data ?? [];
        setTourResults(items);
      })
      .catch(() => {
        if (!active) return;
        setTourResults([]);
        setTourLoadError("Tours could not be loaded. Please try again.");
      })
      .finally(() => { if (active) setTourLoading(false); });
    return () => { active = false; };
  }, [debouncedTourSearch]);

  useEffect(() => {
    if (!prefillTourId) return;
    let active = true;
    api.get(`/public/tours/${prefillTourId}`)
      .then((res) => {
        if (!active) return;
        const tour = res.data?.data ?? res.data;
        setSelectedTour(tour);
        setTourSearch(tour?.title ?? "");
      })
      .catch(() => { if (active) setError("The selected tour is not available for booking."); });
    return () => { active = false; };
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

  async function selectTour(tour: Tour) {
    setSelectedTour(tour);
    setTravelDate("");
    setTourSearch("");
    setShowTourDropdown(false);
    setPriceQuote(null);
    try {
      const res = await api.get(`/public/tours/${tour.id}`);
      setSelectedTour(res.data?.data ?? res.data ?? tour);
    } catch {
      setError("Tour availability could not be loaded. Please select the tour again.");
    }
  }

  function resizeTravellers(nextAdults: number, nextChildren: number) {
    setTravellers((current) => {
      const currentAdults = current.filter((row) => row.traveller_type === "adult");
      const currentChildren = current.filter((row) => row.traveller_type === "child");
      return [
        ...Array.from({ length: nextAdults }, (_, index) => currentAdults[index] ?? { traveller_type: "adult" as const, full_name: "", age: "" }),
        ...Array.from({ length: nextChildren }, (_, index) => currentChildren[index] ?? { traveller_type: "child" as const, full_name: "", age: "" }),
      ];
    });
  }

  function changeTravellerCount(type: "adult" | "child", rawValue: number) {
    const nextAdults = type === "adult" ? Math.min(20, Math.max(1, rawValue || 1)) : adults;
    const nextChildren = type === "child" ? Math.min(20, Math.max(0, rawValue || 0)) : children;
    setAdults(nextAdults);
    setChildren(nextChildren);
    resizeTravellers(nextAdults, nextChildren);
  }

  function updateTraveller(index: number, field: "full_name" | "age", value: string) {
    setTravellers((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  }

  const totalPax = adults + children;
  const unitPrice = Number(selectedTour?.price_start_per_person ?? 0);
  const availableDates = (selectedTour?.calendar ?? []).filter((entry) =>
    ["available", "active"].includes(entry.status) && entry.slots >= totalPax
  );
  const selectedCalendar = availableDates.find((entry) => entry.date === travelDate);
  const estimatedTotal = Number(priceQuote?.final_amount ?? (unitPrice * adults));
  const currency = priceQuote?.currency ?? selectedTour?.currency ?? "USD";

  useEffect(() => {
    if (!selectedTour || !travelDate) {
      setPriceQuote(null);
      setPriceError("");
      return;
    }
    let active = true;
    setPriceLoading(true);
    setPriceError("");
    api.post("/bookings/calculate-price", {
      customer_id: selectedCustomer?.id ?? 0,
      tour_id: selectedTour.id,
      tour_calendar_id: selectedCalendar?.id,
      tour_date: travelDate,
      tour_start_date: travelDate,
      no_of_adults: adults,
      no_of_children: children,
      booking_source: "agent",
    }).then((res) => {
      if (active) setPriceQuote(res.data?.data ?? null);
    }).catch((err: unknown) => {
      if (!active) return;
      setPriceQuote(null);
      setPriceError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "A live price could not be calculated.");
    }).finally(() => { if (active) setPriceLoading(false); });
    return () => { active = false; };
  }, [adults, children, selectedCalendar?.id, selectedCustomer?.id, selectedTour, travelDate]);

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
    const primaryName = selectedCustomer?.full_name ?? selectedCustomer?.name ?? newCustomer.full_name;
    const invalidTraveller = travellers.find((row, index) => {
      const name = (row.full_name || (index === 0 ? primaryName : "")).trim();
      const age = Number(row.age);
      return !name || !Number.isInteger(age) || (row.traveller_type === "adult" ? age < 12 || age > 120 : age < 2 || age > 11);
    });
    if (invalidTraveller) {
      setError("Add a valid full name and age for every traveller (adults 12–120, children 2–11).");
      return;
    }
    const agentId = dashboard?.user?.agent_id ?? user?.agent_id;
    if (!agentId) { setError("Agent account could not be identified. Please sign out and sign back in."); return; }

    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.id;
      let primaryPhone = selectedCustomer?.phone ?? "";

      // Create customer inline if needed
      if (customerMode === "new") {
        const customerPhone = newCustomer.phone ? combinePhone(newCustomerPhoneCountryCode, newCustomer.phone) : "";
        const res = await api.post("/customers/", { ...newCustomer, phone: customerPhone });
        customerId = res.data?.data?.id ?? res.data?.id;
        primaryPhone = customerPhone;
      }

      const payload = {
        customer_id: customerId,
        agent_id: agentId,
        tour_id: selectedTour.id,
        tour_calendar_id: selectedCalendar?.id,
        tour_name: selectedTour.title,
        tour_date: travelDate,
        tour_start_date: travelDate,
        no_of_adults: adults,
        no_of_children: children,
        payment_type: paymentType,
        customer_notes: notes || undefined,
        booking_source: "agent",
        travellers: travellers.map((traveller, index) => ({
          traveller_type: traveller.traveller_type,
          full_name: (traveller.full_name || (index === 0 ? primaryName : "")).trim(),
          age: Number(traveller.age),
          email: index === 0 ? selectedCustomer?.email ?? newCustomer.email : undefined,
          phone: index === 0 ? primaryPhone : undefined,
          is_primary_contact: index === 0,
        })),
      };

      const res = await api.post("/bookings/", payload);
      const bookingId = res.data?.data?.id ?? res.data?.id;
      router.push(`/agent/bookings/${bookingId}?new=1&pay=1`);
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

  const customerReady = customerMode === "search" ? Boolean(selectedCustomer) : Boolean(newCustomer.full_name && newCustomer.email);
  const tourReady = Boolean(selectedTour && travelDate);
  const travellerReady = travellers.length === totalPax && travellers.every((row, index) => {
    const primaryName = selectedCustomer?.full_name ?? selectedCustomer?.name ?? newCustomer.full_name;
    return Boolean((row.full_name || (index === 0 ? primaryName : "")).trim() && row.age);
  });

  return (
    <div className="p-6 md:p-8">
      <Link href="/agent/bookings" className="mb-5 inline-flex items-center gap-1.5 rounded-xl border border-dash-border bg-white px-3 py-2 text-sm font-bold text-dash-body hover:bg-[#F3F8FC] transition-all">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[var(--portal-hero-from)] to-[var(--portal-hero-to)] p-7 text-white shadow-xl shadow-blue-200/40 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-black leading-tight md:text-3xl">Create Booking</h1>
          <p className="mt-1 text-sm font-medium text-blue-100">Book a tour on behalf of your customer.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {[
          { label: "1. Customer", done: customerReady },
          { label: "2. Tour & date", done: tourReady },
          { label: "3. Travellers", done: travellerReady },
          { label: "4. Review", done: customerReady && tourReady && travellerReady && Boolean(priceQuote) },
          { label: "5. Payment", done: false },
        ].map((step) => (
          <div key={step.label} className={`rounded-xl border px-4 py-3 text-sm font-bold ${step.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-dash-border bg-white text-dash-muted"}`}>
            <span className="mr-2">{step.done ? "✓" : "○"}</span>{step.label}
          </div>
        ))}
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
                    ? "border-blue-400 bg-[var(--portal-soft)] text-dash-brand-dark"
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
                    ? "border-blue-400 bg-[var(--portal-soft)] text-dash-brand-dark"
                    : "border-dash-border text-dash-muted hover:bg-dash-bg-muted"
                }`}
              >
                <Plus size={14} className="mr-1 inline" /> New customer
              </button>
            </div>

            {customerMode === "search" ? (
              <div className="mt-4" ref={customerRef}>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-xl border border-blue-300 bg-[var(--portal-soft)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-dash-brand text-xs font-black text-white">
                        {(selectedCustomer.name ?? selectedCustomer.full_name ?? "C")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-dash-text">{selectedCustomer.name ?? selectedCustomer.full_name}</p>
                        <p className="text-xs text-dash-muted">{selectedCustomer.email}</p>
                        {selectedCustomer.phone && <p className="mt-0.5 text-xs text-dash-muted">{selectedCustomer.phone}</p>}
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
                      className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
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
                    className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-dash-muted">Email *</span>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))}
                    placeholder="Email address"
                    className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
                  />
                </label>
                <PhoneInput
                  countryCode={newCustomerPhoneCountryCode}
                  number={newCustomer.phone}
                  onCountryCodeChange={setNewCustomerPhoneCountryCode}
                  onNumberChange={(value) => setNewCustomer((c) => ({ ...c, phone: value }))}
                  label="Phone"
                />
                <label className="block">
                  <span className="text-xs font-bold uppercase text-dash-muted">Country</span>
                  <input value={newCustomer.country} onChange={(e) => setNewCustomer((c) => ({ ...c, country: e.target.value }))} placeholder="Country" autoComplete="country-name" className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-dash-muted">State / Province</span>
                  <input value={newCustomer.state} onChange={(e) => setNewCustomer((c) => ({ ...c, state: e.target.value }))} placeholder="State or province" autoComplete="address-level1" className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-dash-muted">City</span>
                  <input value={newCustomer.city} onChange={(e) => setNewCustomer((c) => ({ ...c, city: e.target.value }))} placeholder="City" autoComplete="address-level2" className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-dash-muted">Postal Code</span>
                  <input value={newCustomer.postal_code} onChange={(e) => setNewCustomer((c) => ({ ...c, postal_code: e.target.value }))} placeholder="Postal code" autoComplete="postal-code" className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-dash-muted">Address Line 1</span>
                  <input value={newCustomer.address_line_1} onChange={(e) => setNewCustomer((c) => ({ ...c, address_line_1: e.target.value }))} placeholder="Street address" autoComplete="address-line1" className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-dash-muted">Address Line 2</span>
                  <input value={newCustomer.address_line_2} onChange={(e) => setNewCustomer((c) => ({ ...c, address_line_2: e.target.value }))} placeholder="Apartment, suite, landmark (optional)" autoComplete="address-line2" className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                </label>
              </div>
            )}
          </div>

          {/* Tour Section */}
          <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-dash-text">Tour</h2>
            <p className="mt-1 text-xs text-dash-muted">Search and select a tour to book.</p>

            <div className="mt-4" ref={tourRef}>
              {selectedTour ? (
                <div className="flex items-center justify-between rounded-xl border border-blue-300 bg-[var(--portal-soft)] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-blue-100">
                      <Image src={tourImage(selectedTour)} alt={selectedTour.title} fill unoptimized sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-dash-text">{selectedTour.title}</p>
                      <p className="truncate text-xs text-dash-muted">
                        {[selectedTour.city_name, selectedTour.country_name].filter(Boolean).join(", ") || selectedTour.tour_code || "Published tour"}
                      </p>
                      <p className="text-xs text-dash-muted">
                        {selectedTour.number_of_days ? `${selectedTour.number_of_days} days` : ""}
                        {unitPrice > 0 && ` · From ${money(unitPrice, currency)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedTour(null); setTourSearch(""); setTravelDate(""); setPriceQuote(null); }}
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
                      placeholder="Search tours by name or destination…"
                      className="w-full rounded-xl border border-dash-border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
                    />
                  {showTourDropdown && (
                    <div className="absolute z-20 mt-1 max-h-96 w-full overflow-y-auto rounded-xl border border-dash-border bg-white shadow-lg">
                      {tourLoading ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-dash-muted">
                          <Loader2 size={14} className="animate-spin" /> Loading published tours…
                        </div>
                      ) : tourLoadError ? (
                        <div className="px-4 py-3 text-sm font-semibold text-rose-600">{tourLoadError}</div>
                      ) : tourResults.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-dash-muted">
                          No published tours match your search.
                        </div>
                      ) : (
                        tourResults.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => void selectTour(t)}
                            className="flex w-full items-start gap-3 border-b border-dash-border px-4 py-3 text-left text-sm last:border-b-0 hover:bg-[var(--portal-soft)]"
                          >
                            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-blue-100">
                              <Image src={tourImage(t)} alt={t.title} fill unoptimized sizes="96px" className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="font-bold text-dash-text">{t.title}</p>
                                {t.category_name && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-dash-brand-dark">{t.category_name}</span>
                                )}
                              </div>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-dash-muted">
                                <MapPin size={11} />
                                {[t.city_name, t.country_name].filter(Boolean).join(", ") || "Destination to be confirmed"}
                              </p>
                              {t.short_description && (
                                <p className="mt-1 line-clamp-1 text-xs text-dash-muted">{t.short_description}</p>
                              )}
                              <p className="mt-1 text-xs font-semibold text-dash-brand-dark">
                                {t.number_of_days ? `${t.number_of_days} days` : "Duration on request"}
                                {t.price_start_per_person != null && ` · From ${money(t.price_start_per_person, t.currency ?? "USD")}`}
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
              <div className="block sm:col-span-3">
                <span className="text-xs font-bold uppercase text-dash-muted">Travel Date *</span>
                <DatePicker
                  value={travelDate}
                  onChange={setTravelDate}
                  minDate={new Date().toISOString().split("T")[0]}
                  availableDates={availableDates.map((entry) => entry.date)}
                  restrictToAvailableDates={Boolean(selectedTour?.calendar?.length)}
                  placeholder={selectedTour?.calendar?.length ? "Select available departure" : "Select travel date"}
                  clearable
                  className="mt-1"
                />
                {selectedTour?.calendar?.length && availableDates.length === 0 ? (
                  <span className="mt-1 block text-xs font-semibold text-rose-600">No departure currently has enough seats for {totalPax} travellers.</span>
                ) : null}
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-dash-muted">Adults *</span>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={adults}
                    onChange={(e) => changeTravellerCount("adult", Number(e.target.value))}
                    className="w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
                  />
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-dash-muted">Children</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={children}
                  onChange={(e) => changeTravellerCount("child", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
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
                  className="mt-1 w-full resize-none rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-dash-text">Traveller Manifest</h2>
                <p className="mt-1 text-xs text-dash-muted">Names and ages must match the selected group size.</p>
              </div>
              <span className="rounded-full bg-[var(--portal-soft)] px-3 py-1 text-xs font-black text-dash-brand-dark">{travellers.length} travellers</span>
            </div>
            <div className="mt-4 space-y-3">
              {travellers.map((traveller, index) => {
                const typeNumber = travellers.slice(0, index + 1).filter((row) => row.traveller_type === traveller.traveller_type).length;
                const isAdult = traveller.traveller_type === "adult";
                const primaryFallback = selectedCustomer?.full_name ?? selectedCustomer?.name ?? newCustomer.full_name;
                return (
                  <div key={`${traveller.traveller_type}-${index}`} className="rounded-xl border border-dash-border bg-dash-bg-muted/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wide text-dash-muted">{isAdult ? "Adult" : "Child"} {typeNumber}</p>
                      {index === 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-dash-brand-dark">Primary contact</span>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
                      <label>
                        <span className="text-xs font-bold text-dash-muted">Full name *</span>
                        <input value={traveller.full_name} onChange={(event) => updateTraveller(index, "full_name", event.target.value)} placeholder={index === 0 && primaryFallback ? primaryFallback : `${isAdult ? "Adult" : "Child"} full name`} className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                      </label>
                      <label>
                        <span className="text-xs font-bold text-dash-muted">Age *</span>
                        <input type="number" min={isAdult ? 12 : 2} max={isAdult ? 120 : 11} value={traveller.age} onChange={(event) => updateTraveller(index, "age", event.target.value)} placeholder={isAdult ? "12+" : "2–11"} className="mt-1 w-full rounded-xl border border-dash-border px-4 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-4 focus:ring-blue-50" />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column - Price Preview + Submit */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-dash-text">Price Preview</h2>
              {selectedTour && (unitPrice > 0 || priceQuote) ? (
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
                    <span className="text-dash-muted">Adults - {adults}</span>
                    <span className="font-bold text-dash-text">{money(unitPrice * adults, currency)}</span>
                  </div>
                  <div className="border-t border-dash-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-dash-text">{priceQuote ? "Quoted Total" : "Estimated Total"}</span>
                      <span className="text-xl font-black text-dash-brand">{priceLoading ? "Calculating…" : money(estimatedTotal, currency)}</span>
                    </div>
                    <p className="mt-1 text-xs text-dash-muted">{priceQuote ? "Live price for the selected date and traveller count." : "Select a date for an exact live price."}</p>
                    {priceError && <p className="mt-2 text-xs font-semibold text-rose-600">{priceError}</p>}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-dash-border p-4 text-center text-sm text-dash-muted">
                  Select a tour to see the price preview.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-dash-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-dash-text">Payment Plan</h2>
              <p className="mt-1 text-xs text-dash-muted">Choose what the customer will be asked to pay.</p>
              <div className="mt-4 grid gap-2">
                {([
                  { value: "partial" as const, label: "30% deposit", description: "Reserve now; remaining balance stays due." },
                  { value: "full" as const, label: "Full payment", description: "Customer pays the complete booking value." },
                ]).map((option) => (
                  <button key={option.value} type="button" onClick={() => setPaymentType(option.value)} className={`rounded-xl border p-3 text-left transition ${paymentType === option.value ? "border-blue-400 bg-[var(--portal-soft)]" : "border-dash-border hover:bg-dash-bg-muted"}`}>
                    <span className="block text-sm font-black text-dash-text">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-dash-muted">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || priceLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand px-5 py-3.5 text-sm font-black text-white transition hover:bg-dash-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating booking…</>
              ) : (
                <><Check size={16} /> Create & Continue to Payment</>
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


