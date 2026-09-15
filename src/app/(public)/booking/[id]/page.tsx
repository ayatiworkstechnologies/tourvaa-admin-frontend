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
import { StripeBadge, PayPalLogo, VisaBadge, MastercardBadge, AmexBadge } from "@/components/common/PaymentLogos";
import DatePicker from "@/components/ui/DatePicker";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { combinePhone } from "@/lib/utils/validators";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";

const FALLBACK_HERO_BG = "/images/compare-hero.jpg";
const FALLBACK_THUMB = "/images/compare-nz.jpg";
// "agent-reseller" is the real seeded role slug; "agent" is kept for
// backward compatibility with any older-seeded accounts still using it.
const AGENT_ROLE_SLUGS = ["agent", "agent-reseller"];

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
  optional_activity_amount: string;
  accommodation_amount: string;
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

type AgentPaymentMethod = "card" | "pay_later";

type NewCustomerForm = {
  fullName: string;
  email: string;
  phoneCountry: string;
  phone: string;
};

/** Agent-only: link an existing customer by email, or create a new one, so
 * the booking is placed against a real customer_id -- never the agent's own. */
function AgentCustomerSelector({
  selectedCustomerId,
  selectedCustomerName,
  selectedCustomerEmail,
  onClear,
  linkEmail,
  onLinkEmailChange,
  onLink,
  linkLoading,
  linkError,
  showNewCustomerForm,
  onToggleNewCustomerForm,
  newCustomer,
  onNewCustomerChange,
  onCreateCustomer,
  newCustomerLoading,
  newCustomerError,
}: {
  selectedCustomerId: number | null;
  selectedCustomerName: string;
  selectedCustomerEmail: string;
  onClear: () => void;
  linkEmail: string;
  onLinkEmailChange: (value: string) => void;
  onLink: () => void;
  linkLoading: boolean;
  linkError: string | null;
  showNewCustomerForm: boolean;
  onToggleNewCustomerForm: () => void;
  newCustomer: NewCustomerForm;
  onNewCustomerChange: (field: keyof NewCustomerForm, value: string) => void;
  onCreateCustomer: () => void;
  newCustomerLoading: boolean;
  newCustomerError: string | null;
}) {
  if (selectedCustomerId) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <User size={16} />
          </span>
          <div>
            <p className="text-xs font-bold text-emerald-900">{selectedCustomerName || "Customer selected"}</p>
            {selectedCustomerEmail && <p className="text-[11px] text-emerald-700">{selectedCustomerEmail}</p>}
          </div>
        </div>
        <button type="button" onClick={onClear} className="text-xs font-bold text-emerald-700 hover:underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-bold text-slate-800">Who is this booking for?</p>
      <p className="mt-0.5 text-[11px] text-slate-500">Link an existing customer by email, or create a new one.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={linkEmail}
          onChange={(e) => onLinkEmailChange(e.target.value)}
          placeholder="customer@example.com"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
        />
        <button
          type="button"
          onClick={onLink}
          disabled={linkLoading || !linkEmail.trim()}
          className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#132d50] disabled:opacity-50"
        >
          {linkLoading ? "Linking..." : "Link Customer"}
        </button>
        <button
          type="button"
          onClick={onToggleNewCustomerForm}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          {showNewCustomerForm ? "Cancel" : "New Customer"}
        </button>
      </div>
      {linkError && <p className="mt-1.5 text-xs font-semibold text-rose-600">{linkError}</p>}

      {showNewCustomerForm && (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newCustomer.fullName}
              onChange={(e) => onNewCustomerChange("fullName", e.target.value)}
              placeholder="Full name"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
            />
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => onNewCustomerChange("email", e.target.value)}
              placeholder="Email address"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
            />
            <input
              type="text"
              value={newCustomer.phoneCountry}
              onChange={(e) => onNewCustomerChange("phoneCountry", e.target.value)}
              placeholder="+91"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
            />
            <input
              type="tel"
              value={newCustomer.phone}
              onChange={(e) => onNewCustomerChange("phone", e.target.value)}
              placeholder="Phone number"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
            />
          </div>
          {newCustomerError && <p className="text-xs font-semibold text-rose-600">{newCustomerError}</p>}
          <button
            type="button"
            onClick={onCreateCustomer}
            disabled={newCustomerLoading}
            className="rounded-lg bg-[#E4572E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#cf4b24] disabled:opacity-50"
          >
            {newCustomerLoading ? "Creating..." : "Create Customer"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Agent-only: commercial controls (markup, reference, settlement method) --
 * never shown to, or submittable by, a customer booking for themselves. */
function AgentCommercialFields({
  agentMarkup,
  onAgentMarkupChange,
  agentReference,
  onAgentReferenceChange,
  agentPaymentMethod,
  onAgentPaymentMethodChange,
}: {
  agentMarkup: string;
  onAgentMarkupChange: (value: string) => void;
  agentReference: string;
  onAgentReferenceChange: (value: string) => void;
  agentPaymentMethod: AgentPaymentMethod;
  onAgentPaymentMethodChange: (value: AgentPaymentMethod) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Commercial Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Your markup</label>
          <input
            type="number"
            min={0}
            value={agentMarkup}
            onChange={(e) => onAgentMarkupChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Your reference (optional)</label>
          <input
            type="text"
            value={agentReference}
            onChange={(e) => onAgentReferenceChange(e.target.value)}
            placeholder="e.g. internal booking ref"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Booking action</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => onAgentPaymentMethodChange("pay_later")} className={`rounded-xl border p-4 text-left transition ${agentPaymentMethod === "pay_later" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
            <span className="block text-sm font-black text-slate-900">Reserve Now</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Create the reservation now. The full invoice is generated and sent to your agent account.</span>
          </button>
          <button type="button" onClick={() => onAgentPaymentMethodChange("card")} className={`rounded-xl border p-4 text-left transition ${agentPaymentMethod === "card" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
            <span className="block text-sm font-black text-slate-900">Pay in Full Today</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Create the booking and continue directly to secure full payment.</span>
          </button>
        </div>
      </div>
    </div>
  );
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
  const [travelDate, setTravelDate] = useState(initialTravelDate);
  const [selectedRoomUpgradeId, setSelectedRoomUpgradeId] = useState<number | null>(null);
  const [nightAddonQty, setNightAddonQty] = useState<Record<number, number>>({});
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [selectedAccommodationExtraIds, setSelectedAccommodationExtraIds] = useState<number[]>([]);

  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Agent-only: the customer this booking is placed for -- an agent never
  // books as themselves, so the lead traveller always comes from here.
  const [agentCustomerId, setAgentCustomerId] = useState<number | null>(null);
  const [agentCustomerName, setAgentCustomerName] = useState("");
  const [agentCustomerEmail, setAgentCustomerEmail] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({ fullName: "", email: "", phoneCountry: "+91", phone: "" });
  const [newCustomerLoading, setNewCustomerLoading] = useState(false);
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null);
  const [agentMarkup, setAgentMarkup] = useState("0");
  const [agentReference, setAgentReference] = useState("");
  const initialAgentAction = searchParams.get("agent_action") === "reserve" ? "reserve" : "full";
  const [agentPaymentMethod, setAgentPaymentMethod] = useState<AgentPaymentMethod>(initialAgentAction === "reserve" ? "pay_later" : "card");

  const [gateway, setGateway] = useState<"stripe" | "paypal">("stripe");
  const [gateways, setGateways] = useState<{ stripe_test: boolean; paypal_test: boolean } | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{ id: number; amount_pending: string; currency: string } | null>(null);
  useEffect(() => {
    api.get("/payments/gateways/status").then(({ data }) => {
      setGateways(data.data);
      if (!data.data.stripe_test && data.data.paypal_test) setGateway("paypal");
    }).catch(() => setGateways({ stripe_test: false, paypal_test: false }));
  }, []);
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
  const isAgent = AGENT_ROLE_SLUGS.includes(roleSlug);
  const canBook = isLoggedIn && (roleSlug === "customer" || isAgent);

  // Auth guard: this checkout requires a logged-in customer, or an agent
  // booking on a customer's behalf. Send anyone else back to login
  // (preserving the return path) or away entirely.
  useEffect(() => {
    if (authLoading) return;
    const query = searchParams.toString();
    const currentPath = `/booking/${params?.id}${query ? `?${query}` : ""}`;
    if (!isLoggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (roleSlug && roleSlug !== "customer" && !AGENT_ROLE_SLUGS.includes(roleSlug)) {
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
    if (travelDate) {
      const match = availableCalendar.find((c) => c.date === travelDate);
      if (match) return match;
      // A date explicitly selected on the tour page must never be silently
      // replaced by the first available departure.
      return null;
    }
    return availableCalendar[0];
  }, [availableCalendar, travelDate]);

  // Default the date picker to the resolved departure once availability loads.
  useEffect(() => {
    if (!travelDate && selectedCalendar) setTravelDate(selectedCalendar.date);
  }, [travelDate, selectedCalendar]);

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

  const availableActivities = useMemo(() => tour?.optional_activities || [], [tour]);

  const toggleActivity = (id: number) => {
    setSelectedActivityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const optionalActivitiesPayload = useMemo(
    () => selectedActivityIds.map((id) => ({ id, quantity: adultCount })),
    [selectedActivityIds, adultCount]
  );

  // The restored accommodation-extras catalog (tour.accommodations) is a
  // separate addon bucket from the tour.extensions room_upgrade/
  // additional_night pair above -- both are real, independently priced and
  // independently submitted (accommodations vs extensions) per the backend.
  const availableAccommodationExtras = useMemo(() => tour?.accommodations || [], [tour]);

  const toggleAccommodationExtra = (id: number) => {
    setSelectedAccommodationExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const accommodationsPayload = useMemo(
    () => selectedAccommodationExtraIds.map((id) => ({ id, quantity: adultCount })),
    [selectedAccommodationExtraIds, adultCount]
  );

  // Start (or resume) a real checkout session once the tour has resolved.
  // Agent bookings skip this entirely -- they submit directly to /bookings
  // for a customer the agent selects, not the session's own customer_id.
  useEffect(() => {
    if (!tour || !canBook || sessionKey || isAgent) return;
    let active = true;
    const storageKey = `tourvaa_checkout_session_${tour.id}`;
    const existing = typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null;
    api
      .post("/checkout/start", {
        tour_id: tour.id,
        tour_calendar_id: selectedCalendar?.id ?? null,
        travel_date: travelDate || undefined,
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
  }, [tour, canBook, selectedCalendar, sessionKey, isAgent]);

  const isCustomer = roleSlug === "customer";
  // A customer booking for themselves can prefill their own name; an agent
  // must never prefill their own name as the traveller -- only the
  // customer they've explicitly linked or created below.
  const selfBookingName = isCustomer ? user?.name || "" : "";

  // Keep the passenger form list in sync with adult/child counts, and
  // prefill the lead traveller from the booking's real owner (the logged-in
  // customer, or the agent's selected customer) -- never from the agent.
  useEffect(() => {
    setPassengers((prev) => {
      const total = adultCount + childCount;
      const next: PassengerData[] = [];
      for (let i = 0; i < total; i++) {
        const type: PassengerType = i < adultCount ? "adult" : "child";
        if (prev[i]) {
          next.push({ ...prev[i], type });
          continue;
        }
        const passenger = emptyPassenger(type);
        if (i === 0) {
          const leadName = isAgent ? agentCustomerName : selfBookingName;
          if (leadName) {
            const [first, ...rest] = leadName.trim().split(/\s+/);
            passenger.firstName = first || "";
            passenger.lastName = rest.join(" ");
          }
          if (isAgent && agentCustomerEmail) passenger.email = agentCustomerEmail;
        }
        next.push(passenger);
      }
      return next;
    });
  }, [adultCount, childCount, isAgent, agentCustomerName, agentCustomerEmail, selfBookingName]);

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
          customer_id: (isAgent ? agentCustomerId : user?.customer_id) || 0,
          tour_id: tour.id,
          tour_calendar_id: selectedCalendar?.id ?? null,
          booking_source: isAgent ? "agent" : "customer",
          no_of_adults: adultCount,
          no_of_children: childCount,
          adults_count: adultCount,
          children_count: childCount,
          currency: tour.currency || "USD",
          extensions: extensionsPayload,
          optional_activities: optionalActivitiesPayload,
          accommodations: accommodationsPayload,
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
  }, [tour, canBook, selectedCalendar, adultCount, childCount, extensionsPayload, optionalActivitiesPayload, accommodationsPayload, promoApplied, promoCode, user, isAgent, agentCustomerId]);

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

  const handleLinkCustomer = async () => {
    if (!linkEmail.trim()) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await api.post("/customers/link", { email: linkEmail.trim() });
      const c = res.data?.data;
      setAgentCustomerId(c?.id ?? null);
      setAgentCustomerName(c?.full_name || "");
      setAgentCustomerEmail(c?.email || linkEmail.trim());
    } catch (err) {
      setLinkError(getApiErrorMessage(err));
    } finally {
      setLinkLoading(false);
    }
  };

  const handleNewCustomerChange = (field: keyof NewCustomerForm, value: string) => {
    setNewCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.fullName.trim() || !newCustomer.email.trim()) {
      setNewCustomerError("Enter the customer's name and email.");
      return;
    }
    setNewCustomerLoading(true);
    setNewCustomerError(null);
    try {
      const res = await api.post("/customers/", {
        full_name: newCustomer.fullName.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone ? combinePhone(newCustomer.phoneCountry || "+91", newCustomer.phone) : "",
      });
      const c = res.data?.data;
      setAgentCustomerId(c?.id ?? null);
      setAgentCustomerName(c?.full_name || newCustomer.fullName.trim());
      setAgentCustomerEmail(c?.email || newCustomer.email.trim());
      setShowNewCustomerForm(false);
    } catch (err) {
      setNewCustomerError(getApiErrorMessage(err));
    } finally {
      setNewCustomerLoading(false);
    }
  };

  const handleClearAgentCustomer = () => {
    setAgentCustomerId(null);
    setAgentCustomerName("");
    setAgentCustomerEmail("");
    setLinkEmail("");
    setLinkError(null);
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
    if (isAgent && !agentCustomerId) {
      setStepError("Select or create a customer to book this tour for.");
      return;
    }
    if (sessionKey) {
      try {
        await api.patch(`/checkout/session/${sessionKey}`, {
          step: "accommodation",
          data: {
            adults: adultCount,
            children: childCount,
            extensions: extensionsPayload,
            optional_activities: optionalActivitiesPayload,
            accommodations: accommodationsPayload,
          },
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

  const buildTravellersPayload = () =>
    passengers.map((p, idx) => ({
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

  const handleContinueStep2 = async () => {
    const err = validatePassengers();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    if (sessionKey && !isAgent) {
      try {
        await api.patch(`/checkout/session/${sessionKey}`, {
          step: "payment",
          data: { travellers: buildTravellersPayload(), promo_code: promoApplied ? promoCode.trim() : null },
        });
      } catch (submitErr) {
        setStepError(getApiErrorMessage(submitErr));
        return;
      }
    }
    setStep(3);
  };

  const startPayment = async (booking: { id: number; amount_pending: string; currency: string }) => {
    setPendingBooking(booking);
    const base = `${window.location.origin}/${isAgent ? "agent" : "customer"}/bookings/${booking.id}`;
    const common = { booking_id: booking.id, amount: booking.amount_pending, currency: booking.currency, test_only: true };
    if (gateway === "stripe") {
      const { data } = await api.post("/payments/stripe/create-session", {
        ...common, success_url: `${base}?payment=${isAgent ? "stripe_success" : "success"}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}?payment=cancelled`,
      });
      if (!data.data?.checkout_url) throw new Error("Stripe checkout URL is missing.");
      window.location.assign(data.data.checkout_url);
    } else {
      const { data } = await api.post("/payments/paypal/create-order", {
        ...common, return_url: `${base}?payment=paypal_approved`, cancel_url: `${base}?payment=cancelled`,
      });
      if (!data.data?.approve_url) throw new Error("PayPal approval URL is missing.");
      sessionStorage.setItem(`paypal_pid_${booking.id}`, String(data.data.payment_id));
      window.location.assign(data.data.approve_url);
    }
  };

  const handleConfirmAndPay = async () => {
    setPaymentError(null);
    if (!acceptTerms || paymentSubmitting) return;
    const onlinePayment = !isAgent || agentPaymentMethod === "card";
    if (onlinePayment && !gateways?.[`${gateway}_test`]) {
      setPaymentError("Enable this provider with test credentials in Payment Settings first.");
      return;
    }
    if (pendingBooking) {
      setPaymentSubmitting(true);
      try { await startPayment(pendingBooking); }
      catch (err) { setPaymentError(getApiErrorMessage(err)); }
      finally { setPaymentSubmitting(false); }
      return;
    }

    // Agent bookings are placed for a selected customer, never the agent's
    // own session -- they submit straight to /bookings instead of the
    // customer-scoped checkout session.
    if (isAgent) {
      if (!agentCustomerId) {
        setPaymentError("Select or create a customer first.");
        return;
      }
      setPaymentSubmitting(true);
      try {
        const res = await api.post("/bookings", {
          customer_id: agentCustomerId,
          tour_id: tour!.id,
          tour_calendar_id: selectedCalendar?.id ?? null,
          tour_date: travelDate || undefined,
          tour_start_date: travelDate || undefined,
          booking_source: "agent",
          no_of_adults: adultCount,
          no_of_children: childCount,
          adults_count: adultCount,
          children_count: childCount,
          currency: tourCurrency,
          payment_type: "full",
          travellers: buildTravellersPayload(),
          optional_activities: optionalActivitiesPayload,
          accommodations: accommodationsPayload,
          extensions: extensionsPayload,
          promo_code: promoApplied ? promoCode.trim() : undefined,
          ...(isAgent ? {
            agent_markup: Number(agentMarkup) || 0,
            agent_reference: agentReference.trim() || undefined,
            // UI state uses "card" for the pay-in-full-today choice, but the
            // backend's agent_payment_method enum has no "card" value - it
            // expects "online" for that case (see BookingCreate validator).
            agent_payment_method: agentPaymentMethod === "card" ? "online" : agentPaymentMethod,
          } : {}),
          agreed_terms: acceptTerms,
          agreed_cancellation_policy: acceptTerms,
        });
        const booking = res.data?.data;
        if (onlinePayment) { await startPayment(booking); return; }
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
      return;
    }

    if (!sessionKey) {
      setPaymentError("Checkout session is not ready. Please refresh and try again.");
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
      await startPayment(booking);
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

                  {isAgent && (
                    <div className="pt-6">
                      <AgentCustomerSelector
                        selectedCustomerId={agentCustomerId}
                        selectedCustomerName={agentCustomerName}
                        selectedCustomerEmail={agentCustomerEmail}
                        onClear={handleClearAgentCustomer}
                        linkEmail={linkEmail}
                        onLinkEmailChange={setLinkEmail}
                        onLink={handleLinkCustomer}
                        linkLoading={linkLoading}
                        linkError={linkError}
                        showNewCustomerForm={showNewCustomerForm}
                        onToggleNewCustomerForm={() => setShowNewCustomerForm((v) => !v)}
                        newCustomer={newCustomer}
                        onNewCustomerChange={handleNewCustomerChange}
                        onCreateCustomer={handleCreateCustomer}
                        newCustomerLoading={newCustomerLoading}
                        newCustomerError={newCustomerError}
                      />
                    </div>
                  )}

                  {/* Passengers */}
                  <div className="pt-6">
                    <h3 className="text-sm font-bold text-slate-900">Passengers</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {isAgent
                        ? "Select the departure date and number of adults for this booking."
                        : "Select the number of adults travelling with you."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4">
                      {isAgent && availableCalendar.length > 0 && (
                        <div className="w-56">
                          <DatePicker
                            label="Departure date"
                            value={travelDate}
                            onChange={setTravelDate}
                            availableDates={availableCalendar.map((c) => c.date)}
                            restrictToAvailableDates
                            required
                          />
                        </div>
                      )}
                      <div className="max-w-xs">
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

                  {/* Optional Activities -- only rendered when the tour actually has real activities configured */}
                  {availableActivities.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Optional Activities</h3>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed max-w-2xl">
                        Add extra experiences to your tour. Priced per adult traveller.
                      </p>

                      <div className="mt-4 space-y-3">
                        {availableActivities.map((activity) => {
                          const checked = selectedActivityIds.includes(activity.id);
                          return (
                            <div
                              key={activity.id}
                              onClick={() => toggleActivity(activity.id)}
                              className={`flex items-center justify-between gap-3.5 rounded-xl border p-4 cursor-pointer transition ${
                                checked ? "border-blue-500 bg-blue-50/10 shadow-2xs" : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleActivity(activity.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-slate-900">{activity.name}</p>
                                  {activity.description && (
                                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900">
                                  {format(activity.price ?? 0, activity.currency || tourCurrency)}
                                </p>
                                <p className="text-[10px] text-slate-400">Per adult</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Accommodation Add-ons -- the tour's own accommodation-extras catalog, separate from the Shared/Upgrade room choice above */}
                  {availableAccommodationExtras.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Accommodation Add-ons</h3>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed max-w-2xl">
                        Optional accommodation extras for this tour. Priced per adult traveller.
                      </p>

                      <div className="mt-4 space-y-3">
                        {availableAccommodationExtras.map((extra) => {
                          const checked = selectedAccommodationExtraIds.includes(extra.id);
                          return (
                            <div
                              key={extra.id}
                              onClick={() => toggleAccommodationExtra(extra.id)}
                              className={`flex items-center justify-between gap-3.5 rounded-xl border p-4 cursor-pointer transition ${
                                checked ? "border-blue-500 bg-blue-50/10 shadow-2xs" : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAccommodationExtra(extra.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-slate-900">{extra.name}</p>
                                  {extra.description && (
                                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                                      {extra.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900">
                                  {format(extra.price ?? 0, tourCurrency)}
                                </p>
                                <p className="text-[10px] text-slate-400">Per adult</p>
                              </div>
                            </div>
                          );
                        })}
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

                  {isAgent && (
                    <AgentCommercialFields
                      agentMarkup={agentMarkup}
                      onAgentMarkupChange={setAgentMarkup}
                      agentReference={agentReference}
                      onAgentReferenceChange={setAgentReference}
                      agentPaymentMethod={agentPaymentMethod}
                      onAgentPaymentMethodChange={setAgentPaymentMethod}
                    />
                  )}

                  {(!isAgent || agentPaymentMethod === "card") && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 sm:p-5 space-y-3.5">
                      <div className="flex items-center justify-between gap-2 pb-1">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment method</p>
                          <p className="text-sm font-black text-slate-900">Choose how you want to pay</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200/80 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Test mode
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Option 1: Stripe (Credit/Debit Card) */}
                        <div
                          onClick={() => {
                            if (!paymentSubmitting && gateways?.stripe_test) {
                              setGateway("stripe");
                            }
                          }}
                          className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                            gateway === "stripe"
                              ? "border-[#635BFF] bg-white shadow-sm ring-4 ring-[#635BFF]/10"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                          } ${!gateways?.stripe_test || paymentSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            {/* Custom Radio */}
                            <div
                              className={`mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                gateway === "stripe"
                                  ? "border-[#635BFF] bg-white"
                                  : "border-slate-300 bg-white group-hover:border-slate-400"
                              }`}
                            >
                              {gateway === "stripe" && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#635BFF]" />
                              )}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  Credit / Debit Card
                                </span>
                                <StripeBadge />
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Safe checkout powered by Stripe
                              </p>
                            </div>
                          </div>

                          {/* Right side: Card badges + Sandbox status */}
                          <div className="flex items-center gap-2.5 self-end sm:self-center">
                            <div className="flex items-center gap-1">
                              <VisaBadge className="h-5 w-auto drop-shadow-2xs" />
                              <MastercardBadge className="h-5 w-auto drop-shadow-2xs" />
                              <AmexBadge className="h-5 w-auto drop-shadow-2xs" />
                            </div>
                            <div className="pl-1 border-l border-slate-200">
                              {gateways === null ? (
                                <span className="text-[11px] text-slate-400">Loading...</span>
                              ) : gateways.stripe_test ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Sandbox
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                  Setup required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Option 2: PayPal */}
                        <div
                          onClick={() => {
                            if (!paymentSubmitting && gateways?.paypal_test) {
                              setGateway("paypal");
                            }
                          }}
                          className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                            gateway === "paypal"
                              ? "border-[#0070BA] bg-white shadow-sm ring-4 ring-[#0070BA]/10"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                          } ${!gateways?.paypal_test || paymentSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            {/* Custom Radio */}
                            <div
                              className={`mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                gateway === "paypal"
                                  ? "border-[#0070BA] bg-white"
                                  : "border-slate-300 bg-white group-hover:border-slate-400"
                              }`}
                            >
                              {gateway === "paypal" && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#0070BA]" />
                              )}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <PayPalLogo />
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Pay via PayPal balance, bank account, or cards
                              </p>
                            </div>
                          </div>

                          {/* Right side: Sandbox status */}
                          <div className="flex items-center gap-2.5 self-end sm:self-center">
                            <div className="text-right">
                              {gateways === null ? (
                                <span className="text-[11px] text-slate-400">Loading...</span>
                              ) : gateways.paypal_test ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Sandbox
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                  Setup required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Helper notice */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                          Continue to secure test checkout. No real money will be charged.
                        </p>
                        {pendingBooking && (
                          <Link
                            href={`/${isAgent ? "agent" : "customer"}/bookings/${pendingBooking.id}`}
                            className="font-semibold text-blue-600 hover:underline shrink-0"
                          >
                            View pending booking &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2">
                    <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs text-slate-700 cursor-pointer transition ${acceptTerms ? "border-slate-300 bg-slate-50/70" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#E4572E] focus:ring-[#E4572E] accent-[#E4572E]"
                      />
                      <span className="leading-relaxed">
                        I accept Tourvaa{" "}
                        <Link href="/terms" className="text-blue-600 underline font-semibold hover:text-blue-700">
                          Terms &amp; Conditions
                        </Link>{" "}
                        and cancellation policy
                      </span>
                    </label>

                    <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs text-slate-700 cursor-pointer transition ${subscribeNewsletter ? "border-slate-300 bg-slate-50/70" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                      <input
                        type="checkbox"
                        checked={subscribeNewsletter}
                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#E4572E] focus:ring-[#E4572E] accent-[#E4572E]"
                      />
                      <span className="leading-relaxed">Subscribe to our newsletter for the latest offers &amp; new trips</span>
                    </label>
                  </div>

                  {paymentError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-center gap-2 text-xs font-semibold text-rose-700">
                      <CircleAlert size={15} className="shrink-0 text-rose-600" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmAndPay}
                      disabled={!acceptTerms || paymentSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E4572E] hover:bg-[#cf4b24] py-4 px-6 text-sm font-black text-white shadow-md shadow-orange-600/15 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paymentSubmitting ? (
                        <>
                          <LoaderCircle size={17} className="animate-spin" />
                          <span>Processing secure checkout...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          <span>{isAgent && agentPaymentMethod === "pay_later" ? "Create Reservation" : isAgent ? "Pay in Full Today" : "Confirm and pay"}</span>
                        </>
                      )}
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

                      {Number(priceEstimate.optional_activity_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1">
                          <span className="text-slate-600">Optional activities</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.optional_activity_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.accommodation_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1">
                          <span className="text-slate-600">Accommodation add-ons</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.accommodation_amount), priceEstimate.currency)}
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
