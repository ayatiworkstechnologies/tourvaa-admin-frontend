"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LuBed as Bed,
  LuCalendar as Calendar,
  LuChevronDown as ChevronDown,
  LuCircleAlert as CircleAlert,
  LuCircleCheckBig as CheckCircle,
  LuCreditCard as CreditCard,
  LuGlobe as Globe,
  LuLoaderCircle as LoaderCircle,
  LuLockKeyhole as Lock,
  LuMapPin as MapPin,
  LuPlane as Plane,
  LuShieldCheck as ShieldCheck,
  LuUserRound as User,
  LuUsers as Users,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";

const FALLBACK_HERO_BG = "/images/compare-hero.jpg";
const FALLBACK_THUMB = "/images/compare-nz.jpg";

type PassengerType = "adult" | "child";

type PassengerData = {
  type: PassengerType;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneCountry: string;
  phone: string;
  email: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
};

type PriceEstimate = {
  currency: string;
  base_amount: string;
  extension_amount: string;
  discount_amount: string;
  tax_amount: string;
  surcharge_amount: string;
  final_amount: string;
};

const COUNTRIES_LIST = [
  { code: "+91", label: "India (+91)", flag: "🇮🇳" },
  { code: "+1", label: "United States (+1)", flag: "🇺🇸" },
  { code: "+44", label: "United Kingdom (+44)", flag: "🇬🇧" },
  { code: "+61", label: "Australia (+61)", flag: "🇦🇺" },
  { code: "+64", label: "New Zealand (+64)", flag: "🇳🇿" },
  { code: "+1", label: "Canada (+1)", flag: "🇨🇦" },
  { code: "+49", label: "Germany (+49)", flag: "🇩🇪" },
  { code: "+33", label: "France (+33)", flag: "🇫🇷" },
  { code: "+971", label: "United Arab Emirates (+971)", flag: "🇦🇪" },
  { code: "+65", label: "Singapore (+65)", flag: "🇸🇬" },
];

function emptyPassenger(type: PassengerType): PassengerData {
  return {
    type,
    firstName: "",
    middleName: "",
    lastName: "",
    phoneCountry: "+91",
    phone: "",
    email: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
  };
}

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function calcAge(day: string, month: string, year: string): number | null {
  if (!day || !month || !year) return null;
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function DynamicTourBookingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, loading: authLoading } = useAuthContext();
  const { code: displayCurrency, format, formatExact } = useCurrency();

  const tourId = Number(params?.id);

  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [tourLoading, setTourLoading] = useState(true);
  const [tourError, setTourError] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const initialAdults = Math.max(1, Number(searchParams.get("adults") || 1));
  const initialChildren = Math.max(0, Number(searchParams.get("children") || 0));
  const initialTravelDate = searchParams.get("travel_date") || "";

  const [adultCount, setAdultCount] = useState(initialAdults);
  const [childCount] = useState(initialChildren);
  const [selectedRoomUpgradeId, setSelectedRoomUpgradeId] = useState<number | null>(null);
  const [nightAddonQty, setNightAddonQty] = useState<Record<number, number>>({});

  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardCountry, setCardCountry] = useState("India");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{ code: string; amount: string; currency: string } | null>(null);

  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const roleSlug = user?.role?.slug || "";
  const canBook = isLoggedIn && roleSlug === "customer";

  // Auth guard: this checkout requires a logged-in customer. Send anyone
  // else back to login (preserving the return path) or away entirely.
  useEffect(() => {
    if (authLoading) return;
    const query = searchParams.toString();
    const currentPath = `/booking/${params?.id}${query ? `?${query}` : ""}`;
    if (!isLoggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (roleSlug && roleSlug !== "customer") {
      router.replace("/tours");
    }
  }, [authLoading, isLoggedIn, roleSlug, router, params?.id, searchParams]);

  // Fetch real tour data
  useEffect(() => {
    if (!tourId || Number.isNaN(tourId)) {
      setTourLoading(false);
      setTourError(true);
      return;
    }
    let active = true;
    fetchPublicTourDetail(tourId)
      .then((res) => {
        if (active) setTour(res);
      })
      .catch(() => {
        if (active) setTourError(true);
      })
      .finally(() => {
        if (active) setTourLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tourId]);

  const availableCalendar = useMemo(
    () => (tour?.calendar || []).filter((c) => c.status === "available" && c.slots > 0),
    [tour]
  );
  const selectedCalendar = useMemo(() => {
    if (availableCalendar.length === 0) return null;
    if (initialTravelDate) {
      const match = availableCalendar.find((c) => c.date === initialTravelDate);
      if (match) return match;
    }
    return availableCalendar[0];
  }, [availableCalendar, initialTravelDate]);

  const roomUpgradeExtensions = useMemo(
    () => (tour?.extensions || []).filter((e) => e.category === "room_upgrade" && (e.price ?? 0) > 0),
    [tour]
  );
  const nightAddonExtensions = useMemo(
    () => (tour?.extensions || []).filter((e) => e.category === "additional_night" && (e.price ?? 0) > 0),
    [tour]
  );

  const extensionsPayload = useMemo(() => {
    const list: { id: number; quantity: number }[] = [];
    if (selectedRoomUpgradeId) list.push({ id: selectedRoomUpgradeId, quantity: adultCount });
    Object.entries(nightAddonQty).forEach(([id, qty]) => {
      if (qty > 0) list.push({ id: Number(id), quantity: qty });
    });
    return list;
  }, [selectedRoomUpgradeId, nightAddonQty, adultCount]);

  // Start (or resume) a real checkout session once the tour has resolved
  useEffect(() => {
    if (!tour || !canBook || sessionKey) return;
    let active = true;
    const storageKey = `tourvaa_checkout_session_${tour.id}`;
    const existing = typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null;
    api
      .post("/checkout/start", {
        tour_id: tour.id,
        tour_calendar_id: selectedCalendar?.id ?? null,
        session_key: existing || undefined,
      })
      .then((res) => {
        if (!active) return;
        const key = res.data?.data?.session_key;
        if (key) {
          setSessionKey(key);
          if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, key);
        }
      })
      .catch(() => {
        if (active) setSessionError("Could not start checkout. Please refresh and try again.");
      });
    return () => {
      active = false;
    };
  }, [tour, canBook, selectedCalendar, sessionKey]);

  // Keep the passenger form list in sync with adult/child counts
  useEffect(() => {
    setPassengers((prev) => {
      const total = adultCount + childCount;
      const next: PassengerData[] = [];
      for (let i = 0; i < total; i++) {
        const type: PassengerType = i < adultCount ? "adult" : "child";
        next.push(prev[i] ? { ...prev[i], type } : emptyPassenger(type));
      }
      return next;
    });
  }, [adultCount, childCount]);

  // Tour metadata
  const tourTitle = tour?.title || "";
  const tourDays = tour?.number_of_days || 0;
  const tourPlace = tour?.country_name || "";
  const tourRoute =
    tour?.start_location && tour?.end_location ? `${tour.start_location} → ${tour.end_location}` : "";
  const tourThumbnail = tour?.banner_image ? mediaUrl(tour.banner_image) : FALLBACK_THUMB;
  const totalTravellers = adultCount + childCount;

  const pricingSlab = useMemo(
    () =>
      (tour?.pricing || []).find(
        (p) => totalTravellers >= p.persons_from && (p.persons_to == null || totalTravellers <= p.persons_to)
      ) ?? null,
    [tour, totalTravellers]
  );
  const adultUnitPrice = pricingSlab?.price_per_person ?? tour?.price_start_per_person ?? 0;
  const tourCurrency = pricingSlab?.currency || tour?.currency || "USD";

  // Live, server-authoritative price estimate -- replaces all client-guessed math
  useEffect(() => {
    if (!tour || !canBook) return;
    let active = true;
    setPriceLoading(true);
    const timer = setTimeout(() => {
      api
        .post("/bookings/calculate-price", {
          customer_id: user?.customer_id || 0,
          tour_id: tour.id,
          tour_calendar_id: selectedCalendar?.id ?? null,
          booking_source: "customer",
          no_of_adults: adultCount,
          no_of_children: childCount,
          adults_count: adultCount,
          children_count: childCount,
          currency: tour.currency || "USD",
          extensions: extensionsPayload,
          promo_code: promoApplied ? promoCode.trim() : undefined,
        })
        .then((res) => {
          if (!active) return;
          setPriceEstimate(res.data?.data ?? null);
          if (promoApplied) setPromoError(null);
        })
        .catch((err) => {
          if (!active) return;
          setPriceEstimate(null);
          if (promoApplied) {
            setPromoError(getApiErrorMessage(err));
            setPromoApplied(false);
          }
        })
        .finally(() => {
          if (active) setPriceLoading(false);
        });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tour, canBook, selectedCalendar, adultCount, childCount, extensionsPayload, promoApplied, promoCode, user]);

  const handlePassengerChange = (index: number, field: keyof PassengerData, value: string) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoError(null);
    setPromoApplied(true);
  };

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(" ") : raw);
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleContinueStep1 = async () => {
    setStepError(null);
    if (availableCalendar.length > 0 && !selectedCalendar) {
      setStepError("No available departure dates for this tour right now.");
      return;
    }
    if (selectedCalendar && totalTravellers > selectedCalendar.slots) {
      setStepError(`Only ${selectedCalendar.slots} seat(s) left for this date. Please reduce travellers.`);
      return;
    }
    if (sessionKey) {
      try {
        await api.patch(`/checkout/session/${sessionKey}`, {
          step: "accommodation",
          data: { adults: adultCount, children: childCount, extensions: extensionsPayload },
        });
      } catch (err) {
        setStepError(getApiErrorMessage(err));
        return;
      }
    }
    setStep(2);
  };

  const validatePassengers = (): string | null => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const label = p.type === "child" ? `Passenger ${i + 1} (child)` : `Passenger ${i + 1}`;
      if (!p.firstName.trim() || !p.lastName.trim()) return `Enter the full name for ${label}.`;
      const age = calcAge(p.birthDay, p.birthMonth, p.birthYear);
      if (age === null) return `Enter a valid date of birth for ${label}.`;
      if (p.type === "adult" && (age < 12 || age > 120)) return `${label} must be 12 years or older.`;
      if (p.type === "child" && (age < 3 || age > 11)) return `${label} must be between 3 and 11 years old.`;
      if (i === 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) return "Enter a valid email address for the lead passenger.";
        if (!p.phone.trim()) return "Enter a phone number for the lead passenger.";
      }
    }
    return null;
  };

  const handleContinueStep2 = async () => {
    const err = validatePassengers();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    const travellers = passengers.map((p, idx) => ({
      traveller_type: p.type,
      first_name: p.firstName.trim(),
      last_name: p.lastName.trim(),
      full_name: `${p.firstName} ${p.middleName} ${p.lastName}`.replace(/\s+/g, " ").trim(),
      date_of_birth: `${p.birthYear}-${p.birthMonth}-${p.birthDay}`,
      age: calcAge(p.birthDay, p.birthMonth, p.birthYear),
      email: idx === 0 ? p.email.trim() : undefined,
      phone: idx === 0 ? `${p.phoneCountry}${p.phone}`.trim() : undefined,
      is_primary_contact: idx === 0,
    }));
    if (sessionKey) {
      try {
        await api.patch(`/checkout/session/${sessionKey}`, {
          step: "payment",
          data: { travellers, promo_code: promoApplied ? promoCode.trim() : null },
        });
      } catch (submitErr) {
        setStepError(getApiErrorMessage(submitErr));
        return;
      }
    }
    setStep(3);
  };

  const isCardValid = () => {
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13 || digits.length > 16) return false;
    const expiryMatch = cardExpiry.match(/^(\d{2}) \/ (\d{2})$/);
    if (!expiryMatch) return false;
    const mm = Number(expiryMatch[1]);
    if (mm < 1 || mm > 12) return false;
    if (cardCvc.length < 3) return false;
    return true;
  };

  const handleConfirmAndPay = async () => {
    setPaymentError(null);
    if (!acceptTerms) return;
    if (!sessionKey) {
      setPaymentError("Checkout session is not ready. Please refresh and try again.");
      return;
    }
    if (!isCardValid()) {
      setPaymentError("Please enter valid card details.");
      return;
    }
    setPaymentSubmitting(true);
    try {
      const res = await api.post(`/checkout/session/${sessionKey}/confirm`, {
        promo_code: promoApplied ? promoCode.trim() : undefined,
        agreed_terms: acceptTerms,
        agreed_cancellation_policy: acceptTerms,
      });
      const booking = res.data?.data?.booking;
      if (typeof window !== "undefined" && tour) {
        window.sessionStorage.removeItem(`tourvaa_checkout_session_${tour.id}`);
      }
      setBookingResult({
        code: booking?.booking_code || "",
        amount: String(booking?.final_amount ?? booking?.total_cost ?? "0"),
        currency: booking?.currency || tourCurrency,
      });
      setStep(4);
    } catch (err) {
      setPaymentError(getApiErrorMessage(err));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (authLoading || !canBook) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoaderCircle size={28} className="animate-spin text-slate-400" />
      </main>
    );
  }

  if (tourLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoaderCircle size={28} className="animate-spin text-slate-400" />
      </main>
    );
  }

  if (tourError || !tour) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC] text-center">
        <CircleAlert size={40} className="text-rose-400" />
        <p className="text-lg font-bold text-slate-900">This tour could not be loaded.</p>
        <Link href="/tours" className="rounded-lg bg-[#0B1F3A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#132d50]">
          Browse All Tours
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 pt-4 text-slate-900">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* TOP TOUR SUMMARY BANNER CARD */}
        <div className="relative mb-6 w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
          <div className="absolute inset-0 z-0">
            <img src={FALLBACK_HERO_BG} alt="Destination scenery" className="h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80" />
          </div>

          <div className="relative z-10 p-3.5 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-3 sm:p-3.5 shadow-md">
              <div className="flex items-center gap-3.5">
                <img
                  src={tourThumbnail}
                  alt={tourTitle}
                  className="h-16 w-24 sm:h-18 sm:w-28 rounded-lg object-cover shadow-2xs shrink-0"
                />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">{tourTitle}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                    {tourPlace && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-blue-500" />
                        {tourPlace}
                      </span>
                    )}
                    {tourDays > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-blue-500" />
                        {`${tourDays} days`}
                      </span>
                    )}
                    {tourRoute && (
                      <span className="inline-flex items-center gap-1">
                        <Plane size={12} className="text-blue-500" />
                        {tourRoute}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={tour.slug ? `/tours/${tour.slug}` : `/tours`}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-blue-600 transition shrink-0 self-end sm:self-center pr-2"
              >
                <span>View tour</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* BOOKING CONFIRMED SUCCESS VIEW (STEP 4) */}
        {step === 4 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm my-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={48} />
            </div>
            <span className="mt-6 inline-block text-xs font-black uppercase tracking-widest text-emerald-600">
              Booking Received
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              You&apos;re Going to {tourPlace || "your destination"}!
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Your booking for <b>{tourTitle}</b> has been received and is pending payment confirmation. A
              confirmation email has been sent to you.
            </p>

            <div className="mt-6 inline-block rounded-xl border border-slate-200 bg-slate-50 px-6 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Booking Reference</p>
              <p className="mt-1 text-2xl font-black tracking-wider text-[#0B1F3A]">{bookingResult?.code}</p>
              {bookingResult && (
                <p className="mt-1 text-sm font-bold text-slate-700">
                  Total: {formatExact(Number(bookingResult.amount), bookingResult.currency)}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/tours"
                className="rounded-lg bg-[#0B1F3A] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#132d50]"
              >
                Explore More Tours
              </Link>
              <Link
                href="/customer/bookings"
                className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            {/* LEFT COLUMN: 3-STEP FLOW */}
            <div className="space-y-4">
              {sessionError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  <CircleAlert size={14} />
                  {sessionError}
                </div>
              )}

              {/* STEP 1: PASSENGERS & ACCOMMODATION */}
              {step === 1 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4572E] text-xs font-black text-white shrink-0">
                      1
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Passengers &amp; Accommodation</h2>
                  </div>

                  {/* Passengers */}
                  <div className="pt-6">
                    <h3 className="text-sm font-bold text-slate-900">Passengers</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Select the number of adults travelling with you.</p>

                    <div className="mt-4 max-w-xs">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Number of Adults (18+)</label>
                      <div className="relative">
                        <select
                          value={adultCount}
                          onChange={(e) => setAdultCount(Number(e.target.value))}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                      {selectedCalendar && (
                        <p className="mt-1.5 text-[11px] text-slate-400">{selectedCalendar.slots} seats left on this date</p>
                      )}
                      {childCount > 0 && (
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          + {childCount} {childCount === 1 ? "child" : "children"} (selected on the tour page)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Tour Accommodation</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Assign {totalTravellers} {totalTravellers === 1 ? "guest" : "guests"} to an accommodation choice
                    </p>

                    <div className="mt-4 space-y-3">
                      <div
                        onClick={() => setSelectedRoomUpgradeId(null)}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border p-4 cursor-pointer transition ${
                          selectedRoomUpgradeId === null
                            ? "border-blue-500 bg-blue-50/10 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">Shared</p>
                            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                              A shared room. Solo travellers will be matched up and share with another solo traveller
                              of the same gender.
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs sm:text-sm font-black text-slate-900">
                            {format(adultUnitPrice, tourCurrency)}
                          </p>
                          <p className="text-[10px] text-slate-400">Per passenger</p>
                        </div>
                      </div>

                      {roomUpgradeExtensions.map((ext) => (
                        <div
                          key={ext.id}
                          onClick={() => setSelectedRoomUpgradeId(ext.id)}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border p-4 cursor-pointer transition ${
                            selectedRoomUpgradeId === ext.id
                              ? "border-blue-500 bg-blue-50/10 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-slate-900">{ext.title}</p>
                              {ext.description && (
                                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                                  {ext.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-xs sm:text-sm font-black text-slate-900">
                              {format(adultUnitPrice + (ext.price ?? 0), tourCurrency)}
                            </p>
                            <p className="text-[10px] text-slate-400">Per passenger</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pre/Post Tour Add-ons -- only rendered when the tour actually has real add-ons configured */}
                  {nightAddonExtensions.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Pre and Post Tour Accommodation</h3>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed max-w-2xl">
                        Optional add-on nights of accommodation around your tour dates.
                      </p>

                      <div className="mt-4 space-y-3">
                        {nightAddonExtensions.map((ext) => (
                          <div
                            key={ext.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5"
                          >
                            <div className="flex items-start gap-3">
                              <Bed size={18} className="text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-slate-900">{ext.title}</p>
                                {ext.description && <p className="text-[11px] text-slate-500">{ext.description}</p>}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                              <div className="text-left sm:text-right mr-2">
                                <p className="text-xs font-black text-slate-900">{format(ext.price ?? 0, tourCurrency)}</p>
                                <p className="text-[9px] text-slate-400">Per night</p>
                              </div>

                              <div className="relative">
                                <select
                                  value={nightAddonQty[ext.id] || 0}
                                  onChange={(e) =>
                                    setNightAddonQty((prev) => ({ ...prev, [ext.id]: Number(e.target.value) }))
                                  }
                                  className="appearance-none rounded-md border border-slate-200 bg-white py-1 pl-2.5 pr-6 text-[11px] font-semibold text-slate-700 outline-none"
                                >
                                  {[0, 1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>
                                      {n} {n === 1 ? "Night" : "Nights"}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={10}
                                  className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stepError && (
                    <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <CircleAlert size={13} />
                      {stepError}
                    </p>
                  )}

                  <div className="mt-8 pt-4">
                    <button
                      type="button"
                      onClick={handleContinueStep1}
                      className="rounded-lg bg-[#E4572E] px-7 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-[#cf4b24] active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <span>Continue to passenger details</span>
                      <span>➜</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setStep(1)}
                  className="flex items-center justify-between rounded-xl border border-[#D1F0DC] bg-[#EDF8F1] px-5 py-3.5 cursor-pointer transition hover:bg-[#e4f4e9]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900">Passengers &amp; Accommodation</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 hover:underline">Edit ⌄</span>
                </div>
              )}

              {/* STEP 2: PASSENGER DETAILS */}
              {step === 2 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4572E] text-xs font-black text-white shrink-0">
                      2
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Passenger Details</h2>
                  </div>

                  <div className="pt-6">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Discount Code</label>
                    <div className="flex max-w-md items-center gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoApplied(false);
                        }}
                        placeholder="Enter promo code"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="rounded-lg bg-[#0B1F3A] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#132d50]"
                      >
                        Apply
                      </button>
                    </div>
                    {promoApplied && priceEstimate && Number(priceEstimate.discount_amount) > 0 && (
                      <p className="mt-1.5 text-xs font-semibold text-emerald-600">
                        Promo code applied! Saved {format(Number(priceEstimate.discount_amount), priceEstimate.currency)}.
                      </p>
                    )}
                    {promoError && <p className="mt-1.5 text-xs font-semibold text-rose-600">{promoError}</p>}
                  </div>

                  {passengers.map((passenger, idx) => {
                    const isLead = idx === 0;
                    const ordinal = idx + 1 === 2 ? "2nd" : idx + 1 === 3 ? "3rd" : `${idx + 1}th`;
                    const labelTitle = isLead
                      ? "Lead Passenger details"
                      : `${ordinal} Passenger details${passenger.type === "child" ? " (Child)" : ""}`;

                    return (
                      <div key={idx} className="mt-8 pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900">{labelTitle}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {passenger.type === "child" ? "Traveller must be 3-11 years old." : "Traveller must be 12 years or older."}
                        </p>

                        <div className="mt-4 space-y-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">First name *</label>
                            <input
                              type="text"
                              value={passenger.firstName}
                              onChange={(e) => handlePassengerChange(idx, "firstName", e.target.value)}
                              placeholder="e.g. Srinath"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Middle name</label>
                            <input
                              type="text"
                              value={passenger.middleName}
                              onChange={(e) => handlePassengerChange(idx, "middleName", e.target.value)}
                              placeholder="e.g. Reddy"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Last name *</label>
                            <input
                              type="text"
                              value={passenger.lastName}
                              onChange={(e) => handlePassengerChange(idx, "lastName", e.target.value)}
                              placeholder="e.g. Garu"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          {isLead && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone number *</label>
                                <div className="flex gap-2">
                                  <div className="relative w-44 shrink-0">
                                    <select
                                      value={passenger.phoneCountry}
                                      onChange={(e) => handlePassengerChange(idx, "phoneCountry", e.target.value)}
                                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                                    >
                                      {COUNTRIES_LIST.map((c) => (
                                        <option key={c.label} value={c.code}>
                                          {`${c.flag} ${c.label}`}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown
                                      size={12}
                                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                  </div>
                                  <input
                                    type="tel"
                                    value={passenger.phone}
                                    onChange={(e) => handlePassengerChange(idx, "phone", e.target.value)}
                                    placeholder="Enter phone number"
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Email address *</label>
                                <input
                                  type="email"
                                  value={passenger.email}
                                  onChange={(e) => handlePassengerChange(idx, "email", e.target.value)}
                                  placeholder="e.g. srinath@example.com"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="relative">
                                <select
                                  value={passenger.birthDay}
                                  onChange={(e) => handlePassengerChange(idx, "birthDay", e.target.value)}
                                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                                >
                                  <option value="">DD</option>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={String(d).padStart(2, "0")}>
                                      {String(d).padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={12}
                                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>

                              <div className="relative">
                                <select
                                  value={passenger.birthMonth}
                                  onChange={(e) => handlePassengerChange(idx, "birthMonth", e.target.value)}
                                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                                >
                                  <option value="">Month</option>
                                  {[
                                    "January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December",
                                  ].map((m, mIdx) => (
                                    <option key={m} value={String(mIdx + 1).padStart(2, "0")}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={12}
                                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>

                              <div className="relative">
                                <select
                                  value={passenger.birthYear}
                                  onChange={(e) => handlePassengerChange(idx, "birthYear", e.target.value)}
                                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                                >
                                  <option value="">YYYY</option>
                                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={String(y)}>
                                      {y}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={12}
                                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stepError && (
                    <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <CircleAlert size={13} />
                      {stepError}
                    </p>
                  )}

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueStep2}
                      className="rounded-lg bg-[#E4572E] px-7 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-[#cf4b24] active:scale-[0.99] flex items-center gap-1.5"
                    >
                      <span>Continue to Payment details</span>
                      <span>➜</span>
                    </button>
                  </div>
                </div>
              ) : step > 2 ? (
                <div
                  onClick={() => setStep(2)}
                  className="flex items-center justify-between rounded-xl border border-[#D1F0DC] bg-[#EDF8F1] px-5 py-3.5 cursor-pointer transition hover:bg-[#e4f4e9]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900">Passenger Details</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 hover:underline">Edit ⌄</span>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                      2
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-500">2. Passenger Details</span>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4572E] text-xs font-black text-white shrink-0">
                      3
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Payment</h2>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Lock size={13} className="text-emerald-700" />
                      <span>This is a secure SSL encrypted payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Secure Payments by Tourvaa</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-50/60 px-3 py-1.5 text-xs font-bold text-blue-700"
                      >
                        <CreditCard size={14} />
                        <span>Card</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Card number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="1234 4567 8910 1112"
                          maxLength={19}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-80">
                          <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-black text-blue-900 border border-slate-200">
                            VISA
                          </span>
                          <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-black text-rose-700 border border-slate-200">
                            MC
                          </span>
                          <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-black text-cyan-800 border border-slate-200">
                            AMEX
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM / YY"
                          maxLength={7}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Security code</label>
                        <div className="relative">
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="CVC"
                            maxLength={4}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                          />
                          <CreditCard
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Country/Territory</label>
                      <div className="relative">
                        <select
                          value={cardCountry}
                          onChange={(e) => setCardCountry(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
                        >
                          <option>India</option>
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Australia</option>
                          <option>New Zealand</option>
                          <option>Canada</option>
                          <option>Singapore</option>
                          <option>Germany</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed pt-1">
                      By providing your card information, you allow Tourvaa to charge your card for future payments
                      in accordance with their terms.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        I accept Tourvaa{" "}
                        <Link href="/terms" className="text-blue-600 underline font-semibold">
                          Terms &amp; Conditions
                        </Link>{" "}
                        and cancellation policy
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={subscribeNewsletter}
                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Subscribe to our newsletter for the latest offers &amp; new trips</span>
                    </label>
                  </div>

                  {paymentError && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <CircleAlert size={13} />
                      {paymentError}
                    </p>
                  )}

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleConfirmAndPay}
                      disabled={!acceptTerms || paymentSubmitting}
                      className="w-full rounded-lg bg-[#E4572E] hover:bg-[#cf4b24] py-3.5 px-6 text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
                    >
                      {paymentSubmitting ? "Processing..." : "Confirm and pay"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                      3
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-500">3. Payment</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY TRIP SUMMARY */}
            <aside className="sticky top-24 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">TRIP SUMMARY</h3>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">YOUR TOUR</p>
                <p className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">{tourTitle}</p>
                {tourDays > 0 && <p className="text-[11px] text-slate-500">{`${tourDays} days`}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DATES</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                    {selectedCalendar ? formatDate(selectedCalendar.date) : "No dates currently available"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Edit
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACCOMMODATION</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                    {selectedRoomUpgradeId
                      ? roomUpgradeExtensions.find((e) => e.id === selectedRoomUpgradeId)?.title || "Upgraded room"
                      : "Shared"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {adultCount} {adultCount === 1 ? "adult" : "adults"}
                    {childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Edit
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">PRICE BREAKDOWN</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                    <Globe size={12} />
                    {`Shown in ${displayCurrency}`}
                  </span>
                </div>

                {priceLoading && !priceEstimate ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                    <LoaderCircle size={14} className="animate-spin" />
                    Calculating price...
                  </div>
                ) : priceEstimate ? (
                  <>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <div>
                          <p className="font-semibold text-slate-900">Base fare</p>
                          <p className="text-[10px] text-slate-400">
                            {adultCount} {adultCount === 1 ? "adult" : "adults"}
                            {childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          {format(Number(priceEstimate.base_amount), priceEstimate.currency)}
                        </span>
                      </div>

                      {Number(priceEstimate.extension_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1">
                          <span className="text-slate-600">Add-ons</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.extension_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.discount_amount) > 0 && (
                        <div className="flex items-center justify-between text-emerald-600 pt-1">
                          <span>Discount</span>
                          <span className="font-bold">
                            - {format(Number(priceEstimate.discount_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.tax_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1">
                          <span className="text-slate-600">Taxes</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.tax_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-[#F0F4F8] p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Total</p>
                        <p className="text-[10px] text-slate-500">Taxes &amp; fees included</p>
                      </div>
                      <strong className="text-base sm:text-lg font-black text-slate-950">
                        {format(Number(priceEstimate.final_amount), priceEstimate.currency)}
                      </strong>
                    </div>
                  </>
                ) : (
                  <p className="py-3 text-xs text-slate-400">Price unavailable right now.</p>
                )}

                {step < 3 && (
                  <button
                    type="button"
                    onClick={step === 1 ? handleContinueStep1 : handleContinueStep2}
                    className="mt-4 w-full rounded-lg bg-[#0B1F3A] hover:bg-[#132d50] py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition active:scale-[0.99]"
                  >
                    Proceed to Payment
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
