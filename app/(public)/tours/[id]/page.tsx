"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCalendar as Calendar, LuCircleCheckBig as CheckCircle2, LuChevronDown as ChevronDown, LuChevronUp as ChevronUp, LuClock as Clock, LuHeart as Heart, LuLogIn as LogIn, LuMapPin as MapPin, LuMessageSquare as MessageSquare, LuMinus as Minus, LuPlus as Plus, LuShare2 as Share2, LuStar as Star, LuUsers as Users, LuX as X, LuCircleX as XCircle, LuBed as Bed, LuUtensils as Utensils, LuPartyPopper as PartyPopper } from "react-icons/lu";
import PhoneInput from "@/components/ui/PhoneInput";
import api from "@/lib/api";
import { combinePhone } from "@/lib/validators";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/publicApi";
import { mediaUrl } from "@/lib/media-url";
import { useAuthContext } from "@/providers/AuthProvider";
import DatePicker from "@/components/ui/DatePicker";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80";

const INPUT = "w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 px-4 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

// section wrapper
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="mb-6 flex items-center gap-3">
        {icon && <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">{icon}</div>}
        <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// itinerary day accordion
function ItineraryDay({ day, title, description, accommodation, meals, open, onToggle }: {
  day: number; title: string; description: string; accommodation: string; meals: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${open ? "border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white" : "border-zinc-100 bg-white"}`}>
      <button type="button" onClick={onToggle} className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${open ? "bg-indigo-50/50" : "hover:bg-zinc-50"}`}>
        <div className="flex items-center gap-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors ${open ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-zinc-100 text-zinc-500"}`}>
            {day}
          </span>
          <span className="font-bold text-zinc-950 text-base">{title || `Day ${day}`}</span>
        </div>
        {open ? <ChevronUp size={18} className="shrink-0 text-indigo-600" /> : <ChevronDown size={18} className="shrink-0 text-zinc-400" />}
      </button>
      {open && (
        <div className="space-y-4 border-t border-indigo-50 px-6 py-5 text-sm">
          {description && <p className="leading-relaxed text-zinc-600">{description}</p>}
          {accommodation && (
            <div className="flex items-start gap-2.5 rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500"><Bed size={14} /> Accommodation:</span>
              <span className="text-sm font-semibold text-zinc-700">{accommodation}</span>
            </div>
          )}
          {meals && (
            <div className="flex items-start gap-2.5 rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500"><Utensils size={14} /> Meals:</span>
              <span className="text-sm font-semibold text-zinc-700">{meals}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// enquiry form
function EnquiryForm({ tourTitle }: { tourTitle: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", date: "" });
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (sent) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <p className="text-lg font-black text-zinc-950">Enquiry sent!</p>
        <p className="mt-2 text-sm font-medium text-zinc-500">Our team will contact you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
      <p className="text-sm font-medium text-zinc-500 mb-2">
        Interested in <strong className="font-bold text-zinc-950">{tourTitle}</strong>?
      </p>
      <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your Name" className={INPUT} />
      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email Address" className={INPUT} />
      <PhoneInput countryCode={phoneCountryCode} number={form.phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={(v) => set("phone", v)} label="Phone (optional)" />
      <input type="date" title="Preferred travel date" value={form.date} onChange={(e) => set("date", e.target.value)} className={INPUT} />
      <textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Special requirements?" rows={3} className={`${INPUT} resize-none`} />
      <button type="submit" className="w-full rounded-xl bg-zinc-950 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:shadow-lg mt-2">
        Send Enquiry
      </button>
    </form>
  );
}

// booking modal
type PricingSlab = { persons_from: number; persons_to: number | null; price_per_person: number; currency: string };

function calcPrice(slabs: PricingSlab[], adults: number, children: number, fallbackCurrency: string, basePrice: number = 0) {
  const totalPax = adults + children;
  if (!slabs.length || totalPax === 0) return { perPerson: basePrice, total: basePrice * totalPax, currency: fallbackCurrency };
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

  const pricing = calcPrice(tour.pricing, adults, children, tour.currency || "AED", tour.price_start_per_person || 0);
  const totalPax = adults + children;
  const today = new Date().toISOString().split("T")[0];
  const phoneValue = phone ? combinePhone(phoneCountryCode, phone) : "";
  
  const allImages = tour.gallery.length > 0
    ? tour.gallery.map((g) => mediaUrl(g.image_url))
    : [tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER];
  const heroImage = allImages[0];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 flex h-full max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:flex-row">
        
        {/* Left Column - Order Context */}
        <div className="relative hidden w-2/5 flex-col bg-zinc-950 text-white lg:flex">
          <div className="absolute inset-0">
            <img src={heroImage} alt={tour.title} className="h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 bg-indigo-950/30 mix-blend-multiply" />
          </div>
          
          <div className="relative flex h-full flex-col p-10">
             <div className="mt-auto space-y-6">
                <div>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                    <MapPin size={12} className="text-indigo-400" />
                    {tour.city_name || "Tour"}
                  </div>
                  <h2 className="text-3xl font-black leading-tight drop-shadow-md">{tour.title}</h2>
                </div>

                {/* Live Order Summary */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-lg">
                   <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-200">Your Booking</h3>
                   
                   <div className="space-y-3 text-sm font-medium text-white/80">
                     <div className="flex justify-between">
                       <span>Date</span>
                       <span className="font-bold text-white">{travelDate ? new Date(travelDate).toLocaleDateString() : "Not selected"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Adults ({adults})</span>
                       <span className="text-white">{pricing.perPerson > 0 ? `${pricing.currency} ${(pricing.perPerson * adults).toLocaleString()}` : "TBD"}</span>
                     </div>
                     {children > 0 && (
                       <div className="flex justify-between">
                         <span>Children ({children})</span>
                         <span className="text-white">{pricing.perPerson > 0 ? `${pricing.currency} ${(pricing.perPerson * children).toLocaleString()}` : "TBD"}</span>
                       </div>
                     )}
                     <div className="my-3 h-px w-full bg-white/20" />
                     <div className="flex items-center justify-between">
                       <span className="text-base font-bold">Total</span>
                       <span className="text-xl font-black text-white">{pricing.total > 0 ? `${pricing.currency} ${pricing.total.toLocaleString()}` : "Price on request"}</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column - Interactive Form */}
        <div className="flex h-full w-full flex-col bg-zinc-50 lg:w-3/5">
           
           {/* Header */}
           <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-5 sm:px-10">
             <div>
                {stepIdx >= 0 && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                    Step {stepIdx + 1} of 3
                  </p>
                )}
                <h2 className="text-xl font-black text-zinc-950">
                   {step === "details" && "Trip Details"}
                   {step === "traveler" && "Guest Details"}
                   {step === "confirm" && "Review & Confirm"}
                   {step === "success" && "Booking Confirmed"}
                   {step === "error" && "Booking Failed"}
                </h2>
             </div>
             <button type="button" aria-label="Close" onClick={onClose} className="rounded-full bg-zinc-100 p-2.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950">
               <X size={20} />
             </button>
           </div>

           {/* Progress Line */}
           {stepIdx >= 0 && (
             <div className="flex h-1 w-full bg-zinc-100">
                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((stepIdx + 1) / 3) * 100}%` }} />
             </div>
           )}

           {/* Scrollable Content Area */}
           <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
             
             {step === "details" && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div>
                   <DatePicker
                     value={travelDate}
                     onChange={setTravelDate}
                     minDate={today}
                     label="Select Travel Date *"
                     availableDates={tour.calendar.filter((c) => c.status === "available").map((c) => c.date)}
                   />
                   {tour.calendar.length > 0 && (
                     <p className="mt-3 text-xs font-medium text-zinc-500">
                       Available soon: {tour.calendar.filter((c) => c.status === "available").slice(0, 3).map((c) => c.date).join(", ")}
                     </p>
                   )}
                 </div>

                 <div>
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Who is traveling?</label>
                   <div className="space-y-4">
                     {[
                       { label: "Adults", sub: "Age 12+", value: adults, min: 1, set: setAdults },
                       { label: "Children", sub: "Age 2–11", value: children, min: 0, set: setChildren },
                     ].map(({ label, sub, value, min, set: setter }) => (
                       <div key={label} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
                         <div>
                           <p className="text-sm font-bold text-zinc-950">{label}</p>
                           <p className="text-xs font-medium text-zinc-400">{sub}</p>
                         </div>
                         <div className="flex items-center gap-5">
                           <button type="button" aria-label={`Decrease ${label}`} onClick={() => setter(Math.max(min, value - 1))} disabled={value <= min} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:bg-transparent disabled:text-zinc-300 disabled:opacity-50">
                             <Minus size={16} />
                           </button>
                           <span className="w-6 text-center text-lg font-black text-zinc-950">{value}</span>
                           <button type="button" aria-label={`Increase ${label}`} onClick={() => setter(value + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950">
                             <Plus size={16} />
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Mobile only pricing block since left col is hidden on mobile */}
                 {tour.pricing.length > 0 && totalPax > 0 && (
                    <div className="block rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-5 lg:hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-600/70">{totalPax} traveller{totalPax > 1 ? "s" : ""} × {pricing.perPerson > 0 ? `${pricing.currency} ${pricing.perPerson.toLocaleString()}` : "TBD"}</p>
                          <p className="text-2xl font-black text-indigo-600">{pricing.total > 0 ? `${pricing.currency} ${pricing.total.toLocaleString()}` : "Price on request"}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                          <Users size={20} className="text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  )}
               </div>
             )}

             {step === "traveler" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div>
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name <span className="text-red-500">*</span></label>
                   <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Primary traveller name" className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-bold text-zinc-950 shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10" />
                 </div>
                 <div>
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address <span className="text-red-500">*</span></label>
                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-bold text-zinc-950 shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10" />
                 </div>
                 <div>
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Phone <span className="text-red-500">*</span></label>
                   <PhoneInput countryCode={phoneCountryCode} number={phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={setPhone} label="Phone" required />
                 </div>
                 <div>
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Special Requirements</label>
                   <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Dietary needs, accessibility…" className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10" />
                 </div>
               </div>
             )}

             {step === "confirm" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                   {[
                     ["Tour", tour.title],
                     ["Travel Date", travelDate],
                     ["Adults", String(adults)],
                     ...(children > 0 ? [["Children", String(children)]] : []),
                     ["Contact", `${name} · ${email}`],
                     ...(phoneValue ? [["Phone", phoneValue]] : []),
                   ].map(([label, value], i) => (
                     <div key={label} className={`flex justify-between px-5 py-4 text-sm ${i % 2 === 0 ? "bg-zinc-50/50" : "bg-white"}`}>
                       <span className="font-bold text-zinc-500">{label}</span>
                       <span className="max-w-[60%] text-right font-black text-zinc-950">{value}</span>
                     </div>
                   ))}
                 </div>
                 
                 <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-6 py-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-600/70">Total Amount Due</p>
                       <p className="text-3xl font-black text-indigo-600">
                         {pricing.total > 0 ? `${pricing.currency} ${pricing.total.toLocaleString()}` : "Price on request"}
                       </p>
                     </div>
                     <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-indigo-600 shadow-sm">{totalPax}</span>
                   </div>
                   <p className="mt-4 text-xs font-medium text-indigo-600/60">Payment terms will be confirmed by our team after your booking is processed.</p>
                 </div>
                 
                 <label className="flex cursor-pointer items-start gap-3 px-1">
                   <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600" />
                   <span className="text-xs font-medium leading-relaxed text-zinc-500">
                     I agree to the{" "}
                     <a href="/terms" target="_blank" className="font-bold text-indigo-600 hover:underline">Terms & Conditions</a>
                     {" "}and{" "}
                     <a href="/cancellation-policy" target="_blank" className="font-bold text-indigo-600 hover:underline">Cancellation Policy</a>.
                   </span>
                 </label>
               </div>
             )}

             {step === "success" && (
               <div className="flex flex-col items-center py-10 text-center duration-500 animate-in zoom-in-95">
                 <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
                   <CheckCircle2 size={48} className="text-emerald-500" />
                 </div>
                 <h3 className="text-3xl font-black text-zinc-950">Booking Confirmed!</h3>
                 <p className="mt-3 text-base font-medium text-zinc-500">Our team will be in touch shortly to finalize the details.</p>
                 
                 {bookingCode && (
                   <div className="mt-8 w-full rounded-3xl border border-zinc-200 bg-white px-8 py-6 shadow-sm">
                     <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Your Booking Reference</p>
                     <p className="text-3xl font-black tracking-widest text-indigo-600">{bookingCode}</p>
                   </div>
                 )}
                 
                 <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                   <Link href="/customer/dashboard" onClick={onClose} className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700">
                     Go to My Dashboard
                   </Link>
                   <button type="button" onClick={onClose} className="flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">
                     Close
                   </button>
                 </div>
               </div>
             )}

             {step === "error" && (
               <div className="flex flex-col items-center py-10 text-center duration-500 animate-in zoom-in-95">
                 <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
                   <XCircle size={48} className="text-red-500" />
                 </div>
                 <h3 className="text-3xl font-black text-zinc-950">Unable to Complete Booking</h3>
                 <p className="mt-3 max-w-sm text-base font-medium text-zinc-500">{errMsg}</p>
                 
                 <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                   <button type="button" onClick={() => setStep("confirm")} className="flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">
                     Go Back & Try Again
                   </button>
                   <Link href="/contact" onClick={onClose} className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700">
                     Contact Support
                   </Link>
                 </div>
               </div>
             )}

           </div>
           
           {/* Footer actions */}
           {stepIdx >= 0 && (
             <div className="flex items-center gap-4 border-t border-zinc-100 bg-white px-6 py-5 sm:px-10">
               {step !== "details" && (
                 <button type="button" onClick={() => setStep(step === "confirm" ? "traveler" : "details")} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50">
                   <ArrowLeft size={16} /> Back
                 </button>
               )}
               {step === "details" && (
                 <button type="button" disabled={!travelDate || adults < 1} onClick={() => setStep("traveler")} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:shadow-none disabled:opacity-50">
                   Continue to Guest Details <ArrowRight size={16} />
                 </button>
               )}
               {step === "traveler" && (
                 <button type="button" disabled={!name.trim() || !email.trim() || !phoneValue.trim()} onClick={() => setStep("confirm")} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:shadow-none disabled:opacity-50">
                   Review Booking <ArrowRight size={16} />
                 </button>
               )}
               {step === "confirm" && (
                 <button type="button" disabled={!agreed || submitting} onClick={handleBook} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:shadow-none disabled:opacity-50">
                   {submitting ? "Processing..." : "Confirm Booking"}
                 </button>
               )}
             </div>
           )}

        </div>
      </div>
    </div>
  );
}

// guest prompt
function GuestPrompt({ onClose, tourId, isLoggedIn }: { onClose: () => void; tourId: number; isLoggedIn?: boolean }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
          <X size={16} />
        </button>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
          <LogIn size={22} className="text-sky-400" />
        </div>
        <h3 className="mt-4 text-lg font-black text-zinc-950">
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
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-sky-600"
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

// main page
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-200 border-t-indigo-600" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading tour…</p>
        </div>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-50">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm border border-zinc-100">
          <MapPin size={40} className="text-zinc-300" />
        </div>
        <p className="text-2xl font-black text-zinc-950">Tour not found</p>
        <Link href="/tours" className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
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
    <main className="min-h-screen bg-zinc-50 pb-32">
      {/* Modals */}
      {showModal && !authLoading && (
        isLoggedIn && isCustomer
          ? <BookingModal tour={tour} customerId={customerId ?? null} customerName={user?.name ?? ""} customerEmail={user?.email ?? ""} onClose={() => setShowModal(false)} />
          : <GuestPrompt onClose={() => setShowModal(false)} tourId={tour.id} isLoggedIn={isLoggedIn} />
      )}

      {/* hero */}
      <div className="relative h-[70vh] min-h-[500px] bg-zinc-950">
        <img
          src={allImages[activeImage]}
          alt={tour.title}
          className="h-full w-full object-cover opacity-60 transition-all duration-700 hover:scale-105"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent" />

        {/* Back + actions */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-6 md:px-8">
          <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
            <Link href="/tours" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/10 shadow-sm">
              <ArrowLeft size={16} /> All Tours
            </Link>
            <div className="flex gap-2">
              <button type="button" aria-label="Save to wishlist" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 border border-white/10 shadow-sm">
                <Heart size={18} />
              </button>
              <button type="button" aria-label="Share tour" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 border border-white/10 shadow-sm">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tour info */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-10 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap gap-2">
              {tour.category_name && (
                <span className="rounded-xl bg-indigo-600/90 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm border border-indigo-500/20">
                  {tour.category_name}
                </span>
              )}
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-sm">
              {tour.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {tour.city_name && (
                <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
                  <MapPin size={14} className="text-indigo-400" /> {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}
                </span>
              )}
              {tour.number_of_days && (
                <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
                  <Clock size={14} className="text-indigo-400" /> {tour.number_of_days} Days
                </span>
              )}
              {tour.price_start_per_person && (
                <span className="flex items-center gap-2 rounded-xl bg-indigo-600/90 px-4 py-2 text-sm font-bold text-white backdrop-blur-md shadow-sm border border-indigo-500/20">
                  From {tour.currency || "AED"} {Number(tour.price_start_per_person).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Gallery thumbnails */}
        {tour.gallery.length > 1 && (
          <div className="absolute bottom-6 right-5 z-10 flex gap-2 md:right-8">
            {tour.gallery.slice(0, 5).map((img, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1}`}
                onClick={() => setActiveImage(i)}
                className={`h-14 w-20 overflow-hidden rounded-xl border-2 transition-all ${i === activeImage ? "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"}`}
              >
                <img src={mediaUrl(img.image_url)} alt={img.alt_text || ""} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* content */}
      <div className="mx-auto max-w-7xl px-5 md:px-8 mt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">

          {/* Left */}
          <div className="space-y-6">
            <div className="sticky top-24 z-20 flex gap-2 overflow-x-auto rounded-2xl bg-white/90 backdrop-blur-lg p-2 shadow-sm border border-zinc-100">
              {tabs.map((t) => (
                <a
                  key={t.key}
                  href={`#${t.key}`}
                  className="whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 focus:bg-indigo-50 focus:text-indigo-600"
                >
                  {t.label}
                </a>
              ))}
            </div>

            {/* Overview */}
            <div id="overview" className="space-y-6 scroll-mt-40">
              {tour.subtitle && <p className="text-xl font-bold text-zinc-800">{tour.subtitle}</p>}
              {tour.short_description && <p className="text-lg leading-relaxed text-zinc-600">{tour.short_description}</p>}
              {tour.long_description && (
                <div className="rounded-3xl border border-zinc-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <p className="leading-relaxed text-zinc-700 whitespace-pre-wrap">{tour.long_description}</p>
                </div>
              )}
              {tour.overview && (
                <Section title="Tour Details" icon={<MapPin size={18} />}>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {([
                      ["Duration", tour.overview.duration_text],
                      ["Start Location", tour.overview.start_location],
                      ["End Location", tour.overview.end_location],
                      ["Group Size", tour.overview.group_size],
                      ["Tour Type", tour.overview.tour_type],
                      ["Physical Rating", tour.overview.physical_rating],
                    ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-4">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</dt>
                        <dd className="mt-1 text-sm font-bold text-zinc-950">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>
              )}
              {tour.highlights.length > 0 && (
                <Section title="Highlights" icon={<Star size={18} />}>
                  <ul className="space-y-4">
                    {tour.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-4 text-base text-zinc-700 font-medium">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                          <Star size={12} className="text-indigo-600" />
                        </span>
                        {h.text}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {/* Itinerary */}
            <div id="itinerary" className="space-y-4 scroll-mt-40 pt-6">
              <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-950">Itinerary</h2>
              {tour.itineraries.length === 0 ? (
                <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-zinc-500 border border-zinc-100 shadow-sm">Itinerary coming soon.</p>
              ) : (
                tour.itineraries.map((it) => (
                  <ItineraryDay key={it.day} day={it.day} title={it.title} description={it.description} accommodation={it.accommodation} meals={it.meals} open={openDay === it.day} onToggle={() => setOpenDay(openDay === it.day ? null : it.day)} />
                ))
              )}
            </div>

            {/* Inclusions */}
            <div id="inclusions" className="scroll-mt-40 pt-6">
              <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-950">What's Included</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {tour.inclusions.length > 0 && (
                  <Section title="Included" icon={<CheckCircle2 size={18} />}>
                    <ul className="space-y-3">
                      {tour.inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
                {tour.exclusions.length > 0 && (
                  <Section title="Excluded" icon={<XCircle size={18} />}>
                    <ul className="space-y-3">
                      {tour.exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-zinc-500">
                          <XCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div id="gallery" className="scroll-mt-40 pt-6">
              <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-950">Gallery</h2>
              {tour.gallery.length === 0 ? (
                <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-zinc-500 border border-zinc-100 shadow-sm">No gallery images yet.</p>
              ) : (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                  {tour.gallery.map((img, i) => (
                    <div key={i} className="break-inside-avoid relative overflow-hidden rounded-2xl border border-zinc-100 group shadow-sm">
                      <img src={mediaUrl(img.image_url)} alt={img.alt_text || tour.title} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div id="calendar" className="scroll-mt-40 pt-6">
              <Section title="Available Departures" icon={<Calendar size={18} />}>
                {tour.calendar.length === 0 ? (
                  <p className="text-sm font-medium text-zinc-500">No scheduled departures yet. Contact us for availability.</p>
                ) : (
                  <div className="space-y-3">
                    {tour.calendar.map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white px-5 py-4 hover:shadow-md hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                            <Calendar size={16} className="text-indigo-600" />
                          </div>
                          <span className="font-bold text-zinc-950 text-base">{c.date}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{c.slots} slots</span>
                          <span className={`rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm ${c.status === "available" ? "bg-emerald-500 text-white" : "bg-red-50 text-red-600"}`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Optional activities */}
            {tour.optional_activities.length > 0 && (
              <Section title="Optional Activities" icon={<Star size={18} />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tour.optional_activities.map((a, i) => (
                    <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 transition-colors hover:bg-white hover:shadow-sm">
                      <p className="font-bold text-zinc-950">{a.name}</p>
                      {a.description && <p className="mt-2 text-sm leading-relaxed text-zinc-500">{a.description}</p>}
                      {a.price && <p className="mt-3 text-sm font-black text-indigo-600">+{a.currency || "AED"} {a.price.toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Extensions */}
            {tour.extensions.length > 0 && (
              <Section title="Extensions" icon={<Clock size={18} />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tour.extensions.map((e, i) => (
                    <div key={i} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 transition-colors hover:bg-white hover:shadow-sm">
                      <p className="font-bold text-zinc-950">{e.title}</p>
                      {e.duration_days && <p className="mt-1 text-xs font-bold uppercase tracking-widest text-indigo-600/70">{e.duration_days} extra days</p>}
                      {e.description && <p className="mt-2 text-sm leading-relaxed text-zinc-500">{e.description}</p>}
                      {e.price && <p className="mt-3 text-sm font-black text-indigo-600">+{tour.currency || "AED"} {e.price.toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Similar tours */}
            {tour.similar_tours.length > 0 && (
              <section className="pt-6">
                <h2 className="mb-6 text-2xl font-black tracking-tight text-zinc-950">You might also like</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {tour.similar_tours.map((st) => (
                    <Link key={st.id} href={`/tours/${st.id}`} className="group flex items-center gap-5 overflow-hidden rounded-3xl border border-zinc-100 bg-white p-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(0,0,0,0.08)]">
                      <div className="h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                        <img src={st.banner_image ? mediaUrl(st.banner_image) : PLACEHOLDER} alt={st.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-950 transition-colors group-hover:text-indigo-600 line-clamp-2">{st.title}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">{st.number_of_days} days · {st.country_name}</p>
                        {st.price_start_per_person && (
                          <p className="mt-2 text-sm font-black text-indigo-600">{st.currency} {st.price_start_per_person.toLocaleString()}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">
            <div className="sticky top-24 space-y-6 z-10">
              {/* Pricing card - Glassmorphic / Aurora widget */}
              <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white/50" />
                <div className="relative bg-zinc-950 px-8 py-7 overflow-hidden">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/30 blur-3xl" />
                  <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-violet-600/30 blur-3xl" />
                  
                  <div className="relative">
                    {tour.price_start_per_person ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Starting from</p>
                        <p className="mt-2 text-4xl font-black text-white">
                          {tour.currency || "AED"}{" "}
                          <span>{Number(tour.price_start_per_person).toLocaleString()}</span>
                          <span className="text-sm font-semibold text-zinc-500"> /person</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-white/80">Price on request</p>
                    )}
                    {/* Stats row */}
                    <div className="mt-6 flex gap-5 border-t border-white/10 pt-5">
                      {tour.number_of_days && (
                        <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                          <Clock size={14} className="text-indigo-400" />
                          {tour.number_of_days} days
                        </div>
                      )}
                      {(tour.city_name || tour.country_name) && (
                        <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                          <MapPin size={14} className="text-indigo-400" />
                          {tour.country_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative p-7">
                  {tour.discounts.length > 0 && (
                    <div className="mb-6 space-y-2">
                      {tour.discounts.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs font-bold text-indigo-700 shadow-sm">
                          <PartyPopper size={14} className="text-indigo-600" /> {d.label} — {d.discount_type === "percentage" ? `${d.value}% off` : `${tour.currency || "AED"} ${d.value} off`}
                        </div>
                      ))}
                    </div>
                  )}

                  {tour.pricing.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Group pricing</p>
                      {tour.pricing.map((p, i) => (
                        <div key={i} className="flex justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-indigo-100 hover:shadow-md">
                          <span className="font-semibold text-zinc-500">{p.persons_from}{p.persons_to ? `–${p.persons_to}` : "+"} persons</span>
                          <span className="font-black text-zinc-950">{p.currency} {p.price_per_person.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBookClick}
                    disabled={checkingAccount}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {checkingAccount ? "Checking…" : "Book This Tour"}
                  </button>

                  {!isLoggedIn && (
                    <Link href="/login" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950">
                      Already a member? Login
                    </Link>
                  )}
                </div>
              </div>

              {/* Enquiry card */}
              <div className="rounded-3xl border border-zinc-100 bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100">
                    <MessageSquare size={18} className="text-zinc-500" />
                  </div>
                  <h3 className="font-black text-zinc-950 text-lg">Have a question?</h3>
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
