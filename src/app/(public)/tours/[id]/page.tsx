"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";

/* eslint-disable @next/next/no-img-element */
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuBadgeDollarSign as BadgeDollarSign, LuBed as Bed, LuBus as Bus, LuCalendar as Calendar, LuCircleCheckBig as CheckCircle2, LuClock as Clock, LuDownload as Download, LuHeadphones as Headphones, LuHeart as Heart, LuLogIn as LogIn, LuMapPin as MapPin, LuMessageSquare as MessageSquare, LuMinus as Minus, LuPartyPopper as PartyPopper, LuPlay as Play, LuPlus as Plus, LuShare2 as Share2, LuShieldCheck as ShieldCheck, LuStar as Star, LuUsers as Users, LuUtensils as Utensils, LuX as X, LuCircleX as XCircle } from "react-icons/lu";
import PhoneInput from "@/components/ui/PhoneInput";
import api from "@/lib/api/client";
import { combinePhone } from "@/lib/utils/validators";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useAuthContext } from "@/providers/AuthProvider";
import DatePicker from "@/components/ui/DatePicker";
import { useCurrency } from "@/hooks/useCurrency";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80";

const INPUT = "w-full rounded-xl border border-zinc-200 bg-slate-50 py-3 px-4 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10";

// section wrapper
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        {icon && <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</div>}
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// itinerary day accordion
function ItineraryDay({ day, title, description, accommodation, meals, isLast }: {
  day: number; title: string; description: string; accommodation: string; meals: string; isLast: boolean;
}) {
  return (
    <div className="relative grid grid-cols-[64px_1fr] gap-5 pb-8">
      <div className="relative flex justify-center"><span className="relative z-10 flex h-9 min-w-14 items-center justify-center rounded-md bg-[#075b57] px-2 text-xs font-black text-white shadow">Day {day}</span>{!isLast && <span className="absolute left-1/2 top-9 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-slate-300" />}<span className="absolute left-[calc(50%+24px)] top-3 h-3 w-3 rounded-full border-2 border-white bg-[#075b57] shadow" /></div>
      <div><h3 className="text-base font-black text-slate-950">{title || `Day ${day}`}</h3>{description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}<div className="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-500">{accommodation && <span className="flex items-center gap-1.5"><Bed size={12} />{accommodation}</span>}{meals && <span className="flex items-center gap-1.5"><Utensils size={12} />{meals}</span>}</div></div>
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
      <DatePicker value={form.date} onChange={(date) => set("date", date)} minDate={new Date().toISOString().split("T")[0]} placeholder="Preferred travel date" accent="teal" />
      <textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Special requirements?" rows={3} className={`${INPUT} resize-none`} />
      <button type="submit" className="w-full rounded-xl bg-[#063c42] py-3.5 text-sm font-bold text-white transition-all hover:bg-teal-600 hover:shadow-lg mt-2">
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
type TravellerDraft = { traveller_type: "adult" | "child"; full_name: string; age: string };
type BookingFormValues = {
  travelDate: string;
  adults: number;
  children: number;
  travellers: TravellerDraft[];
  email: string;
  phone: string;
  phoneCountryCode: string;
  notes: string;
  paymentType: "partial" | "full";
  agreed: boolean;
};

function initialTravellers(adults: number, children: number, primaryName: string): TravellerDraft[] {
  return [
    ...Array.from({ length: adults }, (_, index) => ({ traveller_type: "adult" as const, full_name: index === 0 ? primaryName : "", age: "" })),
    ...Array.from({ length: children }, () => ({ traveller_type: "child" as const, full_name: "", age: "" })),
  ];
}

function BookingModal({ tour, customerId, customerName, customerEmail, initialTravelDate, initialAdults, initialChildren, onClose }: {
  tour: PublicTourDetail; customerId: number | null; customerName: string; customerEmail: string;
  initialTravelDate: string; initialAdults: number; initialChildren: number; onClose: () => void;
}) {
  const router = useRouter();
  const { format: displayMoney } = useCurrency();
  const [step, setStep] = useState<BookingStep>("details");
  const [submitting, setSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const { control, register, setValue, getValues, trigger, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    mode: "onChange",
    defaultValues: {
      travelDate: initialTravelDate,
      adults: initialAdults,
      children: initialChildren,
      travellers: initialTravellers(initialAdults, initialChildren, customerName),
      email: customerEmail,
      phone: "",
      phoneCountryCode: "+91",
      notes: "",
      paymentType: "partial",
      agreed: false,
    },
  });
  const { fields: travellerFields, replace: replaceTravellers } = useFieldArray({ control, name: "travellers" });
  const watched = useWatch({ control });
  const travelDate = watched.travelDate ?? "";
  const adults = watched.adults ?? initialAdults;
  const children = watched.children ?? initialChildren;
  const travellers = (watched.travellers ?? []) as TravellerDraft[];
  const email = watched.email ?? "";
  const phone = watched.phone ?? "";
  const phoneCountryCode = watched.phoneCountryCode ?? "+91";
  const paymentType = watched.paymentType ?? "partial";
  const agreed = watched.agreed ?? false;

  const pricing = calcPrice(tour.pricing, adults, children, tour.currency || "USD", tour.price_start_per_person || 0);
  const totalPax = adults + children;
  const today = new Date().toISOString().split("T")[0];
  const phoneValue = phone ? combinePhone(phoneCountryCode, phone) : "";
  const primaryName = travellers[0]?.full_name || customerName;
  const travellersValid = travellers.length === totalPax && travellers.every((traveller) => {
    const age = Number(traveller.age);
    return traveller.full_name.trim().length > 0 && Number.isInteger(age)
      && (traveller.traveller_type === "adult" ? age >= 12 && age <= 120 : age >= 2 && age <= 11);
  });

  const setTravellerCount = (type: "adult" | "child", count: number) => {
    const nextAdults = type === "adult" ? count : adults;
    const nextChildren = type === "child" ? count : children;
    const current = getValues("travellers");
    const currentAdults = current.filter((traveller) => traveller.traveller_type === "adult");
    const currentChildren = current.filter((traveller) => traveller.traveller_type === "child");
    setValue(type === "adult" ? "adults" : "children", count, { shouldDirty: true, shouldValidate: true });
    replaceTravellers([
      ...Array.from({ length: nextAdults }, (_, index) => currentAdults[index] ?? { traveller_type: "adult" as const, full_name: index === 0 ? customerName : "", age: "" }),
      ...Array.from({ length: nextChildren }, (_, index) => currentChildren[index] ?? { traveller_type: "child" as const, full_name: "", age: "" }),
    ]);
  };
  
  const allImages = tour.gallery.length > 0
    ? tour.gallery.map((g) => mediaUrl(g.image_url))
    : [tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER];
  const heroImage = allImages[0];

  const handleBook = handleSubmit(async (values) => {
    if (!customerId) { setErrMsg("Customer account not identified. Please sign out and sign back in."); setStep("error"); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/customer/bookings", {
        customer_id: customerId, tour_id: tour.id, tour_name: tour.title,
        tour_date: values.travelDate, tour_start_date: values.travelDate,
        no_of_adults: values.adults, no_of_children: values.children,
        currency: tour.currency || "USD", booking_source: "customer",
        payment_type: values.paymentType, total_cost: pricing.total,
        customer_notes: values.notes || undefined,
        travellers: values.travellers.map((traveller, index) => ({
          traveller_type: traveller.traveller_type,
          full_name: traveller.full_name.trim(),
          age: Number(traveller.age),
          email: index === 0 ? values.email : undefined,
          phone: index === 0 ? phoneValue : undefined,
          is_primary_contact: index === 0,
        })),
      });
      const booking = res.data?.data ?? res.data;
      setBookingCode(booking?.booking_code ?? "-");
      if (!booking?.id) throw new Error("Booking ID was not returned");
      onClose();
      router.push(`/customer/bookings/${booking.id}?new=1&pay=1`);
    } catch (err: unknown) {
      setErrMsg((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Booking could not be created.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  });

  const stepIdx = ["details", "traveler", "confirm"].indexOf(step);
  const depositAmount = Math.round(pricing.total * 0.3 * 100) / 100;
  const paymentAmount = paymentType === "partial" ? depositAmount : pricing.total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#063c42]/80 backdrop-blur-sm" onClick={onClose} />
      
      <form onSubmit={handleBook} className="relative z-10 flex h-full max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:flex-row">
        
        {/* Left Column - Order Context */}
        <div className="relative hidden w-2/5 flex-col bg-[#063c42] text-white lg:flex">
          <div className="absolute inset-0">
            <img src={heroImage} alt={tour.title} className="h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 bg-teal-950/30 mix-blend-multiply" />
          </div>
          
          <div className="relative flex h-full flex-col p-10">
             <div className="mt-auto space-y-6">
                <div>
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                    <MapPin size={12} className="text-teal-400" />
                    {tour.city_name || "Tour"}
                  </div>
                  <h2 className="text-3xl font-black leading-tight drop-shadow-md">{tour.title}</h2>
                </div>

                {/* Live Order Summary */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-lg">
                   <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-teal-200">Your Booking</h3>
                   
                   <div className="space-y-3 text-sm font-medium text-white/80">
                     <div className="flex justify-between">
                       <span>Date</span>
                       <span className="font-bold text-white">{travelDate ? new Date(travelDate).toLocaleDateString() : "Not selected"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Adults ({adults})</span>
                       <span className="text-white">{pricing.perPerson > 0 ? displayMoney(pricing.perPerson * adults, pricing.currency) : "TBD"}</span>
                     </div>
                     {children > 0 && (
                       <div className="flex justify-between">
                         <span>Children ({children})</span>
                         <span className="text-white">{pricing.perPerson > 0 ? displayMoney(pricing.perPerson * children, pricing.currency) : "TBD"}</span>
                       </div>
                     )}
                     <div className="my-3 h-px w-full bg-white/20" />
                     <div className="flex items-center justify-between">
                       <span className="text-base font-bold">Total</span>
                       <span className="text-xl font-black text-white">{pricing.total > 0 ? displayMoney(pricing.total, pricing.currency) : "Price on request"}</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column - Interactive Form */}
        <div className="flex h-full w-full flex-col bg-slate-50 lg:w-3/5">
           
           {/* Header */}
           <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 sm:px-10">
             <div>
                {stepIdx >= 0 && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-teal-600">
                    Step {stepIdx + 1} of 3
                  </p>
                )}
                <h2 className="text-xl font-black text-zinc-950">
                   {step === "details" && "Trip Details"}
                   {step === "traveler" && "Guest Details"}
                   {step === "confirm" && "Review & Confirm"}
                   {step === "success" && "Request Received"}
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
                <div className="h-full bg-teal-600 transition-all duration-500" style={{ width: `${((stepIdx + 1) / 3) * 100}%` }} />
             </div>
           )}

           {/* Scrollable Content Area */}
           <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
             
             {step === "details" && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div>
                   <Controller
                     control={control}
                     name="travelDate"
                     rules={{ required: "Travel date is required" }}
                     render={({ field }) => (
                       <DatePicker
                         value={field.value}
                         onChange={field.onChange}
                         minDate={today}
                         label="Select Travel Date *"
                         availableDates={tour.calendar.filter((c) => c.status === "available").map((c) => c.date)}
                         restrictToAvailableDates={tour.calendar.length > 0}
                         accent="teal"
                       />
                     )}
                   />
                   {tour.calendar.length > 0 && (
                     <p className="mt-3 text-xs font-medium text-zinc-500">
                       Available soon: {tour.calendar.filter((c) => c.status === "available").slice(0, 3).map((c) => c.date).join(", ")}
                     </p>
                   )}
                 </div>

                 <div>
                   <input type="hidden" {...register("adults", { valueAsNumber: true, min: 1 })} />
                   <input type="hidden" {...register("children", { valueAsNumber: true, min: 0 })} />
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Who is traveling?</label>
                   <div className="space-y-4">
                     {[
                       { label: "Adults", type: "adult" as const, sub: "Age 12+", value: adults, min: 1 },
                       { label: "Children", type: "child" as const, sub: "Age 2–11", value: children, min: 0 },
                     ].map(({ label, type, sub, value, min }) => (
                       <div key={label} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-teal-100 hover:shadow-md">
                         <div>
                           <p className="text-sm font-bold text-zinc-950">{label}</p>
                           <p className="text-xs font-medium text-zinc-400">{sub}</p>
                         </div>
                         <div className="flex items-center gap-5">
                           <button type="button" aria-label={`Decrease ${label}`} onClick={() => setTravellerCount(type, Math.max(min, value - 1))} disabled={value <= min} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-slate-50 hover:text-zinc-950 disabled:bg-transparent disabled:text-zinc-300 disabled:opacity-50">
                             <Minus size={16} />
                           </button>
                           <span className="w-6 text-center text-lg font-black text-zinc-950">{value}</span>
                           <button type="button" aria-label={`Increase ${label}`} onClick={() => setTravellerCount(type, value + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-slate-50 hover:text-zinc-950">
                             <Plus size={16} />
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 {/* Mobile only pricing block since left col is hidden on mobile */}
                 {tour.pricing.length > 0 && totalPax > 0 && (
                    <div className="block rounded-2xl border border-teal-100 bg-teal-50/50 px-5 py-5 lg:hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-600/70">{totalPax} traveller{totalPax > 1 ? "s" : ""} × {pricing.perPerson > 0 ? displayMoney(pricing.perPerson, pricing.currency) : "TBD"}</p>
                          <p className="text-2xl font-black text-teal-600">{pricing.total > 0 ? displayMoney(pricing.total, pricing.currency) : "Price on request"}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                          <Users size={20} className="text-teal-600" />
                        </div>
                      </div>
                    </div>
                  )}
               </div>
             )}

             {step === "traveler" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="flex flex-wrap items-center justify-between gap-3">
                   <div>
                     <p className="text-sm font-black text-zinc-950">Traveller details</p>
                     <p className="mt-1 text-xs text-zinc-500">Add the full name and age of every traveller.</p>
                   </div>
                   <div className="flex gap-2 text-[11px] font-bold">
                     <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">{adults} Adult{adults === 1 ? "" : "s"}</span>
                     {children > 0 && <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">{children} Child{children === 1 ? "" : "ren"}</span>}
                   </div>
                 </div>

                 <div className="space-y-3">
                   {travellerFields.map((field, index) => {
                     const traveller = travellers[index] ?? field;
                     const typeIndex = travellers.slice(0, index + 1).filter((item) => item.traveller_type === traveller.traveller_type).length;
                     const isAdult = traveller.traveller_type === "adult";
                     return (
                       <div key={field.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                         <div className="mb-3 flex items-center justify-between">
                           <p className="text-xs font-black uppercase tracking-wider text-zinc-600">{isAdult ? "Adult" : "Child"} {typeIndex}</p>
                           {index === 0 && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700">Primary contact</span>}
                         </div>
                         <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                           <label>
                             <span className="mb-1.5 block text-[11px] font-bold text-zinc-500">Full name *</span>
                             <input {...register(`travellers.${index}.full_name`, { required: "Full name is required" })} placeholder={`${isAdult ? "Adult" : "Child"} full name`} autoComplete={index === 0 ? "name" : "off"} className="w-full rounded-xl border border-zinc-200 bg-slate-50 px-3 py-3 text-sm font-bold text-zinc-950 outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10" />
                             {errors.travellers?.[index]?.full_name && <span className="mt-1 block text-[10px] font-semibold text-red-600">{errors.travellers[index]?.full_name?.message}</span>}
                           </label>
                           <label>
                             <span className="mb-1.5 block text-[11px] font-bold text-zinc-500">Age *</span>
                             <input type="number" inputMode="numeric" min={isAdult ? 12 : 2} max={isAdult ? 120 : 11} {...register(`travellers.${index}.age`, { required: "Age is required", validate: (value) => { const age = Number(value); return (isAdult ? age >= 12 && age <= 120 : age >= 2 && age <= 11) || (isAdult ? "Adult age must be 12–120" : "Child age must be 2–11"); } })} placeholder={isAdult ? "12+" : "2–11"} className="w-full rounded-xl border border-zinc-200 bg-slate-50 px-3 py-3 text-sm font-bold text-zinc-950 outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10" />
                             {errors.travellers?.[index]?.age && <span className="mt-1 block text-[10px] font-semibold text-red-600">{errors.travellers[index]?.age?.message}</span>}
                           </label>
                         </div>
                       </div>
                     );
                   })}
                 </div>

                 <div className="grid gap-4 sm:grid-cols-2">
                   <div>
                     <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Contact Email <span className="text-red-500">*</span></label>
                     <input type="email" {...register("email", { required: "Contact email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} placeholder="you@example.com" className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-bold text-zinc-950 shadow-sm outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" />
                     {errors.email && <span className="mt-1 block text-[10px] font-semibold text-red-600">{errors.email.message}</span>}
                   </div>
                   <div>
                     <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Contact Phone <span className="text-red-500">*</span></label>
                     <Controller control={control} name="phoneCountryCode" render={({ field: countryField }) => (
                       <Controller control={control} name="phone" rules={{ required: "Contact phone is required" }} render={({ field: phoneField }) => (
                         <PhoneInput countryCode={countryField.value} number={phoneField.value} onCountryCodeChange={countryField.onChange} onNumberChange={phoneField.onChange} label="Phone" required />
                       )} />
                     )} />
                     {errors.phone && <span className="mt-1 block text-[10px] font-semibold text-red-600">{errors.phone.message}</span>}
                   </div>
                 </div>
                 <div>
                   <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Special Requirements</label>
                   <textarea {...register("notes")} rows={3} placeholder="Dietary needs, accessibility…" className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" />
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
                     ["Contact", `${primaryName} · ${email}`],
                     ...(phoneValue ? [["Phone", phoneValue]] : []),
                   ].map(([label, value], i) => (
                     <div key={label} className={`flex justify-between px-5 py-4 text-sm ${i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}`}>
                       <span className="font-bold text-zinc-500">{label}</span>
                       <span className="max-w-[60%] text-right font-black text-zinc-950">{value}</span>
                     </div>
                   ))}
                 </div>
                 
                 <div className="rounded-2xl border border-teal-100 bg-teal-50/50 px-6 py-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-600/70">Total Amount Due</p>
                       <p className="text-3xl font-black text-teal-600">
                         {pricing.total > 0 ? displayMoney(pricing.total, pricing.currency) : "Price on request"}
                       </p>
                     </div>
                     <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-teal-600 shadow-sm">{totalPax}</span>
                   </div>
                   <p className="mt-4 text-xs font-medium text-teal-600/70">Your booking is confirmed only after payment authorization and supplier acceptance.</p>
                 </div>

                 <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                   <div className="mb-4 flex items-center justify-between">
                     <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Traveller list</p>
                     <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{travellers.length} total</span>
                   </div>
                   <div className="divide-y divide-zinc-100">
                     {travellers.map((traveller, index) => (
                       <div key={`${traveller.traveller_type}-summary-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                         <div className="min-w-0">
                           <p className="truncate text-sm font-black text-zinc-950">{traveller.full_name}</p>
                           <p className="mt-0.5 text-xs capitalize text-zinc-500">{traveller.traveller_type}{index === 0 ? " · Primary contact" : ""}</p>
                         </div>
                         <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">Age {traveller.age}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {pricing.total > 0 && (
                   <fieldset>
                     <legend className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Choose how you want to pay</legend>
                     <div className="grid gap-3 sm:grid-cols-2">
                       {([
                         {
                           value: "partial" as const,
                           label: "Pay 30% now",
                           amount: depositAmount,
                           description: `Reserve your place. Pay the remaining ${displayMoney(pricing.total - depositAmount, pricing.currency)} later.`,
                         },
                         {
                           value: "full" as const,
                           label: "Pay in full",
                           amount: pricing.total,
                           description: "Complete the full tour payment in one secure transaction.",
                         },
                       ]).map((option) => {
                         const selected = paymentType === option.value;
                         return (
                           <label key={option.value} className={`cursor-pointer rounded-2xl border-2 p-4 transition ${selected ? "border-teal-600 bg-teal-50 shadow-sm" : "border-zinc-200 bg-white hover:border-teal-200"}`}>
                             <input type="radio" value={option.value} {...register("paymentType", { required: true })} className="sr-only" />
                             <span className="flex items-start justify-between gap-3">
                               <span>
                                 <span className="block text-sm font-black text-zinc-950">{option.label}</span>
                                 <span className="mt-1 block text-xs leading-5 text-zinc-500">{option.description}</span>
                               </span>
                               <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-teal-600" : "border-zinc-300"}`}>
                                 {selected && <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />}
                               </span>
                             </span>
                             <span className="mt-3 block text-lg font-black text-teal-700">{displayMoney(option.amount, pricing.currency)}</span>
                           </label>
                         );
                       })}
                     </div>
                     <div className="mt-3 flex items-center justify-between rounded-xl bg-zinc-950 px-4 py-3 text-white">
                       <span className="text-xs font-bold">Pay securely now</span>
                       <span className="text-base font-black">{displayMoney(paymentAmount, pricing.currency)}</span>
                     </div>
                   </fieldset>
                 )}
                 
                 <label className="flex cursor-pointer items-start gap-3 px-1">
                   <input type="checkbox" {...register("agreed", { required: "Please accept the booking terms" })} className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-600" />
                   <span className="text-xs font-medium leading-relaxed text-zinc-500">
                     I agree to the{" "}
                     <a href="/terms" target="_blank" className="font-bold text-teal-600 hover:underline">Terms & Conditions</a>
                     {" "}and{" "}
                     <a href="/cancellation-policy" target="_blank" className="font-bold text-teal-600 hover:underline">Cancellation Policy</a>.
                   </span>
                 </label>
               </div>
             )}

             {step === "success" && (
               <div className="flex flex-col items-center py-10 text-center duration-500 animate-in zoom-in-95">
                 <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
                   <CheckCircle2 size={48} className="text-emerald-500" />
                 </div>
                 <h3 className="text-3xl font-black text-zinc-950">Booking Request Received</h3>
                 <p className="mt-3 text-base font-medium text-zinc-500">This is not final confirmation. Your booking will be confirmed after the supplier accepts it.</p>
                 
                 {bookingCode && (
                   <div className="mt-8 w-full rounded-3xl border border-zinc-200 bg-white px-8 py-6 shadow-sm">
                     <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Your Booking Reference</p>
                     <p className="text-3xl font-black tracking-widest text-teal-600">{bookingCode}</p>
                   </div>
                 )}
                 
                 <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                   <Link href="/customer/dashboard" onClick={onClose} className="flex flex-1 items-center justify-center rounded-xl bg-teal-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700">
                     Go to My Dashboard
                   </Link>
                   <button type="button" onClick={onClose} className="flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-slate-50">
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
                   <button type="button" onClick={() => setStep("confirm")} className="flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-slate-50">
                     Go Back & Try Again
                   </button>
                   <Link href="/contact" onClick={onClose} className="flex flex-1 items-center justify-center rounded-xl bg-teal-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700">
                     Contact Support
                   </Link>
                 </div>
               </div>
             )}

           </div>
           
           {/* Footer actions */}
           {stepIdx >= 0 && (
             <div className="flex items-center gap-4 border-t border-slate-100 bg-white px-6 py-5 sm:px-10">
               {step !== "details" && (
                 <button type="button" onClick={() => setStep(step === "confirm" ? "traveler" : "details")} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-slate-50">
                   <ArrowLeft size={16} /> Back
                 </button>
               )}
               {step === "details" && (
                 <button type="button" disabled={!travelDate || adults < 1} onClick={async () => { if (await trigger(["travelDate", "adults", "children"])) setStep("traveler"); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 disabled:shadow-none disabled:opacity-50">
                   Continue to Guest Details <ArrowRight size={16} />
                 </button>
               )}
               {step === "traveler" && (
                 <button type="button" disabled={!travellersValid || !email.trim() || !phoneValue.trim()} onClick={async () => { if (await trigger(["travellers", "email", "phone"])) setStep("confirm"); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 disabled:shadow-none disabled:opacity-50">
                   Review Booking <ArrowRight size={16} />
                 </button>
               )}
               {step === "confirm" && (
                 <button type="submit" disabled={!agreed || submitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 disabled:shadow-none disabled:opacity-50">
                   {submitting ? "Creating request..." : `Continue to Pay ${displayMoney(paymentAmount, pricing.currency)}`}
                 </button>
               )}
             </div>
           )}

        </div>
      </form>
    </div>
  );
}

// guest prompt
function GuestPrompt({ onClose, returnPath, isLoggedIn }: { onClose: () => void; returnPath: string; isLoggedIn?: boolean }) {
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
            onClick={() => { onClose(); router.push(`/login?redirect=${encodeURIComponent(returnPath)}`); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-bold text-white hover:bg-sky-600"
          >
            <LogIn size={15} /> {isLoggedIn ? "Customer Sign In" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); router.push(`/register?redirect=${encodeURIComponent(returnPath)}`); }}
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
  const { formatCompact: displayMoney } = useCurrency();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, loading: authLoading, user, dashboard, refreshSession } = useAuthContext();
  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-200 border-t-teal-600" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Loading tour…</p>
        </div>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm border border-slate-100">
          <MapPin size={40} className="text-zinc-300" />
        </div>
        <p className="text-2xl font-black text-zinc-950">Tour not found</p>
        <Link href="/tours" className="rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all">
          Browse All Tours
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "itinerary", label: "Itinerary" },
    { key: "inclusions", label: "Inclusions" },
    { key: "exclusions", label: "Exclusions", href: "inclusions" },
    { key: "hotels", label: "Hotels", href: "overview" },
    { key: "gallery", label: "Gallery" },
    { key: "reviews", label: "Reviews" },
    { key: "faqs", label: "FAQs" },
  ] as const;

  const roleSlug = dashboard?.user?.role?.slug;
  const customerId = dashboard?.user?.customer_id ?? user?.customer_id ?? null;
  const isCustomer = isLoggedIn && roleSlug === "customer";
  const initialTravelDate = searchParams.get("travel_date") ?? "";
  const initialAdults = Math.max(1, Number(searchParams.get("adults") || 1));
  const initialChildren = Math.max(0, Number(searchParams.get("children") || 0));
  const returnQuery = searchParams.toString();
  const returnPath = `/booking/${tour.id}${returnQuery ? `?${returnQuery}` : ""}`;

  const handleBookClick = async () => {
    if (isCustomer) { router.push(returnPath); return; }
    if (!isLoggedIn) { setShowModal(true); return; }
    setCheckingAccount(true);
    try { await refreshSession(); } finally { setCheckingAccount(false); setShowModal(true); }
  };

  const allImages = tour.gallery.length > 0
    ? tour.gallery.map((g) => mediaUrl(g.image_url))
    : [tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER];

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* Modals */}
      {showModal && !authLoading && (
        isLoggedIn && isCustomer
          ? <BookingModal tour={tour} customerId={customerId ?? null} customerName={user?.name ?? ""} customerEmail={user?.email ?? ""} initialTravelDate={initialTravelDate} initialAdults={initialAdults} initialChildren={initialChildren} onClose={() => setShowModal(false)} />
          : <GuestPrompt onClose={() => setShowModal(false)} returnPath={returnPath} isLoggedIn={isLoggedIn} />
      )}

      {/* Split hero */}
      <section className="bg-white pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <nav className="flex flex-wrap items-center gap-2 py-5 text-[11px] font-semibold text-slate-500"><Link href="/">Home</Link><ArrowRight size={11} /><Link href="/tours">Tour Packages</Link><ArrowRight size={11} /><span>{tour.country_name || "International"}</span><ArrowRight size={11} /><span className="font-black text-slate-800">{tour.title}</span></nav>
        </div>
        <div className="mx-auto grid max-w-7xl overflow-hidden border-y border-slate-200 bg-white lg:grid-cols-[.85fr_1.15fr]">
          <div className="flex flex-col justify-center px-5 py-10 md:px-8 lg:py-12">
            <div className="flex flex-wrap gap-2">{tour.category_name && <span className="rounded-md bg-amber-400 px-3 py-1.5 text-[10px] font-black text-slate-900">{tour.category_name}</span>}</div>
            <h1 className="mt-4 font-heading text-4xl font-black leading-tight tracking-tight text-[#0b2845] md:text-5xl">{tour.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm"><span className="flex items-center gap-1.5 font-semibold text-slate-600"><MapPin size={14} /> {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}</span><span className="flex items-center gap-1 text-orange-500">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={13} className="fill-current" />)}<b className="ml-1 text-slate-700">4.8</b><span className="text-slate-400">(126 Reviews)</span></span></div>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600">{tour.short_description || tour.subtitle || "Experience an expertly curated journey with memorable stays, seamless transfers, and thoughtful local experiences."}</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-slate-700">{tour.number_of_days && <span className="flex items-center gap-1.5"><Calendar size={14} /> {tour.number_of_days - 1 > 0 ? `${tour.number_of_days - 1} Nights / ` : ""}{tour.number_of_days} Days</span>}<span className="flex items-center gap-1.5"><Bed size={14} /> Hotel</span><span className="flex items-center gap-1.5"><Utensils size={14} /> Meals</span><span className="flex items-center gap-1.5"><Bus size={14} /> Transfers</span></div>
            <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={handleBookClick} className="rounded-lg bg-[#075b57] px-6 py-3 text-sm font-black text-white hover:bg-teal-700">Customise Trip</button><button type="button" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"><Heart size={15} /> Add to Wishlist</button><button type="button" aria-label="Share tour" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-600"><Share2 size={16} /></button></div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden bg-slate-100 lg:min-h-[430px]"><img src={allImages[activeImage]} alt={tour.title} className="h-full w-full object-cover transition duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" /><button type="button" className="absolute bottom-8 right-8 flex items-center gap-3 rounded-full bg-white/90 py-2 pl-2 pr-5 text-sm font-black text-slate-800 shadow-xl backdrop-blur"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal-700 shadow"><Play size={17} className="ml-0.5 fill-current" /></span>Watch Video</button></div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-5 py-3 sm:grid-cols-4 md:px-8">
          {allImages.slice(0, 4).map((image, index) => <button key={index} type="button" onClick={() => setActiveImage(index)} className={`relative aspect-[1.8] overflow-hidden rounded-xl border-2 ${activeImage === index ? "border-teal-600" : "border-transparent"}`}><img src={image} alt={`${tour.title} gallery ${index + 1}`} className="h-full w-full object-cover" />{index === 3 && allImages.length > 4 && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-black text-white">+{allImages.length - 4} photos</span>}</button>)}
        </div>
      </section>

      {/* content */}
      <div className="mx-auto mt-3 max-w-7xl px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">

          {/* Left */}
          <div className="space-y-6">
            <div className="sticky top-24 z-20 flex gap-7 overflow-x-auto border-b border-slate-200 bg-white/95 px-1 backdrop-blur-lg">
              {tabs.map((t) => (
                <a
                  key={t.key}
                  href={`#${"href" in t ? t.href : t.key}`}
                  className="whitespace-nowrap border-b-2 border-transparent py-4 text-xs font-black text-slate-600 transition hover:border-teal-700 hover:text-teal-800 focus:border-teal-700 focus:text-teal-800"
                >
                  {t.label}
                </a>
              ))}
            </div>

            {/* Overview */}
            <div id="overview" className="space-y-6 scroll-mt-40">
              <h2 className="pt-2 text-2xl font-black text-[#0b2845]">About This Tour</h2>
              {tour.subtitle && <p className="text-xl font-bold text-zinc-800">{tour.subtitle}</p>}
              {tour.short_description && <p className="text-lg leading-relaxed text-zinc-600">{tour.short_description}</p>}
              {tour.long_description && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
                      <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
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
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50">
                          <Star size={12} className="text-teal-600" />
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
                <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-zinc-500 border border-slate-100 shadow-sm">Itinerary coming soon.</p>
              ) : (
                tour.itineraries.map((it, index) => (
                  <ItineraryDay key={it.day} day={it.day} title={it.title} description={it.description} accommodation={it.accommodation} meals={it.meals} isLast={index === tour.itineraries.length - 1} />
                ))
              )}
              {tour.itineraries.length > 0 && <button type="button" className="mt-1 flex items-center gap-2 rounded-lg border border-teal-800 px-4 py-2.5 text-xs font-black text-teal-800 hover:bg-teal-50"><Download size={14} /> Download Itinerary</button>}
            </div>

            {/* Inclusions */}
            <div id="inclusions" className="scroll-mt-40 pt-6">
              <h2 className="mb-6 text-3xl font-black tracking-tight text-zinc-950">What&apos;s Included</h2>
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
                <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-zinc-500 border border-slate-100 shadow-sm">No gallery images yet.</p>
              ) : (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                  {tour.gallery.map((img, i) => (
                    <div key={i} className="break-inside-avoid relative overflow-hidden rounded-2xl border border-slate-100 group shadow-sm">
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
                      <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 hover:shadow-md hover:border-teal-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
                            <Calendar size={16} className="text-teal-600" />
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
                    <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:bg-white hover:shadow-sm">
                      <p className="font-bold text-zinc-950">{a.name}</p>
                      {a.description && <p className="mt-2 text-sm leading-relaxed text-zinc-500">{a.description}</p>}
                      {a.price && <p className="mt-3 text-sm font-black text-teal-600">+{displayMoney(a.price, a.currency || tour.currency || "USD")}</p>}
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
                    <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:bg-white hover:shadow-sm">
                      <p className="font-bold text-zinc-950">{e.title}</p>
                      {e.duration_days && <p className="mt-1 text-xs font-bold uppercase tracking-widest text-teal-600/70">{e.duration_days} extra days</p>}
                      {e.description && <p className="mt-2 text-sm leading-relaxed text-zinc-500">{e.description}</p>}
                      {e.price && <p className="mt-3 text-sm font-black text-teal-600">+{displayMoney(e.price, tour.currency || "USD")}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div id="reviews" className="scroll-mt-40 pt-6"><Section title="Traveller Reviews" icon={<Star size={18} />}><div className="grid gap-5 sm:grid-cols-2"><div><p className="text-4xl font-black text-[#0b2845]">4.8</p><div className="mt-2 flex gap-1 text-orange-500">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} className="fill-current" />)}</div><p className="mt-2 text-xs text-slate-500">Based on verified traveller feedback</p></div><blockquote className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">“Beautifully planned, responsive support, and a perfectly paced itinerary. We would happily book with Tourvaa again.”<footer className="mt-3 text-xs font-black text-slate-800">- Verified traveller</footer></blockquote></div></Section></div>
            <div id="faqs" className="scroll-mt-40 pt-6"><Section title="Frequently Asked Questions" icon={<MessageSquare size={18} />}><div className="divide-y divide-slate-200">{[["Can this tour be customised?", "Yes. Dates, hotels, activities, and transfers can be adjusted with help from our travel team."], ["Are flights included?", "Flights are included only when explicitly listed under inclusions. Our team can help arrange them separately."], ["How will I receive confirmation?", "Your booking dashboard will contain confirmation, vouchers, payment information, and supplier updates."]].map(([question, answer]) => <details key={question} className="group py-4"><summary className="cursor-pointer list-none text-sm font-black text-slate-900">{question}<Plus size={15} className="float-right transition group-open:rotate-45" /></summary><p className="mt-3 pr-8 text-sm leading-6 text-slate-600">{answer}</p></details>)}</div></Section></div>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4">
            <div className="sticky top-24 z-10 rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold text-slate-500">Price (Per Person)</p>{tour.price_start_per_person ? <p className="mt-2 text-4xl font-black text-[#0b2845]">{displayMoney(tour.price_start_per_person, tour.currency || "USD")}</p> : <p className="mt-2 text-xl font-black">Price on request</p>}</div>{tour.discounts[0] && <span className="mt-5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{tour.discounts[0].discount_type === "percentage" ? `${tour.discounts[0].value}% OFF` : "SPECIAL OFFER"}</span>}</div>
              <div className="mt-6 space-y-3"><button type="button" onClick={handleBookClick} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left"><Calendar size={16} className="text-slate-500" /><span><span className="block text-[10px] font-black text-slate-600">Select Date</span><span className="text-xs text-slate-400">{initialTravelDate || "Choose travel date"}</span></span></button><button type="button" onClick={handleBookClick} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left"><Users size={16} className="text-slate-500" /><span><span className="block text-[10px] font-black text-slate-600">Travellers</span><span className="text-xs text-slate-500">{initialAdults} Adult{initialAdults === 1 ? "" : "s"}{initialChildren ? `, ${initialChildren} Children` : ""}</span></span></button></div>
              {tour.discounts.length > 0 && <div className="mt-4 space-y-2">{tour.discounts.slice(0, 2).map((discount, index) => <p key={index} className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-[11px] font-bold text-teal-800"><PartyPopper size={13} />{discount.label}</p>)}</div>}
              <button type="button" onClick={handleBookClick} disabled={checkingAccount} className="mt-5 w-full rounded-lg bg-orange-500 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60">{checkingAccount ? "Checking…" : "Check Availability"}</button>
              <details className="mt-3"><summary className="cursor-pointer list-none rounded-lg border border-teal-800 py-3 text-center text-sm font-black text-teal-900">Enquire Now</summary><div className="mt-5"><EnquiryForm tourTitle={tour.title} /></div></details>
              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500"><ShieldCheck size={14} className="text-teal-700" /> Secure &amp; Easy Booking</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-[#0b2845]">Why Book With Tourvaa?</h3><div className="mt-4 space-y-4">{[[BadgeDollarSign, "Best Price Guarantee", "We ensure you get the best price"], [ShieldCheck, "Verified Tour Operators", "All our partners are verified"], [BadgeDollarSign, "Secure Payments", "100% secure and safe transactions"], [Headphones, "24/7 Customer Support", "We are here to help anytime"]].map(([Icon, title, text]) => { const I = Icon as typeof ShieldCheck; return <div key={String(title)} className="flex gap-3"><I size={19} className="mt-0.5 shrink-0 text-teal-700" /><div><p className="text-xs font-black text-slate-900">{String(title)}</p><p className="mt-0.5 text-[11px] text-slate-500">{String(text)}</p></div></div>; })}</div></div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Headphones size={26} className="text-teal-700" /><h3 className="mt-3 font-black text-[#0b2845]">Need Help Planning?</h3><p className="mt-1 max-w-[14rem] text-xs leading-5 text-slate-500">Let our travel experts customise this tour for you.</p><Link href="/contact" className="mt-4 inline-flex rounded-lg border border-teal-800 px-4 py-2 text-xs font-black text-teal-900">Talk to an Expert</Link></div>

            {tour.similar_tours.length > 0 && <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-[#0b2845]">Related Tours</h3><div className="mt-4 space-y-3">{tour.similar_tours.slice(0, 3).map((related) => <Link key={related.id} href={`/tours/${related.id}`} className="flex gap-3"><div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg"><img src={related.banner_image ? mediaUrl(related.banner_image) : PLACEHOLDER} alt={related.title} className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="line-clamp-2 text-xs font-black text-slate-900">{related.title}</p><p className="mt-1 text-[10px] text-slate-500">{related.number_of_days} days · {related.country_name}</p>{related.price_start_per_person && <p className="mt-1 text-xs font-black text-teal-800">{displayMoney(related.price_start_per_person, related.currency || "USD")}</p>}</div></Link>)}</div><Link href="/tours" className="mt-4 block rounded-lg border border-teal-800 py-2 text-center text-xs font-black text-teal-900">View All Tours</Link></div>}
          </aside>
        </div>
      </div>

      <section className="mx-auto mt-14 max-w-7xl px-5 md:px-8"><div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5">{[[BadgeDollarSign, "Best Price Guarantee", "We offer the best prices"], [ShieldCheck, "Flexible Bookings", "Flexible options on select tours"], [Users, "Trusted Partners", "Handpicked and verified"], [BadgeDollarSign, "Secure Payments", "Multiple payment options"], [Headphones, "24/7 Assistance", "We are here for you"]].map(([Icon, title, text]) => { const I = Icon as typeof ShieldCheck; return <div key={String(title)} className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"><I size={18} /></span><div><p className="text-xs font-black text-slate-900">{String(title)}</p><p className="mt-0.5 text-[10px] text-slate-500">{String(text)}</p></div></div>; })}</div></section>
    </main>
  );
}
