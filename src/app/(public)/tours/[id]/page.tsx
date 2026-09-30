"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LuArrowRight as ArrowRight,
  LuLogIn as LogIn,
  LuMapPin as MapPin,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuX as X,
} from "react-icons/lu";
import {
  fetchPublicTourDetail,
  PublicTourDetail,
} from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useAuthContext } from "@/providers/AuthProvider";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import CountryTourListing from "@/components/public/CountryTourListing";
import TourDetailExperience from "@/components/public/TourDetailExperience";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80";

// Upgraded Luxury Guest Booking Prompt Modal
function GuestPrompt({
  onClose,
  returnPath,
  isLoggedIn,
}: {
  onClose: () => void;
  returnPath: string;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={
        isLoggedIn ? "Booking account required" : "Sign in to book your tour"
      }
    >
      {/* Backdrop with smooth blur */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 transition-all transform animate-scale-in">
        {/* Decorative Top Glows */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/25">
            <LogIn size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
              <Sparkles size={11} className="text-blue-600" />
              Secure Checkout
            </span>
            <h3 className="text-lg font-black text-slate-950 tracking-tight mt-0.5">
              {isLoggedIn
                ? "Booking Account Required"
                : "Sign in to Book Your Tour"}
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed font-normal">
          {isLoggedIn
            ? "Your current account does not have booking permissions. Please sign in with an authorised traveller or agent account."
            : "To secure your departure date, hold your seats, and receive instant digital vouchers, please choose how you would like to proceed:"}
        </p>

        {/* Action Selection Cards */}
        <div className="mt-5 space-y-2.5">
          {/* Customer / Traveller Option */}
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(
                `/login?role=traveller&redirect=${encodeURIComponent(returnPath)}`,
              );
            }}
            className="group relative flex w-full items-center justify-between rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 p-4 text-left transition hover:border-blue-600 hover:bg-blue-50/80 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition group-hover:scale-105">
                <LogIn size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-950">
                    Customer Login
                  </span>
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Personal bookings, tickets &amp; trip itinerary
                </p>
              </div>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-2xs border border-blue-100 transition group-hover:translate-x-0.5">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Agent Portal Option */}
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(
                `/agent-portal/login?redirect=${encodeURIComponent(returnPath)}`,
              );
            }}
            className="group relative flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs transition group-hover:scale-105 group-hover:bg-slate-200">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-slate-900 block">
                  Travel Agent Portal
                </span>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Book for clients, manage commissions &amp; deposits
                </p>
              </div>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100 transition group-hover:translate-x-0.5 group-hover:text-slate-700">
              <ArrowRight size={14} />
            </div>
          </button>
        </div>

        {/* Registration Footer */}
        {!isLoggedIn && (
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account yet?{" "}
              <Link
                href={`/register?redirect=${encodeURIComponent(returnPath)}`}
                onClick={onClose}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
              >
                Create customer account
              </Link>
            </p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-3.5 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span>Instant Digital Confirmation</span>
        </div>
      </div>
    </div>
  );
}

// main page
export default function TourDetailPage() {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const params = useParams<{ id?: string; country?: string; slug?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isLoggedIn,
    loading: authLoading,
    user,
    dashboard,
    refreshSession,
    hasPermission,
  } = useAuthContext();
  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pendingBookingPath, setPendingBookingPath] = useState("");
  const loadedTourKeyRef = useRef<string | null>(null);
  const requestedTravelDate = searchParams.get("travel_date") ?? "";
  const [priceTravelDate, setPriceTravelDate] = useState(requestedTravelDate);
  useEffect(() => { setPriceTravelDate(requestedTravelDate); }, [requestedTravelDate]);
  const handleTravelDateChange = useCallback((travelDate: string) => {
    setPriceTravelDate((current) => current === travelDate ? current : travelDate);
  }, []);
  const countryOnlySlug =
    params?.id && !params.slug && !/^\d+$/.test(params.id) ? params.id : null;

  useEffect(() => {
    let active = true;
    const routeId = params?.id;
    const routeSlug = params?.slug;
    const isCountryListing = routeId && !routeSlug && !/^\d+$/.test(routeId);
    if (isCountryListing) {
      setLoading(false);
      setNotFound(false);
      return;
    }
    const tourKey = routeSlug || routeId;
    if (!tourKey) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const isInitialTourLoad = loadedTourKeyRef.current !== tourKey;
    setLoading(isInitialTourLoad);
    setNotFound(false);
    setLoadError(false);
    fetchPublicTourDetail(tourKey, routeSlug ? routeId : undefined, priceTravelDate || undefined)
      .then((data) => {
        if (!active) return;
        if (routeId && /^\d+$/.test(routeId))
          router.replace(publicTourUrl(data), { scroll: false });
        setTour({
          ...data,
          itineraries: data.itineraries ?? [],
          highlights: data.highlights ?? [],
          inclusions: data.inclusions ?? [],
          exclusions: data.exclusions ?? [],
          gallery: data.gallery ?? [],
          pricing: data.pricing ?? [],
          optional_activities: data.optional_activities ?? [],
          accommodations: data.accommodations ?? [],
          extensions: data.extensions ?? [],
          discounts: data.discounts ?? [],
          calendar: data.calendar ?? [],
          departures: data.departures ?? [],
          similar_tours: data.similar_tours ?? [],
          cancellation_policy: data.cancellation_policy ?? [],
          reviews: data.reviews ?? [],
        });
        loadedTourKeyRef.current = tourKey;
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isInitialTourLoad) {
          if (axios.isAxiosError(error) && error.response?.status === 404)
            setNotFound(true);
          else setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params?.id, params?.slug, priceTravelDate, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (countryOnlySlug) {
    return <CountryTourListing countrySlug={countryOnlySlug} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-200 border-t-blue-600" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            Loading tour…
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-5 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-red-100 bg-white shadow-sm">
          <MapPin size={40} className="text-red-300" />
        </div>
        <div>
          <p className="text-2xl font-black text-zinc-950">
            Tour could not be loaded
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Please check your connection and try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
        >
          Retry
        </button>
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
        <Link
          href="/tours"
          className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
        >
          Browse All Tours
        </Link>
      </div>
    );
  }

  const bookingUser = dashboard?.user ?? user;
  const roleSlug = bookingUser?.role?.slug;
  const isCustomer = isLoggedIn && roleSlug === "customer";
  const isAgent =
    isLoggedIn && ["agent", "agent-reseller"].includes(roleSlug ?? "");
  const canBookFromPublic =
    isCustomer ||
    (isAgent &&
      (hasPermission("bookings.create") || hasPermission("create-bookings")));
  const initialTravelDate = searchParams.get("travel_date") ?? "";
  const initialAdults = Math.max(1, Number(searchParams.get("adults") || 1));
  const initialChildren = Math.max(
    0,
    Number(searchParams.get("children") || 0),
  );
  const returnQuery = searchParams.toString();
  const returnPath = `/booking/${tour.id}${returnQuery ? `?${returnQuery}` : ""}`;

  const handleBookClick = async (selection?: {
    travelDate: string;
    adults: number;
    children: number;
    agentAction?: "reserve" | "full";
  }) => {
    const bookingQuery = new URLSearchParams(searchParams.toString());
    if (selection?.travelDate)
      bookingQuery.set("travel_date", selection.travelDate);
    if (selection) {
      bookingQuery.set("adults", String(selection.adults));
      bookingQuery.set("children", String(selection.children));
      if (selection.agentAction)
        bookingQuery.set("agent_action", selection.agentAction);
    }
    const query = bookingQuery.toString();
    const bookingPath = `/booking/${tour.id}${query ? `?${query}` : ""}`;
    setPendingBookingPath(bookingPath);
    if (canBookFromPublic) {
      router.push(bookingPath);
      return;
    }
    if (!isLoggedIn) {
      setShowModal(true);
      return;
    }
    try {
      await refreshSession();
    } finally {
      setShowModal(true);
    }
  };

  const allImages =
    tour.gallery.length > 0
      ? tour.gallery.map((g) => mediaUrl(g.image_url))
      : [tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER];
  const travelItem = {
    id: tour.id,
    title: tour.title,
    place:
      [tour.city_name, tour.country_name].filter(Boolean).join(", ") ||
      "Worldwide",
    image: allImages[0],
    price: tour.price_start_per_person,
    currency: tour.currency || "USD",
    duration: tour.number_of_days
      ? `${tour.number_of_days} days`
      : tour.number_of_hours
        ? `${tour.number_of_hours} hours`
        : "Flexible",
    href: publicTourUrl(tour),
  };
  const wishlisted = isWishlisted(tour.id);
  return (
    <TourDetailExperience
      tour={tour}
      images={allImages}
      initialTravelDate={priceTravelDate || initialTravelDate}
      initialAdults={initialAdults}
      initialChildren={initialChildren}
      onTravelDateChange={handleTravelDateChange}
      agentBooking={isAgent}
      onBook={handleBookClick}
      onWishlist={() => toggleWishlist(travelItem)}
      wishlisted={wishlisted}
      modal={
        showModal &&
        !authLoading && (
          <GuestPrompt
            onClose={() => setShowModal(false)}
            returnPath={pendingBookingPath || returnPath}
            isLoggedIn={isLoggedIn}
          />
        )
      }
    />
  );
}
