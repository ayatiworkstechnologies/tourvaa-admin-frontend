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
import { getActiveReferralCode } from "@/lib/utils/affiliateReferral";
import { useAuthContext } from "@/providers/AuthProvider";
import DatePicker from "@/components/ui/DatePicker";
import PhoneInput from "@/components/ui/PhoneInput";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/currency";
import { ADDON_CATEGORIES, addonCategoryLabel } from "@/lib/constants/addonCategories";
import { todayLocalDateStr } from "@/lib/utils/date";

type Traveller = {
  traveller_type: "adult" | "child"; full_name: string; age: string;
  gender: string; date_of_birth: string; nationality: string;
  passport_number: string; passport_expiry_date: string;
};
type AgentCustomer = { id: number; name?: string; full_name?: string; email?: string; phone?: string };
type FormValues = {
  travelDate: string; adults: number; children: number; infants: number; rooms: number; travellers: Traveller[];
  email: string; phone: string; phoneCountryCode: string; notes: string;
  primaryIsContact: boolean;
  activityIds: number[]; accommodationIds: number[]; extensionIds: number[];
  paymentType: "partial" | "full"; agreed: boolean;
  agentMarkup: number; agentReference: string;
  agentPaymentMethod: "online" | "wallet" | "credit" | "bank_transfer" | "pay_later";
};
type BookingResult = { id: number; booking_code: string; final_amount: number | string; amount_pending: number | string; amount_paid?: number | string; currency: string; payment_type?: "partial" | "full" };
type Gateways = { stripe: boolean; paypal: boolean; test_mode_available: boolean };

const STEPS = [
  ["Trip Setup", "Choose date & group", Calendar], ["Customize", "Personalize your trip", Sparkles],
  ["Travellers", "Add traveller details", User], ["Review", "Check your booking", Receipt],
  ["Payment", "Secure checkout", CreditCard], ["Confirmation", "Booking received", CheckCircle],
] as const;
const PLACEHOLDER = "/images/tour-card-fallback.jpg";

const BLANK_TRAVELLER_EXTRAS = { gender: "", date_of_birth: "", nationality: "", passport_number: "", passport_expiry_date: "" };

function travellerRows(adults: number, children: number, primaryName = ""): Traveller[] {
  return [
    ...Array.from({ length: adults }, (_, index) => ({ traveller_type: "adult" as const, full_name: index === 0 ? primaryName : "", age: "", ...BLANK_TRAVELLER_EXTRAS })),
    ...Array.from({ length: children }, () => ({ traveller_type: "child" as const, full_name: "", age: "", ...BLANK_TRAVELLER_EXTRAS })),
  ];
}

export default function PublicBookingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dashboard, user: sessionUser, isLoggedIn, loading: authLoading, refreshSession } = useAuthContext();
  const [showOtpGate, setShowOtpGate] = useState(false);
  const { format: money, code: displayCurrency } = useCurrency();
  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [gateways, setGateways] = useState<Gateways | null>(null);
  const [busy, setBusy] = useState<"booking" | "stripe" | "paypal" | "test" | "return" | null>(null);
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<AgentCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AgentCustomer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  const user = dashboard?.user ?? sessionUser;
  const roleSlug = user?.role?.slug ?? "";
  const isAgent = ["agent", "agent-reseller"].includes(roleSlug);
  const isCustomer = roleSlug === "customer";
  const selfBookingName = isCustomer ? user?.name || "" : "";
  const selfBookingEmail = isCustomer ? user?.email || "" : "";
  const { control, register, setValue, getValues, trigger, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      travelDate: searchParams.get("travel_date") || "", adults: Math.max(1, Number(searchParams.get("adults") || 1)), children: Math.max(0, Number(searchParams.get("children") || 0)),
      infants: Math.max(0, Number(searchParams.get("infants") || 0)), rooms: 1,
      travellers: travellerRows(Math.max(1, Number(searchParams.get("adults") || 1)), Math.max(0, Number(searchParams.get("children") || 0)), selfBookingName),
      email: selfBookingEmail, phone: "", phoneCountryCode: "+91", notes: "", primaryIsContact: true, activityIds: [], accommodationIds: [], extensionIds: [], paymentType: "partial", agreed: false,
      agentMarkup: 0, agentReference: "", agentPaymentMethod: "online",
    },
  });
  const { fields, replace } = useFieldArray({ control, name: "travellers" });
  const values = useWatch({ control });
  const adults = values.adults ?? 1;
  const children = values.children ?? 0;
  const infants = values.infants ?? 0;
  const rooms = values.rooms ?? 1;
  const travellers = (values.travellers || []) as Traveller[];
  const totalPax = adults + children;

  useEffect(() => {
    fetchPublicTourDetail(Number(params.id)).then(setTour).catch(() => setError("Tour could not be loaded.")).finally(() => setPageLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (user?.role?.slug !== "customer") return;
    if (user?.name && !getValues("travellers.0.full_name")) setValue("travellers.0.full_name", user.name);
    if (user?.email && !getValues("email")) setValue("email", user.email);
  }, [user, getValues, setValue]);

  useEffect(() => {
    const query = customerSearch.trim();
    if (!isAgent || selectedCustomer) {
      setCustomerResults([]);
      return;
    }
    if (query.length === 1) {
      setCustomerResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setCustomerLoading(true);
      api.get("/customers", { params: { ...(query ? { search: query } : {}), limit: 8 } })
        .then((response) => {
          const rows = response.data?.items ?? response.data?.data?.items ?? response.data?.data ?? [];
          setCustomerResults(Array.isArray(rows) ? rows : []);
        })
        .catch(() => setCustomerResults([]))
        .finally(() => setCustomerLoading(false));
    }, query ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [customerSearch, isAgent, selectedCustomer]);

  useEffect(() => {
    if (step === 5) api.get("/payments/gateways/status").then((response) => setGateways(response.data?.data)).catch(() => setGateways({ stripe: false, paypal: false, test_mode_available: false }));
  }, [step]);

  const loadBooking = useCallback(async (bookingId: number) => {
    const response = await api.get(isAgent ? `/bookings/${bookingId}` : `/customer/bookings/${bookingId}`);
    const row = response.data?.data ?? response.data;
    setBooking(row);
    return row as BookingResult;
  }, [isAgent]);

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
  const agentMarkup = isAgent ? Math.max(0, Number(values.agentMarkup) || 0) : 0;
  const customerTotal = pricing.total + agentMarkup;
  const agentPaymentMethod = values.agentPaymentMethod ?? "online";
  const depositAmount = tour?.booking_deposit && tour.booking_deposit > 0 ? Number(tour.booking_deposit) : null;
  const balanceDueDate = useMemo(() => {
    if (!depositAmount || !tour?.balance_payment_deadline_days || !values.travelDate) return null;
    const travel = new Date(`${values.travelDate}T00:00:00`);
    if (Number.isNaN(travel.getTime())) return null;
    const due = new Date(travel);
    due.setDate(due.getDate() - tour.balance_payment_deadline_days);
    return due;
  }, [depositAmount, tour, values.travelDate]);

  useEffect(() => {
    if (!depositAmount) setValue("paymentType", "full", { shouldDirty: true });
  }, [depositAmount, setValue]);
  const selectedCustomerName = selectedCustomer?.full_name ?? selectedCustomer?.name ?? "";

  const changeCount = (type: "adult" | "child", count: number) => {
    const nextAdults = type === "adult" ? count : adults, nextChildren = type === "child" ? count : children;
    const current = getValues("travellers"), oldAdults = current.filter((x) => x.traveller_type === "adult"), oldChildren = current.filter((x) => x.traveller_type === "child");
    setValue(type === "adult" ? "adults" : "children", count, { shouldDirty: true });
    replace([
      ...Array.from({ length: nextAdults }, (_, i) => oldAdults[i] || { traveller_type: "adult" as const, full_name: i === 0 ? (isAgent ? selectedCustomerName : selfBookingName) : "", age: "", ...BLANK_TRAVELLER_EXTRAS }),
      ...Array.from({ length: nextChildren }, (_, i) => oldChildren[i] || { traveller_type: "child" as const, full_name: "", age: "", ...BLANK_TRAVELLER_EXTRAS }),
    ]);
  };

  const selectAgentCustomer = (customer: AgentCustomer) => {
    const name = customer.full_name ?? customer.name ?? "";
    setSelectedCustomer(customer);
    setCustomerSearch(name || customer.email || "");
    setValue("travellers.0.full_name", name, { shouldDirty: true });
    setValue("email", customer.email ?? "", { shouldDirty: true });
    setError("");
  };

  const clearAgentCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setValue("travellers.0.full_name", "", { shouldDirty: true });
    setValue("email", "", { shouldDirty: true });
    setError("");
  };

  const next = async () => {
    setError("");
    if (step === 1 && isAgent && !selectedCustomer) {
      setError("Select one of your customers to continue.");
      return;
    }
    if (step === 1) {
      const valid = await trigger(["travelDate", "adults", "children"], { shouldFocus: true });
      if (!valid) { setError("Choose an available travel date and valid group size."); return; }
      if (isAgent || isCustomer) setStep(2);
      else setShowOtpGate(true);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (await trigger(["travellers", "email", "phone"], { shouldFocus: true })) setStep(4);
      else setError("Complete every traveller and contact field using valid details.");
    }
  };

  const createBooking = handleSubmit(async (form) => {
    const customerId = isAgent ? selectedCustomer?.id : user?.customer_id;
    if (!tour || !customerId) {
      setError(isAgent ? "Select one of your customers before creating the booking." : "Customer account could not be identified.");
      return;
    }
    setBusy("booking"); setError("");
    try {
      const phone = combinePhone(form.phoneCountryCode, form.phone);
      const selectedCalendar = tour.calendar.find((row) => row.date === form.travelDate);
      const response = await api.post(isAgent ? "/bookings" : "/customer/bookings", {
        customer_id: customerId, tour_id: tour.id, tour_calendar_id: selectedCalendar?.id, tour_name: tour.title, tour_date: form.travelDate, tour_start_date: form.travelDate,
        no_of_adults: form.adults, no_of_children: form.children, no_of_infants: form.infants, no_of_rooms: form.rooms || undefined, currency: tour.currency || "USD", booking_source: isAgent ? "agent" : "customer", payment_type: form.paymentType,
        ...(isAgent ? {
          agent_markup: Math.max(0, Number(form.agentMarkup) || 0),
          agent_payment_method: form.agentPaymentMethod,
          agent_reference: form.agentReference.trim() || undefined,
        } : {}),
        customer_notes: form.notes || undefined,
        ...(isAgent ? {} : { affiliate_ref_code: getActiveReferralCode() || undefined }),
        optional_activities: form.activityIds.map((id) => ({ id, quantity: totalPax })), accommodations: form.accommodationIds.map((id) => ({ id, quantity: 1 })), extensions: form.extensionIds.map((id) => ({ id, quantity: 1 })),
        travellers: form.travellers.map((row, index) => ({
          ...row,
          age: Number(row.age),
          email: index === 0 ? form.email : undefined,
          phone: index === 0 ? phone : undefined,
          is_primary_contact: index === 0 && form.primaryIsContact,
          // Passport is collected only for additional travellers, and is optional there.
          passport_number: index === 0 ? undefined : (row.passport_number || undefined),
          passport_expiry_date: index === 0 ? undefined : (row.passport_expiry_date || undefined),
          gender: row.gender || undefined,
          date_of_birth: row.date_of_birth || undefined,
          nationality: row.nationality || undefined,
        })),
      });
      const created = response.data?.data ?? response.data;
      setBooking(created);
      if (isAgent && form.agentPaymentMethod !== "online") {
        router.push(`/agent/bookings/${created.id}?new=1`);
        return;
      }
      setStep(5);
    } catch (exception) {
      setError(apiErrorMessage(exception, "Booking could not be created."));
    } finally { setBusy(null); }
  });

  const paymentAmount = booking ? (values.paymentType === "partial" && depositAmount ? Math.min(Number(booking.amount_pending), depositAmount) : Number(booking.amount_pending)) : 0;
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
    } catch (exception) { setError(apiErrorMessage(exception, "Payment could not be started.")); setBusy(null); }
  };

  if (pageLoading || authLoading || busy === "return") return <div className="flex min-h-[70vh] items-center justify-center"><Loader className="animate-spin text-teal-700" size={34} /></div>;
  if (!tour) return <div className="mx-auto max-w-xl px-5 py-28 text-center"><h1 className="text-2xl font-black">Tour unavailable</h1><Link href="/tours" className="mt-5 inline-flex text-teal-700">Back to tours</Link></div>;
  // Agents must already be signed in (they're picking a customer to book for);
  // anonymous customers pick date/travellers first, then verify via the in-page OTP step below.
  if (isLoggedIn && !isCustomer && !isAgent) return <div className="mx-auto max-w-lg px-5 py-28 text-center"><Lock className="mx-auto text-teal-700" size={42} /><h1 className="mt-5 text-3xl font-black text-slate-950">Sign in to continue booking</h1><p className="mt-3 text-slate-500">Customers and agents can use this same booking journey.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={`/login?role=traveller&redirect=${encodeURIComponent(`/booking/${tour.id}?${searchParams.toString()}`)}`} className="inline-flex rounded-xl bg-teal-700 px-6 py-3.5 font-bold text-white">Customer login</Link><Link href={`/agent-portal/login?redirect=${encodeURIComponent(`/booking/${tour.id}?${searchParams.toString()}`)}`} className="inline-flex rounded-xl border border-teal-700 px-6 py-3.5 font-bold text-teal-800">Agent login</Link></div></div>;

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
            {isAgent && step === 1 && !showOtpGate && <AgentCustomerSelector search={customerSearch} onSearchChange={(value) => { setCustomerSearch(value); setSelectedCustomer(null); setError(""); }} results={customerResults} selected={selectedCustomer} loading={customerLoading} onSelect={selectAgentCustomer} onClear={clearAgentCustomer} />}
            {step === 1 && !showOtpGate && <div><Header n="1" title="Trip Setup" text="Choose your preferred date and group size." /><Controller control={control} name="travelDate" rules={{ required: "Select a travel date" }} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} minDate={todayLocalDateStr()} availableDates={tour.calendar.filter((x) => x.status === "available" && x.slots > 0).map((x) => x.date)} restrictToAvailableDates label="Travel date *" subtitle="Choose travel date" />} />{errors.travelDate && <ErrorText text={errors.travelDate.message} />}<div className="mt-6 grid gap-3 sm:grid-cols-2">{[["Adults", "adult", adults, 1, "Age 12+"], ["Children", "child", children, 0, "Age 3–11"]].map(([label, type, value, min, sub]) => <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"><div><p className="font-black">{label}</p><p className="text-xs text-slate-400">{sub}</p></div><div className="flex items-center gap-4"><button type="button" onClick={() => changeCount(type as "adult" | "child", Math.max(Number(min), Number(value) - 1))} disabled={Number(value) <= Number(min)} className="counter"><Minus size={14} /></button><b>{value}</b><button type="button" onClick={() => changeCount(type as "adult" | "child", Number(value) + 1)} className="counter"><Plus size={14} /></button></div></div>)}</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[["Infants", infants, 0, "Under 2 years"], ["Rooms required", rooms, 1, "Approximate is fine"]].map(([label, value, min, sub]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div><p className="font-black">{label}</p><p className="text-xs text-slate-400">{sub}</p></div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setValue(label === "Infants" ? "infants" : "rooms", Math.max(Number(min), Number(value) - 1), { shouldDirty: true })} disabled={Number(value) <= Number(min)} className="counter"><Minus size={14} /></button>
                      <b>{value}</b>
                      <button type="button" onClick={() => setValue(label === "Infants" ? "infants" : "rooms", Number(value) + 1, { shouldDirty: true })} className="counter"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>}
            {step === 1 && showOtpGate && <OtpLoginStep onBack={() => setShowOtpGate(false)} onVerified={async () => { await refreshSession(); setShowOtpGate(false); setStep(2); }} />}
            {step === 2 && (
              <div>
                <Header n="2" title="Customize Your Trip" text="Choose optional upgrades and experiences." />
                {groupAddonsByCategory(tour).map((group) => (
                  <OptionGroup
                    key={group.category}
                    title={addonCategoryLabel(group.category)}
                    items={group.items}
                    selectedIds={{ accommodation: values.accommodationIds || [], activity: values.activityIds || [], extension: values.extensionIds || [] }}
                    onToggle={(source, id) => toggleId(source === "accommodation" ? "accommodationIds" : source === "activity" ? "activityIds" : "extensionIds", id, getValues, setValue)}
                    currency={currency}
                  />
                ))}
                {(tour.accommodations.length > 0 || tour.optional_activities.length > 0 || tour.extensions.length > 0) && <button type="button" onClick={() => setStep(3)} className="text-xs font-bold text-teal-700 hover:text-teal-900">Skip Add-ons →</button>}
              </div>
            )}
            {step === 3 && (
              <div>
                <Header n="3" title="Traveller Details" text={`Enter details for ${totalPax} traveller${totalPax === 1 ? "" : "s"}.`} />
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const row = travellers[index] || field;
                    const adult = row.traveller_type === "adult";
                    const isPrimary = index === 0;
                    const travellerError = errors.travellers?.[index];
                    return (
                      <div key={field.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="mb-3 flex justify-between">
                          <b className="text-sm">Traveller {index + 1} ({adult ? "Adult" : "Child"})</b>
                          {isPrimary && <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700">Primary traveller</span>}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                          <label className="field-label">Full name *<input aria-invalid={Boolean(travellerError?.full_name)} {...register(`travellers.${index}.full_name`, { required: "Name is required" })} className={`field ${travellerError?.full_name ? "border-red-400 ring-2 ring-red-100" : ""}`} /><ErrorText text={travellerError?.full_name?.message} /></label>
                          <label className="field-label">Age *<input type="number" min={adult ? 12 : 3} max={adult ? 120 : 11} aria-invalid={Boolean(travellerError?.age)} {...register(`travellers.${index}.age`, { required: "Age is required", validate: (v) => { const age = Number(v); return (adult ? age >= 12 && age <= 120 : age >= 3 && age <= 11) || (adult ? "Age must be 12–120" : "Age must be 3–11"); } })} className={`field ${travellerError?.age ? "border-red-400 ring-2 ring-red-100" : ""}`} /><ErrorText text={travellerError?.age?.message} /></label>
                        </div>
                        <div className="mt-3">
                          <label className="field-label">Gender<select {...register(`travellers.${index}.gender`)} className="field"><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="field-label">Contact email *<input type="email" aria-invalid={Boolean(errors.email)} {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" } })} className={`field ${errors.email ? "border-red-400 ring-2 ring-red-100" : ""}`} /><ErrorText text={errors.email?.message} /></label>
                  <label className="field-label">Contact phone *<Controller control={control} name="phoneCountryCode" render={({ field: cc }) => <Controller control={control} name="phone" rules={{ required: "Phone is required" }} render={({ field }) => <PhoneInput countryCode={cc.value} number={field.value} onCountryCodeChange={cc.onChange} onNumberChange={field.onChange} label="Phone" required errorMessage={errors.phone?.message} />} />} /></label>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" {...register("primaryIsContact")} className="rounded" />Primary traveller is also the booking contact</label>
                <label className="field-label mt-4">Special requirements<textarea {...register("notes")} rows={3} className="field resize-none" /></label>
              </div>
            )}
            {step === 4 && <div><Header n="4" title="Review & Confirm" text="Check your trip before creating the booking." /><TourCard tour={tour} hero={hero} />{isAgent && <div className="mt-5"><AgentCommercialFields register={register} paymentMethod={agentPaymentMethod} netPrice={pricing.total} markup={agentMarkup} customerTotal={customerTotal} currency={currency} money={money} /></div>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><ReviewBox title="Trip" rows={[["Booking for", isAgent ? selectedCustomerName || "-" : "Myself"], ["Travel date", values.travelDate || "-"], ["Travellers", `${adults} adult${adults === 1 ? "" : "s"}${children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}`], ["Contact", values.email || "-"]]} /><ReviewBox title="Price summary" rows={[["Package", money(pricing.base, currency)], ["Upgrades", money(pricing.extras, currency)], ...(isAgent ? [["Agent markup", money(agentMarkup, currency)]] : []), ["Total", money(customerTotal, currency)]]} /></div>                <div className={`mt-5 grid gap-3 ${depositAmount ? "sm:grid-cols-2" : ""}`}>
                  {depositAmount && (
                    <label className={`cursor-pointer rounded-2xl border-2 p-4 ${values.paymentType === "partial" ? "border-teal-700 bg-teal-50" : "border-slate-200"}`}>
                      <input type="radio" value="partial" {...register("paymentType")} className="sr-only" />
                      <b className="block">Pay booking deposit</b>
                      <strong className="mt-2 block text-xl text-teal-800">{money(depositAmount, currency)}</strong>
                      <span className="text-xs text-slate-500">{balanceDueDate ? `Balance payable before ${balanceDueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : "Pay the balance later"}</span>
                    </label>
                  )}
                  <label className={`cursor-pointer rounded-2xl border-2 p-4 ${values.paymentType === "full" || !depositAmount ? "border-teal-700 bg-teal-50" : "border-slate-200"}`}>
                    <input type="radio" value="full" {...register("paymentType")} className="sr-only" />
                    <b className="block">Pay in full</b>
                    <strong className="mt-2 block text-xl text-teal-800">{money(customerTotal, currency)}</strong>
                    <span className="text-xs text-slate-500">Complete in one payment</span>
                  </label>
                </div><label className="mt-5 flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" {...register("agreed", { required: true })} className="mt-1" />I agree to the booking terms and cancellation policy.</label></div>}
            {step === 5 && booking && <div><Header n="5" title="Secure Payment" text="Choose a gateway to complete your payment." /><div className="rounded-2xl bg-[#063c42] p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-teal-200">Pay securely now</p><p className="mt-2 text-4xl font-black">{formatCurrency(paymentAmount, booking.currency)}</p>{displayCurrency !== booking.currency && <p className="mt-1 text-xs font-semibold text-teal-200">≈ {money(paymentAmount, booking.currency)} in your selected currency</p>}<p className="mt-2 text-sm text-white/70">Booking {booking.booking_code} · {values.paymentType === "partial" ? "Deposit payment" : "Full payment"}</p></div>{displayCurrency !== booking.currency && <p className="mt-3 text-xs text-slate-500">This displayed conversion is indicative. Payment is processed in the booking currency shown at checkout.</p>}<div className="mt-5 space-y-3"><PayButton disabled={!gateways?.stripe || !!busy} onClick={() => pay("stripe")} loading={busy === "stripe"} label="Pay with Stripe" /><PayButton disabled={!gateways?.paypal || !!busy} onClick={() => pay("paypal")} loading={busy === "paypal"} label="Pay with PayPal" />{gateways?.test_mode_available && <PayButton disabled={!!busy} onClick={() => pay("test")} loading={busy === "test"} label="Simulate test payment" test />}</div><div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-800"><ShieldCheck className="shrink-0" size={20} /><span>Your payment is encrypted. Booking confirmation remains subject to supplier acceptance.</span></div></div>}
            {step === 6 && booking && <div className="py-8 text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle size={50} /></div><p className="mt-6 text-xs font-black uppercase tracking-widest text-emerald-700">Payment received</p><h2 className="mt-2 text-3xl font-black">Booking request confirmed</h2><p className="mx-auto mt-3 max-w-lg text-slate-500">Your payment is recorded. We’ll notify you when the supplier accepts the booking.</p><div className="mx-auto mt-7 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold text-slate-400">BOOKING REFERENCE</p><p className="mt-2 text-2xl font-black tracking-wider text-teal-800">{booking.booking_code}</p></div><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={isAgent ? `/agent/bookings/${booking.id}` : `/customer/bookings/${booking.id}`} className="rounded-xl bg-teal-700 px-6 py-3 font-bold text-white">View booking</Link>{!isAgent && <Link href="/customer/invoices" className="rounded-xl border border-slate-300 px-6 py-3 font-bold">Download invoice</Link>}{!isAgent && <a href={`/api/customer/bookings/${booking.id}/itinerary`} className="rounded-xl border border-slate-300 px-6 py-3 font-bold">Download itinerary</a>}{!isAgent && <Link href="/customer/support" className="rounded-xl border border-slate-300 px-6 py-3 font-bold">Contact support</Link>}<Link href={isAgent ? "/agent/dashboard" : "/customer/dashboard"} className="rounded-xl border border-slate-300 px-6 py-3 font-bold">Go to dashboard</Link><Link href="/tours" className="rounded-xl border border-slate-300 px-6 py-3 font-bold">Explore more tours</Link></div></div>}

            {step < 4 && !showOtpGate && <div className="mt-7 flex justify-between border-t border-slate-100 pt-5"><button type="button" onClick={() => step === 1 ? router.back() : setStep(step - 1)} className="nav-secondary"><ArrowLeft size={16} /> Back</button><button type="button" onClick={next} className="nav-primary">Continue <ArrowRight size={16} /></button></div>}
            {step === 4 && <div className="mt-7 flex justify-between border-t border-slate-100 pt-5"><button type="button" onClick={() => setStep(3)} className="nav-secondary"><ArrowLeft size={16} /> Back</button><button type="submit" disabled={!values.agreed || busy === "booking"} className="nav-primary">{busy === "booking" ? <Loader className="animate-spin" size={16} /> : <Lock size={15} />} {isAgent && agentPaymentMethod !== "online" ? "Create booking" : "Proceed to payment"}</button></div>}
          </section>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"><img src={hero} alt={tour.title} className="aspect-[16/10] w-full rounded-2xl object-cover" /><h2 className="mt-4 font-black">{tour.title}</h2><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{[tour.city_name, tour.country_name].filter(Boolean).join(", ")}</p><div className="my-4 h-px bg-slate-100" /><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Travellers</span><b>{totalPax}</b></div><div className="flex justify-between"><span>Package</span><b>{money(pricing.base, currency)}</b></div><div className="flex justify-between"><span>Upgrades</span><b>{money(pricing.extras, currency)}</b></div></div><div className="mt-4 flex justify-between rounded-xl bg-slate-950 px-4 py-3 text-white"><span>Total</span><b>{booking ? money(Number(booking.final_amount), booking.currency) : money(customerTotal, currency)}</b></div><p className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500"><ShieldCheck size={14} className="text-teal-700" /> Secure booking &amp; payment</p></aside>
        </form>
      </div>
    </main>
  );
}

function Header({ n, title, text }: { n: string; title: string; text: string }) { return <div className="mb-6"><p className="text-xs font-black uppercase tracking-widest text-teal-700">Step {n}</p><h2 className="mt-1 text-2xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{text}</p></div>; }
function ErrorText({ text }: { text?: string }) { return text ? <p className="mt-2 text-xs font-semibold text-red-600">{text}</p> : null; }
function apiErrorMessage(exception: unknown, fallback: string) {
  if (!axios.isAxiosError(exception)) return fallback;
  const detail = exception.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg).filter(Boolean).join(" · ") || fallback;
  return fallback;
}
function TourCard({ tour, hero }: { tour: PublicTourDetail; hero: string }) { return <div className="flex gap-4 rounded-2xl border border-slate-200 p-3"><img src={hero} alt="" className="h-20 w-28 rounded-xl object-cover" /><div><b>{tour.title}</b><p className="mt-1 text-xs text-slate-500">{tour.number_of_days ? `${tour.number_of_days} days` : "Curated tour"}</p><p className="mt-1 text-xs text-slate-500">{tour.country_name}</p></div></div>; }
function ReviewBox({ title, rows }: { title: string; rows: (string | number)[][] }) { return <div className="rounded-2xl border border-slate-200 p-4"><b className="text-sm">{title}</b><div className="mt-3 space-y-2">{rows.map(([a, b]) => <div key={String(a)} className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{a}</span><strong className="text-right">{b}</strong></div>)}</div></div>; }
type AddonSource = "accommodation" | "activity" | "extension";
type AddonItem = { id: number; name: string; description: string; price: number | null; source: AddonSource; perPerson?: boolean };

function groupAddonsByCategory(tour: PublicTourDetail): { category: string; items: AddonItem[] }[] {
  const all: (AddonItem & { category: string })[] = [
    ...tour.accommodations.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price, source: "accommodation" as const, category: x.category })),
    ...tour.optional_activities.map((x) => ({ id: x.id, name: x.name, description: x.description, price: x.price, source: "activity" as const, perPerson: true, category: x.category })),
    ...tour.extensions.map((x) => ({ id: x.id, name: x.title, description: x.description, price: x.price, source: "extension" as const, category: x.category })),
  ];
  const byCategory = new Map<string, AddonItem[]>();
  for (const item of all) {
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  return ADDON_CATEGORIES.map((c) => c.value).filter((cat) => byCategory.has(cat)).map((cat) => ({ category: cat, items: byCategory.get(cat)! }));
}

function OptionGroup({ title, items, selectedIds, onToggle, currency }: { title: string; items: AddonItem[]; selectedIds: Record<AddonSource, number[]>; onToggle: (source: AddonSource, id: number) => void; currency: string }) {
  const { format: money } = useCurrency();
  if (!items.length) return null;
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const active = selectedIds[item.source].includes(item.id);
          return (
            <button type="button" key={`${item.source}-${item.id}`} onClick={() => onToggle(item.source, item.id)} className={`rounded-2xl border-2 p-4 text-left ${active ? "border-teal-700 bg-teal-50" : "border-slate-200 hover:border-teal-200"}`}>
              <span className="flex justify-between gap-2"><b className="text-sm">{item.name}</b><span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-teal-700 text-white" : "border border-slate-300"}`}>{active && <Check size={12} />}</span></span>
              {item.description && <span className="mt-1 block text-xs text-slate-500">{item.description}</span>}
              <strong className="mt-2 block text-xs text-teal-800">{item.price ? `+ ${money(item.price, currency)}${item.perPerson ? " / traveller" : ""}` : "Included"}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function PayButton({ disabled, onClick, loading, label, test }: { disabled: boolean; onClick: () => void; loading: boolean; label: string; test?: boolean }) { return <button type="button" disabled={disabled} onClick={onClick} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black disabled:cursor-not-allowed disabled:opacity-40 ${test ? "border-2 border-dashed border-amber-400 bg-amber-50 text-amber-800" : "bg-teal-700 text-white hover:bg-teal-800"}`}>{loading ? <Loader className="animate-spin" size={18} /> : <CreditCard size={18} />}{label}</button>; }
function toggleId(name: "activityIds" | "accommodationIds" | "extensionIds", id: number, getValues: ReturnType<typeof useForm<FormValues>>["getValues"], setValue: ReturnType<typeof useForm<FormValues>>["setValue"]) { const current = getValues(name); setValue(name, current.includes(id) ? current.filter((x) => x !== id) : [...current, id], { shouldDirty: true }); }

function OtpLoginStep({ onVerified, onBack }: { onVerified: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    setBusy(true); setError("");
    try {
      await api.post("/auth/otp/request", { email: email.trim() });
      setPhase("code");
    } catch (exception) {
      setError(apiErrorMessage(exception, "Could not send the verification code."));
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code."); return; }
    setBusy(true); setError("");
    try {
      await api.post("/auth/otp/verify", { email: email.trim(), code: code.trim(), client_type: "web-cookie" });
      onVerified();
    } catch (exception) {
      setError(apiErrorMessage(exception, "Incorrect or expired code."));
      setBusy(false);
    }
  };

  return (
    <div>
      <Header n="1" title="Continue your booking" text={phase === "email" ? "Enter your email. We will send you a verification code." : `Enter the 6-digit code we sent to ${email}.`} />
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {phase === "email" ? (
        <div className="space-y-4">
          <label className="field-label">Email address *<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), sendOtp())} placeholder="you@example.com" className="field" /></label>
          <button type="button" disabled={busy} onClick={sendOtp} className="nav-primary w-full justify-center">{busy ? <Loader className="animate-spin" size={16} /> : null} Send OTP</button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="field-label">Verification code *<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), verifyOtp())} placeholder="123456" className="field tracking-[0.4em]" /></label>
          <button type="button" disabled={busy} onClick={verifyOtp} className="nav-primary w-full justify-center">{busy ? <Loader className="animate-spin" size={16} /> : null} Verify OTP</button>
          <button type="button" onClick={() => { setPhase("email"); setCode(""); setError(""); }} className="w-full text-center text-xs font-bold text-teal-700">Use a different email</button>
        </div>
      )}
      <button type="button" onClick={onBack} className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowLeft size={14} /> Back to trip setup</button>
    </div>
  );
}

function AgentCustomerSelector({ search, onSearchChange, results, selected, loading, onSelect, onClear }: {
  search: string;
  onSearchChange: (value: string) => void;
  results: AgentCustomer[];
  selected: AgentCustomer | null;
  loading: boolean;
  onSelect: (customer: AgentCustomer) => void;
  onClear: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");

  const createCustomer = async () => {
    if (!fullName.trim() || !email.trim()) {
      setCreateError("Enter the customer name and email.");
      return;
    }
    setSaving(true);
    setCreateError("");
    try {
      const response = await api.post("/customers/", {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() ? combinePhone(phoneCountryCode, phone) : "",
      });
      const customer = response.data?.data ?? response.data;
      if (!customer?.id) throw new Error("Customer was not returned.");
      onSelect(customer);
      setCreating(false);
    } catch (exception) {
      const message = apiErrorMessage(exception, "Customer could not be created.");
      if (message.toLowerCase().includes("email already exists")) {
        try {
          const response = await api.post("/customers/link", { email: email.trim() });
          const customer = response.data?.data ?? response.data;
          onSelect(customer);
          setCreating(false);
          return;
        } catch (linkException) {
          setCreateError(apiErrorMessage(linkException, "This email already exists but could not be linked to your agent account."));
          return;
        }
      }
      setCreateError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-blue-700">Agent booking</p>
      <h3 className="mt-1 font-black text-slate-900">Select your customer</h3>
      <p className="mt-1 text-xs text-slate-500">Only customers available to your agent account are shown.</p>
      {selected ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-3">
          <div className="min-w-0"><b className="block truncate text-sm">{selected.full_name ?? selected.name ?? "Customer"}</b><span className="block truncate text-xs text-slate-500">{selected.email}</span></div>
          <button type="button" onClick={onClear} className="rounded-lg px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Change</button>
        </div>
      ) : <div className="mt-3">
        {!creating ? <>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search customer name or email…" className="field bg-white" />
          <div className="mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
            {loading ? <p className="px-3 py-3 text-xs text-slate-500">Loading customers…</p> : results.length > 0 ? results.map((customer) => (
              <button key={customer.id} type="button" onClick={() => onSelect(customer)} className="block w-full rounded-lg px-3 py-2.5 text-left hover:bg-blue-50">
                <b className="block text-sm">{customer.full_name ?? customer.name ?? "Customer"}</b>
                <span className="block text-xs text-slate-500">{customer.email}</span>
              </button>
            )) : <p className="px-3 py-3 text-xs text-slate-500">{search.trim().length === 1 ? "Type one more character to search." : "No customers found. Create the customer below."}</p>}
          </div>
          <button type="button" onClick={() => { setCreating(true); setCreateError(""); }} className="mt-3 text-xs font-black text-blue-700 hover:text-blue-900">+ Create a new customer</button>
        </> : <div className="space-y-3 rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex items-center justify-between"><b className="text-sm">New customer</b><button type="button" onClick={() => setCreating(false)} className="text-xs font-bold text-slate-500">Cancel</button></div>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name *" className="field" />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address *" className="field" />
          <PhoneInput countryCode={phoneCountryCode} number={phone} onCountryCodeChange={setPhoneCountryCode} onNumberChange={setPhone} label="Phone (optional)" />
          {createError && <p className="text-xs font-semibold text-red-600">{createError}</p>}
          <button type="button" disabled={saving} onClick={() => void createCustomer()} className="w-full rounded-xl bg-blue-700 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Creating…" : "Create and select customer"}</button>
        </div>}
      </div>}
    </div>
  );
}

function AgentCommercialFields({ register, paymentMethod, netPrice, markup, customerTotal, currency, money }: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  paymentMethod: FormValues["agentPaymentMethod"];
  netPrice: number;
  markup: number;
  customerTotal: number;
  currency: string;
  money: (amount: number, sourceCurrency?: string) => string;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-blue-700">Agent details</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Net price</span><b className="mt-1 block text-sm">{money(netPrice, currency)}</b></div>
        <div className="rounded-xl bg-white p-3"><span className="text-[10px] font-bold uppercase text-slate-400">Markup</span><b className="mt-1 block text-sm">{money(markup, currency)}</b></div>
        <div className="rounded-xl bg-blue-700 p-3 text-white"><span className="text-[10px] font-bold uppercase text-blue-100">Customer price</span><b className="mt-1 block text-sm">{money(customerTotal, currency)}</b></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="field-label">Agent markup<input type="number" min={0} step="0.01" {...register("agentMarkup", { valueAsNumber: true, min: 0 })} className="field bg-white" /></label>
        <label className="field-label">Agent reference<input {...register("agentReference")} placeholder="Internal reference" className="field bg-white" /></label>
        <label className="field-label sm:col-span-2">Payment method<select {...register("agentPaymentMethod")} className="field bg-white"><option value="online">Online payment</option><option value="wallet">Agent wallet</option><option value="credit">Credit limit</option><option value="bank_transfer">Bank transfer</option><option value="pay_later">Pay later - admin approval</option></select></label>
      </div>
      {paymentMethod !== "online" && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-blue-800">The booking will be created without opening public online payment and will continue in your agent portal.</p>}
    </div>
  );
}
