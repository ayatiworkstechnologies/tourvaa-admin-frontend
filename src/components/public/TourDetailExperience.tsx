"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { LuCalendar as Calendar, LuCheck as Check, LuChevronDown as ChevronDown, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuChevronUp as ChevronUp, LuCompass as Compass, LuHeart as Heart, LuHotel as Hotel, LuInfo as Info, LuMapPin as MapPin, LuMinus as Minus, LuPlus as Plus, LuShieldCheck as ShieldCheck, LuStar as Star, LuUser as User, LuUsers as Users, LuUtensils as Utensils, LuX as X, LuBus as Bus, LuGlobe as Globe, LuFlag as Flag } from "react-icons/lu";
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

// Curated 6 High-Res Photos for New Zealand / Fallback
const CURATED_GALLERY = [
  "/images/compare-hero.jpg",
  "/images/compare-iceland.jpg",
  "/images/destination-alpine.jpg",
  "/images/compare-nz.jpg",
  "/images/about-mountain.png",
  "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
];

// Curated 6 Tour Highlights matching the reference screenshot
const REFERENCE_HIGHLIGHTS = [
  {
    title: "Tongariro Alpine Crossing",
    desc: "Trek through active volcanic peaks, emerald alpine crater lakes, and dramatic lunar landscapes.",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Waitomo Glowworm Caves",
    desc: "Glide by boat beneath thousands of magical bioluminescent glowworms illuminating subterranean caves.",
    img: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Milford Sound Cruise",
    desc: "Cruise through towering vertical rock cliffs, plunging waterfalls, and playful fur seals.",
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Rotorua Geothermal Valley",
    desc: "Witness steaming geysers, bubbling mud pools, and authentic Māori indigenous ceremonies.",
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Queenstown Gondola & Luge",
    desc: "Soar above Lake Wakatipu for 360° alpine panoramas followed by thrilling downhill luge tracks.",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Mount Cook Glacier Explorers",
    desc: "Marvel at icebergs floating on the terminal lake of New Zealand's longest Tasman Glacier.",
    img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=500&q=80",
  },
];

// Splits a free-form, comma/newline-separated backend Text field (meals,
// activities, optional_activities) into short trimmed items for bullet/chip
// rendering, instead of printing it as one run-on line.
function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Rich Day-by-Day Itinerary matching the reference screenshot
const REFERENCE_ITINERARY = [
  {
    day: 1,
    title: "WELCOME TO AUCKLAND",
    summary: "Arrive in Auckland and settle in for the journey ahead.",
    detail: "Arrive at Auckland Airport. Meet and greet with your tour director, followed by a panoramic orientation drive and hotel check-in. Evening welcome dinner.",
    startPoint: "Auckland Airport / Hotel (Complimentary airport transfer)",
    transport: "Private coach",
    travelTime: "",
    startTime: "",
    endTime: "",
    meals: ["Welcome Dinner with local wine pairings"],
    accommodation: "Grand Millennium Auckland (or similar 4-star)",
    activities: [],
    optionalActivities: ["Sky Tower SkyWalk", "Waitematā Harbour Sunset Cruise"],
    importantNotes: "",
    photos: [
      "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=400&q=80",
      "/images/compare-nz.jpg",
      "/images/compare-hero.jpg",
    ],
  },
  {
    day: 2,
    title: "Auckland to Rotorua via Waitomo",
    summary: "Cross the Waikato region and discover glowworm caves en route to Rotorua.",
    detail: "Journey south through the lush rolling hills of the Waikato region. Stop at Waitomo Caves for a boat ride under glowing insects, then arrive in geothermal Rotorua.",
    startPoint: "Grand Millennium Auckland Hotel Lobby",
    transport: "Private coach",
    travelTime: "3h 30m · 234 km",
    startTime: "08:00 AM",
    endTime: "",
    meals: ["Breakfast", "Traditional Māori Hāngī Dinner"],
    accommodation: "Millennium Hotel Rotorua (or similar)",
    activities: ["Waitomo Glowworm Caves boat ride"],
    optionalActivities: ["Polynesian Spa Lake Pools", "Redwoods Treewalk"],
    importantNotes: "",
    photos: ["https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=400&q=80"],
  },
  {
    day: 3,
    title: "Rotorua – Geothermal & Māori Culture",
    summary: "Explore geothermal wonders and immerse in Māori culture.",
    detail: "Spend the morning exploring Te Puia geothermal valley, home to Pōhutu Geyser and Māori arts. Afternoon at leisure before an evening cultural performance.",
    startPoint: "Rotorua Hotel Lobby",
    transport: "",
    travelTime: "",
    startTime: "",
    endTime: "",
    meals: ["Cooked Breakfast", "Local Lunch"],
    accommodation: "Millennium Hotel Rotorua",
    activities: ["Te Puia geothermal valley tour", "Evening Māori cultural performance"],
    optionalActivities: ["Kaituna River Rafting", "Agrodome Farm Show"],
    importantNotes: "",
    photos: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80"],
  },
  {
    day: 4,
    title: "Taupo & Tongariro National Park",
    summary: "Journey through volcanic landscapes to a UNESCO World Heritage site.",
    detail: "Travel past serene Lake Taupo and Huka Falls towards the dramatic volcanic scenery of Tongariro National Park, a dual UNESCO World Heritage site.",
    startPoint: "Rotorua Hotel Lobby",
    transport: "Private coach",
    travelTime: "2h 45m",
    startTime: "",
    endTime: "",
    meals: ["Breakfast", "Picnic Lunch"],
    accommodation: "Chateau Tongariro Hotel (or similar)",
    activities: ["Huka Falls viewpoint stop"],
    optionalActivities: ["Tongariro Guided Alpine Day Walk", "Scenic Helicopter Flight"],
    importantNotes: "The Alpine Crossing is weather-dependent and may be rescheduled by the tour director.",
    photos: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"],
  },
  {
    day: 5,
    title: "Napier to Wellington",
    summary: "Pass through the Art Deco capital on the way to Wellington.",
    detail: "Cross the scenic mountain ranges towards Hawke's Bay's Art Deco capital of Napier, then continue south to the vibrant capital city of Wellington.",
    startPoint: "Tongariro Lodge",
    transport: "Private coach",
    travelTime: "4h 15m",
    startTime: "",
    endTime: "",
    meals: ["Breakfast", "Vineyard Wine Tasting Lunch"],
    accommodation: "James Cook Hotel Grand Chancellor Wellington",
    activities: ["Napier Art Deco walking stop"],
    optionalActivities: ["Te Papa National Museum Tour", "Cable Car Lookout"],
    importantNotes: "",
    photos: ["/images/compare-hero.jpg"],
  },
  {
    day: 6,
    title: "Wellington – Departure",
    summary: "A relaxed final morning before your onward journey.",
    detail: "Enjoy your final morning at leisure in vibrant Wellington. Take in the waterfront promenades before your scheduled airport transfer for onward journeys.",
    startPoint: "Wellington Hotel",
    transport: "Airport transfer",
    travelTime: "",
    startTime: "",
    endTime: "",
    meals: ["Breakfast"],
    accommodation: "",
    activities: [],
    optionalActivities: ["Wētā Workshop Film Tour", "Oriental Bay Walk"],
    importantNotes: "Late checkout available on request, subject to hotel availability.",
    photos: ["/images/compare-nz.jpg"],
  },
];

// Fallback 4 Similar Tours matching the reference screenshot
const REFERENCE_SIMILAR_TOURS = [
  {
    id: "1",
    title: "North Island Explorer",
    country: "New Zealand",
    duration: "9 Days",
    price: "USD $1,985",
    rating: 4.8,
    reviews: "1,240 reviews",
    image: "/images/compare-hero.jpg",
    slug: "north-island-explorer",
  },
  {
    id: "2",
    title: "Golden Triangle Escape",
    country: "India",
    duration: "7 Days",
    price: "USD $850",
    rating: 4.9,
    reviews: "890 reviews",
    image: "/images/hero-1.jpg",
    slug: "golden-triangle-escape",
  },
  {
    id: "3",
    title: "Swiss Alps Wonder",
    country: "Switzerland",
    duration: "8 Days",
    price: "USD $2,350",
    rating: 4.9,
    reviews: "640 reviews",
    image: "/images/destination-alpine.jpg",
    slug: "swiss-alps-wonder",
  },
  {
    id: "4",
    title: "Best of Iceland",
    country: "Iceland",
    duration: "7 Days",
    price: "USD $1,750",
    rating: 4.7,
    reviews: "520 reviews",
    image: "/images/compare-iceland.jpg",
    slug: "best-of-iceland",
  },
];

// Group-size discount tiers, expressed as a rate off the tour's own
// per-person price rather than a flat dollar amount - a flat number (e.g.
// "$200 off") only makes sense in one specific currency/price range and
// falls apart for a tour priced in a different currency or magnitude.
const GROUP_TIERS: { key: "1-4" | "5-10" | "10-16"; label: string; discountRate: number }[] = [
  { key: "1-4", label: "1–4 travellers", discountRate: 0 },
  { key: "5-10", label: "5–10 travellers", discountRate: 0.07 },
  { key: "10-16", label: "10–16 travellers", discountRate: 0.09 },
];

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

  const destination = tour.country_name || "New Zealand";
  const title = tour.title || "New Zealand Explorer";
  const dayCount = tour.number_of_days || 10;
  const nightCount = Math.max(0, dayCount - 1);

  // Gallery Photos (6 Photos total)
  const galleryPhotos = useMemo(() => {
    const supplied = (images || []).filter(Boolean);
    const fromTour = (tour.gallery || []).map((g) => mediaUrl(g.image_url)).filter(Boolean);
    const combined = Array.from(new Set([...supplied, ...fromTour]));
    if (combined.length >= 6) return combined.slice(0, 6);
    return [...combined, ...CURATED_GALLERY].slice(0, 6);
  }, [images, tour.gallery]);

  // Calendar Departure Dates (September 2026 default as in screenshot)
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1);
  const calendarMonths = [
    { name: "August 2026", year: 2026, month: 8 },
    { name: "September 2026", year: 2026, month: 9 },
    { name: "October 2026", year: 2026, month: 10 },
  ];

  const defaultDepartureDates = useMemo(() => {
    return [
      { id: "dep-1", date: "12 Sep 2026", seats: "8 Seats Left", urgent: false },
      { id: "dep-2", date: "25 Sep 2026", seats: "11 Seats Left", urgent: false },
      { id: "dep-3", date: "17 Sep 2026,", seats: "5 Seats Left", urgent: true },
      { id: "dep-4", date: "19 Sep 2026", seats: "8 Seats Left", urgent: true },
      { id: "dep-5", date: "20 Sep 2026", seats: "10 Seats Left", urgent: false },
      { id: "dep-6", date: "21 Sep 2026", seats: "2 Seats Left", urgent: true },
    ];
  }, []);

  const [selectedDateId, setSelectedDateId] = useState("dep-1");

  // Group Pricing Tier
  const [selectedGroupTier, setSelectedGroupTier] = useState<"1-4" | "5-10" | "10-16">("1-4");

  // Travellers State
  const [adults, setAdults] = useState(initialAdults || 2);
  const [children, setChildren] = useState(initialChildren || 0);

  // Itinerary View Mode & Accordion State
  const [itineraryMode, setItineraryMode] = useState<"detailed" | "overview">("detailed");
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true });

  const toggleDay = (day: number) => {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  // Pricing calculations - all in tour.currency, converted for display via format()
  const tourCurrency = tour.currency || "USD";
  const unitPrice = Number(tour.price_start_per_person || 1182);
  const selectedTier = GROUP_TIERS.find((t) => t.key === selectedGroupTier) ?? GROUP_TIERS[0];
  const tourPrice = adults * unitPrice + children * Math.round(unitPrice * 0.8);
  const groupDiscount = Math.round(tourPrice * selectedTier.discountRate);
  const totalAmount = Math.max(0, tourPrice - groupDiscount);
  const perPersonPrice = Math.round(tourPrice / Math.max(1, adults));

  // Itinerary List - each day's free-form text fields (meals/activities/
  // optional_activities are plain Text columns on the backend, not arrays)
  // are split into short bullet/chip items instead of printed as one
  // run-on line - see splitList() below.
  const itineraryList = useMemo(() => {
    if (tour.itineraries && tour.itineraries.length > 0) {
      return tour.itineraries.map((it, idx) => ({
        day: it.day || idx + 1,
        title: it.title || `Day ${idx + 1} Scenic Adventure`,
        summary: it.short_description || "",
        detail: it.long_description || (!it.short_description ? it.description : "") || "",
        startPoint: it.location ? `${it.location} Meeting Point` : "",
        transport: it.transport || "",
        travelTime: [it.travel_duration, it.travel_distance].filter(Boolean).join(" · "),
        startTime: it.start_time || "",
        endTime: it.end_time || "",
        meals: splitList(it.meals),
        accommodation: it.accommodation || "",
        activities: splitList(it.activities),
        optionalActivities: splitList(it.optional_activities),
        importantNotes: it.important_notes || "",
        photos: it.images && it.images.length > 0 ? it.images.map(mediaUrl) : galleryPhotos.slice(idx % 3, (idx % 3) + 3),
      }));
    }
    return REFERENCE_ITINERARY;
  }, [tour.itineraries, galleryPhotos]);

  // Highlights
  const highlightsList = useMemo(() => {
    if (tour.highlights && tour.highlights.length >= 4) {
      return tour.highlights.map((h, idx) => ({
        title: h.title || h.text || `Highlight ${idx + 1}`,
        desc: h.description || "Discover scenic landscapes and iconic landmark experiences with expert local guidance.",
        img: h.image ? mediaUrl(h.image) : galleryPhotos[idx % galleryPhotos.length],
      }));
    }
    return REFERENCE_HIGHLIGHTS;
  }, [tour.highlights, galleryPhotos]);

  // Similar Tours
  const similarToursList = useMemo(() => {
    if (tour.similar_tours && tour.similar_tours.length > 0) {
      return tour.similar_tours.map((st) => ({
        id: String(st.id),
        title: st.title || "Scenic Tour",
        country: st.country_name || destination,
        duration: st.number_of_days ? `${st.number_of_days} Days` : "7 Days",
        price: st.price_start_per_person != null ? format(st.price_start_per_person, st.currency || "USD") : format(1985, "USD"),
        rating: st.rating_average || 4.8,
        reviews: `${st.rating_count || 120} reviews`,
        image: st.banner_image ? mediaUrl(st.banner_image) : "/images/compare-hero.jpg",
        slug: st.slug || "",
      }));
    }
    return REFERENCE_SIMILAR_TOURS;
  }, [tour.similar_tours, destination, format]);

  const handleBookNow = () => {
    const chosenDate = defaultDepartureDates.find((d) => d.id === selectedDateId)?.date || initialTravelDate || "12 Aug 2026 - 20 Aug 2026";
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
          {/* Scenic Coastal Banner Background */}
          <img
            src="/images/compare-hero.jpg"
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
                Join On The Go for the ultimate adventure through New Zealand, exploring volcanic landscapes,
                lush rainforests, pristine beaches, and breathtaking fjords. Journey from the geothermal wonders of the
                North Island to the dramatic alpine peaks and glaciers of the South Island, uncovering rich Māori heritage,
                vibrant wildlife, and unforgettable scenery along the way.
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
              Operated by: <b className="text-slate-800">Tourvaa Adventures</b>
            </span>
          </div>

          {/* Quick Action Links */}
          <div className="mt-4 flex flex-wrap items-center gap-5 border-b border-slate-100 pb-4 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={onWishlist}
              className="flex items-center gap-1.5 hover:text-red-600 transition"
            >
              <Heart size={14} className={wishlisted ? "fill-red-500 text-red-500" : "text-slate-400"} />
              <span>{wishlisted ? "Wishlisted" : "Wishlist"}</span>
            </button>
            <button type="button" className="flex items-center gap-1 hover:text-blue-600 transition">
              <span>Free Cancellation</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
            <button type="button" className="flex items-center gap-1 hover:text-blue-600 transition">
              <span>Need Guidance?</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
          </div>
        </section>

        {/* ── 3. 6-IMAGE PHOTO GALLERY GRID ── */}
        <section className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {galleryPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="group relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-slate-100 shadow-2xs border border-slate-200/70"
              >
                <img
                  src={photo}
                  alt={`${title} view ${idx + 1}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500 leading-relaxed">
            North Island and South Island tour that starts in Auckland and ends in Christchurch with tour accommodation, professional guide, transport and more.
          </p>
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
                  <span>🇳🇿</span>
                </h3>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {dayCount} Days / {nightCount} Nights
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                A classic {dayCount}-day journey across New Zealand&apos;s dramatic landscapes. From the volcanic wonders and Maori culture of Rotorua to the majestic fjords of Milford Sound and alpine peaks of Queenstown. Stay in premium accommodations, travel in modern coaches, and explore with our knowledgeable local guides.
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
                      <p className="text-slate-500 font-medium">Auckland – Wellington</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Flag size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Start / Finish</p>
                      <p className="text-slate-500 font-medium">Auckland</p>
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
                      <p className="font-bold text-slate-900">Minimum Age</p>
                      <p className="text-slate-500 font-medium">12 Years</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <User size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Maximum Age</p>
                      <p className="text-slate-500 font-medium">80 Years</p>
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
                      <p className="text-slate-500 font-medium">Fully Guided English Tour Leader</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Hotel size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Accommodation</p>
                      <p className="text-slate-500 font-medium">4-Star Hotels ({nightCount} Nights)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Utensils size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Meals</p>
                      <p className="text-slate-500 font-medium">9 Breakfasts, 3 Dinners</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Bus size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Transportation</p>
                      <p className="text-slate-500 font-medium">Luxury Coach &amp; Transfer</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Globe size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Destination</p>
                      <p className="text-slate-500 font-medium">{destination}</p>
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
                  6 Handpicked Highlights
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
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
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
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Accommodation:</b> 4-star hotels &amp; premium lodges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Meals:</b> Daily cooked breakfast &amp; 3 regional dinners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Transport:</b> Air-conditioned luxury touring coach &amp; ferry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Guide &amp; Tour Leader:</b> Expert English-speaking tour leader</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Entrance Fees:</b> National parks, caves, and thermal reserve passes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Airport Transfers:</b> Arrival &amp; departure meet &amp; greet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>Free Wi-Fi:</b> High-speed Wi-Fi available on all coach journeys</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span><b>24/7 Support:</b> Dedicated tour concierge assistance</span>
                    </li>
                  </ul>
                </div>

                {/* WHAT'S NOT INCLUDED */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs">
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
                    <li className="flex items-start gap-2">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                      <span><b>International Flights:</b> Arrival and departure airfare</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                      <span><b>Travel Insurance:</b> Comprehensive medical and trip cancellation insurance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                      <span><b>Optional Excursions:</b> Activities and helicopter flights not specified</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                      <span><b>Meals Not Specified:</b> Lunches and alcoholic beverages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={14} className="mt-0.5 shrink-0 text-rose-500 stroke-[3]" />
                      <span><b>Gratuities:</b> Tips for drivers and tour guides</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Alert Box */}
              <div className="mt-6 rounded-xl bg-orange-50/70 p-3.5 text-[11px] font-medium text-orange-900 flex items-center gap-2 border border-orange-200/60">
                <Info size={15} className="shrink-0 text-[#E4572E]" />
                <span>
                  Detailed itinerary schedule and inclusions/exclusions may vary depending on departure season and weather conditions.
                </span>
              </div>
            </div>

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
                        <div className="border-t border-slate-100 bg-[#FAFBFD] px-5 py-4 space-y-4">
                          {/* Summary line + supporting detail, instead of one run-on paragraph */}
                          {(day.summary || day.detail) && (
                            <div className="space-y-1">
                              {day.summary && (
                                <p className="text-xs font-bold text-slate-900">{day.summary}</p>
                              )}
                              {day.detail && (
                                <p className="text-xs leading-relaxed text-slate-600 font-medium">{day.detail}</p>
                              )}
                            </div>
                          )}

                          {/* Day facts as icon rows, matching the Travel Essentials pattern */}
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
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                              <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
                              <p className="text-xs font-medium text-amber-800">{day.importantNotes}</p>
                            </div>
                          )}

                          {/* 3 Photos inside Day 1/Active day */}
                          {day.photos && day.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2.5 pt-2">
                              {day.photos.slice(0, 3).map((img, pIdx) => (
                                <div key={pIdx} className="h-20 sm:h-24 w-full overflow-hidden rounded-lg bg-slate-100 border border-slate-200/60">
                                  <img src={img} alt="" className="h-full w-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
                disabled={currentMonthIndex <= 0}
                onClick={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {calendarMonths[currentMonthIndex].name}
              </span>
              <button
                type="button"
                disabled={currentMonthIndex >= calendarMonths.length - 1}
                onClick={() => setCurrentMonthIndex((prev) => Math.min(calendarMonths.length - 1, prev + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 6 Departure Date Cards (3 columns x 2 rows) */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {defaultDepartureDates.map((dep) => {
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

            {/* GROUP PRICING Section */}
            <div className="mt-5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                GROUP PRICING
              </h4>
              <div className="mt-2.5 space-y-2">
                {GROUP_TIERS.map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setSelectedGroupTier(tier.key)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 transition ${
                      selectedGroupTier === tier.key
                        ? "border-blue-400 bg-[#EEF5FF]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900">{tier.label}</span>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-blue-600">
                        {format(Math.round(unitPrice * (1 - tier.discountRate)), tourCurrency)}
                      </span>
                      <span className="block text-[9px] text-slate-400">Per person</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Help link */}
              <div className="mt-2.5">
                <p className="text-[10px] text-slate-400">
                  Can&apos;t find a date that works for you?
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentMonthIndex(2)}
                  className="text-[10px] font-medium text-blue-600 underline hover:text-blue-700"
                >
                  Find similar {destination} tours available in Oct 2026
                </button>
              </div>
            </div>

            <div className="my-4 border-b border-slate-100" />

            {/* WHO'S TRAVELLING? Section */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                WHO&apos;S TRAVELLING?
              </h4>

              <div className="mt-3 space-y-3 text-xs">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Adults</p>
                    <p className="text-[10px] text-slate-400">Ages 18 years and above</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900 text-xs">
                      {String(adults).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdults((a) => a + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Children</p>
                    <p className="text-[10px] text-slate-400">Ages 5 – 17</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900 text-xs">
                      {String(children).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChildren((c) => c + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
                  <span className="font-bold text-slate-900">{format(tourPrice, tourCurrency)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Discount</span>
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
              className="mt-4 w-full rounded-xl bg-[#0B1F3A] py-3.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#132d50] active:scale-[0.99] text-center"
            >
              Proceed to Payment
            </button>
          </aside>
        </div>

        {/* ── 5. SIMILAR TOURS SECTION ── */}
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
                        <span>Transport &amp; Coach</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-600" />
                        <span>Guided Sightseeing</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-emerald-600" />
                        <span>Daily Breakfast Included</span>
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
      </div>
    </main>
  );
}
