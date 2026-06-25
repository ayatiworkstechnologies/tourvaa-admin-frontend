"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Heart, LogIn, MapPin, MessageSquare, Minus, Plus, Share2,
  Star, Users, X, XCircle,
} from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import api from "@/lib/api";
import { combinePhone } from "@/lib/validators";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/publicApi";
import { mediaUrl } from "@/lib/media-url";
import { useAuthContext } from "@/providers/AuthProvider";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80";

const INPUT = "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-[#0F172A] outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100";

/* ─── Section wrapper ─── */
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        {icon && <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0A0F1E] text-sky-400">{icon}</div>}
        <h2 className="text-base font-bold text-[#0F172A]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ─── Itinerary day accordion ─── */
function ItineraryDay({ day, title, description, accommodation, meals, open, onToggle }: {
  day: number; title: string; description: string; accommodation: string; meals: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-200 ${open ? "border-sky-200 shadow-sm" : "border-slate-200"}`}>
      <button type="button" onClick={onToggle} className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${open ? "bg-sky-50" : "bg-white hover:bg-slate-50"}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${open ? "bg-[#0A0F1E] text-sky-400" : "bg-slate-100 text-slate-600"}`}>
            {day}
          </span>
          <span className="font-bold text-[#0F172A]">{title || `Day ${day}`}</span>
        </div>
        {open ? <ChevronUp size={15} className="shrink-0 text-sky-500" /> : <ChevronDown size={15} className="shrink-0 text-slate-400" />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-5 py-4 text-sm">
          {description && <p className="leading-7 text-slate-600">{description}</p>}
          {accommodation && (
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-bold text-slate-500">🏨 Accommodation:</span>
              <span className="text-xs text-slate-600">{accommodation}</span>
            </div>
          )}
          {meals && (
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-bold text-slate-500">🍽️ Meals:</span>
              <span className="text-xs text-slate-600">{meals}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Enquiry form ─── */
function EnquiryForm({ tourTitle }: { tourTitle: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", date: "" });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (sent) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <p className="mt-3 font-bold text-[#0F172A]">Enquiry sent!</p>
        <p className="mt-1 text-xs text-slate-500">Our team will contact you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-3">
      <p className="text-sm text-slate-500">
        Interested in <strong className="font-bold text-slate-700">{tourTitle}</strong>?
      </p>
      <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your Name" className={INPUT} />
      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email Address" className={INPUT} />
      <PhoneInput countryCode={phoneCountryCode} number={form.phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={(v) => set("phone", v)} label="Phone (optional)" />
      <input type="date" title="Preferred travel date" value={form.date} onChange={(e) => set("date", e.target.value)} className={INPUT} />
      <textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Special requirements?" rows={3} className={`${INPUT} resize-none`} />
      <button type="submit" className="w-full rounded-xl bg-[#0A0F1E] py-3 text-sm font-bold text-white transition-all hover:bg-sky-600 hover:shadow-md">
        Send Enquiry
      </button>
    </form>
  );
}

/* ─── Booking modal ─── */
type PricingSlab = { persons_from: number; persons_to: number | null; price_per_person: number; currency: string };

function calcPrice(slabs: PricingSlab[], adults: number, children: number) {
  const totalPax = adults + children;
  if (!slabs.length || totalPax === 0) return { perPerson: 0, total: 0, currency: "AED" };
  const match = slabs.find((s) => totalPax >= s.persons_from && (s.persons_to === null || totalPax <= s.persons_to)) ?? slabs[slabs.length - 1];
  return { perPerson: match.price_per_person, total: match.price_per_person * totalPax, currency: match.currency };
}

type BookingStep = "details" | "traveler" | "confirm" | "success" | "error";

function BookingModal({ tour, customerId, customerName, customerEmail, onClose }: {
  tour: PublicTourDetail; customerId: number | null; customerName: string; customerEmail: string; onClose: () => void;
}) {
  const [step, setStep] = useState<BookingStep>("details");
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const pricing = calcPrice(tour.pricing, adults, children);
  const totalPax = adults + children;
  const today = new Date().toISOString().split("T")[0];
  const phoneValue = phone ? combinePhone(phoneCountryCode, phone) : "";

  const handleBook = async () => {
    if (!customerId) { setErrMsg("Customer account not identified. Please sign out and sign back in."); setStep("error"); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/bookings/", {
        customer_id: customerId, tour_id: tour.id, tour_name: tour.title,
        tour_date: travelDate, tour_start_date: travelDate,
        no_of_adults: adults, no_of_children: children,
        currency: tour.currency || "AED", booking_source: "customer",
        payment_type: "full", total_cost: pricing.total,
        customer_notes: notes || undefined,
        travellers: [{ traveller_type: "adult", full_name: name, email, phone: phoneValue, is_primary_contact: true }],
      });
      setBookingCode(res.data?.data?.booking_code ?? res.data?.booking_code ?? "—");
      setStep("success");
    } catch (err: unknown) {
      setErrMsg((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Booking could not be created.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  const stepIdx = ["details", "traveler", "confirm"].indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {stepIdx >= 0 && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Step {stepIdx + 1} of 3 — {["Trip Details", "Your Details", "Review & Confirm"][stepIdx]}
              </p>
            )}
            <h2 className="font-bold text-[#0F172A]">{tour.title}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        {stepIdx >= 0 && (
          <div className="flex gap-1 px-6 pt-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${stepIdx >= i ? "bg-sky-500" : "bg-slate-100"}`} />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1 */}
          {step === "details" && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Travel Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" title="Travel date" min={today} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className={`${INPUT} pl-9`} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Travellers</label>
                <div className="space-y-2.5">
                  {[
                    { label: "Adults", sub: "Age 12+", value: adults, min: 1, set: setAdults },
                    { label: "Children", sub: "Age 2–11", value: children, min: 0, set: setChildren },
                  ].map(({ label, sub, value, min, set: setter }) => (
                    <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{label}</p>
                        <p className="text-xs text-slate-400">{sub}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={`Decrease ${label}`} onClick={() => setter(Math.max(min, value - 1))} disabled={value <= min} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-[#0F172A]">{value}</span>
                        <button type="button" aria-label={`Increase ${label}`} onClick={() => setter(value + 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {tour.pricing.length > 0 && totalPax > 0 && (
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">{totalPax} traveller{totalPax > 1 ? "s" : ""} × {pricing.currency} {pricing.perPerson.toLocaleString()}</p>
                      <p className="mt-0.5 text-xl font-black text-sky-600">{pricing.currency} {pricing.total.toLocaleString()}</p>
                    </div>
                    <Users size={20} className="text-sky-400" />
                  </div>
                </div>
              )}
              {tour.calendar.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  <span className="font-bold">Available dates: </span>
                  {tour.calendar.filter((c) => c.status === "available").slice(0, 3).map((c) => c.date).join(", ")}
                  {tour.calendar.filter((c) => c.status === "available").length > 3 && " and more…"}
                </div>
              )}
            </div>
          )}

          {/* Step 2 */}
          {step === "traveler" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Full Name <span className="text-red-500">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Primary traveller name" className={INPUT} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Phone <span className="text-red-500">*</span></label>
                <PhoneInput countryCode={phoneCountryCode} number={phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={setPhone} label="Phone" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Special Requirements</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Dietary needs, accessibility…" className={`${INPUT} resize-none`} />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50">
                {[
                  ["Tour", tour.title],
                  ["Travel Date", travelDate],
                  ["Adults", String(adults)],
                  ...(children > 0 ? [["Children", String(children)]] : []),
                  ["Contact", `${name} · ${email}`],
                  ...(phoneValue ? [["Phone", phoneValue]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-400">{label}</span>
                    <span className="max-w-[55%] text-right font-semibold text-[#0F172A]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Total amount</p>
                    <p className="text-2xl font-black text-sky-600">
                      {pricing.total > 0 ? `${pricing.currency} ${pricing.total.toLocaleString()}` : "Price on request"}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-600">{totalPax} pax</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Payment terms confirmed by our team after booking.</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-sky-500" />
                <span className="text-xs text-slate-500">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="font-bold text-sky-600 hover:underline">Terms & Conditions</a>
                  {" "}and{" "}
                  <a href="/cancellation-policy" target="_blank" className="font-bold text-sky-600 hover:underline">Cancellation Policy</a>.
                </span>
              </label>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#0F172A]">Booking Confirmed!</h3>
              <p className="mt-1 text-sm text-slate-500">Our team will be in touch shortly.</p>
              {bookingCode && (
                <div className="mt-4 rounded-xl bg-[#0A0F1E] px-6 py-3">
                  <p className="text-xs font-semibold text-white/40">Booking Reference</p>
                  <p className="mt-0.5 text-lg font-black text-sky-400">{bookingCode}</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <Link href="/customer/dashboard" onClick={onClose} className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
                  My Dashboard
                </Link>
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <XCircle size={36} className="text-red-400" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#0F172A]">Unable to complete booking</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-500">{errMsg}</p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep("confirm")} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Go back
                </button>
                <Link href="/contact" onClick={onClose} className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
                  Contact Us
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {stepIdx >= 0 && (
          <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
            {step !== "details" && (
              <button type="button" onClick={() => setStep(step === "confirm" ? "traveler" : "details")} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step === "details" && (
              <button type="button" disabled={!travelDate || adults < 1} onClick={() => setStep("traveler")} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-40">
                Continue <ArrowRight size={14} />
              </button>
            )}
            {step === "traveler" && (
              <button type="button" disabled={!name.trim() || !email.trim() || !phoneValue.trim()} onClick={() => setStep("confirm")} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-40">
                Review Booking <ArrowRight size={14} />
              </button>
            )}
            {step === "confirm" && (
              <button type="button" disabled={!agreed || submitting} onClick={handleBook} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-40">
                {submitting ? "Confirming…" : "Confirm Booking"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Guest prompt ─── */
function GuestPrompt({ onClose, tourId, isLoggedIn }: { onClose: () => void; tourId: number; isLoggedIn?: boolean }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
          <X size={16} />
        </button>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0F1E]">
          <LogIn size={22} className="text-sky-400" />
        </div>
        <h3 className="mt-4 text-lg font-black text-[#0F172A]">
          {isLoggedIn ? "Customer account required" : "Sign in to book"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {isLoggedIn
            ? "Bookings require a customer account. Switch to customer login to continue."
            : "Create a free account or sign in to complete your booking."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => { onClose(); router.push(`/login?redirect=/tours/${tourId}`); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-600"
          >
            <LogIn size={15} /> {isLoggedIn ? "Customer Sign In" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); router.push("/register"); }}
            className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function TourDetailPage() {
  const params = useParams<{ id: string }>();
  const { isLoggedIn, loading: authLoading, user, dashboard, refreshSession } = useAuthContext();
  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary" | "inclusions" | "gallery" | "calendar">("overview");
  const [showModal, setShowModal] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) { setNotFound(true); setLoading(false); return; }
    fetchPublicTourDetail(id)
      .then((data) => setTour({
        ...data,
        itineraries: data.itineraries ?? [],
        highlights: data.highlights ?? [],
        inclusions: data.inclusions ?? [],
        exclusions: data.exclusions ?? [],
        gallery: data.gallery ?? [],
        pricing: data.pricing ?? [],
        optional_activities: data.optional_activities ?? [],
        extensions: data.extensions ?? [],
        discounts: data.discounts ?? [],
        calendar: data.calendar ?? [],
        similar_tours: data.similar_tours ?? [],
      }))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <p className="text-sm text-slate-500">Loading tour…</p>
        </div>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F8FC]">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
          <MapPin size={36} className="text-slate-400" />
        </div>
        <p className="text-lg font-bold text-[#0F172A]">Tour not found</p>
        <Link href="/tours" className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600">
          Browse All Tours
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "itinerary", label: `Itinerary (${tour.itineraries.length}d)` },
    { key: "inclusions", label: "Inclusions" },
    { key: "gallery", label: `Gallery (${tour.gallery.length})` },
    { key: "calendar", label: "Dates" },
  ] as const;

  const roleSlug = dashboard?.user?.role?.slug;
  const customerId = dashboard?.user?.customer_id ?? user?.customer_id ?? null;
  const isCustomer = isLoggedIn && roleSlug === "customer";

  const handleBookClick = async () => {
    if (!isLoggedIn) { setShowModal(true); return; }
    setCheckingAccount(true);
    try { await refreshSession(); } finally { setCheckingAccount(false); setShowModal(true); }
  };

  const allImages = tour.gallery.length > 0
    ? tour.gallery.map((g) => mediaUrl(g.image_url))
    : [tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER];

  return (
    <main className="min-h-screen bg-[#F5F8FC] pb-24">
      {/* Modals */}
      {showModal && !authLoading && (
        isLoggedIn && isCustomer
          ? <BookingModal tour={tour} customerId={customerId ?? null} customerName={user?.name ?? ""} customerEmail={user?.email ?? ""} onClose={() => setShowModal(false)} />
          : <GuestPrompt onClose={() => setShowModal(false)} tourId={tour.id} isLoggedIn={isLoggedIn} />
      )}

      {/* ─── Hero ─── */}
      <div className="relative h-[65vh] min-h-[460px] bg-[#0A0F1E]">
        <img
          src={allImages[activeImage]}
          alt={tour.title}
          className="h-full w-full object-cover opacity-75 transition-opacity duration-500"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1E]/60 to-transparent" />

        {/* Back + actions */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 md:px-8">
          <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
            <Link href="/tours" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              <ArrowLeft size={14} /> All Tours
            </Link>
            <div className="flex gap-2">
              <button type="button" aria-label="Save to wishlist" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                <Heart size={16} />
              </button>
              <button type="button" aria-label="Share tour" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tour info */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap gap-2">
              {tour.category_name && (
                <span className="rounded-lg bg-sky-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {tour.category_name}
                </span>
              )}
            </div>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
              {tour.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {tour.city_name && (
                <span className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm">
                  <MapPin size={12} /> {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}
                </span>
              )}
              {tour.number_of_days && (
                <span className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm">
                  <Clock size={12} /> {tour.number_of_days} Days
                </span>
              )}
              {tour.price_start_per_person && (
                <span className="flex items-center gap-1.5 rounded-xl bg-sky-500/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                  From {tour.currency || "AED"} {Number(tour.price_start_per_person).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Gallery thumbnails */}
        {tour.gallery.length > 1 && (
          <div className="absolute bottom-4 right-5 z-10 flex gap-1.5 md:right-8">
            {tour.gallery.slice(0, 5).map((img, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveImage(i)}
                className={`h-11 w-16 overflow-hidden rounded-lg border-2 transition-all ${i === activeImage ? "border-sky-400 shadow-lg" : "border-transparent opacity-55 hover:opacity-90"}`}
              >
                <img src={mediaUrl(img.image_url)} alt={img.alt_text || ""} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">

          {/* Left */}
          <div className="space-y-5">
            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === t.key
                      ? "bg-[#0A0F1E] text-sky-400 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {tour.subtitle && <p className="text-base font-semibold text-slate-700">{tour.subtitle}</p>}
                {tour.short_description && <p className="leading-7 text-slate-500">{tour.short_description}</p>}
                {tour.long_description && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="leading-7 text-slate-700">{tour.long_description}</p>
                  </div>
                )}
                {tour.overview && (
                  <Section title="Tour Details" icon={<MapPin size={15} />}>
                    <dl className="grid gap-2.5 sm:grid-cols-2">
                      {([
                        ["Duration", tour.overview.duration_text],
                        ["Start Location", tour.overview.start_location],
                        ["End Location", tour.overview.end_location],
                        ["Group Size", tour.overview.group_size],
                        ["Tour Type", tour.overview.tour_type],
                        ["Physical Rating", tour.overview.physical_rating],
                      ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-[#0F172A]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Section>
                )}
                {tour.highlights.length > 0 && (
                  <Section title="Highlights" icon={<Star size={15} />}>
                    <ul className="space-y-2.5">
                      {tour.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50">
                            <Star size={10} className="text-amber-500" />
                          </span>
                          {h.text}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>
            )}

            {/* Itinerary */}
            {activeTab === "itinerary" && (
              <div className="space-y-2.5">
                {tour.itineraries.length === 0 ? (
                  <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 border border-slate-100 shadow-sm">Itinerary coming soon.</p>
                ) : (
                  tour.itineraries.map((it) => (
                    <ItineraryDay key={it.day} day={it.day} title={it.title} description={it.description} accommodation={it.accommodation} meals={it.meals} open={openDay === it.day} onToggle={() => setOpenDay(openDay === it.day ? null : it.day)} />
                  ))
                )}
              </div>
            )}

            {/* Inclusions */}
            {activeTab === "inclusions" && (
              <div className="grid gap-5 sm:grid-cols-2">
                {tour.inclusions.length > 0 && (
                  <Section title="Inclusions" icon={<CheckCircle2 size={15} />}>
                    <ul className="space-y-2.5">
                      {tour.inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
                {tour.exclusions.length > 0 && (
                  <Section title="Exclusions" icon={<XCircle size={15} />}>
                    <ul className="space-y-2.5">
                      {tour.exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500">
                          <XCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>
            )}

            {/* Gallery */}
            {activeTab === "gallery" && (
              <div className="space-y-3">
                {tour.gallery.length === 0 ? (
                  <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 border border-slate-100 shadow-sm">No gallery images yet.</p>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                      <img src={mediaUrl(tour.gallery[activeImage]?.image_url || tour.gallery[0].image_url)} alt={tour.title} className="h-80 w-full object-cover md:h-96" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {tour.gallery.map((img, i) => (
                        <button key={i} type="button" aria-label={`View image ${i + 1}`} onClick={() => setActiveImage(i)} className={`overflow-hidden rounded-xl border-2 transition-all ${i === activeImage ? "border-sky-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}>
                          <img src={mediaUrl(img.image_url)} alt={img.alt_text || tour.title} className="h-16 w-full object-cover sm:h-20" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Calendar */}
            {activeTab === "calendar" && (
              <Section title="Available Departure Dates" icon={<Calendar size={15} />}>
                {tour.calendar.length === 0 ? (
                  <p className="text-sm text-slate-500">No scheduled departures yet. Contact us for availability.</p>
                ) : (
                  <div className="space-y-2">
                    {tour.calendar.map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A0F1E]">
                            <Calendar size={15} className="text-sky-400" />
                          </div>
                          <span className="font-semibold text-[#0F172A]">{c.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{c.slots} slots</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.status === "available" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Optional activities */}
            {tour.optional_activities.length > 0 && (
              <Section title="Optional Activities" icon={<Star size={15} />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tour.optional_activities.map((a, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-white">
                      <p className="font-bold text-[#0F172A]">{a.name}</p>
                      {a.description && <p className="mt-1 text-xs leading-5 text-slate-500">{a.description}</p>}
                      {a.price && <p className="mt-2 text-sm font-bold text-sky-600">+{a.currency || "AED"} {a.price.toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Extensions */}
            {tour.extensions.length > 0 && (
              <Section title="Extensions" icon={<Clock size={15} />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tour.extensions.map((e, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-white">
                      <p className="font-bold text-[#0F172A]">{e.title}</p>
                      {e.duration_days && <p className="mt-0.5 text-xs text-slate-400">{e.duration_days} extra days</p>}
                      {e.description && <p className="mt-1 text-xs leading-5 text-slate-500">{e.description}</p>}
                      {e.price && <p className="mt-2 text-sm font-bold text-sky-600">+AED {e.price.toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Similar tours */}
            {tour.similar_tours.length > 0 && (
              <section>
                <h2 className="mb-4 text-base font-bold text-[#0F172A]">You might also like</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tour.similar_tours.map((st) => (
                    <Link key={st.id} href={`/tours/${st.id}`} className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <img src={st.banner_image ? mediaUrl(st.banner_image) : PLACEHOLDER} alt={st.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] transition-colors group-hover:text-sky-600">{st.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{st.number_of_days} days · {st.country_name}</p>
                        {st.price_start_per_person && (
                          <p className="mt-1 text-sm font-black text-sky-600">{st.currency} {st.price_start_per_person.toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4">
            <div className="sticky top-6 space-y-4">
              {/* Pricing card */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="bg-[#0A0F1E] px-6 py-5">
                  {tour.price_start_per_person ? (
                    <>
                      <p className="text-xs font-semibold text-white/40">Starting from</p>
                      <p className="mt-1 text-3xl font-black text-white">
                        {tour.currency || "AED"}{" "}
                        <span>{Number(tour.price_start_per_person).toLocaleString()}</span>
                        <span className="text-sm font-normal text-white/40"> /person</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-base font-semibold text-white/70">Price on request</p>
                  )}
                  {/* Stats row */}
                  <div className="mt-4 flex gap-4 border-t border-white/8 pt-4">
                    {tour.number_of_days && (
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <Clock size={12} className="text-sky-400" />
                        {tour.number_of_days} days
                      </div>
                    )}
                    {(tour.city_name || tour.country_name) && (
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <MapPin size={12} className="text-sky-400" />
                        {tour.country_name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  {tour.discounts.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      {tour.discounts.map((d, i) => (
                        <div key={i} className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                          🎉 {d.label} — {d.discount_type === "percentage" ? `${d.value}% off` : `AED ${d.value} off`}
                        </div>
                      ))}
                    </div>
                  )}

                  {tour.pricing.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group pricing</p>
                      {tour.pricing.map((p, i) => (
                        <div key={i} className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm">
                          <span className="text-slate-400">{p.persons_from}{p.persons_to ? `–${p.persons_to}` : "+"} persons</span>
                          <span className="font-bold text-[#0F172A]">{p.currency} {p.price_per_person.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBookClick}
                    disabled={checkingAccount}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-bold text-white shadow-[0_0_16px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-600 hover:shadow-[0_0_24px_rgba(14,165,233,0.45)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {checkingAccount ? "Checking…" : "Book This Tour"}
                  </button>

                  {!isLoggedIn && (
                    <Link href="/login" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50">
                      Already a member? Login
                    </Link>
                  )}
                </div>
              </div>

              {/* Enquiry card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0A0F1E]">
                    <MessageSquare size={15} className="text-sky-400" />
                  </div>
                  <h3 className="font-bold text-[#0F172A]">Send an Enquiry</h3>
                </div>
                <EnquiryForm tourTitle={tour.title} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
