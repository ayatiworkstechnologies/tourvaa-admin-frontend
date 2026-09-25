"use client";

/* eslint-disable @next/next/no-img-element */

// MoM 2026-08-27, item 8: hide the accommodation/"hotel booking" step
// (room-type choice, pre/post-tour nights, accommodation add-ons) from the
// customer booking flow for now -- a proper redesign is planned, so the
// sections stay in the code (untouched below) rather than being deleted;
// flip this back to true once that's ready.
const SHOW_ACCOMMODATION_BOOKING = false;

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuBadgePercent as BadgePercent,
  LuBed as Bed,
  LuCalendar as Calendar,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuCircleAlert as CircleAlert,
  LuCircleCheckBig as CheckCircle,
  LuClock as Clock,
  LuCopy as Copy,
  LuGlobe as Globe,
  LuHeadphones as Headphones,
  LuLoaderCircle as LoaderCircle,
  LuLockKeyhole as Lock,
  LuMail as Mail,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPhone as Phone,
  LuPlane as Plane,
  LuPlus as Plus,
  LuShield as Shield,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuTag as Tag,
  LuTicket as Ticket,
  LuUserRound as User,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { StripeBadge, PayPalLogo, VisaBadge, MastercardBadge, AmexBadge } from "@/components/common/PaymentLogos";
import DatePicker from "@/components/ui/DatePicker";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import publicApi from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";
import { combinePhone } from "@/lib/utils/validators";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";

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

function normalizeDateStringToIso(val?: string | null): string {
  if (!val) return "";
  const cleaned = decodeURIComponent(val).replace(/\+/g, " ").trim();
  if (!cleaned) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return cleaned;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const iso = normalizeDateStringToIso(isoDate);
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function calcAge(day: string, month: string, year: string): number | null {
  if (!day || !month || !year) return null;
  const dob = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(dob.getTime())) return null;
  // Date() silently rolls impossible dates over (31 Feb -> 3 Mar); reject them.
  if (dob.getDate() !== Number(day) || dob.getMonth() !== Number(month) - 1) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

type AgentPaymentMethod = "card" | "pay_later";
type CustomerPaymentMethod = "full" | "deposit";

// Mirrors backend GET /tours/{id}/deposit-options (see
// routers/public.py public_tour_deposit_options) - checked before booking
// creation so the checkout page can show/hide "Secure with a Deposit" /
// "Reserve Now" rather than let the traveller pick it and get rejected at
// booking-creation time. Both branches share one eligibility window
// (tour_availability._deposit_window) but each carries its own
// role-specific deposit terms.
type DepositOptions = {
  customer: {
    eligible: boolean;
    due_date: string | null;
    deposit_type: "percentage" | "fixed" | null;
    deposit_percentage: number | null;
    booking_deposit: number | null;
  };
  agent: {
    eligible: boolean;
    due_date: string | null;
    deposit_percentage: number;
  };
};

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
          className="rounded-lg bg-pub-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-pub-primary-dark disabled:opacity-50"
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
            className="rounded-lg bg-pub-accent px-4 py-2 text-xs font-bold text-white transition hover:bg-[#cf4b24] disabled:opacity-50"
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
  reserveDepositPercentage,
  reserveEligible,
  reserveDepositLabel,
  reserveBalanceLabel,
  reserveDueDate,
}: {
  agentMarkup: string;
  onAgentMarkupChange: (value: string) => void;
  agentReference: string;
  onAgentReferenceChange: (value: string) => void;
  agentPaymentMethod: AgentPaymentMethod;
  onAgentPaymentMethodChange: (value: AgentPaymentMethod) => void;
  reserveDepositPercentage: number;
  /** Whether this tour/travel date still qualifies for a Reserve Now
   * (deposit now, balance later) booking (see
   * tour_availability.agent_reserve_eligibility) - when false, "Reserve Now"
   * is hidden entirely rather than shown and then rejected by booking creation. */
  reserveEligible: boolean;
  /** Pre-formatted deposit due today and remaining balance, once a price
   * estimate exists; null before that. */
  reserveDepositLabel: string | null;
  reserveBalanceLabel: string | null;
  /** Balance due date from the eligibility check (ISO date), if eligible. */
  reserveDueDate: string | null;
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
        <div className={`grid gap-3 ${reserveEligible ? "sm:grid-cols-2" : ""}`}>
          {reserveEligible && (
            <button type="button" onClick={() => onAgentPaymentMethodChange("pay_later")} className={`rounded-xl border p-4 text-left transition ${agentPaymentMethod === "pay_later" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
              <span className="block text-sm font-black text-slate-900">Reserve Now ({reserveDepositPercentage}% deposit)</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Reserve your booking now with a {reserveDepositPercentage}% deposit{reserveDepositLabel ? <> (<strong className="text-slate-700">{reserveDepositLabel}</strong>)</> : null}.
                {" "}{reserveBalanceLabel ? <>Balance of <strong className="text-slate-700">{reserveBalanceLabel}</strong> is due</> : "The balance is due"}
                {reserveDueDate ? <> by <strong className="text-slate-700">{formatDate(reserveDueDate)}</strong>.</> : " before the booking cutoff."}
              </span>
            </button>
          )}
          <button type="button" onClick={() => onAgentPaymentMethodChange("card")} className={`rounded-xl border p-4 text-left transition ${agentPaymentMethod === "card" ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
            <span className="block text-sm font-black text-slate-900">Pay in Full Today</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Pay in full today and confirm your booking.</span>
          </button>
        </div>
        {!reserveEligible && (
          <p className="mt-2 text-xs text-amber-700">This travel date is too close for Reserve Now -- full payment is required to confirm this booking.</p>
        )}
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
  const rawParamDate = searchParams.get("travel_date") || "";
  const initialTravelDate = normalizeDateStringToIso(rawParamDate) || rawParamDate;

  const [adultCount, setAdultCount] = useState(initialAdults);
  const [childCount, setChildCount] = useState(initialChildren);
  const [travelDate, setTravelDate] = useState(initialTravelDate);
  const [selectedRoomUpgradeId, setSelectedRoomUpgradeId] = useState<number | null>(null);
  const [nightAddonQty, setNightAddonQty] = useState<Record<number, number>>({});
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [selectedAccommodationExtraIds, setSelectedAccommodationExtraIds] = useState<number[]>([]);

  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  // Per-passenger, per-field inline validation errors shown beneath each input
  const [passengerErrors, setPassengerErrors] = useState<Record<number, Partial<Record<keyof PassengerData, string>>>>({});
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const [depositEligibility, setDepositEligibility] = useState<DepositOptions | null>(null);
  // "Secure with a Deposit" on the tour page arrives as agent_action=reserve
  // too; preselect the deposit option (the effect below falls back to full
  // payment if the date turns out not to be eligible).
  const [customerPaymentMethod, setCustomerPaymentMethod] = useState<CustomerPaymentMethod>(initialAgentAction === "reserve" ? "deposit" : "full");

  const roleSlug = (user?.role?.slug || "").toLowerCase();
  const userType = (user?.user_type || "").toLowerCase();
  const isAgent = AGENT_ROLE_SLUGS.includes(roleSlug) || userType === "agent";
  const isCustomer = roleSlug === "customer" || userType === "customer";
  const canBook = isLoggedIn && (isCustomer || isAgent);

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
    if ((roleSlug || userType) && !isCustomer && !isAgent) {
      router.replace("/tours");
    }
  }, [authLoading, isLoggedIn, roleSlug, userType, isCustomer, isAgent, router, params?.id, searchParams]);

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
      const normTravel = normalizeDateStringToIso(travelDate);
      const match = availableCalendar.find((c) => {
        if (c.date === travelDate) return true;
        if (normTravel && (c.date === normTravel || normalizeDateStringToIso(c.date) === normTravel)) return true;
        const d1 = new Date(c.date.includes("T") ? c.date : `${c.date}T00:00:00`);
        const d2 = new Date(travelDate.includes("T") ? travelDate : `${travelDate.replace(/\+/g, " ")}T00:00:00`);
        if (!Number.isNaN(d1.getTime()) && !Number.isNaN(d2.getTime())) {
          return d1.toDateString() === d2.toDateString();
        }
        return false;
      });
      if (match) return match;
      // A date explicitly selected on the tour page must never be silently
      // replaced by the first available departure.
      return null;
    }
    return availableCalendar[0];
  }, [availableCalendar, travelDate]);

  // Default the date picker to the resolved departure once availability loads.
  useEffect(() => {
    if (selectedCalendar && travelDate !== selectedCalendar.date) {
      setTravelDate(selectedCalendar.date);
    } else if (!travelDate && selectedCalendar) {
      setTravelDate(selectedCalendar.date);
    }
  }, [travelDate, selectedCalendar]);

  useEffect(() => {
    const maxAdults = Math.max(1, Math.min(10, (selectedCalendar?.slots ?? 10) - childCount));
    if (adultCount > maxAdults) setAdultCount(maxAdults);
  }, [selectedCalendar, childCount, adultCount]);

  useEffect(() => {
    if (!tour?.id || !selectedCalendar?.date) {
      setDepositEligibility(null);
      return;
    }
    let active = true;
    publicApi.get(`/tours/${tour.id}/deposit-options`, { params: { travel_date: selectedCalendar.date } })
      .then((res) => { if (active) setDepositEligibility(res.data?.data ?? null); })
      .catch(() => { if (active) setDepositEligibility(null); });
    return () => { active = false; };
  }, [tour?.id, selectedCalendar?.date]);

  // If the traveller had "Secure with a Deposit" selected and then changes
  // the date to one that's no longer eligible, fall back to full payment
  // rather than silently keeping an option that's about to be rejected.
  useEffect(() => {
    if (customerPaymentMethod === "deposit" && depositEligibility && !depositEligibility.customer.eligible) {
      setCustomerPaymentMethod("full");
    }
  }, [depositEligibility, customerPaymentMethod]);

  useEffect(() => {
    if (agentPaymentMethod === "pay_later" && depositEligibility && !depositEligibility.agent.eligible) {
      setAgentPaymentMethod("card");
    }
  }, [depositEligibility, agentPaymentMethod]);

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
  }, [tour, canBook, selectedCalendar, sessionKey, isAgent, travelDate]);

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
  const maxAdults = Math.max(1, Math.min(10, (selectedCalendar?.slots ?? 10) - childCount));
  // Seats left on the departure after adults (same 10-traveller cap as adults).
  const maxChildren = Math.max(0, Math.min(10, selectedCalendar?.slots ?? 10) - adultCount);

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

  // Offers come only from the public tour payload (tour.discounts, built by
  // services.discounts.list_public_offers): automatic discounts
  // (requires_code=false) and promo codes the admin marked "show on
  // website" (requires_code=true, with discount_code). Private codes are
  // never listed but still work when typed.
  const { availableCoupons, automaticDiscounts } = useMemo(() => {
    const couponMap = new Map<string, {
      code: string;
      name: string;
      type: "percentage" | "fixed";
      value: number;
      validUntil?: string | null;
      minAmount?: number | null;
    }>();

    const autoList: Array<{
      label: string;
      type: "percentage" | "fixed";
      value: number;
    }> = [];

    (tour?.discounts ?? []).forEach((d) => {
      const name = d.label || d.discount_name || "Special Tour Deal";
      const val = Number(d.value ?? d.discount_value ?? 0);
      const type = (d.discount_type === "fixed" ? "fixed" : "percentage") as "percentage" | "fixed";
      const code = (d.discount_code || "").trim().toUpperCase();
      // requires_code decides the bucket, not whether a code string happens
      // to be present -- a promo code must never show as automatic savings.
      if (d.requires_code) {
        if (code) {
          couponMap.set(code, {
            code,
            name,
            type,
            value: val,
            validUntil: d.valid_to || null,
            minAmount: d.minimum_booking_amount ? Number(d.minimum_booking_amount) : null,
          });
        }
      } else if (val > 0) {
        autoList.push({ label: name, type, value: val });
      }
    });

    return {
      availableCoupons: Array.from(couponMap.values()),
      automaticDiscounts: autoList,
    };
  }, [tour?.discounts]);

  const handleCopyCode = (code: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleApplyPromo = (codeToApply?: string | unknown) => {
    const code = (typeof codeToApply === "string" ? codeToApply : promoCode).trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    setPromoCode(code);
    setPromoApplied(true);
  };

  // Drops the code; the price estimate effect re-runs without it, so the
  // price falls back to any automatic discount.
  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
    setPromoError(null);
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
    const fullName = newCustomer.fullName.trim();
    const email = newCustomer.email.trim().toLowerCase();
    const phone = newCustomer.phone.trim();
    if (fullName.length < 2) {
      setNewCustomerError("Enter the customer's full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewCustomerError("Enter a valid customer email address.");
      return;
    }
    if (phone && !/^\d[\d\s().-]{6,14}\d$/.test(phone)) {
      setNewCustomerError("Enter a valid customer phone number.");
      return;
    }
    setNewCustomerLoading(true);
    setNewCustomerError(null);
    try {
      const res = await api.post("/customers/", {
        full_name: fullName,
        email,
        phone: phone ? combinePhone(newCustomer.phoneCountry || "+91", phone) : "",
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
    if (!selectedCalendar) {
      setStepError(
        availableCalendar.length === 0
          ? "No available departure dates for this tour right now."
          : "Please select an available departure date to continue."
      );
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
            travel_date: travelDate || null,
            tour_calendar_id: selectedCalendar?.id ?? null,
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

  /**
   * Validates all passengers and populates per-field inline errors.
   * Returns a human-readable summary string on failure, or null on success.
   */
  const validatePassengers = (): string | null => {
    const newErrors: Record<number, Partial<Record<keyof PassengerData, string>>> = {};
    let firstError: string | null = null;

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const label = p.type === "child" ? `Passenger ${i + 1} (child)` : `Passenger ${i + 1}`;
      newErrors[i] = {};

      // --- Name validation ---
      if (!p.firstName.trim()) {
        newErrors[i].firstName = "First name is required.";
        if (!firstError) firstError = `Enter the first name for ${label}.`;
      } else if (p.firstName.trim().length < 2) {
        newErrors[i].firstName = "Must be at least 2 characters.";
        if (!firstError) firstError = `First name for ${label} is too short.`;
      }
      if (!p.lastName.trim()) {
        newErrors[i].lastName = "Last name is required.";
        if (!firstError) firstError = `Enter the last name for ${label}.`;
      } else if (p.lastName.trim().length < 2) {
        newErrors[i].lastName = "Must be at least 2 characters.";
        if (!firstError) firstError = `Last name for ${label} is too short.`;
      }

      // --- Date of birth validation ---
      const age = calcAge(p.birthDay, p.birthMonth, p.birthYear);
      if (age === null) {
        newErrors[i].birthDay = "Enter a valid date of birth.";
        if (!firstError) firstError = `Enter a valid date of birth for ${label}.`;
      } else if (p.type === "adult" && (age < 12 || age > 120)) {
        newErrors[i].birthDay = "Adult must be 12 years or older.";
        if (!firstError) firstError = `${label} must be 12 years or older.`;
      } else if (p.type === "child" && (age < 3 || age > 11)) {
        newErrors[i].birthDay = "Child must be between 3 and 11 years old.";
        if (!firstError) firstError = `${label} must be between 3 and 11 years old.`;
      }

      // --- Lead passenger contact fields (mandatory) ---
      if (i === 0) {
        const emailVal = p.email.trim();
        if (!emailVal) {
          newErrors[i].email = "Email address is required.";
          if (!firstError) firstError = "Enter an email address for the lead passenger.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
          newErrors[i].email = "Enter a valid email address (e.g. name@example.com).";
          if (!firstError) firstError = "Enter a valid email address for the lead passenger.";
        }

        const phoneDigits = p.phone.trim().replace(/[\s()\-]/g, "");
        if (!phoneDigits) {
          newErrors[i].phone = "Mobile number is required.";
          if (!firstError) firstError = "Enter a mobile number for the lead passenger.";
        } else if (!/^\d{7,15}$/.test(phoneDigits)) {
          newErrors[i].phone = "Enter a valid mobile number (7–15 digits).";
          if (!firstError) firstError = "Enter a valid mobile number for the lead passenger.";
        }
      }
    }

    setPassengerErrors(newErrors);
    return firstError;
  };

  /** Clears a specific field's inline error as the user types to correct it. */
  const clearPassengerFieldError = (idx: number, field: keyof PassengerData) => {
    setPassengerErrors((prev) => {
      if (!prev[idx]?.[field]) return prev;
      return { ...prev, [idx]: { ...prev[idx], [field]: undefined } };
    });
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
    setPassengerErrors({});
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


  // Mirrors the backend's own computation (payments_gateway._minimum_deposit_amount's
  // customer branch) so the amount charged at the gateway matches what the
  // server will independently accept -- a mismatch here would just mean the
  // gateway charges a different amount than the confirmation screen showed,
  // not a security issue, since the server floor is authoritative either way.
  function computeCustomerDepositAmount(amountPending: string): string | undefined {
    const customer = depositEligibility?.customer;
    if (!customer?.eligible) return undefined;
    const pending = Number(amountPending);
    if (!Number.isFinite(pending) || pending <= 0) return undefined;
    if (customer.deposit_type === "percentage" && customer.deposit_percentage) {
      return (pending * (customer.deposit_percentage / 100)).toFixed(2);
    }
    if (customer.booking_deposit) {
      return Math.min(customer.booking_deposit, pending).toFixed(2);
    }
    return undefined;
  }

  // Deposit-today / balance-later split shown on the "Secure with a Deposit"
  // (customer) and "Reserve Now" (agent) options, from the live price
  // estimate. Display only -- the amounts actually charged are still derived
  // from the created booking (computeCustomerDepositAmount /
  // booking.agent_reserve_deposit.minimum_amount).
  const estimateTotal = priceEstimate ? Number(priceEstimate.final_amount) : NaN;
  const customerDepositToday = Number.isFinite(estimateTotal) ? computeCustomerDepositAmount(String(estimateTotal)) : undefined;
  const customerDepositSplit = customerDepositToday != null
    ? { deposit: Number(customerDepositToday), balance: Math.max(0, estimateTotal - Number(customerDepositToday)) }
    : null;
  const agentReservePercentage = depositEligibility?.agent.deposit_percentage ?? tour?.agent_reserve_deposit_percentage ?? 30;
  const agentReserveSplit = Number.isFinite(estimateTotal) && estimateTotal > 0
    ? (() => {
        const deposit = Math.round(estimateTotal * agentReservePercentage) / 100;
        return { deposit, balance: Math.max(0, estimateTotal - deposit) };
      })()
    : null;

  const paymentIdempotencyKeys = useRef<Record<string, string>>({});
  const startPayment = async (booking: { id: number; amount_pending: string; currency: string }, amountOverride?: string) => {
    setPendingBooking(booking);
    const base = `${window.location.origin}/${isAgent ? "agent" : "customer"}/bookings/${booking.id}`;
    const testOnly = gateway === "stripe" ? Boolean(gateways?.stripe_test) : Boolean(gateways?.paypal_test);
    const amount = amountOverride || booking.amount_pending;
    // Stable per booking/gateway/amount so a retry or double-click reuses the same
    // gateway session instead of creating a second charge.
    const common = { booking_id: booking.id, amount, currency: booking.currency, test_only: testOnly, idempotency_key: `checkout-${booking.id}-${gateway}-${amount}` };
    const paymentKey = `${gateway}:${booking.id}:${common.amount}:${common.currency}`;
    paymentIdempotencyKeys.current[paymentKey] ??= typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const idempotency_key = paymentIdempotencyKeys.current[paymentKey];
    if (gateway === "stripe") {
      const { data } = await api.post("/payments/stripe/create-session", {
        ...common, idempotency_key, success_url: `${base}?payment=${isAgent ? "stripe_success" : "success"}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}?payment=cancelled`,
      });
      if (!data.data?.checkout_url) throw new Error("Stripe checkout URL is missing.");
      window.location.assign(data.data.checkout_url);
    } else {
      const { data } = await api.post("/payments/paypal/create-order", {
        ...common, idempotency_key, return_url: `${base}?payment=paypal_approved`, cancel_url: `${base}?payment=cancelled`,
      });
      if (!data.data?.approve_url) throw new Error("PayPal approval URL is missing.");
      sessionStorage.setItem(`paypal_pid_${booking.id}`, String(data.data.payment_id));
      window.location.assign(data.data.approve_url);
    }
  };

  const handleConfirmAndPay = async () => {
    setPaymentError(null);
    if (!acceptTerms || paymentSubmitting) return;
    // Agent "Reserve Now" (pay_later) now requires an upfront deposit
    // (see agent_reserve_deposit in the booking-creation response) instead
    // of the old $0-down credit-approval flow, so it goes through the same
    // gateway checkout as "card" - just for a reduced amount.
    const onlinePayment = !isAgent || agentPaymentMethod === "card" || agentPaymentMethod === "pay_later";
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
        if (onlinePayment) {
          const depositAmount = agentPaymentMethod === "pay_later" ? booking?.agent_reserve_deposit?.minimum_amount : undefined;
          await startPayment(booking, depositAmount);
          return;
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
      const depositAmount = customerPaymentMethod === "deposit" ? computeCustomerDepositAmount(booking?.amount_pending ?? "0") : undefined;
      await startPayment(booking, depositAmount);
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
        <Link href="/tours" className="rounded-lg bg-pub-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-pub-primary-dark">
          Browse All Tours
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 pt-4 text-slate-900">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* TOP NAVIGATION & CONFIDENCE HEADER */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <Link
            href={tour.slug ? `/tours/${tour.slug}` : `/tours`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-pub-primary transition group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back to Tour Details</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>256-Bit SSL Secure Checkout</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/70 px-3 py-1 text-[11px] font-bold text-pub-secondary">
              <BadgeCheck size={14} className="text-pub-secondary shrink-0" />
              <span>Official Tour Operator Booking</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE 3-STEP PROGRESS STEPPER */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Connecting Line Background */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 via-pub-primary to-pub-accent transition-all duration-500 -z-0"
              style={{
                width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
                right: step === 3 ? "24px" : "auto",
              }}
            />

            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              disabled={step === 1}
              className={`relative z-10 flex items-center gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                step === 1
                  ? "bg-pub-primary text-white shadow-md ring-4 ring-pub-primary/15"
                  : step > 1
                  ? "bg-emerald-600 text-white shadow-xs cursor-pointer hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/20 text-xs font-black">
                {step > 1 ? <Check size={13} className="stroke-[3]" /> : "1"}
              </span>
              <span className="hidden sm:inline">Dates &amp; Guests</span>
              <span className="sm:hidden">Guests</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => step > 2 && setStep(2)}
              disabled={step <= 2}
              className={`relative z-10 flex items-center gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                step === 2
                  ? "bg-pub-primary text-white shadow-md ring-4 ring-pub-primary/15"
                  : step > 2
                  ? "bg-emerald-600 text-white shadow-xs cursor-pointer hover:bg-emerald-700"
                  : "bg-white border border-slate-200 text-slate-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-black ${
                  step === 2
                    ? "bg-white/20 text-white"
                    : step > 2
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > 2 ? <Check size={13} className="stroke-[3]" /> : "2"}
              </span>
              <span className="hidden sm:inline">Passenger Details</span>
              <span className="sm:hidden">Details</span>
            </button>

            {/* Step 3 Pill */}
            <div
              className={`relative z-10 flex items-center gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                step === 3
                  ? "bg-pub-primary text-white shadow-md ring-4 ring-pub-primary/15"
                  : "bg-white border border-slate-200 text-slate-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-black ${
                  step === 3 ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                3
              </span>
              <span className="hidden sm:inline">Payment &amp; Review</span>
              <span className="sm:hidden">Payment</span>
            </div>
          </div>
        </div>

        {/* TOUR SNAPSHOT CARD */}
        <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative h-20 w-28 sm:h-22 sm:w-32 rounded-xl overflow-hidden shadow-2xs shrink-0 bg-slate-100">
                <img
                  src={tourThumbnail}
                  alt={tourTitle}
                  className="h-full w-full object-cover"
                />
                {tourPlace && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    {tourPlace}
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-pub-secondary/10 px-2 py-0.5 text-[11px] font-bold text-pub-secondary">
                    <Clock size={11} />
                    {tourDays > 0 ? `${tourDays} Days Tour` : "Tour Package"}
                  </span>
                  {tourRoute && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Plane size={11} className="text-sky-500" />
                      {tourRoute}
                    </span>
                  )}
                </div>

                <h1 className="mt-1 text-base sm:text-lg lg:text-xl font-black text-slate-950 tracking-tight leading-snug">
                  {tourTitle}
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle size={13} className="text-emerald-600" />
                    Instant Confirmation
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                    <ShieldCheck size={13} className="text-pub-secondary" />
                    100% Guaranteed Departure
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={tour.slug ? `/tours/${tour.slug}` : `/tours`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 transition shrink-0 self-start sm:self-center cursor-pointer"
            >
              <span>View Tour</span>
              <ArrowRight size={13} />
            </Link>
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
              <p className="mt-1 text-2xl font-black tracking-wider text-pub-primary">{bookingResult?.code}</p>
              {bookingResult && (
                <p className="mt-1 text-sm font-bold text-slate-700">
                  Total: {formatExact(Number(bookingResult.amount), bookingResult.currency)}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/tours"
                className="rounded-lg bg-pub-primary px-6 py-3 text-xs font-bold text-white transition hover:bg-pub-primary-dark"
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
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pub-accent text-xs font-black text-white shrink-0">
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

                  {/* Departure & Passengers Card */}
                  <div className="pt-6">
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Calendar size={16} className="text-pub-primary" />
                          <span>Select Departure &amp; Guests</span>
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {availableCalendar.length > 0
                            ? "Choose your departure date and configure the number of travellers joining this tour."
                            : "Confirm the number of travellers joining this tour."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        {/* Departure Date Picker */}
                        {availableCalendar.length > 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                            <span className="block text-xs font-bold text-slate-800 mb-2">Departure Date</span>
                            <DatePicker
                              label=""
                              value={travelDate}
                              onChange={setTravelDate}
                              availableDates={availableCalendar.map((c) => c.date)}
                              restrictToAvailableDates
                              required
                            />
                            {selectedCalendar ? (
                              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{selectedCalendar.slots} spots available on this departure</span>
                              </div>
                            ) : (
                              travelDate ? (
                                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  <span>Departure selected: {formatDate(travelDate)}</span>
                                </div>
                              ) : (
                                <p className="mt-2 text-[11px] text-amber-600 font-medium">Please select an available departure date</p>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <span className="block text-xs font-bold text-slate-800 mb-1">Departure Date</span>
                            <p className="text-xs text-slate-500">Flexible departure &mdash; to be finalized upon booking confirmation.</p>
                          </div>
                        )}

                        {/* Adults Quantity Stepper */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block text-xs font-bold text-slate-900">Adults (12+ yrs)</span>
                              <span className="text-[11px] text-slate-400">Standard traveller fare</span>
                            </div>

                            {/* Tactile Counter */}
                            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
                              <button
                                type="button"
                                disabled={adultCount <= 1}
                                onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                                aria-label="Decrease adult count"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-black text-slate-900">
                                {adultCount}
                              </span>
                              <button
                                type="button"
                                disabled={adultCount >= maxAdults}
                                onClick={() => setAdultCount(Math.min(maxAdults, adultCount + 1))}
                                aria-label="Increase adult count"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Children Quantity Stepper -- same control as adults */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="block text-xs font-bold text-slate-900">Children (3-11 yrs)</span>
                              <span className="text-[11px] text-slate-400">Child fare</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
                              <button
                                type="button"
                                disabled={childCount <= 0}
                                onClick={() => setChildCount(Math.max(0, childCount - 1))}
                                aria-label="Decrease child count"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-black text-slate-900">
                                {childCount}
                              </span>
                              <button
                                type="button"
                                disabled={childCount >= maxChildren}
                                onClick={() => setChildCount(Math.min(maxChildren, childCount + 1))}
                                aria-label="Increase child count"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium">Total travellers</span>
                            <span className="font-bold text-slate-900">
                              {totalTravellers} {totalTravellers === 1 ? "guest" : "guests"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accommodation */}
                  {SHOW_ACCOMMODATION_BOOKING && (
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
                  )}

                  {/* Pre/Post Tour Add-ons -- only rendered when the tour actually has real add-ons configured */}
                  {SHOW_ACCOMMODATION_BOOKING && nightAddonExtensions.length > 0 && (
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

                  {/* Optional Activities */}
                  {availableActivities.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles size={16} className="text-pub-primary" />
                        <span>Optional Activities</span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
                        Add curated extra experiences to your itinerary. Priced per adult traveller.
                      </p>

                      <div className="mt-4 space-y-3">
                        {availableActivities.map((activity) => {
                          const checked = selectedActivityIds.includes(activity.id);
                          return (
                            <div
                              key={activity.id}
                              onClick={() => toggleActivity(activity.id)}
                              className={`flex items-center justify-between gap-3.5 rounded-xl border-2 p-4 cursor-pointer transition ${
                                checked
                                  ? "border-pub-primary bg-blue-50/20 shadow-2xs ring-2 ring-pub-primary/10"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleActivity(activity.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-pub-primary focus:ring-pub-primary accent-pub-primary"
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

                  {/* Accommodation Add-ons */}
                  {SHOW_ACCOMMODATION_BOOKING && availableAccommodationExtras.length > 0 && (
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
                                checked ? "border-pub-primary bg-blue-50/10 shadow-2xs" : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAccommodationExtra(extra.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 rounded text-pub-primary focus:ring-pub-primary"
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
                    <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      <CircleAlert size={14} className="shrink-0" />
                      {stepError}
                    </p>
                  )}

                  <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinueStep1}
                      className="w-full sm:w-auto rounded-xl bg-pub-accent hover:bg-[#cf4b24] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/15 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <span>Continue to Passenger Details</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setStep(1)}
                  className="group flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50/90 px-5 sm:px-6 py-4 cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black shadow-2xs">
                      <Check size={14} className="stroke-[3]" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Completed</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900">Dates &amp; Guests</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedCalendar ? formatDate(selectedCalendar.date) : travelDate || "Selected date"} &bull; {adultCount} {adultCount === 1 ? "Adult" : "Adults"}{childCount > 0 ? `, ${childCount} ${childCount === 1 ? "Child" : "Children"}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:text-emerald-950 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg transition shadow-2xs">
                    Edit Step
                  </span>
                </div>
              )}

              {/* STEP 2: PASSENGER DETAILS */}
              {step === 2 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pub-accent text-xs font-black text-white shrink-0 shadow-2xs">
                      2
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Passenger Details</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Please provide passenger details as they appear on official travel IDs / passports.</p>
                    </div>
                  </div>

                  {/* Promo Voucher */}
                  <div className="pt-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5">
                      <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Tag size={15} className="text-pub-primary" />
                        <span>Have a Promo or Gift Voucher?</span>
                      </label>
                      <div className="flex max-w-md items-center gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoApplied(false);
                          }}
                          placeholder="Enter promo code"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-primary focus:ring-2 focus:ring-pub-primary/10"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          className="rounded-xl bg-pub-primary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-pub-primary-dark active:scale-95 shrink-0 shadow-2xs"
                        >
                          Apply Code
                        </button>
                      </div>
                      {promoApplied && !priceLoading && priceEstimate && Number(priceEstimate.discount_amount) > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-1.5 max-w-md">
                          <BadgeCheck size={15} className="text-emerald-600 shrink-0" />
                          <span>Promo code applied! You saved {format(Number(priceEstimate.discount_amount), priceEstimate.currency)}.</span>
                        </div>
                      )}
                      {promoError && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                          <CircleAlert size={14} className="shrink-0" />
                          <span>{promoError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passengers Inputs */}
                  {passengers.map((passenger, idx) => {
                    const isLead = idx === 0;
                    const ordinal = idx + 1 === 2 ? "2nd" : idx + 1 === 3 ? "3rd" : `${idx + 1}th`;
                    const labelTitle = isLead
                      ? "Lead Passenger (Primary Contact)"
                      : `${ordinal} Passenger${passenger.type === "child" ? " (Child)" : ""}`;

                    return (
                      <div key={idx} className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shrink-0 ${isLead ? "bg-pub-primary text-white" : "bg-slate-100 text-slate-700"}`}>
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{labelTitle}</span>
                                {isLead && (
                                  <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    Lead Guest
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                {passenger.type === "child" ? "Traveller must be 3-11 years old." : "Traveller must be 12 years or older."}
                              </p>
                            </div>
                          </div>
                          {isLead && (
                            <span className="text-[11px] font-medium text-slate-400">
                              Trip confirmation will be emailed here
                            </span>
                          )}
                        </div>

                        <div className="mt-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {/* First Name */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                First name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={passenger.firstName}
                                onChange={(e) => {
                                  handlePassengerChange(idx, "firstName", e.target.value);
                                  clearPassengerFieldError(idx, "firstName");
                                }}
                                placeholder="e.g. Srinath"
                                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
                                  passengerErrors[idx]?.firstName
                                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                                    : "border-slate-200 focus:border-pub-primary focus:ring-pub-primary/10"
                                }`}
                              />
                              {passengerErrors[idx]?.firstName && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                  <CircleAlert size={11} className="shrink-0" />
                                  {passengerErrors[idx].firstName}
                                </p>
                              )}
                            </div>

                            {/* Middle Name (optional) */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Middle name <span className="text-slate-400 font-normal text-[10px]">(optional)</span>
                              </label>
                              <input
                                type="text"
                                value={passenger.middleName}
                                onChange={(e) => handlePassengerChange(idx, "middleName", e.target.value)}
                                placeholder="Optional"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pub-primary focus:ring-2 focus:ring-pub-primary/10"
                              />
                            </div>

                            {/* Last Name */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Last name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={passenger.lastName}
                                onChange={(e) => {
                                  handlePassengerChange(idx, "lastName", e.target.value);
                                  clearPassengerFieldError(idx, "lastName");
                                }}
                                placeholder="e.g. Garu"
                                className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
                                  passengerErrors[idx]?.lastName
                                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                                    : "border-slate-200 focus:border-pub-primary focus:ring-pub-primary/10"
                                }`}
                              />
                              {passengerErrors[idx]?.lastName && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                  <CircleAlert size={11} className="shrink-0" />
                                  {passengerErrors[idx].lastName}
                                </p>
                              )}
                            </div>
                          </div>

                          {isLead && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                              {/* Mobile Number */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                  <Phone size={13} className="text-slate-400" />
                                  <span>Mobile number <span className="text-rose-500">*</span></span>
                                </label>
                                <div className="flex gap-2">
                                  <div className="relative w-36 sm:w-40 shrink-0">
                                    <select
                                      value={passenger.phoneCountry}
                                      onChange={(e) => handlePassengerChange(idx, "phoneCountry", e.target.value)}
                                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:border-pub-primary focus:bg-white"
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
                                    required
                                    value={passenger.phone}
                                    onChange={(e) => {
                                      handlePassengerChange(idx, "phone", e.target.value);
                                      clearPassengerFieldError(idx, "phone");
                                    }}
                                    placeholder="e.g. 9876543210"
                                    maxLength={15}
                                    className={`flex-1 rounded-xl border bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
                                      passengerErrors[idx]?.phone
                                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                                        : "border-slate-200 focus:border-pub-primary focus:ring-pub-primary/10"
                                    }`}
                                  />
                                </div>
                                {passengerErrors[idx]?.phone ? (
                                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                    <CircleAlert size={11} className="shrink-0" />
                                    {passengerErrors[idx].phone}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-[10px] text-slate-400">Digits only, 7–15 characters (country code selected above)</p>
                                )}
                              </div>

                              {/* Email Address */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                  <Mail size={13} className="text-slate-400" />
                                  <span>Email address <span className="text-rose-500">*</span></span>
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={passenger.email}
                                  onChange={(e) => {
                                    handlePassengerChange(idx, "email", e.target.value);
                                    clearPassengerFieldError(idx, "email");
                                  }}
                                  placeholder="e.g. srinath@example.com"
                                  className={`w-full rounded-xl border bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
                                    passengerErrors[idx]?.email
                                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                                      : "border-slate-200 focus:border-pub-primary focus:ring-pub-primary/10"
                                  }`}
                                />
                                {passengerErrors[idx]?.email ? (
                                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                    <CircleAlert size={11} className="shrink-0" />
                                    {passengerErrors[idx].email}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-[10px] text-slate-400">Booking confirmation sent to this address</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              <span>Date of Birth <span className="text-rose-500">*</span></span>
                            </label>
                            <div className="grid grid-cols-3 gap-2.5 max-w-md">
                              <div className="relative">
                                <select
                                  required
                                  value={passenger.birthDay}
                                  onChange={(e) => {
                                    handlePassengerChange(idx, "birthDay", e.target.value);
                                    clearPassengerFieldError(idx, "birthDay");
                                  }}
                                  className={`w-full appearance-none rounded-xl border bg-slate-50/50 py-2.5 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:bg-white ${
                                    passengerErrors[idx]?.birthDay
                                      ? "border-rose-400 focus:border-rose-500"
                                      : "border-slate-200 focus:border-pub-primary"
                                  }`}
                                >
                                  <option value="">Day</option>
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
                                  required
                                  value={passenger.birthMonth}
                                  onChange={(e) => {
                                    handlePassengerChange(idx, "birthMonth", e.target.value);
                                    clearPassengerFieldError(idx, "birthDay");
                                  }}
                                  className={`w-full appearance-none rounded-xl border bg-slate-50/50 py-2.5 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:bg-white ${
                                    passengerErrors[idx]?.birthDay
                                      ? "border-rose-400 focus:border-rose-500"
                                      : "border-slate-200 focus:border-pub-primary"
                                  }`}
                                >
                                  <option value="">Month</option>
                                  {[
                                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
                                  required
                                  value={passenger.birthYear}
                                  onChange={(e) => {
                                    handlePassengerChange(idx, "birthYear", e.target.value);
                                    clearPassengerFieldError(idx, "birthDay");
                                  }}
                                  className={`w-full appearance-none rounded-xl border bg-slate-50/50 py-2.5 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:bg-white ${
                                    passengerErrors[idx]?.birthDay
                                      ? "border-rose-400 focus:border-rose-500"
                                      : "border-slate-200 focus:border-pub-primary"
                                  }`}
                                >
                                  <option value="">Year</option>
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
                            {passengerErrors[idx]?.birthDay && (
                              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                <CircleAlert size={11} className="shrink-0" />
                                {passengerErrors[idx].birthDay}
                              </p>
                            )}
                          </div>
                        </div>
                      
                      </div>
                    );
                  })}

                  {stepError && (
                    <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      <CircleAlert size={14} className="shrink-0" />
                      {stepError}
                    </p>
                  )}

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.99]"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueStep2}
                      className="rounded-xl bg-pub-accent hover:bg-[#cf4b24] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/15 transition-all active:scale-[0.99] flex items-center gap-2"
                    >
                      <span>Check &amp; Continue to Payment</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ) : step > 2 ? (
                <div
                  onClick={() => setStep(2)}
                  className="group flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50/90 px-5 sm:px-6 py-4 cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black shadow-2xs">
                      <Check size={14} className="stroke-[3]" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Completed</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs sm:text-sm font-black text-slate-900">Passenger Details</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Lead: {passengers[0]?.firstName || ""} {passengers[0]?.lastName || ""} &bull; {passengers.length} {passengers.length === 1 ? "passenger" : "passengers"} configured
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:text-emerald-950 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-lg transition shadow-2xs">
                    Edit Step
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-5 sm:px-6 py-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xs font-bold shrink-0">
                      2
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-600">2. Passenger Details</span>
                      <p className="text-[11px] text-slate-400">Add passenger names, contact information and date of birth</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6">
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pub-accent text-xs font-black text-white shrink-0 shadow-2xs">
                      3
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Payment &amp; Final Review</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Select your preferred payment method and confirm your reservation.</p>
                    </div>
                  </div>

                  {/* Trust Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/50 p-4 text-xs text-emerald-900">
                    <div className="flex items-center gap-2.5 font-medium">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
                        <Lock size={15} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Bank-Grade 256-Bit SSL Encryption</p>
                        <p className="text-[11px] text-emerald-700">Your sensitive payment details are strictly encrypted and never stored.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-white/80 border border-emerald-200/80 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Verified by Tourvaa</span>
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
                      reserveDepositPercentage={depositEligibility?.agent.deposit_percentage ?? tour?.agent_reserve_deposit_percentage ?? 30}
                      reserveEligible={depositEligibility?.agent.eligible ?? true}
                      reserveDepositLabel={agentReserveSplit ? format(agentReserveSplit.deposit, priceEstimate!.currency) : null}
                      reserveBalanceLabel={agentReserveSplit ? format(agentReserveSplit.balance, priceEstimate!.currency) : null}
                      reserveDueDate={depositEligibility?.agent.due_date ?? null}
                    />
                  )}

                  {!isAgent && depositEligibility?.customer.eligible && (
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-3.5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Schedule</p>
                        <p className="text-sm font-black text-slate-900">Choose your payment flexibility</p>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setCustomerPaymentMethod("deposit")}
                          className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                            customerPaymentMethod === "deposit"
                              ? "border-pub-primary bg-white shadow-sm ring-4 ring-pub-primary/10"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="block text-sm font-black text-slate-900">Secure with a Deposit</span>
                            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-pub-primary">
                              Flexible
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                            Pay <strong className="text-slate-900 font-bold">
                              {customerDepositSplit && priceEstimate
                                ? format(customerDepositSplit.deposit, priceEstimate.currency)
                                : depositEligibility.customer.deposit_type === "percentage" ? `${depositEligibility.customer.deposit_percentage}%` : formatExact(Number(depositEligibility.customer.booking_deposit ?? 0), tourCurrency)}
                            </strong>
                            {customerDepositSplit && depositEligibility.customer.deposit_type === "percentage" ? ` (${depositEligibility.customer.deposit_percentage}%)` : ""} today to secure your booking.
                            {depositEligibility.customer.due_date && (
                              <span className="block mt-1 text-[11px] text-slate-500 font-medium">
                                Your remaining balance{customerDepositSplit && priceEstimate ? <> of <strong className="text-slate-700">{format(customerDepositSplit.balance, priceEstimate.currency)}</strong></> : null} is due by {formatDate(depositEligibility.customer.due_date)}.
                              </span>
                            )}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomerPaymentMethod("full")}
                          className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                            customerPaymentMethod === "full"
                              ? "border-pub-primary bg-white shadow-sm ring-4 ring-pub-primary/10"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="block text-sm font-black text-slate-900">Pay in Full Today</span>
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Instant Confirmation
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                            Pay in full today and confirm your booking.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {(!isAgent || agentPaymentMethod === "card") && (
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-1">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Gateway</p>
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                          <span>Test mode gateway &bull; No real charge will be applied to your card.</span>
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
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-pub-accent focus:ring-pub-accent accent-pub-accent"
                      />
                      <span className="leading-relaxed">
                        I accept Tourvaa{" "}
                        <Link href="/terms" className="text-blue-600 underline font-semibold hover:text-blue-700">
                          Terms &amp; Conditions
                        </Link>{" "}
                        and tour cancellation policies
                      </span>
                    </label>

                    <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs text-slate-700 cursor-pointer transition ${subscribeNewsletter ? "border-slate-300 bg-slate-50/70" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                      <input
                        type="checkbox"
                        checked={subscribeNewsletter}
                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-pub-accent focus:ring-pub-accent accent-pub-accent"
                      />
                      <span className="leading-relaxed">Subscribe to newsletter for exclusive deals, travel guides &amp; new trips</span>
                    </label>
                  </div>

                  {paymentError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-center gap-2 text-xs font-semibold text-rose-700">
                      <CircleAlert size={15} className="shrink-0 text-rose-600" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.99]"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Passengers</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAndPay}
                      disabled={!acceptTerms || paymentSubmitting}
                      className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-pub-accent hover:bg-[#cf4b24] py-4 px-6 text-sm font-black text-white shadow-md shadow-orange-600/15 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paymentSubmitting ? (
                        <>
                          <LoaderCircle size={17} className="animate-spin" />
                          <span>Processing secure checkout...</span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          <span>{isAgent && agentPaymentMethod === "pay_later" ? "Pay Deposit & Reserve" : isAgent ? "Pay in Full Today" : customerPaymentMethod === "deposit" ? "Pay Deposit & Secure Booking" : "Confirm and Pay Now"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-5 sm:px-6 py-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xs font-bold shrink-0">
                      3
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-600">3. Payment &amp; Confirmation</span>
                      <p className="text-[11px] text-slate-400">Choose payment method and confirm your reservation</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY TRIP SUMMARY */}
            <aside className="sticky top-24 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sparkles size={14} className="text-pub-primary" />
                  <span>Trip Summary</span>
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck size={12} />
                  Instant Confirmation
                </span>
              </div>

              {/* Tour Brief */}
              <div className="flex items-center gap-3">
                <img
                  src={tourThumbnail}
                  alt={tourTitle}
                  className="h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">{tourTitle}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {tourDays > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        <span>{tourDays} Days</span>
                      </span>
                    )}
                    {tourPlace && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        <span>{tourPlace}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Snapshot: Date & Guests */}
              <div className="rounded-xl bg-slate-50/70 border border-slate-200/70 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar size={14} className="text-pub-primary shrink-0" />
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
                      <span className="font-bold text-slate-900">
                        {selectedCalendar ? formatDate(selectedCalendar.date) : travelDate ? formatDate(travelDate) : "Departure not selected"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-pub-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users size={14} className="text-pub-primary shrink-0" />
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Travellers</span>
                      <span className="font-bold text-slate-900">
                        {adultCount} {adultCount === 1 ? "Adult" : "Adults"}{childCount > 0 ? `, ${childCount} Child` : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-pub-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Cart-side promo entry; automatic discounts need no action and
                  are shown in the price breakdown below. */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
                <div>
                  <label htmlFor="cart-promo-code" className="mb-2 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} className="text-pub-primary" /> Promo code
                    </span>
                    {availableCoupons.length > 0 && (
                      <span className="text-[10px] font-semibold text-pub-primary bg-pub-primary/10 px-1.5 py-0.5 rounded-full">
                        {availableCoupons.length} {availableCoupons.length === 1 ? "Offer Available" : "Offers Available"}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input id="cart-promo-code" value={promoCode}
                      onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); setPromoApplied(false); setPromoError(null); }}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleApplyPromo(); } }}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs uppercase outline-none focus:border-pub-primary" />
                    {promoApplied ? (
                      <button type="button" onClick={handleRemovePromo}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">Remove</button>
                    ) : (
                      <button type="button" onClick={() => handleApplyPromo()} disabled={!promoCode.trim() || priceLoading}
                        className="rounded-lg bg-pub-primary px-3 py-2 text-xs font-bold text-white hover:bg-pub-primary-dark disabled:opacity-50 transition cursor-pointer">Apply</button>
                    )}
                  </div>
                  {promoError && <p className="mt-2 text-[11px] font-semibold text-rose-600">{promoError}</p>}
                  {!promoApplied && priceEstimate && Number(priceEstimate.discount_amount) > 0 && (
                    <p className="mt-2 text-[11px] font-semibold text-emerald-700">Best eligible discount applied automatically.</p>
                  )}
                </div>

                {/* Available Offers & Coupons Listout */}
                {availableCoupons.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <BadgePercent size={13} className="text-pub-accent" />
                        Available Offers &amp; Coupons
                      </span>
                    </div>

                    <div className="space-y-2">
                      {availableCoupons.map((coupon) => {
                        const isApplied = promoApplied && promoCode.toUpperCase() === coupon.code.toUpperCase();
                        return (
                          <div
                            key={coupon.code}
                            className={`rounded-xl border p-2.5 transition-all ${
                              isApplied
                                ? "border-emerald-500 bg-emerald-50/50 shadow-2xs ring-2 ring-emerald-500/15"
                                : "border-dashed border-pub-primary/30 bg-orange-50/20 hover:border-pub-primary hover:bg-orange-50/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                                  {coupon.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(coupon.code)}
                                  title="Copy code"
                                  className="text-[10px] text-slate-400 hover:text-slate-600 transition"
                                >
                                  {copiedCode === coupon.code ? (
                                    <span className="text-emerald-600 font-bold">Copied!</span>
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                                {coupon.type === "percentage" ? `${coupon.value}% OFF` : `${format(coupon.value, tourCurrency)} OFF`}
                              </span>
                            </div>

                            <p className="mt-1.5 text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                              {coupon.name}
                            </p>

                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                              <span>
                                {coupon.minAmount ? `Min. spend ${format(coupon.minAmount, tourCurrency)}` : coupon.validUntil ? `Valid till ${formatDate(coupon.validUntil)}` : "Special offer"}
                              </span>
                              {coupon.validUntil && coupon.minAmount && (
                                <span>Till {formatDate(coupon.validUntil)}</span>
                              )}
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end">
                              {isApplied ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                    <Check size={12} className="stroke-[3]" /> Applied
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRemovePromo}
                                    disabled={priceLoading}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <X size={12} /> Remove
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApplyPromo(coupon.code)}
                                  disabled={priceLoading}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-pub-primary hover:text-white bg-white hover:bg-pub-primary border border-pub-primary px-3 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Ticket size={12} />
                                  Apply Coupon
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Automatic discounts overview if present */}
                {automaticDiscounts.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Automatic Savings Included
                    </span>
                    {automaticDiscounts.map((ad, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                        <span className="font-medium flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                          <span>{ad.label}</span>
                        </span>
                        <span className="font-bold">
                          {ad.type === "percentage" ? `${ad.value}% OFF` : `${format(ad.value, tourCurrency)} OFF`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Price Breakdown</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pub-primary">
                    <Globe size={12} />
                    {`Shown in ${displayCurrency}`}
                  </span>
                </div>

                {priceLoading && !priceEstimate ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
                    <LoaderCircle size={15} className="animate-spin text-pub-primary" />
                    <span>Calculating real-time rates...</span>
                  </div>
                ) : priceEstimate ? (
                  <>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <div>
                          <p className="font-semibold text-slate-900">Base Fare</p>
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
                        <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-600">Extensions &amp; Nights</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.extension_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.optional_activity_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-600">Optional Experiences</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.optional_activity_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.accommodation_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-600">Accommodation Add-ons</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.accommodation_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.discount_amount) > 0 && (
                        <div className="flex items-center justify-between text-emerald-600 pt-1.5 border-t border-slate-100">
                          <span className="font-medium flex items-center gap-1">
                            <Tag size={12} />
                            <span>{promoApplied ? `Promo code ${promoCode}` : "Automatic discount"}</span>
                          </span>
                          <span className="font-bold">
                            - {format(Number(priceEstimate.discount_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.tax_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-600">Estimated Taxes</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.tax_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}

                      {Number(priceEstimate.surcharge_amount) > 0 && (
                        <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-100">
                          <span className="text-slate-600">Surcharge</span>
                          <span className="font-bold text-slate-900">
                            {format(Number(priceEstimate.surcharge_amount), priceEstimate.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total Card */}
                    <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
                      {!isAgent && customerPaymentMethod === "deposit" && depositEligibility?.customer.eligible ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-emerald-400">Due Today (Deposit)</p>
                              <p className="text-[11px] font-medium text-slate-200">Secures your travel reservation</p>
                            </div>
                            <span className="text-xl font-black text-white">
                              {format(customerDepositSplit?.deposit ?? Number(priceEstimate.final_amount), priceEstimate.currency)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-200">
                            <span>Total Trip Value:</span>
                            <span className="font-bold text-white">{format(Number(priceEstimate.final_amount), priceEstimate.currency)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-white">Total Payable</p>
                            <p className="text-[11px] font-semibold text-white">Taxes &amp; fees included</p>
                          </div>
                          <strong className="text-xl font-black text-white">
                            {format(Number(priceEstimate.final_amount), priceEstimate.currency)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {priceEstimate.currency.toUpperCase() !== displayCurrency.toUpperCase() && (
                      <p className="mt-2 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        You will be charged in {formatExact(Number(priceEstimate.final_amount), priceEstimate.currency)} &mdash; converted to {displayCurrency} for viewing convenience.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="py-3 text-xs text-slate-400">Pricing currently unavailable.</p>
                )}

                {step < 3 && (
                  <button
                    type="button"
                    onClick={step === 1 ? handleContinueStep1 : handleContinueStep2}
                    className="mt-4 w-full rounded-xl bg-pub-primary hover:bg-pub-primary-dark py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-pub-primary/15 transition active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <span>{step === 1 ? "Continue to Passenger Details" : "Proceed to Payment"}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {/* Confidence & Buyer Protection Pillars */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                    <Shield size={13} />
                  </div>
                  <span>Best Price &amp; Genuine Operator Guarantee</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                    <Lock size={13} />
                  </div>
                  <span>256-Bit SSL Encrypted &bull; No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-orange-600 shrink-0">
                    <Headphones size={13} />
                  </div>
                  <span>24/7 Global Traveler Support</span>
                </div>
              </div>
            </aside>

          </div>
        )}
      </div>
    </main>
  );
}
