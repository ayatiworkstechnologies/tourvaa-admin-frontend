"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuCalendar as Calendar,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronUp as ChevronUp,
  LuCompass as Compass,
  LuHeart as Heart,
  LuHotel as Hotel,
  LuInfo as Info,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuUser as User,
  LuUsers as Users,
  LuUtensils as Utensils,
  LuX as X,
  LuBus as Bus,
  LuGlobe as Globe,
  LuFlag as Flag,
} from "react-icons/lu";
import { PublicTourDetail } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type Props = {
  tour: PublicTourDetail;
  images: string[];
  initialTravelDate: string;
  initialAdults: number;
  initialChildren: number;
  onBook: (selection: { travelDate: string; adults: number; children: number }) => void;
  onWishlist: () => void;
  wishlisted: boolean;
  modal?: React.ReactNode;
};

// Fallback high-res photos if tour gallery is empty
const CURATED_GALLERY = [
  "/images/compare-hero.jpg",
  "/images/destination-alpine.jpg",
  "/images/destination-desert.jpg",
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
  "/images/tour-card-fallback.jpg",
];

// Helper to return appropriate flag emoji by country name
function getCountryFlag(country?: string | null): string {
  if (!country) return "";
  const c = country.toLowerCase().trim();
  if (c.includes("india")) return "🇮🇳";
  if (c.includes("new zealand") || c === "nz") return "🇳🇿";
  if (c.includes("indonesia") || c.includes("bali")) return "🇮🇩";
  if (c.includes("japan")) return "🇯🇵";
  if (c.includes("switzerland")) return "🇨🇭";
  if (c.includes("greece")) return "🇬🇷";
  if (c.includes("peru")) return "🇵🇪";
  if (c.includes("iceland")) return "🇮🇸";
  if (c.includes("morocco")) return "🇲🇦";
  if (c.includes("tanzania")) return "🇹🇿";
  if (c.includes("vietnam")) return "🇻🇳";
  if (c.includes("maldives")) return "🇲🇻";
  if (c.includes("france")) return "🇫🇷";
  if (c.includes("italy")) return "🇮🇹";
  if (c.includes("spain")) return "🇪🇸";
  if (c.includes("united kingdom") || c === "uk" || c.includes("britain")) return "🇬🇧";
  if (c.includes("united states") || c === "usa" || c.includes("america")) return "🇺🇸";
  if (c.includes("australia")) return "🇦🇺";
  if (c.includes("thailand")) return "🇹🇭";
  if (c.includes("singapore")) return "🇸🇬";
  if (c.includes("malaysia")) return "🇲🇾";
  if (c.includes("nepal")) return "🇳🇵";
  if (c.includes("sri lanka")) return "🇱🇰";
  if (c.includes("uae") || c.includes("dubai")) return "🇦🇪";
  return "";
}

// Splits a free-form, comma/newline-separated backend Text field into clean bullet chips
function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupTierLabel(personsFrom: number, personsTo: number | null): string {
  return personsTo != null ? `${personsFrom}–${personsTo} travellers` : `${personsFrom}+ travellers`;
}

type DepartureDateItem = {
  id: string;
  date: string;
  seats: string;
  urgent: boolean;
  slotsRemaining: number;
};

type MonthGroup = {
  name: string;
  key: string;
  dates: DepartureDateItem[];
};

function parseItineraryDetail(raw: string): { title: string | null; body: string }[] {
  if (!raw || typeof raw !== "string") return [];
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Match stop title pattern: Starts at line start or after sentence ending, capital letter, ends with colon
  // e.g. "Auckland Harbour Bridge – A City Icon:" or "Devonport – Heritage Charm & Stunning Views:"
  const titleRegex = /(?:^|\n|(?<=[.!?"]\s+))([A-Z0-9][A-Za-z0-9\s&'/–—\-]+:)\s*/g;
  const matches = [...normalized.matchAll(titleRegex)];

  if (matches.length > 0) {
    const blocks: { title: string | null; body: string }[] = [];
    if (matches[0].index > 0) {
      const pre = normalized.slice(0, matches[0].index).trim();
      if (pre) blocks.push({ title: null, body: pre });
    }
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const title = match[1].replace(/:$/, "").trim();
      const contentStart = match.index + match[0].length;
      const contentEnd = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
      const body = normalized.slice(contentStart, contentEnd).trim();
      blocks.push({ title, body });
    }
    return blocks;
  }

  // Fallback: split by newlines or paragraphs
  const paragraphs = normalized.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((p) => {
    const colonIdx = p.indexOf(":");
    if (colonIdx > 0 && colonIdx < 60 && /^[A-Z]/.test(p)) {
      return { title: p.slice(0, colonIdx).trim(), body: p.slice(colonIdx + 1).trim() };
    }
    return { title: null, body: p };
  });
}

function ItineraryDetailContent({ detail }: { detail: string }) {
  const blocks = useMemo(() => parseItineraryDetail(detail), [detail]);

  if (!blocks.length) return null;

  if (blocks.length === 1 && !blocks[0].title) {
    return (
      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 font-normal whitespace-pre-line bg-white rounded-xl border border-slate-200/70 p-4 shadow-xs">
        {blocks[0].body}
      </p>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {blocks.map((block, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-blue-200 hover:shadow-sm"
        >
          {block.title ? (
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xs">
                  {idx + 1}
                </span>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  {block.title}
                </h5>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 pl-7 font-normal">
                {block.body}
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 font-normal">
              {block.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TourDetailExperience({
  tour,
  images,
  initialTravelDate,
  initialAdults,
  initialChildren,
  onBook,
  onWishlist,
  wishlisted,
  modal,
}: Props) {
  const { format } = useCurrency();

  const destination = tour.country_name || tour.city_name || "Destination";
  const title = tour.title || "Tour Experience";
  const dayCount = tour.number_of_days || (tour.itineraries?.length || 1);
  const nightCount = tour.number_of_nights ?? Math.max(0, dayCount - 1);
  const countryFlag = getCountryFlag(destination);

  const startLocation = tour.start_location || tour.city_name || destination;
  const finishLocation = tour.finish_location || tour.overview?.end_location || tour.city_name || destination;
  const routeSummary =
    startLocation && finishLocation && startLocation !== finishLocation
      ? `${startLocation} – ${finishLocation}`
      : startLocation;

  // Gallery Photos (6 Photos total)
  const galleryPhotos = useMemo(() => {
    const supplied = (images || []).filter(Boolean);
    const fromTour = (tour.gallery || []).map((g) => mediaUrl(g.image_url)).filter(Boolean);
    const banner = tour.banner_image ? [mediaUrl(tour.banner_image)] : [];
    const combined = Array.from(new Set([...banner, ...fromTour, ...supplied]));
    if (combined.length >= 6) return combined.slice(0, 6);
    return [...combined, ...CURATED_GALLERY].slice(0, 6);
  }, [images, tour.gallery, tour.banner_image]);

  // Dynamic Departure Dates from Backend Calendar / Departures
  const realDates = useMemo(() => {
    const source = [
      ...(tour.calendar || []),
      ...(tour.departures || []),
    ];
    const map = new Map<string, { id: number | string; date: string; slots?: number; status?: string }>();
    source.forEach((item) => {
      if (item && item.date && item.status !== "unavailable" && item.status !== "cancelled") {
        const dateKey = item.date.split("T")[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, item);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tour.calendar, tour.departures]);

  // Group departures by Month dynamically
  const monthGroups: MonthGroup[] = useMemo(() => {
    if (realDates.length === 0) return [];

    const groupMap = new Map<string, DepartureDateItem[]>();
    const monthNameMap = new Map<string, string>();
    realDates.forEach((rd) => {
      const dObj = new Date(rd.date.includes("T") ? rd.date : `${rd.date}T00:00:00`);
      if (Number.isNaN(dObj.getTime())) return;
      const year = dObj.getFullYear();
      const monthNum = dObj.getMonth() + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, "0")}`;
      const monthName = dObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const cardDate = dObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const slots = rd.slots ?? 10;
      const seats = slots > 0 ? `${slots} Seats Left` : "Available";

      if (!groupMap.has(monthKey)) {
        groupMap.set(monthKey, []);
        monthNameMap.set(monthKey, monthName);
      }
      groupMap.get(monthKey)!.push({
        id: String(rd.id || rd.date),
        date: cardDate,
        seats,
        urgent: slots > 0 && slots <= 5,
        slotsRemaining: slots,
      });
    });

    const sortedKeys = Array.from(groupMap.keys()).sort();
    return sortedKeys.map((key) => ({
      name: monthNameMap.get(key) || key,
      key,
      dates: groupMap.get(key)!,
    }));
  }, [realDates]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const safeMonthIndex = Math.min(Math.max(0, currentMonthIndex), Math.max(0, monthGroups.length - 1));
  const currentMonth = useMemo(
    () => monthGroups[safeMonthIndex] || { name: "No departures", key: "none", dates: [] },
    [monthGroups, safeMonthIndex],
  );

  const [selectedDateId, setSelectedDateId] = useState<string>("");

  useEffect(() => {
    if (currentMonth && currentMonth.dates.length > 0) {
      if (!selectedDateId || !currentMonth.dates.some((d) => d.id === selectedDateId)) {
        setSelectedDateId(currentMonth.dates[0].id);
      }
    }
  }, [currentMonth, selectedDateId]);

  // Group Pricing Tier -- real per-pax-range prices from the backend
  // (tour.pricing, already including any active discount, see
  // routers.public._public_pricing_rows), not a fabricated discount curve.
  const pricingRows = useMemo(() => [...(tour.pricing || [])].sort((a, b) => a.persons_from - b.persons_from), [tour.pricing]);

  // Travellers State - capped to the selected departure's remaining seats
  // rather than unbounded, so the +/- steppers can't run past what's
  // actually available for that date.
  const selectedDeparture = currentMonth.dates.find((d) => d.id === selectedDateId) || currentMonth.dates[0];
  const maxTravellers = Math.max(1, selectedDeparture?.slotsRemaining ?? 10);
  const [adults, setAdults] = useState(Math.min(initialAdults || 2, maxTravellers));
  const [children, setChildren] = useState(initialChildren || 0);

  // If switching to a departure with fewer remaining seats, pull the
  // traveller count back down instead of leaving it over capacity.
  useEffect(() => {
    setAdults((a) => {
      const clampedAdults = Math.min(a, maxTravellers);
      setChildren((c) => Math.min(c, Math.max(0, maxTravellers - clampedAdults)));
      return clampedAdults;
    });
  }, [maxTravellers]);

  // The GROUP PRICING tier always follows the actual traveller count (not
  // independent manual state) -- otherwise clicking "2-5 travellers" then
  // later dropping back to 1 adult via the +/- stepper left that bigger,
  // wrong-priced tier selected and charged. Clicking a tier below instead
  // moves the traveller count into that tier's range, so the two can never
  // disagree about what's actually being booked/charged.
  const travellerCount = adults + children;
  const selectedGroupTier = useMemo(() => {
    const idx = pricingRows.findIndex((row) => travellerCount >= row.persons_from && (row.persons_to == null || travellerCount <= row.persons_to));
    return idx === -1 ? 0 : idx;
  }, [pricingRows, travellerCount]);

  // Itinerary View Mode & Accordion State
  const [itineraryMode, setItineraryMode] = useState<"detailed" | "overview">("detailed");
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true });

  const toggleDay = (day: number) => {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  // Pricing calculations - in tour.currency, converted for display via format()
  const tourCurrency = tour.currency || "USD";
  const baseRow = pricingRows[0];
  const selectedRow = pricingRows[selectedGroupTier] ?? baseRow;
  const unitPrice = Number(selectedRow?.price_per_person ?? tour.discounted_price_per_person ?? tour.price_start_per_person ?? 1182);
  const childUnitPrice = Number(selectedRow?.child_price_per_person ?? Math.round(unitPrice * 0.8));
  const tourPrice = adults * unitPrice + children * childUnitPrice;
  // Total "you save" = the group-size saving (base 1-pax tier's original
  // price vs this tier's original price) PLUS any active promo discount
  // (this tier's original price vs its actual discounted price -- see
  // routers.public._public_pricing_rows, which sets original_price_per_person
  // only when a discount is currently active). Combining both here means
  // the Discount line reflects the real total reduction, not just the
  // group-size portion (which is 0 for the base tier even when a live
  // promo is already baked into unitPrice).
  const originalUnitPrice = Number(selectedRow?.original_price_per_person ?? unitPrice);
  const originalChildUnitPrice = Number(selectedRow?.original_child_price_per_person ?? childUnitPrice);
  const baseOriginalUnitPrice = Number(baseRow?.original_price_per_person ?? baseRow?.price_per_person ?? originalUnitPrice);
  const baseOriginalChildUnitPrice = Number(baseRow?.original_child_price_per_person ?? baseRow?.child_price_per_person ?? originalChildUnitPrice);
  // "Tour Price" (below) shows this pre-discount reference total, so
  // Original - Discount = Total Amount always reconciles instead of the
  // Discount line floating disconnected from the other two figures.
  const originalTourPrice = adults * baseOriginalUnitPrice + children * baseOriginalChildUnitPrice;
  const groupDiscount = Math.max(0, Math.round(originalTourPrice - tourPrice));
  const promoActive = Boolean(tour.discount_percentage && tour.discount_percentage > 0 && (originalUnitPrice > unitPrice || originalChildUnitPrice > childUnitPrice));
  const totalAmount = Math.max(0, tourPrice);
  const perPersonPrice = Math.round(tourPrice / Math.max(1, adults));

  // Itinerary List
  const itineraryList = useMemo(() => {
    if (tour.itineraries && tour.itineraries.length > 0) {
      return tour.itineraries.map((it, idx) => ({
        day: it.day || idx + 1,
        title: it.title || `Day ${idx + 1}: ${startLocation} to ${it.location || destination}`,
        summary: it.short_description || it.description || "",
        detail: it.long_description || (!it.short_description ? it.description : "") || it.short_description || "",
        startPoint: it.location ? `${it.location} Meeting Point` : (startLocation ? `${startLocation} Meeting Point` : ""),
        transport: it.transport || "Air-conditioned coach / transfer",
        travelTime: [it.travel_duration, it.travel_distance].filter(Boolean).join(" · "),
        startTime: it.start_time || "",
        endTime: it.end_time || "",
        meals: splitList(it.meals),
        accommodation: it.accommodation || (nightCount > 0 ? "Selected Hotel Accommodations" : ""),
        activities: splitList(it.activities),
        optionalActivities: splitList(it.optional_activities),
        importantNotes: it.important_notes || "",
        photos: it.images && it.images.length > 0 ? it.images.map(mediaUrl) : galleryPhotos.slice(idx % 3, (idx % 3) + 3),
      }));
    }
    const generated = [];
    for (let d = 1; d <= dayCount; d++) {
      const isFirst = d === 1;
      const isLast = d === dayCount;
      const dayTitle = isFirst
        ? `Day 1: Welcome & Arrival in ${startLocation}`
        : isLast
          ? `Day ${d}: Concluding Highlights in ${finishLocation}`
          : `Day ${d}: Guided Sights of ${title}`;
      const daySummary = isFirst
        ? `Arrive in ${startLocation}, connect with your tour leader, and settle in for the journey ahead.`
        : isLast
          ? `Enjoy final morning sightseeing and leisure time before onward transfers.`
          : `Explore iconic landmarks, scenic viewpoints, and authentic experiences across ${destination}.`;
      generated.push({
        day: d,
        title: dayTitle,
        summary: daySummary,
        detail: `${daySummary} Seamless local arrangements and professional guidance included throughout.`,
        startPoint: `${startLocation} Meeting Point`,
        transport: "Private touring vehicle / transfer",
        travelTime: "",
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        meals: isFirst ? ["Welcome Dinner"] : isLast ? ["Breakfast"] : ["Breakfast", "Local Lunch"],
        accommodation: isLast ? "" : "Selected 4-Star Hotel Accommodation",
        activities: [`Highlights tour of ${destination}`],
        optionalActivities: [],
        importantNotes: "",
        photos: galleryPhotos.slice((d - 1) % 3, ((d - 1) % 3) + 3),
      });
    }
    return generated;
  }, [tour.itineraries, galleryPhotos, dayCount, nightCount, startLocation, finishLocation, destination, title]);

  // Highlights
  const highlightsList = useMemo(() => {
    if (tour.highlights && tour.highlights.length > 0) {
      return tour.highlights.map((h, idx) => ({
        title: h.title || h.text || `Highlight ${idx + 1}`,
        desc: h.description || `Scenic and cultural experiences in ${destination}.`,
        img: h.image ? mediaUrl(h.image) : galleryPhotos[idx % galleryPhotos.length],
      }));
    }
    return [
      {
        title: `Iconic Sights of ${title}`,
        desc: `Experience top landmark attractions and guided highlights across ${destination}.`,
        img: galleryPhotos[0] || "/images/hero-1.jpg",
      },
      {
        title: `Cultural & Local Heritage`,
        desc: `Immerse in authentic regional traditions, historic architecture, and local flavors.`,
        img: galleryPhotos[1 % galleryPhotos.length] || "/images/destination-alpine.jpg",
      },
      {
        title: `Scenic Highlights & Relaxation`,
        desc: `Enjoy comfortable journeys, picturesque vistas, and memorable stops along the route.`,
        img: galleryPhotos[2 % galleryPhotos.length] || "/images/compare-hero.jpg",
      },
      {
        title: `Expert Guided Experience`,
        desc: `Gain insider knowledge and memorable stories from our professional tour leaders.`,
        img: galleryPhotos[3 % galleryPhotos.length] || "/images/destination-desert.jpg",
      },
    ];
  }, [tour.highlights, galleryPhotos, title, destination]);

  // Similar Tours
  const similarToursList = useMemo(() => {
    if (tour.similar_tours && tour.similar_tours.length > 0) {
      return tour.similar_tours.map((st) => ({
        id: String(st.id),
        title: st.title || "Scenic Tour",
        country: st.country_name || destination,
        duration: st.number_of_days ? `${st.number_of_days} Days` : "7 Days",
        price: st.price_start_per_person != null ? format(st.price_start_per_person, st.currency || "USD") : format(unitPrice, tourCurrency),
        rating: st.rating_average || 4.8,
        reviews: `${st.rating_count || 120} reviews`,
        image: st.banner_image ? mediaUrl(st.banner_image) : "/images/compare-hero.jpg",
        slug: st.slug || "",
      }));
    }
    return [
      {
        id: "1",
        title: `${destination} Heritage & Cultural Discovery`,
        country: destination,
        duration: `${dayCount} Days`,
        price: format(unitPrice, tourCurrency),
        rating: 4.9,
        reviews: "340 reviews",
        image: galleryPhotos[0] || "/images/hero-1.jpg",
        slug: "",
      },
      {
        id: "2",
        title: `${destination} Scenic Highlights & Landscapes`,
        country: destination,
        duration: `${dayCount + 1} Days`,
        price: format(Math.round(unitPrice * 1.15), tourCurrency),
        rating: 4.8,
        reviews: "280 reviews",
        image: galleryPhotos[1 % galleryPhotos.length] || "/images/destination-alpine.jpg",
        slug: "",
      },
      {
        id: "3",
        title: `${destination} Explorer Journey`,
        country: destination,
        duration: `${Math.max(3, dayCount - 1)} Days`,
        price: format(Math.round(unitPrice * 0.9), tourCurrency),
        rating: 4.8,
        reviews: "190 reviews",
        image: galleryPhotos[2 % galleryPhotos.length] || "/images/compare-hero.jpg",
        slug: "",
      },
    ];
  }, [tour.similar_tours, destination, format, dayCount, unitPrice, tourCurrency, galleryPhotos]);

  const handleBookNow = () => {
    const chosen = currentMonth.dates.find((d) => d.id === selectedDateId) || currentMonth.dates[0];
    const chosenDate = chosen?.date || initialTravelDate || "Available on Request";
    onBook({
      travelDate: chosenDate,
      adults,
      children,
    });
  };

  return (
    <main className="min-h-screen bg-white pb-24 pt-4 text-slate-900 font-sans">
      {modal}

      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        {/* ── 1. TOP DESTINATION HERO BANNER ── */}
        <section className="relative h-[340px] sm:h-[380px] w-full overflow-hidden rounded-[20px] bg-slate-900 shadow-md">
          <img
            src={tour.banner_image ? mediaUrl(tour.banner_image) : (galleryPhotos[0] || "/images/compare-hero.jpg")}
            alt={`${destination} Tours`}
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />

          {/* Centered Glassmorphic Hero Card */}
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
            <div className="max-w-3xl rounded-2xl bg-black/60 p-6 sm:p-8 backdrop-blur-md border border-white/15 text-white shadow-2xl">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {destination} Tours
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm font-medium leading-relaxed text-white/90">
                Discover the ultimate adventure through {destination}. Explore iconic cultural landmarks, breathtaking landscapes, and unforgettable regional sights crafted with expert planning and seamless local itineraries.
              </p>

              {/* Breadcrumbs inside Hero Card */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>&gt;</span>
                <Link href="/tours" className="hover:text-white transition">Tours</Link>
                <span>&gt;</span>
                <Link href={`/tours?country=${encodeURIComponent(destination)}`} className="hover:text-white transition">{destination}</Link>
                <span>&gt;</span>
                <span className="text-amber-300 font-bold">{title}</span>
              </div>
            </div>

            {/* Trust Line Below Card */}
            <p className="mt-4 text-xs font-medium text-white/95 drop-shadow-sm">
              The world&apos;s most trusted tour operator{" "}
              <span className="text-amber-400 font-bold">★★★★★ 4.8/5</span> based on 2,400+ reviews
            </p>
          </div>
        </section>

        {/* ── 2. TOUR TITLE & BADGES ── */}
        <section className="mt-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            {title}
          </h2>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-[#E4572E] px-3 py-1 font-bold text-white shadow-2xs">
              Best Seller
            </span>
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>4.8</span>
              <span className="font-normal text-slate-500">(1,240 Reviews)</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-600">
              {destination}
            </span>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={onWishlist}
              className={`inline-flex items-center gap-1.5 font-bold transition ${
                wishlisted ? "text-red-600" : "text-slate-600 hover:text-red-600"
              }`}
            >
              <Heart size={14} className={wishlisted ? "fill-current text-red-600" : ""} />
              <span>{wishlisted ? "Saved in Wishlist" : "Save to Wishlist"}</span>
            </button>
          </div>
        </section>

        {/* ── 3. PHOTO GALLERY GRID ── */}
        <section className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {galleryPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="group relative h-36 sm:h-44 overflow-hidden rounded-xl bg-slate-100 shadow-2xs"
              >
                <img
                  src={photo}
                  alt={tour.gallery.find((item) => mediaUrl(item.image_url) === photo)?.alt_text || tour.image_alt_text || `${title} view ${idx + 1}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500 leading-relaxed">
            {destination} tour starting in {startLocation}{finishLocation && finishLocation !== startLocation ? ` and concluding in ${finishLocation}` : ""} with tour accommodation, professional guide, transport and more.
          </p>
          {(tour.map_image || tour.tour_video_url || tour.brochure_pdf) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tour.map_image && (
                <a href={mediaUrl(tour.map_image)} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                  View tour map
                </a>
              )}
              {tour.tour_video_url && (
                <a href={tour.tour_video_url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                  Watch tour video
                </a>
              )}
              {tour.brochure_pdf && (
                <a href={mediaUrl(tour.brochure_pdf)} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                  Download brochure
                </a>
              )}
            </div>
          )}
        </section>

        {/* ── 4. MAIN 2-COLUMN SECTION (CONTENT + STICKY WIDGET) ── */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_370px] gap-8 items-start">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-10 min-w-0">
            {/* A. OVERVIEW */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                  <span>{title}</span>
                  {countryFlag && <span>{countryFlag}</span>}
                </h3>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {dayCount} Days / {nightCount} Nights
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                {tour.long_description ||
                  tour.short_description ||
                  tour.subtitle ||
                  `A classic ${dayCount}-day journey exploring the rich culture, scenic landscapes, and iconic highlights of ${destination}. Stay in comfortable accommodations, travel seamlessly, and discover authentic local experiences with our knowledgeable guides.`}
              </p>

              {/* 4 Feature Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Check size={14} className="stroke-[3] text-blue-600" />
                  100% Carbon Neutral
                </span>
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Check size={14} className="stroke-[3] text-blue-600" />
                  Small Group Tours
                </span>
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Check size={14} className="stroke-[3] text-blue-600" />
                  Solo &amp; Family Friendly
                </span>
                <span className="flex items-center gap-1.5 text-slate-800">
                  <Check size={14} className="stroke-[3] text-blue-600" />
                  Expert Local Guides
                </span>
              </div>
            </div>

            {/* B. 🧭 TRAVEL ESSENTIALS */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                <Compass size={18} className="text-blue-600" />
                <span>Travel Essentials</span>
              </h3>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-xs">
                {/* Col 1 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Location</p>
                      <p className="text-slate-500 font-medium">{routeSummary}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Flag size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Start / Finish</p>
                      <p className="text-slate-500 font-medium">
                        {startLocation === finishLocation ? startLocation : `${startLocation} / ${finishLocation}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Calendar size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Duration</p>
                      <p className="text-slate-500 font-medium">{dayCount} Days / {nightCount} Nights</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Users size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Suitable Age</p>
                      <p className="text-slate-500 font-medium">{tour.suitable_age_range || tour.overview?.ideal_for || "All ages"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <User size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Group Size</p>
                      <p className="text-slate-500 font-medium">
                        {tour.min_booking_size && tour.max_group_size
                          ? `${tour.min_booking_size}–${tour.max_group_size} travellers`
                          : tour.max_group_size
                            ? `Up to ${tour.max_group_size} travellers`
                            : tour.overview?.group_size || "Flexible group size"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <User size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Tour Guide</p>
                      <p className="text-slate-500 font-medium">
                        {tour.overview?.tour_type || `Guided${tour.tour_language ? ` in ${tour.tour_language}` : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Hotel size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Accommodation</p>
                      <p className="text-slate-500 font-medium">
                        {tour.overview?.accommodation_summary ||
                          (tour.itineraries?.find((it) => it.accommodation)?.accommodation
                            ? `${tour.itineraries.find((it) => it.accommodation)?.accommodation} (${nightCount} Nights)`
                            : `Selected Accommodations (${nightCount} Nights)`)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Utensils size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Meals</p>
                      <p className="text-slate-500 font-medium">
                        {tour.overview?.meal_summary ||
                          (tour.itineraries?.filter((it) => it.meals).length
                            ? `${tour.itineraries.filter((it) => it.meals).length} Days Included Meals`
                            : "Included as per itinerary")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Bus size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Transportation</p>
                      <p className="text-slate-500 font-medium">
                        {tour.overview?.transportation_summary ||
                          (tour.itineraries?.find((it) => it.transport)?.transport || "Luxury Coach & Transfer")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Globe size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Destination / Category</p>
                      <p className="text-slate-500 font-medium">{[destination, tour.category_name].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* C. ⭐ TOUR HIGHLIGHTS */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                  <span>TOUR HIGHLIGHTS</span>
                </h3>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  {highlightsList.length} Handpicked Highlights
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {highlightsList.map((h, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-32 w-full overflow-hidden bg-slate-100">
                      <img src={h.img} alt={h.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3.5">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{h.title}</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. 🛡️ YOUR TOUR PACKAGE DETAILS (INCLUDED / NOT INCLUDED) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                <ShieldCheck size={18} className="text-blue-600" />
                <span>Your Tour Package Details</span>
              </h3>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* WHAT'S INCLUDED */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                        What&apos;s Included
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">Included in price</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {tour.inclusions && tour.inclusions.length > 0 ? (
                      tour.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                          <span>{inc.text}{inc.description ? <small className="mt-0.5 block text-[11px] text-slate-500">{inc.description}</small> : null}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                          <span><b>Accommodation:</b> Selected hotels &amp; lodging as per itinerary</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                          <span><b>Transport:</b> All scheduled sightseeing &amp; touring transportation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                          <span><b>Guide &amp; Leader:</b> Expert local tour leader services</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                          <span><b>Support:</b> 24/7 dedicated customer assistance throughout the trip</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* WHAT'S NOT INCLUDED */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">
                      ✕
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-700">
                        What&apos;s Not Included
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">Extra / Excluded</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {tour.exclusions && tour.exclusions.length > 0 ? (
                      tour.exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                          <span>{exc.text}{exc.description ? <small className="mt-0.5 block text-[11px] text-slate-500">{exc.description}</small> : null}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                          <span><b>Flights &amp; Visas:</b> International airfare and personal entry visas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                          <span><b>Travel Insurance:</b> Comprehensive medical and travel coverage</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                          <span><b>Personal Expenses:</b> Optional activities, meals, and beverages not specified</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                          <span><b>Gratuities:</b> Tips for drivers and guides</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Alert Box */}
              <div className="mt-6 rounded-xl bg-orange-50/70 p-3.5 text-[11px] font-medium text-orange-900 flex items-center gap-2 border border-orange-200/60">
                <Info size={15} className="shrink-0 text-[#E4572E]" />
                <span>
                  Detailed itinerary schedule and inclusions/exclusions may vary depending on departure season and operational availability.
                </span>
              </div>
            </div>

            {(tour.accommodations.length > 0 || tour.optional_activities.length > 0 || tour.extensions.length > 0) && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                  <Sparkles size={18} className="text-blue-600" />
                  <span>Enhance Your Tour</span>
                </h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {tour.accommodations.map((item) => (
                    <div key={`accommodation-${item.id}`} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Accommodation</p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">{item.name}</h4>
                      {item.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>}
                      {item.price != null && <p className="mt-3 text-xs font-bold text-slate-800">+ {format(item.price, tourCurrency)}</p>}
                    </div>
                  ))}
                  {tour.optional_activities.map((item) => (
                    <div key={`activity-${item.id}`} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">Optional activity</p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">{item.name}</h4>
                      {item.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>}
                      {item.price != null && <p className="mt-3 text-xs font-bold text-slate-800">+ {format(item.price, item.currency || tourCurrency)}</p>}
                    </div>
                  ))}
                  {tour.extensions.map((item) => (
                    <div key={`extension-${item.id}`} className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Tour extension</p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">{item.title}</h4>
                      {item.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>}
                      {item.price != null && <p className="mt-3 text-xs font-bold text-slate-800">+ {format(item.price, tourCurrency)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E. 📅 ITINERARY ACCORDION */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                  <Calendar size={18} className="text-blue-600" />
                  <span>Itinerary</span>
                </h3>

                {/* Detailed vs Overview Tabs */}
                <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setItineraryMode("detailed")}
                    className={`rounded-md px-3 py-1 transition ${
                      itineraryMode === "detailed" ? "bg-[#0B1F3A] text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Detailed
                  </button>
                  <button
                    type="button"
                    onClick={() => setItineraryMode("overview")}
                    className={`rounded-md px-3 py-1 transition ${
                      itineraryMode === "overview" ? "bg-[#0B1F3A] text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Overview
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {itineraryList.map((day) => {
                  const isOpen = Boolean(openDays[day.day]);

                  return (
                    <div
                      key={day.day}
                      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white transition"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDay(day.day)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50/60"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                            DAY 0{day.day}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {day.title}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp size={16} className="text-blue-600 shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-[#FAFBFD] px-5 py-5 space-y-4">
                          {day.summary && (
                            <div className="rounded-xl bg-blue-50/80 border border-blue-100/90 px-4 py-3">
                              <p className="text-xs sm:text-[13px] font-bold text-blue-950 flex items-center gap-2">
                                <Sparkles size={15} className="text-blue-600 shrink-0 fill-blue-600/20" />
                                <span>{day.summary}</span>
                              </p>
                            </div>
                          )}

                          {itineraryMode === "detailed" && day.detail && (
                            <ItineraryDetailContent detail={day.detail} />
                          )}

                          {itineraryMode === "overview" && !day.summary && day.detail && (
                            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 line-clamp-3">
                              {day.detail}
                            </p>
                          )}

                          {/* Day facts */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                            {day.startPoint && (
                              <div className="flex items-start gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <MapPin size={13} />
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Point</p>
                                  <p className="text-slate-700 font-medium">{day.startPoint}</p>
                                </div>
                              </div>
                            )}
                            {(day.startTime || day.endTime) && (
                              <div className="flex items-start gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <Calendar size={13} />
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timing</p>
                                  <p className="text-slate-700 font-medium">{[day.startTime, day.endTime].filter(Boolean).join(" – ") || "—"}</p>
                                </div>
                              </div>
                            )}
                            {(day.transport || day.travelTime) && (
                              <div className="flex items-start gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <Bus size={13} />
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transport</p>
                                  <p className="text-slate-700 font-medium">{[day.transport, day.travelTime].filter(Boolean).join(" · ")}</p>
                                </div>
                              </div>
                            )}
                            {day.accommodation && (
                              <div className="flex items-start gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <Hotel size={13} />
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accommodation</p>
                                  <p className="text-slate-700 font-medium">{day.accommodation}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {day.meals.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Utensils size={13} />
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {day.meals.map((meal, mIdx) => (
                                  <span key={mIdx} className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                    {meal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {day.activities.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Included Activities</p>
                              <ul className="space-y-1.5 text-xs">
                                {day.activities.map((activity, aIdx) => (
                                  <li key={aIdx} className="flex items-start gap-2">
                                    <Check size={13} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                                    <span className="text-slate-700 font-medium">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {day.optionalActivities.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Optional Activities</p>
                              <ul className="space-y-1.5 text-xs">
                                {day.optionalActivities.map((activity, oIdx) => (
                                  <li key={oIdx} className="flex items-start gap-2">
                                    <Plus size={13} className="mt-0.5 shrink-0 text-blue-600 stroke-[3]" />
                                    <span className="text-slate-700 font-medium">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {day.importantNotes && (
                            <p className="text-[11px] text-amber-700 font-medium bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
                              <b>Note:</b> {day.importantNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {tour.cancellation_policy.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span>Cancellation &amp; Refund Policy</span>
                </h3>
                <div className="mt-4 divide-y divide-slate-100">
                  {tour.cancellation_policy.map((rule, index) => (
                    <div key={`${rule.days_before_min}-${rule.days_before_max ?? "plus"}-${index}`} className="grid gap-1 py-3 text-xs sm:grid-cols-[180px_1fr]">
                      <p className="font-bold text-slate-900">
                        {rule.days_before_max == null
                          ? `${rule.days_before_min}+ days before`
                          : `${rule.days_before_min}–${rule.days_before_max} days before`}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-bold text-emerald-700">{rule.refund_percentage}% refund</span>
                        {rule.description ? ` · ${rule.description}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: STICKY BOOKING WIDGET ── */}
          <aside id="booking-widget" className="sticky top-20 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-950">
              Book Your {destination} Adventure
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Secure your preferred departure in just a few steps.
            </p>

            {/* Month-based Departure Navigation */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={safeMonthIndex <= 0}
                onClick={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {currentMonth.name}
              </span>
              <button
                type="button"
                disabled={safeMonthIndex >= monthGroups.length - 1}
                onClick={() => setCurrentMonthIndex((prev) => Math.min(monthGroups.length - 1, prev + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Departure Date Cards (3 columns x 2 rows) */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {currentMonth.dates.slice(0, 6).map((dep) => {
                const isSelected = selectedDateId === dep.id;
                return (
                  <button
                    key={dep.id}
                    type="button"
                    onClick={() => setSelectedDateId(dep.id)}
                    className={`rounded-xl border p-2 text-center transition ${
                      isSelected
                        ? "border-blue-400 bg-[#EEF5FF] ring-1 ring-blue-400"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-slate-900">
                      {dep.date}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] ${
                        dep.urgent ? "font-semibold text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {dep.seats}
                    </span>
                  </button>
                );
              })}
            </div>
            {currentMonth.dates.length === 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                No bookable departure dates are currently available for this tour.
              </div>
            )}

            {/* GROUP PRICING Section */}
            {pricingRows.length > 0 && (
            <div className="mt-5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                GROUP PRICING
              </h4>
              <div className="mt-2.5 space-y-2">
                {pricingRows.map((row, index) => {
                  const savePct = baseRow && baseRow.price_per_person > 0
                    ? Math.round((1 - row.price_per_person / baseRow.price_per_person) * 100)
                    : 0;
                  return (
                    <button
                      key={`${row.persons_from}-${row.persons_to ?? "plus"}`}
                      type="button"
                      onClick={() => {
                        // Move the traveller count into this tier's range
                        // (clamped to actual seat availability) so the
                        // highlighted tier and the WHO'S TRAVELLING? steppers
                        // never disagree about what's being charged.
                        const target = Math.min(row.persons_from, maxTravellers);
                        setAdults(target);
                        setChildren(0);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 transition ${
                        selectedGroupTier === index
                          ? "border-blue-400 bg-[#EEF5FF]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        {groupTierLabel(row.persons_from, row.persons_to)}
                        {savePct > 0 && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                            Save {savePct}%
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-blue-600">
                          {format(row.price_per_person, row.currency || tourCurrency)}
                        </span>
                        <span className="block text-[9px] text-slate-400">Per person</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Help link */}
              {safeMonthIndex < monthGroups.length - 1 && (
                <div className="mt-2.5">
                  <p className="text-[10px] text-slate-400">
                    Can&apos;t find a date that works for you?
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentMonthIndex(safeMonthIndex + 1)}
                    className="text-[10px] font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    Find similar {destination} tours available in {monthGroups[safeMonthIndex + 1]?.name}
                  </button>
                </div>
              )}
            </div>
            )}

            <div className="my-4 border-b border-slate-100" />

            {/* WHO'S TRAVELLING? Section */}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                  WHO&apos;S TRAVELLING?
                </h4>
                <span className="text-[10px] font-semibold text-slate-400">Max {maxTravellers} for this date</span>
              </div>

              <div className="mt-3 space-y-3 text-xs">
                {/* Adults - capped by the selected departure's remaining seats */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Adults</p>
                    <p className="text-[10px] text-slate-400">Ages 18 years and above</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-5 text-center font-bold text-slate-900">{adults}</span>
                    <button
                      type="button"
                      disabled={adults + children >= maxTravellers}
                      onClick={() => setAdults((a) => Math.min(maxTravellers - children, a + 1))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>

                {/* Children - shares the same per-departure cap as Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Children</p>
                    <p className="text-[10px] text-slate-400">Ages 3 – 17 years</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-5 text-center font-bold text-slate-900">{children}</span>
                    <button
                      type="button"
                      disabled={adults + children >= maxTravellers}
                      onClick={() => setChildren((c) => Math.min(maxTravellers - adults, c + 1))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-4 border-b border-slate-100" />

            {/* BOOKING SUMMARY Section */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                BOOKING SUMMARY
              </h4>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Tour Price ({adults} Adult{adults > 1 ? "s" : ""})</span>
                  <span className="font-bold text-slate-900">{format(originalTourPrice, tourCurrency)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>
                    Discount
                    {promoActive && (
                      <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                        {tour.discount_percentage}% coupon auto-applied
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-slate-900">- {format(groupDiscount, tourCurrency)}</span>
                </div>
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>You Save</span>
                  <span>{format(groupDiscount, tourCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Taxes &amp; Service Fees</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Booking Fee</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>

                <div className="my-2 border-b border-dotted border-slate-200" />

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Total Amount</p>
                    <p className="text-[10px] text-slate-400">{format(perPersonPrice, tourCurrency)} per person</p>
                  </div>
                  <strong className="text-lg font-black text-slate-950">
                    {format(totalAmount, tourCurrency)}
                  </strong>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleBookNow}
              disabled={!selectedDeparture}
              className="mt-4 w-full rounded-xl bg-[#0B1F3A] py-3.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#132d50] active:scale-[0.99] text-center disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {selectedDeparture ? "Proceed to Payment" : "No Dates Available"}
            </button>
          </aside>
        </div>

        {/* ── 5. SIMILAR TOURS SECTION - only shown when there are real recommendations ── */}
        {similarToursList.length > 0 && (
        <section className="mt-16 border-t border-slate-100 pt-10">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
            <Compass size={20} className="text-blue-600" />
            <span>Similar Tours</span>
          </h3>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarToursList.map((sim, sIdx) => (
              <div
                key={`${sim.id}-${sIdx}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={sim.image}
                      alt={sim.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                      {sim.duration}
                    </span>
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-xs hover:scale-110 transition"
                    >
                      <Heart size={14} className="fill-current" />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                      {sim.country}
                    </p>
                    <Link
                      href={sim.slug ? `/tours/${sim.slug}` : `/tours/${sim.id}`}
                      className="mt-1 block text-xs font-bold text-slate-900 line-clamp-1 hover:text-blue-600 transition"
                    >
                      {sim.title}
                    </Link>

                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800">{sim.rating}</span>
                      <span className="text-[10px] text-slate-400">({sim.reviews})</span>
                    </div>

                    <ul className="mt-2.5 space-y-1 text-[11px] text-slate-500">
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-600" />
                        <span>Transport &amp; Transfers</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-600" />
                        <span>Guided Sightseeing</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-600" />
                        <span>Included Experiences</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">From</span>
                      <p className="text-xs font-black text-slate-950">{sim.price}</p>
                    </div>
                    <Link
                      href={sim.slug ? `/tours/${sim.slug}` : `/tours/${sim.id}`}
                      className="rounded-lg bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#132d50]"
                    >
                      View Tour
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
      </div>
    </main>
  );
}
