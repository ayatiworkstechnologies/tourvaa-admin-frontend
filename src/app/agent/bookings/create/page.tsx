"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCalendarCheck as CalendarCheck, LuCreditCard as CreditCard, LuLoaderCircle as Loader2, LuPlus as Plus, LuSearch as Search, LuTrash as Trash, LuUser as User, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import BookingPaymentModal from "@/components/bookings/BookingPaymentModal";
import { AgentPageHeader, AgentPageShell } from "@/components/agent/AgentPage";

/* ── Types ─────────────────────────────────────────── */

type Customer = { id: number; full_name: string; email: string; phone: string; country: string; city: string };
type Tour = { id: number; title: string; banner_image: string; category_name: string; country_name: string; city_name: string; number_of_days: number; price_start_per_person: string; currency: string; departures: { id: number; date: string; slots: number }[] };
type PriceQuote = { final_amount: string; base_amount: string; currency: string; agent_net_price: string; agent_markup: string; customer_selling_price: string; available: boolean; line_items?: { optional_activities: any[]; accommodations: any[]; extensions: any[] } };

type TravellerInput = {
  first_name: string;
  last_name: string;
  age: string;
  traveller_type: "adult" | "child";
  is_primary_contact: boolean;
};

/* ── Helpers ───────────────────────────────────────── */

function money(value: string | number | undefined, currency = "USD") {
  if (!value && value !== 0) return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function dateText(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Step Components ────────────────────────────────── */

function StepIndicator({ step, total, label }: { step: number; total: number; label: string }) {
  const progress = ((step - 1) / (total - 1)) * 100;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: total }).map((_, i) => {
          const s = i + 1;
          const active = s === step;
          const done = s < step;
          return (
            <div key={s} className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${active ? "bg-[#2563EB] text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{done ? "✓" : s}</div>
              <span className={`mt-1.5 text-xs font-bold ${active ? "text-[#2563EB]" : done ? "text-emerald-600" : "text-slate-500"}`}>{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-[#2563EB] transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

/* ── Main Wizard ────────────────────────────────────── */

export default function AgentBookingCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* State */
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Customer step */
  const [customerMode, setCustomerMode] = useState<"search" | "create">("search");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ full_name: "", email: "", phone: "", country: "", state: "", city: "", address: "", postal_code: "" });

  /* Tour step */
  const [tourSearch, setTourSearch] = useState("");
  const [tourResults, setTourResults] = useState<Tour[]>([]);
  const [tourSearchLoading, setTourSearchLoading] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [selectedTourDate, setSelectedTourDate] = useState("");

  /* Travellers step */
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travellers, setTravellers] = useState<TravellerInput[]>([{ first_name: "", last_name: "", age: "", traveller_type: "adult", is_primary_contact: true }]);

  /* Price & payment step */
  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [agentMarkup, setAgentMarkup] = useState("0");
  const [agentPaymentMethod, setAgentPaymentMethod] = useState<"online" | "credit" | "bank_transfer" | "pay_later" | "">("");
  const [agentReference, setAgentReference] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const totalSteps = 5;

  /* ── URL prefill ──────────────────────────────────── */

  useEffect(() => {
    const prefillCustomer = searchParams.get("customer_id");
    const prefillTour = searchParams.get("tour_id");

    if (prefillCustomer) {
      api.get(`/customers/${prefillCustomer}`)
        .then(r => {
          const c = r.data?.data;
          if (c) setSelectedCustomer({ id: c.id, full_name: c.full_name, email: c.email, phone: c.phone || "", country: c.country || "", city: c.city || "" });
        })
        .catch(() => {});
    }
    if (prefillTour) {
      api.get(`/public/tours/${prefillTour}`)
        .then(r => {
          const t = r.data?.data;
          if (t) setSelectedTour({ id: t.id, title: t.title, banner_image: t.banner_image, category_name: t.category_name, country_name: t.country_name, city_name: t.city_name, number_of_days: t.number_of_days, price_start_per_person: t.price_start_per_person, currency: t.currency, departures: t.calendar || [] });
        })
        .catch(() => {});
    }
  }, [searchParams]);

  /* ── Customer search ──────────────────────────────── */

  useEffect(() => {
    if (customerMode !== "search" || !customerSearch.trim()) { setCustomerResults([]); return; }
    const handler = setTimeout(() => {
      setCustomerSearchLoading(true);
      api.get("/customers", { params: { search: customerSearch, limit: 10 } })
        .then(r => setCustomerResults(r.data?.items ?? r.data?.data ?? []))
        .catch(() => setCustomerResults([]))
        .finally(() => setCustomerSearchLoading(false));
    }, 400);
    return () => clearTimeout(handler);
  }, [customerSearch, customerMode]);

  /* ── Tour search ───────────────────────────────────── */

  useEffect(() => {
    if (!tourSearch.trim()) { setTourResults([]); return; }
    const handler = setTimeout(() => {
      setTourSearchLoading(true);
      api.get("/public/tours", { params: { search: tourSearch, limit: 20 } })
        .then(r => setTourResults(r.data?.items ?? r.data?.data ?? []))
        .catch(() => setTourResults([]))
        .finally(() => setTourSearchLoading(false));
    }, 400);
    return () => clearTimeout(handler);
  }, [tourSearch]);

  /* ── Sync travellers with adult/child counts ──────── */

  useEffect(() => {
    const total = adults + children;
    const arr: TravellerInput[] = [];
    for (let i = 0; i < adults; i++) {
      arr.push({ first_name: travellers[i]?.first_name || "", last_name: travellers[i]?.last_name || "", age: travellers[i]?.age || "30", traveller_type: "adult", is_primary_contact: i === 0 });
    }
    for (let i = 0; i < children; i++) {
      const idx = adults + i;
      arr.push({ first_name: travellers[idx]?.first_name || "", last_name: travellers[idx]?.last_name || "", age: travellers[idx]?.age || "8", traveller_type: "child", is_primary_contact: false });
    }
    setTravellers(arr);
  }, [adults, children]);

  /* ── Price calculation ────────────────────────────── */

  async function calculatePrice() {
    if (!selectedCustomer || !selectedTour || !selectedTourDate) { setError("Please select a customer, tour, and date."); return; }
    setPriceLoading(true);
    setError("");
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        booking_source: "agent",
        tour_id: selectedTour.id,
        tour_calendar_id: selectedCalendarId,
        tour_date: selectedTourDate,
        no_of_adults: adults,
        no_of_children: children,
        no_of_infants: 0,
        adults_count: adults,
        children_count: children,
        agent_markup: Number(agentMarkup) || 0,
        agent_payment_method: agentPaymentMethod || undefined,
        agent_reference: agentReference || undefined,
        payment_type: "full",
        travellers: travellers.map(t => ({ traveller_type: t.traveller_type, first_name: t.first_name, last_name: t.last_name, full_name: `${t.first_name} ${t.last_name}`.trim(), age: parseInt(t.age) || 30, is_primary_contact: t.is_primary_contact })),
      };
      const res = await api.post("/bookings/calculate-price", payload);
      setPriceQuote(res.data?.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Could not calculate price.");
    } finally {
      setPriceLoading(false);
    }
  }

  /* ── Create booking ───────────────────────────────── */

  async function createBooking() {
    if (!priceQuote || !priceQuote.available) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        customer_id: selectedCustomer!.id,
        booking_source: "agent",
        tour_id: selectedTour!.id,
        tour_calendar_id: selectedCalendarId,
        tour_date: selectedTourDate,
        no_of_adults: adults,
        no_of_children: children,
        no_of_infants: 0,
        adults_count: adults,
        children_count: children,
        agent_markup: Number(agentMarkup) || 0,
        agent_payment_method: agentPaymentMethod || undefined,
        agent_reference: agentReference || undefined,
        payment_type: "full",
        travellers: travellers.map(t => ({ traveller_type: t.traveller_type, first_name: t.first_name, last_name: t.last_name, full_name: `${t.first_name} ${t.last_name}`.trim(), age: parseInt(t.age) || 30, is_primary_contact: t.is_primary_contact })),
      };
      const res = await api.post("/bookings/", payload);
      const booking = res.data?.data;
      setBookingId(booking.id);
      if (Number(booking.amount_pending ?? 0) > 0) {
        setShowPayment(true);
      } else {
        router.push(`/agent/bookings/${booking.id}?new=1`);
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || "Could not create booking.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Step navigation ──────────────────────────────── */

  function nextStep() {
    if (step === 1 && !selectedCustomer) { setError("Please select or create a customer."); return; }
    if (step === 2 && (!selectedTour || !selectedTourDate)) { setError("Please select a tour and date."); return; }
    if (step === 3) {
      const allFilled = travellers.every(t => t.first_name && t.last_name && t.age);
      if (!allFilled) { setError("Please fill in all traveller details."); return; }
    }
    if (step === 4) { calculatePrice(); return; }
    setError("");
    setStep(s => Math.min(s + 1, totalSteps));
  }

  function prevStep() { setStep(s => Math.max(s - 1, 1)); setError(""); }

  /* ── Render ───────────────────────────────────────── */

  return (
    <AgentPageShell>
      <AgentPageHeader
        title="Create Booking"
        description="Create a new booking on behalf of a customer."
        icon={Plus}
        eyebrow="Booking Operations"
        actions={[{ label: "Back to Bookings", href: "/agent/bookings", icon: ArrowLeft, variant: "secondary" }]}
      />

      <div className="mt-4 rounded-2xl border border-[#DFE7F2] bg-white p-6 shadow-[0_10px_32px_-27px_rgba(28,73,135,.75)]">
        <StepIndicator step={step} total={totalSteps} label={["Customer", "Tour & Date", "Travellers", "Review", "Payment"][step - 1]} />

        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

        {/* Step 1: Customer */}
        {step === 1 && (
          <div>
            <div className="mb-4 flex gap-4">
              <button type="button" onClick={() => { setCustomerMode("search"); setSelectedCustomer(null); }} className={`rounded-xl px-4 py-2 text-xs font-bold ${customerMode === "search" ? "bg-[#2563EB] text-white" : "border border-[#D7E2F2] bg-white text-[#355174]"}`}>Search Existing</button>
              <button type="button" onClick={() => { setCustomerMode("create"); setCustomerResults([]); }} className={`rounded-xl px-4 py-2 text-xs font-bold ${customerMode === "create" ? "bg-[#2563EB] text-white" : "border border-[#D7E2F2] bg-white text-[#355174]"}`}>Create New</button>
            </div>

            {customerMode === "search" && (
              <>
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search by name, email, or phone..." className="w-full rounded-xl border border-[#D7E2F2] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2563EB]" />
                </div>
                {customerSearchLoading && <div className="py-4 text-center text-sm text-slate-500">Searching...</div>}
                {!customerSearchLoading && customerResults.length === 0 && customerSearch && <p className="py-4 text-center text-sm text-slate-500">No customers found.</p>}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customerResults.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomerResults([]); }} className="cursor-pointer rounded-xl border border-[#D7E2F2] p-3 hover:border-[#2563EB] hover:bg-[#F5F8FF]">
                      <p className="font-bold text-[#10213F]">{c.full_name}</p>
                      <p className="text-sm text-slate-600">{c.email}</p>
                      {c.phone && <p className="text-sm text-slate-600">{c.phone}</p>}
                    </div>
                  ))}
                </div>
                {selectedCustomer && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="font-bold text-emerald-700">Selected: {selectedCustomer.full_name}</p>
                    <p className="text-sm text-emerald-600">{selectedCustomer.email}</p>
                  </div>
                )}
              </>
            )}

            {customerMode === "create" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input type="text" required value={newCustomer.full_name} onChange={e => setNewCustomer({ ...newCustomer, full_name: e.target.value })} placeholder="Full Name *" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="email" required value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="Email *" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="Phone" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="text" value={newCustomer.country} onChange={e => setNewCustomer({ ...newCustomer, country: e.target.value })} placeholder="Country" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="text" value={newCustomer.state} onChange={e => setNewCustomer({ ...newCustomer, state: e.target.value })} placeholder="State" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="text" value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value })} placeholder="City" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="text" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Address" className="sm:col-span-2 rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <input type="text" value={newCustomer.postal_code} onChange={e => setNewCustomer({ ...newCustomer, postal_code: e.target.value })} placeholder="Postal Code" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
                <button type="button" onClick={async () => {
                  if (!newCustomer.full_name || !newCustomer.email) { setError("Full name and email are required."); return; }
                  try {
                    const res = await api.post("/customers/", newCustomer);
                    const c = res.data?.data;
                    setSelectedCustomer({ id: c.id, full_name: c.full_name, email: c.email, phone: c.phone || "", country: c.country || "", city: c.city || "" });
                    setNewCustomer({ full_name: "", email: "", phone: "", country: "", state: "", city: "", address: "", postal_code: "" });
                  } catch (e: any) { setError(e.response?.data?.detail || "Could not create customer."); }
                }} className="sm:col-span-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8]">Create Customer</button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Tour & Date */}
        {step === 2 && (
          <div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={tourSearch} onChange={e => setTourSearch(e.target.value)} placeholder="Search tours by name..." className="w-full rounded-xl border border-[#D7E2F2] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2563EB]" />
            </div>
            {tourSearchLoading && <div className="py-4 text-center text-sm text-slate-500">Searching...</div>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-72 overflow-y-auto">
              {tourResults.map(t => (
                <div key={t.id} onClick={() => { setSelectedTour(t); setTourSearch(""); setTourResults([]); }} className="cursor-pointer rounded-xl border border-[#D7E2F2] p-3 hover:border-[#2563EB] hover:bg-[#F5F8FF]">
                  <p className="font-bold text-[#10213F]">{t.title}</p>
                  <p className="text-sm text-slate-600">{t.category_name} • {t.country_name}</p>
                  <p className="text-sm text-slate-600">{t.number_of_days} day{t.number_of_days !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            {selectedTour && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-black text-[#10213F]">Select a departure date</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedTour.departures.map(d => (
                    <button key={d.id} type="button" onClick={() => { setSelectedCalendarId(d.id); setSelectedTourDate(d.date); }} disabled={d.slots <= 0} className={`rounded-xl border p-2.5 text-left text-sm font-bold ${selectedCalendarId === d.id ? "border-[#2563EB] bg-[#F5F8FF] text-[#2563EB]" : "border-[#D7E2F2] bg-white text-[#10213F] hover:border-[#2563EB]"} ${d.slots <= 0 ? "cursor-not-allowed opacity-50" : ""}`}>
                      <p>{dateText(d.date)}</p>
                      <p className="text-xs font-normal">{d.slots} slots left</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Travellers */}
        {step === 3 && (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Adults (12-120)</label>
                <input type="number" min={1} max={20} value={adults} onChange={e => setAdults(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className="mt-1 w-full rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Children (2-11)</label>
                <input type="number" min={0} max={20} value={children} onChange={e => setChildren(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))} className="mt-1 w-full rounded-xl border border-[#D7E2F2] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB]" />
              </div>
            </div>

            <div className="space-y-3">
              {travellers.map((t, i) => (
                <div key={i} className="rounded-xl border border-[#D7E2F2] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-black text-[#10213F]">#{i + 1} {t.traveller_type === "adult" ? "Adult" : "Child"}</span>
                    {t.is_primary_contact && <span className="rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">Primary Contact</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input type="text" value={t.first_name} onChange={e => { const arr = [...travellers]; arr[i].first_name = e.target.value; setTravellers(arr); }} placeholder="First Name" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]" />
                    <input type="text" value={t.last_name} onChange={e => { const arr = [...travellers]; arr[i].last_name = e.target.value; setTravellers(arr); }} placeholder="Last Name" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]" />
                    <input type="number" min={t.traveller_type === "adult" ? 12 : 2} max={t.traveller_type === "adult" ? 120 : 11} value={t.age} onChange={e => { const arr = [...travellers]; arr[i].age = e.target.value; setTravellers(arr); }} placeholder="Age" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D7E2F2] p-4">
              <h3 className="mb-2 text-sm font-black text-[#10213F]">Customer</h3>
              <p className="font-bold">{selectedCustomer?.full_name}</p>
              <p className="text-sm text-slate-600">{selectedCustomer?.email}</p>
            </div>
            <div className="rounded-xl border border-[#D7E2F2] p-4">
              <h3 className="mb-2 text-sm font-black text-[#10213F]">Tour</h3>
              <p className="font-bold">{selectedTour?.title}</p>
              <p className="text-sm text-slate-600">{selectedTour?.category_name} • {dateText(selectedTourDate)}</p>
            </div>
            <div className="rounded-xl border border-[#D7E2F2] p-4">
              <h3 className="mb-2 text-sm font-black text-[#10213F]">Travellers</h3>
              <p className="text-sm text-slate-600">{adults} adult{adults !== 1 ? "s" : ""} · {children} child{children !== 1 ? "s" : ""}</p>
            </div>

            <div className="rounded-xl border border-[#D7E2F2] p-4">
              <h3 className="mb-3 text-sm font-black text-[#10213F]">Agent Pricing</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input type="number" min={0} step={0.01} value={agentMarkup} onChange={e => setAgentMarkup(e.target.value)} placeholder="Agent Markup" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]" />
                <select value={agentPaymentMethod} onChange={e => setAgentPaymentMethod(e.target.value as any)} className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]">
                  <option value="">Online Payment</option>
                  <option value="credit">Credit (Pay Later)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="pay_later">Pay Later</option>
                </select>
                <input type="text" value={agentReference} onChange={e => setAgentReference(e.target.value)} placeholder="Agent Reference" className="rounded-xl border border-[#D7E2F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]" />
              </div>
            </div>

            {priceQuote && (
              <div className="rounded-xl border border-[#D7E2F2] p-4">
                <h3 className="mb-2 text-sm font-black text-[#10213F]">Price Quote</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Base Amount</span><span>{money(priceQuote.base_amount, priceQuote.currency)}</span></div>
                  <div className="flex justify-between"><span>Agent Markup</span><span>{money(priceQuote.agent_markup, priceQuote.currency)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total</span><span>{money(priceQuote.final_amount, priceQuote.currency)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && (
          <div className="text-center py-8">
            {priceQuote && (
              <div className="mb-6">
                <p className="text-2xl font-black text-[#10213F]">{money(priceQuote.final_amount, priceQuote.currency)}</p>
                <p className="text-sm text-slate-600">Total booking amount</p>
              </div>
            )}
            <p className="mb-6 text-sm text-slate-600">Click below to create the booking and proceed to payment.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between border-t border-[#E7EDF6] pt-4">
          <button type="button" onClick={prevStep} disabled={step === 1} className="flex items-center gap-1.5 rounded-xl border border-[#D7E2F2] bg-white px-4 py-2.5 text-sm font-bold text-[#355174] disabled:opacity-50">
            <ArrowLeft size={14} /> Back
          </button>
          {step < totalSteps ? (
            <button type="button" onClick={nextStep} className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8]">
              {step === 4 ? "Calculate Price" : "Continue"} <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={createBooking} disabled={loading} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={14} />} Create & Pay
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && bookingId && priceQuote && (
        <BookingPaymentModal
          bookingId={bookingId}
          outstandingAmount={Number(priceQuote.final_amount)}
          totalAmount={Number(priceQuote.final_amount)}
          amountPaid={0}
          preferredPaymentType="full"
          currency={priceQuote.currency}
          returnPath={`/agent/bookings/${bookingId}`}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); router.push(`/agent/bookings/${bookingId}?new=1&pay=1`); }}
        />
      )}
    </AgentPageShell>
  );
}
