"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LuBed as Bed,
  LuCalendar as Calendar,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuCircleCheckBig as CheckCircle,
  LuCreditCard as CreditCard,
  LuGlobe as Globe,
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
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";

const FALLBACK_HERO_BG = "/images/compare-hero.jpg";
const FALLBACK_THUMB = "/images/compare-nz.jpg";

type PassengerData = {
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

export default function DynamicTourBookingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn } = useAuthContext();
  const { format: formatMoney } = useCurrency();

  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Stepper state (1: Passengers & Accommodation, 2: Passenger Details, 3: Payment, 4: Confirmed)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Passengers & Accommodation
  const [adultCount, setAdultCount] = useState<number>(2);
  const [accommodationType, setAccommodationType] = useState<"shared" | "single">("shared");
  const [sharedRoomsCount, setSharedRoomsCount] = useState<number>(2);
  const [singleRoomsCount, setSingleRoomsCount] = useState<number>(0);

  // Pre/Post accommodation add-ons
  const [postAccRooms, setPostAccRooms] = useState<number>(0);
  const [postAccNights, setPostAccNights] = useState<number>(0);
  const [preAccRooms, setPreAccRooms] = useState<number>(0);
  const [preAccNights, setPreAccNights] = useState<number>(0);

  // Step 2: Passenger Details
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const [passengers, setPassengers] = useState<PassengerData[]>([
    {
      firstName: "",
      middleName: "",
      lastName: "",
      phoneCountry: "+91",
      phone: "",
      email: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
    },
    {
      firstName: "",
      middleName: "",
      lastName: "",
      phoneCountry: "+91",
      phone: "",
      email: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
    },
  ]);

  // Step 3: Payment Form
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardCountry, setCardCountry] = useState("India");
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [bookingCode, setBookingCode] = useState<string>("");

  // Travel dates
  const [startDateStr, setStartDateStr] = useState("12 Aug 2026");
  const [endDateStr, setEndDateStr] = useState("20 Aug 2026");

  // Fetch tour details
  useEffect(() => {
    const tourId = Number(params?.id);
    if (!tourId || Number.isNaN(tourId)) {
      setLoading(false);
      return;
    }
    fetchPublicTourDetail(tourId)
      .then((res) => {
        if (res) {
          setTour(res);
          if (res.calendar && res.calendar.length > 0) {
            const depDate = new Date(res.calendar[0].date);
            setStartDateStr(
              depDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            );
            const days = res.number_of_days || 9;
            const returnDate = new Date(depDate);
            returnDate.setDate(returnDate.getDate() + (days - 1));
            setEndDateStr(
              returnDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            );
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  // Keep passenger list length synced with adult count
  useEffect(() => {
    setPassengers((prev) => {
      const next = [...prev];
      while (next.length < adultCount) {
        next.push({
          firstName: "",
          middleName: "",
          lastName: "",
          phoneCountry: "+91",
          phone: "",
          email: "",
          birthDay: "",
          birthMonth: "",
          birthYear: "",
        });
      }
      return next.slice(0, adultCount);
    });

    if (accommodationType === "shared") {
      setSharedRoomsCount(adultCount);
      setSingleRoomsCount(0);
    } else {
      setSingleRoomsCount(adultCount);
      setSharedRoomsCount(0);
    }
  }, [adultCount, accommodationType]);

  // Tour metadata fallbacks matching screenshot
  const tourTitle = tour?.title || "North Island Adventure - 9 days";
  const tourDays = tour?.number_of_days || 9;
  const tourPlace = tour?.country_name || "New Zealand";
  const tourRoute =
    tour?.start_location && tour?.end_location
      ? `${tour.start_location} → ${tour.end_location}`
      : "Auckland → Wellington";
  const tourThumbnail = tour?.banner_image ? mediaUrl(tour.banner_image) : FALLBACK_THUMB;

  // Base pricing
  const basePricePerPerson = tour?.price_start_per_person || 1985;
  const singleSupplementRate = 2730;
  const ratePerPerson =
    accommodationType === "single" ? singleSupplementRate : basePricePerPerson;

  // Total calculations
  const travellersTotal = ratePerPerson * adultCount;
  const prePostAddonTotal =
    postAccRooms * postAccNights * 45 + preAccRooms * preAccNights * 45;
  const subTotal = travellersTotal + prePostAddonTotal - promoDiscount;
  const finalTotal = Math.max(0, subTotal);

  // Update a specific passenger field
  const handlePassengerChange = (
    index: number,
    field: keyof PassengerData,
    value: string
  ) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Promo code handler
  const handleApplyPromo = () => {
    if (promoCode.trim().toLowerCase() === "save10") {
      const discount = travellersTotal * 0.1;
      setPromoDiscount(discount);
      setPromoApplied(true);
    } else if (promoCode.trim().length > 0) {
      setPromoDiscount(100);
      setPromoApplied(true);
    }
  };

  // Format credit card input with spaces
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(" ") : raw);
  };

  // Format card expiry with slash
  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Submit and confirm booking
  const handleConfirmAndPay = async () => {
    setPaymentSubmitting(true);
    try {
      const generatedCode = `TV-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingCode(generatedCode);
      // If signed in, also sync with API endpoint
      if (isLoggedIn && tour?.id) {
        await api.post("/customer/bookings", {
          tour_id: tour.id,
          tour_name: tour.title,
          tour_date: startDateStr,
          no_of_adults: adultCount,
          currency: "USD",
          total_price: finalTotal,
          payment_type: "full",
          travellers: passengers.map((p) => ({
            full_name: `${p.firstName} ${p.lastName}`.trim(),
            email: p.email,
            phone: `${p.phoneCountry}${p.phone}`,
            birth_date: `${p.birthYear}-${p.birthMonth}-${p.birthDay}`,
          })),
        }).catch(() => {});
      }
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 pt-4 text-slate-900">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* TOP TOUR SUMMARY BANNER CARD */}
        <div className="relative mb-6 w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
          {/* Background Scenic Image with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={FALLBACK_HERO_BG}
              alt="Destination scenery"
              className="h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80" />
          </div>

          {/* Floating White Tour Badge Inside Banner */}
          <div className="relative z-10 p-3.5 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-3 sm:p-3.5 shadow-md">
              <div className="flex items-center gap-3.5">
                {/* Thumbnail */}
                <img
                  src={tourThumbnail}
                  alt={tourTitle}
                  className="h-16 w-24 sm:h-18 sm:w-28 rounded-lg object-cover shadow-2xs shrink-0"
                />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                    {tourTitle}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500" />
                      {tourPlace}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-blue-500" />
                      {`${tourDays} days`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Plane size={12} className="text-blue-500" />
                      {tourRoute}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={tour?.slug ? `/tours/${tour.slug}` : `/tours`}
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
              Payment & Booking Confirmed
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              You&apos;re Going to {tourPlace}!
            </h1>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Your booking for <b>{tourTitle}</b> has been received. A confirmation
              and itinerary voucher have been sent to your email.
            </p>

            <div className="mt-6 inline-block rounded-xl border border-slate-200 bg-slate-50 px-6 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Booking Reference
              </p>
              <p className="mt-1 text-2xl font-black tracking-wider text-[#0B1F3A]">
                {bookingCode || "TV-892401"}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/tours"
                className="rounded-lg bg-[#0B1F3A] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#132d50]"
              >
                Explore More Tours
              </Link>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Book Another Trip
              </button>
            </div>
          </div>
        ) : (
          /* MAIN 2-COLUMN BOOKING FLOW GRID */
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            {/* LEFT COLUMN: DYNAMIC 3-STEP FLOW */}
            <div className="space-y-4">
              {/* STEP 1: PASSENGERS & ACCOMMODATION */}
              {step === 1 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4572E] text-xs font-black text-white shrink-0">
                      1
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Passengers &amp; Accommodation
                    </h2>
                  </div>

                  {/* Section 1: Passengers */}
                  <div className="pt-6">
                    <h3 className="text-sm font-bold text-slate-900">Passengers</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Select the number of passengers traveling with you.
                    </p>

                    <div className="mt-4 max-w-xs">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Number of Adults (18+)
                      </label>
                      <div className="relative">
                        <select
                          value={adultCount}
                          onChange={(e) => setAdultCount(Number(e.target.value))}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
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
                    </div>
                  </div>

                  {/* Section 2: Tour Accommodation */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                      Tour Accommodation
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Assign {adultCount} {adultCount === 1 ? "guest" : "guests"} to an accommodation choice
                    </p>

                    <div className="mt-4 space-y-3">
                      {/* Option 1: Shared */}
                      <div
                        onClick={() => setAccommodationType("shared")}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border p-4 cursor-pointer transition ${
                          accommodationType === "shared"
                            ? "border-blue-500 bg-blue-50/10 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              Shared
                            </p>
                            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                              A shared room. Solo travellers will be matched up and share with another solo traveller of the same gender.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm font-black text-slate-900">
                              USD ${basePricePerPerson.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400">Per passenger</p>
                          </div>

                          <div className="relative">
                            <select
                              value={accommodationType === "shared" ? `${sharedRoomsCount} rooms (${sharedRoomsCount} guests)` : "0 rooms (0 guests)"}
                              onChange={(e) => {
                                setAccommodationType("shared");
                                const parsed = parseInt(e.target.value) || adultCount;
                                setSharedRoomsCount(parsed);
                              }}
                              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                            >
                              <option>{`${adultCount} rooms (${adultCount} guests)`}</option>
                              <option>1 room (1 guest)</option>
                              <option>0 rooms (0 guests)</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Option 2: Single */}
                      <div
                        onClick={() => setAccommodationType("single")}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border p-4 cursor-pointer transition ${
                          accommodationType === "single"
                            ? "border-blue-500 bg-blue-50/10 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              Single
                            </p>
                            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                              Enjoy the privacy of your own room.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm font-black text-slate-900">
                              USD ${singleSupplementRate.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400">Per passenger</p>
                          </div>

                          <div className="relative">
                            <select
                              value={accommodationType === "single" ? `${singleRoomsCount} rooms (${singleRoomsCount} guests)` : "0 rooms (0 guests)"}
                              onChange={(e) => {
                                setAccommodationType("single");
                                const parsed = parseInt(e.target.value) || adultCount;
                                setSingleRoomsCount(parsed);
                              }}
                              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                            >
                              <option>0 rooms (0 guests)</option>
                              <option>{`${adultCount} rooms (${adultCount} guests)`}</option>
                              <option>1 room (1 guest)</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Pre and Post Tour Accommodation */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                      Pre and Post Tour Accommodation
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed max-w-2xl">
                      If you choose our pre or post tour accommodation, then we guarantee you will stay in the same hotel that the tour starts from or ends in, meaning you can unpack and relax without needing to worry about moving to a different hotel.
                    </p>

                    {/* Post-Tour Wellington */}
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-800 mb-2">
                        Post Tour Accommodation Wellington – (Intro Travel)
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className="flex items-start gap-3">
                          <Bed size={18} className="text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Shared</p>
                            <p className="text-[11px] text-slate-500">
                              A shared room. Solo travellers will be matched up and share with another solo traveller of the same gender.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
                          <div className="text-left sm:text-right mr-2">
                            <p className="text-xs font-black text-slate-900">USD $45</p>
                            <p className="text-[9px] text-slate-400">Per passenger / night</p>
                          </div>

                          <div className="relative">
                            <select
                              value={postAccRooms}
                              onChange={(e) => setPostAccRooms(Number(e.target.value))}
                              className="appearance-none rounded-md border border-slate-200 bg-white py-1 pl-2.5 pr-6 text-[11px] font-semibold text-slate-700 outline-none"
                            >
                              <option value={0}>0 rooms (0 guests)</option>
                              <option value={1}>1 room (1 guest)</option>
                              <option value={2}>2 rooms (2 guests)</option>
                            </select>
                            <ChevronDown
                              size={10}
                              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>

                          <div className="relative">
                            <select
                              value={postAccNights}
                              onChange={(e) => setPostAccNights(Number(e.target.value))}
                              className="appearance-none rounded-md border border-slate-200 bg-white py-1 pl-2.5 pr-6 text-[11px] font-semibold text-slate-700 outline-none"
                            >
                              <option value={0}>0 Nights</option>
                              <option value={1}>1 Night</option>
                              <option value={2}>2 Nights</option>
                              <option value={3}>3 Nights</option>
                            </select>
                            <ChevronDown
                              size={10}
                              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>

                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            More Options
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (postAccRooms === 0) setPostAccRooms(1);
                              if (postAccNights === 0) setPostAccNights(1);
                            }}
                            className="rounded-md bg-[#0B1F3A] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#132d50] transition"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="mt-8 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-lg bg-[#E4572E] px-7 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-[#cf4b24] active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <span>Continue to passenger details</span>
                      <span>➜</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Collapsed / Completed Step 1 Header */
                <div
                  onClick={() => setStep(1)}
                  className="flex items-center justify-between rounded-xl border border-[#D1F0DC] bg-[#EDF8F1] px-5 py-3.5 cursor-pointer transition hover:bg-[#e4f4e9]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900">
                      Passengers &amp; Accommodation
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 hover:underline">
                    Edit ⌄
                  </span>
                </div>
              )}

              {/* STEP 2: PASSENGER DETAILS */}
              {step === 2 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4572E] text-xs font-black text-white shrink-0">
                      2
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Passenger Details
                    </h2>
                  </div>

                  {/* Discount Promo Code Row */}
                  <div className="pt-6">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Discount Code
                    </label>
                    <div className="flex max-w-md items-center gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
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
                    {promoApplied && (
                      <p className="mt-1.5 text-xs font-semibold text-emerald-600">
                        Promo code applied! Saved USD ${promoDiscount.toLocaleString()}.
                      </p>
                    )}
                  </div>

                  {/* Dynamic Passenger Forms */}
                  {passengers.map((passenger, idx) => {
                    const isLead = idx === 0;
                    const labelTitle = isLead
                      ? "Lead Passengers details"
                      : `${idx + 1 === 2 ? "2nd" : `${idx + 1}th`} Passengers details`;

                    return (
                      <div key={idx} className="mt-8 pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900">
                          {labelTitle}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Select the number of passengers traveling with you.
                        </p>

                        <div className="mt-4 space-y-3.5">
                          {/* First Name */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              First name *
                            </label>
                            <input
                              type="text"
                              value={passenger.firstName}
                              onChange={(e) =>
                                handlePassengerChange(idx, "firstName", e.target.value)
                              }
                              placeholder="e.g. srinath"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          {/* Middle Name */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Middle name *
                            </label>
                            <input
                              type="text"
                              value={passenger.middleName}
                              onChange={(e) =>
                                handlePassengerChange(idx, "middleName", e.target.value)
                              }
                              placeholder="e.g. reddy"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          {/* Last Name */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Last name *
                            </label>
                            <input
                              type="text"
                              value={passenger.lastName}
                              onChange={(e) =>
                                handlePassengerChange(idx, "lastName", e.target.value)
                              }
                              placeholder="e.g. Garu"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          {/* Lead Passenger specific fields: Phone & Email */}
                          {isLead && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Phone number *
                                </label>
                                <div className="flex gap-2">
                                  <div className="relative w-44 shrink-0">
                                    <select
                                      value={passenger.phoneCountry}
                                      onChange={(e) =>
                                        handlePassengerChange(idx, "phoneCountry", e.target.value)
                                      }
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
                                    onChange={(e) =>
                                      handlePassengerChange(idx, "phone", e.target.value)
                                    }
                                    placeholder="Enter phone number"
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Email address *
                                </label>
                                <input
                                  type="email"
                                  value={passenger.email}
                                  onChange={(e) =>
                                    handlePassengerChange(idx, "email", e.target.value)
                                  }
                                  placeholder="e.g. srinath@example.com"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
                                />
                              </div>
                            </>
                          )}

                          {/* Date of Birth: DD, Month, YYYY */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Date of Birth *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {/* DD */}
                              <div className="relative">
                                <select
                                  value={passenger.birthDay}
                                  onChange={(e) =>
                                    handlePassengerChange(idx, "birthDay", e.target.value)
                                  }
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

                              {/* Month */}
                              <div className="relative">
                                <select
                                  value={passenger.birthMonth}
                                  onChange={(e) =>
                                    handlePassengerChange(idx, "birthMonth", e.target.value)
                                  }
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

                              {/* YYYY */}
                              <div className="relative">
                                <select
                                  value={passenger.birthYear}
                                  onChange={(e) =>
                                    handlePassengerChange(idx, "birthYear", e.target.value)
                                  }
                                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none"
                                >
                                  <option value="">YYYY</option>
                                  {Array.from({ length: 70 }, (_, i) => 2010 - i).map((y) => (
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

                  {/* Continue Button */}
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
                      onClick={() => setStep(3)}
                      className="rounded-lg bg-[#E4572E] px-7 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-[#cf4b24] active:scale-[0.99] flex items-center gap-1.5"
                    >
                      <span>Continue to Payment details</span>
                      <span>➜</span>
                    </button>
                  </div>
                </div>
              ) : step > 2 ? (
                /* Collapsed / Completed Step 2 Header */
                <div
                  onClick={() => setStep(2)}
                  className="flex items-center justify-between rounded-xl border border-[#D1F0DC] bg-[#EDF8F1] px-5 py-3.5 cursor-pointer transition hover:bg-[#e4f4e9]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900">
                      Passenger Details
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 hover:underline">
                    Edit ⌄
                  </span>
                </div>
              ) : (
                /* Inactive Step 2 Accordion Header */
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                      2
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-500">
                      2. Passenger Details
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6">
                  {/* Step Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4572E] text-xs font-black text-white shrink-0">
                      3
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Payment
                    </h2>
                  </div>

                  {/* Security Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Lock size={13} className="text-emerald-700" />
                      <span>This is a secure SSL encrypted payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Secure Payments by Stripe / Tourvaa</span>
                    </div>
                  </div>

                  {/* Payment Form Box */}
                  <div className="rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
                    {/* Method Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-50/60 px-3 py-1.5 text-xs font-bold text-blue-700"
                      >
                        <CreditCard size={14} />
                        <span>Card</span>
                      </button>
                    </div>

                    {/* Link Checkout Banner */}
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Lock size={12} className="text-slate-500" />
                        <span>Secure, fast checkout with Link</span>
                      </span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>

                    {/* Card Number Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Card number
                      </label>
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

                    {/* Expiry & CVC Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Expiry date
                        </label>
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
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Security code
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) =>
                              setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                            }
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

                    {/* Country/Territory */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Country/Territory
                      </label>
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
                      By providing your card information, you allow Tourvaa to charge your card for future payments in accordance with their terms.
                    </p>
                  </div>

                  {/* Checkboxes */}
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
                        </Link>
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

                  {/* Confirm and Pay CTA Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleConfirmAndPay}
                      disabled={!acceptTerms || paymentSubmitting}
                      className="w-full rounded-lg bg-[#E4572E] hover:bg-[#cf4b24] py-3.5 px-6 text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
                    >
                      {paymentSubmitting ? "Processing Payment..." : "Confirm and pay"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Inactive Step 3 Accordion Header */
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                      3
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-500">
                      3. Payment
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY TRIP SUMMARY */}
            <aside className="sticky top-24 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                TRIP SUMMARY
              </h3>

              {/* Your Tour */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  YOUR TOUR
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">
                  {tourTitle}
                </p>
                <p className="text-[11px] text-slate-500">{`${tourDays} days`}</p>
              </div>

              {/* Dates */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    DATES
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                    {`${startDateStr} - ${endDateStr}`}
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

              {/* Accommodation */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ACCOMMODATION
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900 capitalize">
                    {accommodationType === "shared"
                      ? `Shared • ${sharedRoomsCount} rooms`
                      : `Single • ${singleRoomsCount} rooms`}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {adultCount} {adultCount === 1 ? "guest" : "guests"}
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

              {/* Price Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    PRICE BREAKDOWN
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                    <Globe size={12} />
                    Shown in USD
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <div>
                      <p className="font-semibold text-slate-900">Per person</p>
                      <p className="text-[10px] text-slate-400">{adultCount} travellers</p>
                    </div>
                    <span className="font-bold text-slate-900">
                      USD ${ratePerPerson.toLocaleString()}.00
                    </span>
                  </div>

                  {prePostAddonTotal > 0 && (
                    <div className="flex items-center justify-between text-slate-700 pt-1">
                      <span className="text-slate-600">Pre/Post Accommodation</span>
                      <span className="font-bold text-slate-900">
                        USD ${prePostAddonTotal.toLocaleString()}.00
                      </span>
                    </div>
                  )}

                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 pt-1">
                      <span>Promo discount</span>
                      <span className="font-bold">
                        - USD ${promoDiscount.toLocaleString()}.00
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Box */}
                <div className="mt-4 rounded-xl bg-[#F0F4F8] p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Total</p>
                    <p className="text-[10px] text-slate-500">Taxes &amp; fees included</p>
                  </div>
                  <strong className="text-base sm:text-lg font-black text-slate-950">
                    USD ${finalTotal.toLocaleString()}.00
                  </strong>
                </div>

                {/* Proceed Button */}
                {step < 3 && (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
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
