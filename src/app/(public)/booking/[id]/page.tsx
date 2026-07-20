"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import axios from "axios";
import { LuArrowLeft as ArrowLeft, LuArrowRight as ArrowRight, LuCalendar as Calendar, LuCheck as Check, LuCircleCheckBig as CheckCircle, LuCreditCard as CreditCard, LuLoaderCircle as Loader, LuLockKeyhole as Lock, LuMapPin as MapPin, LuMinus as Minus, LuPlus as Plus, LuReceipt as Receipt, LuShieldCheck as ShieldCheck, LuSparkles as Sparkles, LuUserRound as User } from "react-icons/lu";
import api from "@/lib/api/client";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { combinePhone } from "@/lib/utils/validators";
import { useAuthContext } from "@/providers/AuthProvider";
import DatePicker from "@/components/ui/DatePicker";
import PhoneInput from "@/components/ui/PhoneInput";
import { useCurrency } from "@/hooks/useCurrency";

type Traveller = { traveller_type: "adult" | "child"; full_name: string; age: string };
type FormValues = {
  travelDate: string; adults: number; children: number; travellers: Traveller[];
  email: string; phone: string; phoneCountryCode: string; notes: string;
  activityIds: number[]; accommodationIds: number[]; extensionIds: number[];
  paymentType: "partial" | "full"; agreed: boolean;
};
type BookingResult = { id: number; booking_code: string; final_amount: number | string; amount_pending: number | string; amount_paid?: number | string; currency: string; payment_type?: "partial" | "full" };
type Gateways = { stripe: boolean; paypal: boolean; test_mode_available: boolean };

const STEPS = [
  ["Trip Setup", "Choose date & group", Calendar], ["Customize", "Personalize your trip", Sparkles],
  ["Travellers", "Add traveller details", User], ["Review", "Check your booking", Receipt],
  ["Payment", "Secure checkout", CreditCard], ["Confirmation", "Booking received", CheckCircle],
] as const;
const PLACEHOLDER = "/images/tour-card-fallback.jpg";

function travellerRows(adults: number, children: number, primaryName = ""): Traveller[] {
  return [
    ...Array.from({ length: adults }, (_, index) => ({ traveller_type: "adult" as const, full_name: index === 0 ? primaryName : "", age: "" })),
    ...Array.from({ length: children }, () => ({ traveller_type: "child" as const, full_name: "", age: "" })),
  ];
}

export default function PublicBookingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dashboard, isLoggedIn, loading: authLoading } = useAuthContext();
  const { format: money, code: displayCurrency } = useCurrency();
  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [gateways, setGateways] = useState<Gateways | null>(null);
  const [busy, setBusy] = useState<"booking" | "stripe" | "paypal" | "test" | "return" | null>(null);
  const [error, setError] = useState("");

  const user = dashboard?.user;
  const { control, register, setValue, getValues, trigger, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      travelDate: searchParams.get("travel_date") || "", adults: Math.max(1, Number(searchParams.get("adults") || 1)), children: Math.max(0, Number(searchParams.get("children") || 0)),
      travellers: travellerRows(Math.max(1, Number(searchParams.get("adults") || 1)), Math.max(0, Number(searchParams.get("children") || 0)), user?.name || ""),
      email: user?.email || "", phone: "", phoneCountryCode: "+91", notes: "", activityIds: [], accommodationIds: [], extensionIds: [], paymentType: "partial", agreed: false,
    },
  });
  const { fields, replace } = useFieldArray({ control, name: "travellers" });
  const values = useWatch({ control });
  const adults = values.adults ?? 1;
  const children = values.children ?? 0;
  const travellers = (values.travellers || []) as Traveller[];
  const totalPax = adults + children;

  useEffect(() => {
    fetchPublicTourDetail(Number(params.id)).then(setTour).catch(() => setError("Tour could not be loaded.")).finally(() => setPageLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (user?.name && !getValues("travellers.0.full_name")) setValue("travellers.0.full_name", user.name);
    if (user?.email && !getValues("email")) setValue("email", user.email);
  }, [getValues, setValue, user]);

  useEffect(() => {
    if (step === 5) api.get("/payments/gateways/status").then((response) => setGateways(response.data?.data)).catch(() => setGateways({ stripe: false, paypal: false, test_mode_available: false }));
  }, [step]);

  const loadBooking = useCallback(async (bookingId: number) => {
    const response = await api.get(`/customer/bookings/${bookingId}`);
    const row = response.data?.data ?? response.data;
    setBooking(row);
    return row as BookingResult;
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const bookingId = Number(searchParams.get("booking_id") || 0);
    const payment = searchParams.get("payment");
    if (!bookingId || !payment) return;
    setBusy("return"); setError("");
    if (payment === "stripe_success") {
      api.post("/payments/stripe/confirm-return", { booking_id: bookingId, session_id: searchParams.get("session_id") || undefined })
        .then(() => loadBooking(bookingId)).then(() => setStep(6)).catch(() => setError("Payment confirmation is pending. Please refresh shortly.")).finally(() => setBusy(null));
    } else if (payment === "paypal_approved" && searchParams.get("token")) {
      const paymentId = sessionStorage.getItem(`booking_paypal_${bookingId}`);
      if (!paymentId) { setError("PayPal payment reference was not found."); setBusy(null); return; }
      api.post("/payments/paypal/capture", { order_id: searchParams.get("token"), payment_id: Number(paymentId) })
        .then(() => { sessionStorage.removeItem(`booking_paypal_${bookingId}`); return loadBooking(bookingId); }).then(() => setStep(6)).catch(() => setError("PayPal capture failed. Please contact support.")).finally(() => setBusy(null));
    } else {
      void loadBooking(bookingId).then(() => setStep(5)).finally(() => setBusy(null));
    }
  }, [isLoggedIn, loadBooking, searchParams]);

  const pricing = useMemo(() => {
    if (!tour) return { base: 0, extras: 0, total: 0, perPerson: 0 };
    const slab = tour.pricing.find((row) => totalPax >= row.persons_from && (row.persons_to == null || totalPax <= row.persons_to)) || tour.pricing.at(-1);
    const perPerson = slab?.price_per_person || tour.price_start_per_person || 0;
    const base = perPerson * totalPax;
    const activityIds = values.activityIds || [], accommodationIds = values.accommodationIds || [], extensionIds = values.extensionIds || [];
    const extras = tour.optional_activities.filter((x) => activityIds.includes(x.id)).reduce((sum, x) => sum + Number(x.price || 0) * totalPax, 0)
      + tour.accommodations.filter((x) => accommodationIds.includes(x.id)).reduce((sum, x) => sum + Number(x.price || 0), 0)
      + tour.extensions.filter((x) => extensionIds.includes(x.id)).reduce((sum, x) => sum + Number(x.price || 0), 0);
    return { base, extras, total: base + extras, perPerson };
  }, [tour, totalPax, values.activityIds, values.accommodationIds, values.extensionIds]);

  const changeCount = (type: "adult" | "child", count: number) => {
    const nextAdults = type === "adult" ? count : adults, nextChildren = type === "child" ? count : children;
    const current = getValues("travellers"), oldAdults = current.filter((x) => x.traveller_type === "adult"), oldChildren = current.filter((x) => x.traveller_type === "child");
    setValue(type === "adult" ? "adults" : "children", count, { shouldDirty: true });
    replace([
      ...Array.from({ length: nextAdults }, (_, i) => oldAdults[i] || { traveller_type: "adult" as const, full_name: i === 0 ? user?.name || "" : "", age: "" }),
      ...Array.from({ length: nextChildren }, (_, i) => oldChildren[i] || { traveller_type: "child" as const, full_name: "", age: "" }),
    ]);
  };

  const next = async () => {
    setError("");
    if (step === 1 && await trigger(["travelDate", "adults", "children"])) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3 && await trigger(["travellers", "email", "phone"])) setStep(4);
  };

  const createBooking = handleSubmit(async (form) => {
    if (!tour || !user?.customer_id) return;
    setBusy("booking"); setError("");
    try {
      const phone = combinePhone(form.phoneCountryCode, form.phone);
      const response = await api.post("/customer/bookings", {
        customer_id: user.customer_id, tour_id: tour.id, tour_name: tour.title, tour_date: form.travelDate, tour_start_date: form.travelDate,
        no_of_adults: form.adults, no_of_children: form.children, currency: tour.currency || "USD", booking_source: "customer", payment_type: form.paymentType,
        customer_notes: form.notes || undefined,
        optional_activities: form.activityIds.map((id) => ({ id, quantity: totalPax })), accommodations: form.accommodationIds.map((id) => ({ id, quantity: 1 })), extensions: form.extensionIds.map((id) => ({ id, quantity: 1 })),
        travellers: form.travellers.map((row, index) => ({ ...row, age: Number(row.age), email: index === 0 ? form.email : undefined, phone: index === 0 ? phone : undefined, is_primary_contact: index === 0 })),
      });
      setBooking(response.data?.data ?? response.data); setStep(5);
    } catch (exception) {
      setError(axios.isAxiosError(exception) ? exception.response?.data?.detail || "Booking could not be created." : "Booking could not be created.");
    } finally { setBusy(null); }
  });

  const paymentAmount = booking ? (values.paymentType === "partial" ? Math.min(Number(booking.amount_pending), Math.round(Number(booking.final_amount) * 0.3 * 100) / 100) : Number(booking.amount_pending)) : 0;
  const returnBase = typeof window === "undefined" || !booking ? "" : `${window.location.origin}/booking/${tour?.id}?booking_id=${booking.id}`;
  const pay = async (gateway: "stripe" | "paypal" | "test") => {
    if (!booking) return;
    setBusy(gateway); setError("");
    try {
      if (gateway === "stripe") {
        const response = await api.post("/payments/stripe/create-session", { booking_id: booking.id, amount: paymentAmount, currency: booking.currency, success_url: `${returnBase}&payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${returnBase}&payment=cancelled` });
        window.location.assign(response.data.data.checkout_url);
      } else if (gateway === "paypal") {
        const response = await api.post("/payments/paypal/create-order", { booking_id: booking.id, amount: paymentAmount, currency: booking.currency, return_url: `${returnBase}&payment=paypal_approved`, cancel_url: `${returnBase}&payment=cancelled` });
        sessionStorage.setItem(`booking_paypal_${booking.id}`, String(response.data.data.payment_id)); window.location.assign(response.data.data.approve_url);
      } else {
        await api.post("/payments/test/simulate", { booking_id: booking.id, amount: paymentAmount, note: "Public checkout test payment" });
        await loadBooking(booking.id); setStep(6);
      }
    } catch (exception) { setError(axios.isAxiosError(exception) ? exception.response?.data?.detail || "Payment could not be started." : "Payment could not be started."); setBusy(null); }
  };

  if (pageLoading || authLoading || busy === "return") return <div className="flex min-h-[70vh] items-center justify-center"><Loader className="animate-spin text-teal-700" size={34} /></div>;
  if (!tour) return <div className="mx-auto max-w-xl px-5 py-28 text-center"><h1 className="text-2xl font-black">Tour unavailable</h1><Link href="/tours" className="mt-5 inline-flex text-teal-700">Back to tours</Link></div>;
  if (!isLoggedIn || user?.role?.slug !== "customer") return <div className="mx-auto max-w-lg px-5 py-28 text-center"><Lock className="mx-auto text-teal-700" size={42} /><h1 className="mt-5 text-3xl font-black text-slate-950">Sign in to continue booking</h1><p className="mt-3 text-slate-500">Your trip selections will remain in the URL while you securely sign in.</p><Link href={`/login?redirect=${encodeURIComponent(`/booking/${tour.id}?${searchParams.toString()}`)}`} className="mt-7 inline-flex rounded-xl bg-teal-700 px-7 py-3.5 font-bold text-white">Sign in as customer</Link></div>;

  const currency = tour.currency || "USD";
  const hero = tour.gallery[0]?.image_url ? mediaUrl(tour.gallery[0].image_url) : tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER;

  return (
    <main className="min-h-screen bg-[#f7faf9] pb-16 pt-24 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 md:px-7">
        <div className="mb-8 text-center"><p className="text-xs font-black uppercase tracking-[.25em] text-teal-700">Simple · Secure · Seamless</p><h1 className="mt-2 text-3xl font-black text-[#063c42] md:text-4xl">Tour Booking Flow</h1></div>
        <div className="mb-8 grid grid-cols-3 gap-2 lg:grid-cols-6">
          {STEPS.map(([label, sub, Icon], index) => { const n = index + 1, active = step === n, done = step > n; return <div key={label} className="relative text-center"><div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 ${active ? "border-teal-700 bg-teal-700 text-white" : done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-400"}`}>{done ? <Check size={18} /> : <Icon size={18} />}</div><p className={`mt-2 text-xs font-black ${active ? "text-teal-800" : "text-slate-600"}`}>{n}. {label}</p><p className="mt-0.5 hidden text-[10px] text-slate-400 md:block">{sub}</p>{index < 5 && <span className="absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-5 hidden h-px bg-slate-200 lg:block" />}</div>; })}
        </div>

        {error && <div className="mx-auto mb-5 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <form onSubmit={createBooking} className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            {step === 1 && <div><Header n="1" title="Trip Setup" text="Choose your preferred date and group size." /><Controller control={control} name="travelDate" rules={{ required: "Select a travel date" }} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} minDate={new Date().toISOString().split("T")[0]} availableDates={tour.calendar.filter((x) => x.status === "available").map((x) => x.date)} label="Travel date *" />} />{errors.travelDate && <ErrorText text={errors.travelDate.message} />}<div className="mt-6 grid gap-3 sm:grid-cols-2">{[["Adults", "adult", adults, 1, "Age 12+"], ["Children", "child", children, 0, "Age 2–11"]].map(([label, type, value, min, sub]) => <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"><div><p className="font-black">{label}</p><p className="text-xs text-slate-400">{sub}</p></div><div className="flex items-center gap-4"><button type="button" onClick={() => changeCount(type as "adult" | "child", Math.max(Number(min), Number(value) - 1))} disabled={Number(value) <= Number(min)} className="counter"><Minus size={14} /></button><b>{value}</b><button type="button" onClick={() => changeCount(type as "adult" | "child", Number(value) + 1)} className="counter"><Plus size={14} /></button></div></div>)}</div></div>}
            {step === 2 && <div><Header n="2" title="Customize Your Trip" text="Choose optional upgrades and experiences." /><OptionGroup title="Accommodation" items={tour.accommodations.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price }))} selected={values.accommodationIds || []} onToggle={(id) => toggleId("accommodationIds", id, getValues, setValue)} currency={currency} /><OptionGroup title="Activities" items={tour.optional_activities.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price }))} selected={values.activityIds || []} onToggle={(id) => toggleId("activityIds", id, getValues, setValue)} currency={currency} perPerson /><OptionGroup title="Extensions" items={tour.extensions.map((x) => ({ id: x.id, name: x.title, description: x.description, price: x.price }))} selected={values.extensionIds || []} onToggle={(id) => toggleId("extensionIds", id, getValues, setValue)} currency={currency} /></div>}
            {step === 3 && <div><Header n="3" title="Traveller Details" text={`Enter details for ${totalPax} traveller${totalPax === 1 ? "" : "s"}.`} /><div className="space-y-3">{fields.map((field, index) => { const row = travellers[index] || field, adult = row.traveller_type === "adult"; return <div key={field.id} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex justify-between"><b className="text-sm">Traveller {index + 1} ({adult ? "Adult" : "Child"})</b>{index === 0 && <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700">Primary contact</span>}</div><div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="field-label">Full name *<input {...register(`travellers.${index}.full_name`, { required: "Name is required" })} className="field" /></label><label className="field-label">Age *<input type="number" {...register(`travellers.${index}.age`, { required: "Age is required", validate: (v) => { const age = Number(v); return (adult ? age >= 12 && age <= 120 : age >= 2 && age <= 11) || "Invalid age"; } })} className="field" /></label></div></div>; })}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="field-label">Contact email *<input type="email" {...register("email", { required: "Email is required" })} className="field" /></label><label className="field-label">Contact phone *<Controller control={control} name="phoneCountryCode" render={({ field: cc }) => <Controller control={control} name="phone" rules={{ required: "Phone is required" }} render={({ field }) => <PhoneInput countryCode={cc.value} number={field.value} onCountryCodeChange={cc.onChange} onNumberChange={field.onChange} label="Phone" required />} />} /></label></div><label className="field-label mt-4">Special requirements<textarea {...register("notes")} rows={3} className="field resize-none" /></label></div>}
            {step === 4 && <div><Header n="4" title="Review & Confirm" text="Check your trip before creating the booking." /><TourCard tour={tour} hero={hero} /><div className="mt-5 grid gap-4 sm:grid-cols-2"><ReviewBox title="Trip" rows={[["Travel date", values.travelDate || "-"], ["Travellers", `${adults} adult${adults === 1 ? "" : "s"}${children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}`], ["Contact", values.email || "-"]]} /><ReviewBox title="Price summary" rows={[["Package", money(pricing.base, currency)], ["Upgrades", money(pricing.extras, currency)], ["Total", money(pricing.total, currency)]]} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["partial", "Pay 30% deposit", pricing.total * .3, "Pay the balance later"], ["full", "Pay in full", pricing.total, "Complete in one payment"]].map(([type, label, amount, note]) => <label key={String(type)} className={`cursor-pointer rounded-2xl border-2 p-4 ${values.paymentType === type ? "border-teal-700 bg-teal-50" : "border-slate-200"}`}><input type="radio" value={type} {...register("paymentType")} className="sr-only" /><b className="block">{label}</b><strong className="mt-2 block text-xl text-teal-800">{money(Number(amount), currency)}</strong><span className="text-xs text-slate-500">{note}</span></label>)}</div><label className="mt-5 flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" {...register("agreed", { required: true })} className="mt-1" />I agree to the booking terms and cancellation policy.</label></div>}
            {step === 5 && booking && <div><Header n="5" title="Secure Payment" text="Choose a gateway to complete your payment." /><div className="rounded-2xl bg-[#063c42] p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-teal-200">Pay securely now</p><p className="mt-2 text-4xl font-black">{money(paymentAmount, booking.currency)}</p>{displayCurrency !== booking.currency && <p className="mt-1 text-xs font-bold text-amber-200">Charged as {booking.currency} {paymentAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}; displayed conversion is indicative.</p>}<p className="mt-2 text-sm text-white/70">Booking {booking.booking_code} · {values.paymentType === "partial" ? "30% deposit" : "Full payment"}</p></div><div className="mt-5 space-y-3"><PayButton disabled={!gateways?.stripe || !!busy} onClick={() => pay("stripe")} loading={busy === "stripe"} label="Pay with Stripe" /><PayButton disabled={!gateways?.paypal || !!busy} onClick={() => pay("paypal")} loading={busy === "paypal"} label="Pay with PayPal" />{gateways?.test_mode_available && <PayButton disabled={!!busy} onClick={() => pay("test")} loading={busy === "test"} label="Simulate test payment" test />}</div><div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-800"><ShieldCheck className="shrink-0" size={20} /><span>Your payment is encrypted. Booking confirmation remains subject to supplier acceptance.</span></div></div>}
            {step === 6 && booking && <div className="py-8 text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle size={50} /></div><p className="mt-6 text-xs font-black uppercase tracking-widest text-emerald-700">Payment received</p><h2 className="mt-2 text-3xl font-black">Booking request confirmed</h2><p className="mx-auto mt-3 max-w-lg text-slate-500">Your payment is recorded. We’ll notify you when the supplier accepts the booking.</p><div className="mx-auto mt-7 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold text-slate-400">BOOKING REFERENCE</p><p className="mt-2 text-2xl font-black tracking-wider text-teal-800">{booking.booking_code}</p></div><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={`/customer/bookings/${booking.id}`} className="rounded-xl bg-teal-700 px-6 py-3 font-bold text-white">View booking</Link><Link href="/tours" className="rounded-xl border border-slate-300 px-6 py-3 font-bold">Explore more tours</Link></div></div>}

            {step < 4 && <div className="mt-7 flex justify-between border-t border-slate-100 pt-5"><button type="button" onClick={() => step === 1 ? router.back() : setStep(step - 1)} className="nav-secondary"><ArrowLeft size={16} /> Back</button><button type="button" onClick={next} className="nav-primary">Continue <ArrowRight size={16} /></button></div>}
            {step === 4 && <div className="mt-7 flex justify-between border-t border-slate-100 pt-5"><button type="button" onClick={() => setStep(3)} className="nav-secondary"><ArrowLeft size={16} /> Back</button><button type="submit" disabled={!values.agreed || busy === "booking"} className="nav-primary">{busy === "booking" ? <Loader className="animate-spin" size={16} /> : <Lock size={15} />} Proceed to payment</button></div>}
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"><img src={hero} alt={tour.title} className="aspect-[16/10] w-full rounded-2xl object-cover" /><h2 className="mt-4 font-black">{tour.title}</h2><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{[tour.city_name, tour.country_name].filter(Boolean).join(", ")}</p><div className="my-4 h-px bg-slate-100" /><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Travellers</span><b>{totalPax}</b></div><div className="flex justify-between"><span>Package</span><b>{money(pricing.base, currency)}</b></div><div className="flex justify-between"><span>Upgrades</span><b>{money(pricing.extras, currency)}</b></div></div><div className="mt-4 flex justify-between rounded-xl bg-slate-950 px-4 py-3 text-white"><span className="font-bold">Total</span><b>{booking ? money(Number(booking.final_amount), booking.currency) : money(pricing.total, currency)}</b></div><p className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500"><ShieldCheck size={14} className="text-teal-700" /> Secure booking & payment</p></aside>
        </form>
      </div>
    </main>
  );
}

function Header({ n, title, text }: { n: string; title: string; text: string }) { return <div className="mb-6"><p className="text-xs font-black uppercase tracking-widest text-teal-700">Step {n}</p><h2 className="mt-1 text-2xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{text}</p></div>; }
function ErrorText({ text }: { text?: string }) { return text ? <p className="mt-2 text-xs font-semibold text-red-600">{text}</p> : null; }
function TourCard({ tour, hero }: { tour: PublicTourDetail; hero: string }) { return <div className="flex gap-4 rounded-2xl border border-slate-200 p-3"><img src={hero} alt="" className="h-20 w-28 rounded-xl object-cover" /><div><b>{tour.title}</b><p className="mt-1 text-xs text-slate-500">{tour.number_of_days ? `${tour.number_of_days} days` : "Curated tour"}</p><p className="mt-1 text-xs text-slate-500">{tour.country_name}</p></div></div>; }
function ReviewBox({ title, rows }: { title: string; rows: (string | number)[][] }) { return <div className="rounded-2xl border border-slate-200 p-4"><b className="text-sm">{title}</b><div className="mt-3 space-y-2">{rows.map(([a, b]) => <div key={String(a)} className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{a}</span><strong className="text-right">{b}</strong></div>)}</div></div>; }
function OptionGroup({ title, items, selected, onToggle, currency, perPerson }: { title: string; items: { id: number; name: string; description: string; price: number | null }[]; selected: number[]; onToggle: (id: number) => void; currency: string; perPerson?: boolean }) { const { format: money } = useCurrency(); if (!items.length) return null; return <div className="mb-6"><h3 className="mb-3 text-sm font-black">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{items.map((item) => { const active = selected.includes(item.id); return <button type="button" key={item.id} onClick={() => onToggle(item.id)} className={`rounded-2xl border-2 p-4 text-left ${active ? "border-teal-700 bg-teal-50" : "border-slate-200 hover:border-teal-200"}`}><span className="flex justify-between gap-2"><b className="text-sm">{item.name}</b><span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-teal-700 text-white" : "border border-slate-300"}`}>{active && <Check size={12} />}</span></span>{item.description && <span className="mt-1 block text-xs text-slate-500">{item.description}</span>}<strong className="mt-2 block text-xs text-teal-800">{item.price ? `+ ${money(item.price, currency)}${perPerson ? " / traveller" : ""}` : "Included"}</strong></button>; })}</div></div>; }
function PayButton({ disabled, onClick, loading, label, test }: { disabled: boolean; onClick: () => void; loading: boolean; label: string; test?: boolean }) { return <button type="button" disabled={disabled} onClick={onClick} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black disabled:cursor-not-allowed disabled:opacity-40 ${test ? "border-2 border-dashed border-amber-400 bg-amber-50 text-amber-800" : "bg-teal-700 text-white hover:bg-teal-800"}`}>{loading ? <Loader className="animate-spin" size={18} /> : <CreditCard size={18} />}{label}</button>; }
function toggleId(name: "activityIds" | "accommodationIds" | "extensionIds", id: number, getValues: ReturnType<typeof useForm<FormValues>>["getValues"], setValue: ReturnType<typeof useForm<FormValues>>["setValue"]) { const current = getValues(name); setValue(name, current.includes(id) ? current.filter((x) => x !== id) : [...current, id], { shouldDirty: true }); }
