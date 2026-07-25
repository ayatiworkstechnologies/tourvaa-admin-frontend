"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LuLogIn as LogIn, LuMapPin as MapPin, LuX as X } from "react-icons/lu";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useAuthContext } from "@/providers/AuthProvider";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import CountryTourListing from "@/components/public/CountryTourListing";
import TourDetailExperience from "@/components/public/TourDetailExperience";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80";

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
          {isLoggedIn ? "Booking account required" : "Sign in to book"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {isLoggedIn
            ? "This booking is available to customer and agent accounts."
            : "Continue as a customer or book for a customer using an agent account."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => { onClose(); router.push(`/login?role=traveller&redirect=${encodeURIComponent(returnPath)}`); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-bold text-white hover:bg-sky-600"
          >
            <LogIn size={15} /> Customer login
          </button>
          <button
            type="button"
            onClick={() => { onClose(); router.push(`/login?role=agent&redirect=${encodeURIComponent(returnPath)}`); }}
            className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Agent login
          </button>
          {!isLoggedIn && <Link href={`/register?redirect=${encodeURIComponent(returnPath)}`} onClick={onClose} className="py-2 text-center text-xs font-bold text-teal-700">Create customer account</Link>}
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
  const { isLoggedIn, loading: authLoading, user, dashboard, refreshSession } = useAuthContext();
  const [tour, setTour] = useState<PublicTourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingBookingPath, setPendingBookingPath] = useState("");
  const countryOnlySlug = params?.id && !params.slug && !/^\d+$/.test(params.id) ? params.id : null;

  useEffect(() => {
    const routeId = params?.id;
    const routeSlug = params?.slug;
    const isCountryListing = routeId && !routeSlug && !/^\d+$/.test(routeId);
    if (isCountryListing) { setLoading(false); setNotFound(false); return; }
    const tourKey = routeSlug || routeId;
    if (!tourKey) { setNotFound(true); setLoading(false); return; }
    fetchPublicTourDetail(tourKey, routeSlug ? routeId : undefined)
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
  }, [params?.id, params?.slug]);

  useEffect(() => {
    if (tour && params?.id && /^\d+$/.test(params.id)) router.replace(publicTourUrl(tour), { scroll: false });
  }, [tour, params?.id, router]);

  if (countryOnlySlug) {
    return <CountryTourListing countrySlug={countryOnlySlug} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-200 border-t-blue-600" />
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
        <Link href="/tours" className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
          Browse All Tours
        </Link>
      </div>
    );
  }

  const bookingUser = dashboard?.user ?? user;
  const roleSlug = bookingUser?.role?.slug;
  const isCustomer = isLoggedIn && roleSlug === "customer";
  const isAgent = isLoggedIn && ["agent", "agent-reseller"].includes(roleSlug ?? "");
  const canBookFromPublic = isCustomer || isAgent;
  const initialTravelDate = searchParams.get("travel_date") ?? "";
  const initialAdults = Math.max(1, Number(searchParams.get("adults") || 1));
  const initialChildren = Math.max(0, Number(searchParams.get("children") || 0));
  const returnQuery = searchParams.toString();
  const returnPath = `/booking/${tour.id}${returnQuery ? `?${returnQuery}` : ""}`;

  const handleBookClick = async (selection?: { travelDate: string; adults: number; children: number }) => {
    const bookingQuery = new URLSearchParams(searchParams.toString());
    if (selection?.travelDate) bookingQuery.set("travel_date", selection.travelDate);
    if (selection) {
      bookingQuery.set("adults", String(selection.adults));
      bookingQuery.set("children", String(selection.children));
    }
    const query = bookingQuery.toString();
    const bookingPath = `/booking/${tour.id}${query ? `?${query}` : ""}`;
    setPendingBookingPath(bookingPath);
    if (canBookFromPublic) { router.push(bookingPath); return; }
    if (!isLoggedIn) { setShowModal(true); return; }
    try { await refreshSession(); } finally { setShowModal(true); }
  };

  const allImages = tour.gallery.length > 0
    ? tour.gallery.map((g) => mediaUrl(g.image_url))
    : [tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER];
  const travelItem = { id: tour.id, title: tour.title, place: [tour.city_name, tour.country_name].filter(Boolean).join(", ") || "Worldwide", image: allImages[0], price: tour.price_start_per_person, currency: tour.currency || "USD", duration: tour.number_of_days ? `${tour.number_of_days} days` : tour.number_of_hours ? `${tour.number_of_hours} hours` : "Flexible", href: publicTourUrl(tour) };
  const wishlisted = isWishlisted(tour.id);
  return (
    <TourDetailExperience
      tour={tour}
      images={allImages}
      initialTravelDate={initialTravelDate}
      initialAdults={initialAdults}
      initialChildren={initialChildren}
      onBook={handleBookClick}
      onWishlist={() => toggleWishlist(travelItem)}
      wishlisted={wishlisted}
      modal={showModal && !authLoading && (
        <GuestPrompt onClose={() => setShowModal(false)} returnPath={pendingBookingPath || returnPath} isLoggedIn={isLoggedIn} />
      )}
    />
  );
}
