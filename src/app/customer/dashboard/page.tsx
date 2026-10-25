"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as CalendarDays,
  LuCompass as Compass,
  LuCreditCard as CreditCard,
  LuFileText as FileText,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuLayoutGrid as LayoutGrid,
  LuMapPin as MapPin,
  LuPencil as Pencil,
  LuShare2 as Share2,
  LuTicket as Ticket,
  LuUserPlus as UserPlus,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { bookingStatusLabel } from "@/lib/constants/bookingStatus";
import { useCurrency } from "@/hooks/useCurrency";
import { AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";
import Loader from "@/components/ui/Loader";

type Profile = {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line_1?: string;
  country_name?: string;
  country?: string;
  city_name?: string;
  city?: string;
  pincode?: string;
  postal_code?: string;
  passport_no?: string;
  passport_number?: string;
  nationality?: string;
};

type Booking = {
  id: number | string;
  booking_code: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  cancellation_source?: string | null;
  final_amount?: string | number;
  amount_paid?: string | number;
  amount_pending?: string | number;
  authorized_amount?: string | number;
  payment_status?: string;
  currency?: string;
  tour_image?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatStatus(status: string, cancellationSource?: string | null) {
  const s = status.toLowerCase();
  const label = bookingStatusLabel(status, "customer", cancellationSource);
  if (["confirmed", "ready_to_travel", "upcoming", "postponed"].includes(s)) {
    return <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">{label}</span>;
  }
  if (s === "ongoing") {
    return <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">{label}</span>;
  }
  if (s === "completed") {
    return <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">{label}</span>;
  }
  if (s === "cancellation_requested") {
    return <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">{label}</span>;
  }
  if (["cancelled", "declined", "refunded"].includes(s)) {
    return <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-500">{label}</span>;
  }
  return <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">{label}</span>;
}

export default function CustomerDashboardPage() {
  const { user } = useAuthContext();
  const { wishlist, toggleWishlist } = useTravelStore();
  const { format, formatExact } = useCurrency();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState(false);

  const handleReferralShare = useCallback(async () => {
    const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${encodeURIComponent(String(user?.id ?? ""))}` : "";
    const text = "Book your next trip with Tourvaa - join me and explore curated tours worldwide!";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tourvaa", text, url: link });
      } catch {
        // User cancelled the native share sheet - nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied to clipboard.");
    } catch {
      toast.error("Could not copy the referral link.");
    }
  }, [user, toast]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setBookingsLoading(true);
    setBookingsError(false);
    try {
      const [profileResult, bookingResult] = await Promise.allSettled([
        // Customer portal routes enforce ownership. The former /customers/me
        // endpoint is an admin-era path and caused a rejected request on every
        // dashboard mount, which made reloads visibly flicker.
        api.get("/customer/profile", { signal }),
        api.get("/customer/bookings", { params: { limit: 5 }, signal }),
      ]);
      if (signal?.aborted) return;
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data?.data ?? null);
      }
      if (bookingResult.status === "fulfilled") {
        const items = bookingResult.value.data?.items ?? bookingResult.value.data?.data;
        if (Array.isArray(items)) {
          setBookings(items);
        } else {
          setBookings([]);
          setBookingsError(true);
        }
      } else {
        setBookings([]);
        setBookingsError(true);
      }
    } catch {
      if (signal?.aborted) return;
      setBookings([]);
      setBookingsError(true);
    } finally {
      if (!signal?.aborted) setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const fullName = profile?.full_name || profile?.name || user?.name || "";
  const email = profile?.email || user?.email || "";
  const phone = profile?.phone || user?.phone || "";
  const passportNo = profile?.passport_no || profile?.passport_number || "";
  const nationality = profile?.nationality || profile?.country_name || profile?.country || "";
  const homeAddress = profile?.address || profile?.address_line_1 || "";

  // Wishlist items from real travel store
  const wishlistItems = wishlist.slice(0, 3).map((w) => ({
    id: String(w.id),
    title: w.title || "Tour Experience",
    location: w.place || "Destination",
    duration: w.duration || "Flexible",
    price: w.price ? format(w.price, w.currency || "USD") : "Price on request",
    image: mediaUrl(w.image) || "/images/tour-card-fallback.jpg",
    href: w.href || `/tours/${w.id}`,
  }));

  return (
    <AgentPageShell className="customer-dashboard">
        <AgentPageHeader
          title={`Welcome back, ${fullName || "Traveller"}`}
          description="Manage your profile, bookings, payments, travellers, and saved destinations."
          icon={Compass}
          eyebrow="Customer Dashboard"
          actions={[{ label: "Refer & Earn", onClick: handleReferralShare, icon: Share2 }]}
        />

        {/* ── Quick Actions ── */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link href="/tours" className="flex flex-col items-center gap-2 rounded-2xl border border-dash-border/80 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-dash-brand/30 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Compass size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Book a Tour</span>
          </Link>
          <Link href="/customer/payments" className="flex flex-col items-center gap-2 rounded-2xl border border-dash-border/80 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-dash-brand/30 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Make a Payment</span>
          </Link>
          <Link href="/customer/travellers" className="flex flex-col items-center gap-2 rounded-2xl border border-dash-border/80 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-dash-brand/30 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><UserPlus size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Add Traveller</span>
          </Link>
          <Link href="/customer/invoices" className="flex flex-col items-center gap-2 rounded-2xl border border-dash-border/80 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-dash-brand/30 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><FileText size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">View Invoices</span>
          </Link>
          <Link href="/customer/support" className="col-span-2 flex flex-col items-center gap-2 rounded-2xl border border-dash-border/80 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-dash-brand/30 hover:shadow-md sm:col-span-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Headset size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Contact Support</span>
          </Link>
        </div>

        {/* ── Card 1: Profile Details ── */}
        <AgentSection className="mt-4" title="Profile Details" description="Your personal and travel information at a glance." action={{ label: "Edit profile", href: "/customer/profile", icon: Pencil }}>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                FULL NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={fullName}
                  placeholder="Not provided"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition cursor-default ${
                    fullName
                      ? "border-slate-200 bg-white font-semibold text-slate-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 font-normal italic text-slate-400"
                  }`}
                />
                {!fullName && (
                  <Link
                    href="/customer/profile"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1464F4] hover:underline"
                  >
                    + Add
                  </Link>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={email}
                  placeholder="Not provided"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition cursor-default ${
                    email
                      ? "border-slate-200 bg-white font-semibold text-slate-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 font-normal italic text-slate-400"
                  }`}
                />
                {!email && (
                  <Link
                    href="/customer/profile"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1464F4] hover:underline"
                  >
                    + Add
                  </Link>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PHONE NUMBER
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={phone}
                  placeholder="Not provided"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition cursor-default ${
                    phone
                      ? "border-slate-200 bg-white font-semibold text-slate-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 font-normal italic text-slate-400"
                  }`}
                />
                {!phone && (
                  <Link
                    href="/customer/profile"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1464F4] hover:underline"
                  >
                    + Add
                  </Link>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PASSPORT NO.
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={passportNo}
                  placeholder="Not provided"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition cursor-default ${
                    passportNo
                      ? "border-slate-200 bg-white font-semibold text-slate-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 font-normal italic text-slate-400"
                  }`}
                />
                {!passportNo && (
                  <Link
                    href="/customer/profile"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1464F4] hover:underline"
                  >
                    + Add
                  </Link>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                COUNTRY
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={nationality}
                  placeholder="Not provided"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition cursor-default ${
                    nationality
                      ? "border-slate-200 bg-white font-semibold text-slate-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 font-normal italic text-slate-400"
                  }`}
                />
                {!nationality && (
                  <Link
                    href="/customer/profile"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1464F4] hover:underline"
                  >
                    + Add
                  </Link>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                HOME ADDRESS
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={homeAddress}
                  placeholder="Not provided"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition cursor-default ${
                    homeAddress
                      ? "border-slate-200 bg-white font-semibold text-slate-800"
                      : "border-dashed border-slate-200 bg-slate-50/70 font-normal italic text-slate-400"
                  }`}
                />
                {!homeAddress && (
                  <Link
                    href="/customer/profile"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1464F4] hover:underline"
                  >
                    + Add
                  </Link>
                )}
              </div>
            </div>
          </div>
        </AgentSection>

        {/* ── Card 2: My Bookings ── */}
        <AgentSection className="mt-4" title="My Bookings" description="Track your latest trips, balances, and booking status." action={{ label: "See all", href: "/customer/bookings", icon: LayoutGrid }}>
          <div className="p-5">

          {bookingsLoading ? (
            <div className="py-8"><Loader label="Loading your bookings..." compact /></div>
          ) : bookingsError ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center">
              <Ticket size={28} className="text-amber-400" />
              <p className="mt-2 text-xs font-bold text-amber-900">We could not load your bookings</p>
              <button type="button" onClick={() => void load()} className="mt-3 rounded-xl border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100">Try again</button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Ticket size={28} className="text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-600">No tour bookings yet</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Discover incredible hand-crafted itineraries and start your journey</p>
              <Link
                href="/tours"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
              >
                Explore Tours
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const pendingAmount = Number(b.amount_pending || 0);
                const paidAmount = Number(b.amount_paid || 0);
                const authorizedAmount = Number(b.authorized_amount || 0);
                const paymentCoveredByAuthorization = (b.payment_status || "").toLowerCase() === "authorized"
                  && pendingAmount > 0
                  && authorizedAmount >= pendingAmount;
                const hasBalance = pendingAmount > 0 && !paymentCoveredByAuthorization;
                const displayedAmount = paymentCoveredByAuthorization
                  ? b.authorized_amount
                  : hasBalance
                    ? b.amount_pending
                    : paidAmount > 0
                      ? b.amount_paid
                      : b.final_amount;
                const amountLabel = paymentCoveredByAuthorization
                  ? "Payment authorized"
                  : hasBalance
                    ? "Amount due"
                    : paidAmount > 0
                      ? "Total paid"
                      : "Booking total";
                return (
                  <article key={b.id} className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_-22px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_34px_-22px_rgba(37,99,235,0.38)]">
                    <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
                      <Link href={`/customer/bookings/${b.id}`} className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 sm:h-24 sm:w-32" aria-label={`View ${b.tour_name || "tour booking"}`}>
                        {b.tour_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl(b.tour_image)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><MapPin size={24} className="text-blue-300" /></div>
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700 shadow-sm">#{b.booking_code.replace(/^#/, "")}</span>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/customer/bookings/${b.id}`} className="line-clamp-2 text-sm font-black leading-snug text-slate-900 transition hover:text-blue-600 sm:text-[15px]">
                              {b.tour_name || "Tour Package"}
                            </Link>
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <CalendarDays size={14} className="text-blue-500" /> {formatDate(b.tour_date)}
                            </p>
                          </div>
                          {formatStatus(b.booking_status, b.cancellation_source)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:min-w-[145px] sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:py-1 sm:pl-5 sm:pt-1">
                        <div className="sm:text-right">
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{amountLabel}</p>
                          <p className={`mt-1 text-lg font-black ${hasBalance ? "text-amber-600" : "text-slate-900"}`}>{formatExact(displayedAmount, b.currency || "USD")}</p>
                        </div>
                        <Link href={`/customer/bookings/${b.id}${hasBalance ? "?action=pay" : ""}`} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${hasBalance ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                          {hasBalance ? "Pay now" : "View booking"} <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </div>
        </AgentSection>

        {/* ── Card 3: My Wishlist ── */}
        <AgentSection className="mt-4" title="My Wishlist" description="Your saved tours and future travel ideas." action={{ label: "See all", href: "/customer/wishlist", icon: LayoutGrid }}>
          <div className="p-5">

          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Heart size={28} className="text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-600">No saved tours yet</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Explore our destinations and save tours to your wishlist</p>
              <Link
                href="/tours"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
              >
                Explore Tours
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {wishlistItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Image & Badges */}
                  <div className="relative h-44 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                    {/* Top-Left Location Badge */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-xs shadow-xs">
                      <MapPin size={11} className="text-slate-600" />
                      {item.location}
                    </span>
                    {/* Top-Right Heart Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const savedTour = wishlist.find((tour) => String(tour.id) === item.id);
                        if (savedTour) toggleWishlist(savedTour);
                      }}
                      aria-label={`Remove ${item.title} from wishlist`}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-xs hover:scale-110 transition"
                    >
                      <Heart size={14} className="fill-current text-blue-600" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Title & Duration */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                      <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                        {item.duration}
                      </span>
                    </div>

                    {/* Price & Book Now */}
                    <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500">Price </span>
                        <span className="text-xs font-black text-slate-900">{item.price}</span>
                        <span className="text-[10px] text-slate-400"> pp</span>
                      </div>
                      <Link
                        href={item.href || "/tours"}
                        className="rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#1D4ED8]"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AgentSection>
    </AgentPageShell>
  );
}
