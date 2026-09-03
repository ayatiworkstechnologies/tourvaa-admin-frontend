"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuActivity as Activity,
  LuArrowRight as ArrowRight,
  LuBedDouble as Bed,
  LuCalendar as Calendar,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuClock as Clock,
  LuCompass as Compass,
  LuFileText as FileText,
  LuHeart as Heart,
  LuHotel as Hotel,
  LuHouse as Home,
  LuInfo as Info,
  LuMap as MapIcon,
  LuMapPin as MapPin,
  LuMinus as Minus,
  LuPlus as Plus,
  LuShieldCheck as ShieldCheck,
  LuStar as Star,
  LuUser as User,
  LuUsers as Users,
  LuUtensils as Utensils,
  LuWifi as Wifi,
  LuX as X,
  LuZap as Zap,
} from "react-icons/lu";
import { PublicTour, PublicTourDetail } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import { DiscountSavingsLine, DiscountPriceLine, hasActiveDiscount } from "@/components/public/DiscountPrice";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";

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

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
];

const FALLBACK_HIGHLIGHTS = [
  {
    title: "Milford Sound Scenic Cruise",
    desc: "Glide through towering fjords, cascading waterfalls, and misty peaks in Fiordland National Park.",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Waitomo Glowworm Caves",
    desc: "Marvel at thousands of luminous glowworms illuminating subterranean limestone caverns by boat.",
    img: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Rotorua Geothermal Valley",
    desc: "Witness bubbling mud pools, natural geysers, and authentic Māori cultural traditions.",
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Queenstown Gondola & Luge",
    desc: "Ride high above Lake Wakatipu for panoramic views and thrilling scenic alpine luge rides.",
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Lake Tekapo & Mt Cook",
    desc: "Gaze upon turquoise alpine glacial waters and New Zealand's highest majestic snow-capped peak.",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Auckland Harbour Sailing",
    desc: "Sail across the sparkling Waitematā Harbour with sweeping vistas of the City of Sails skyline.",
    img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
  },
];

const FALLBACK_ITINERARY = [
  {
    day: 1,
    title: "Welcome & City Orientation",
    desc: "Arrive at the destination, meet your tour director, and enjoy a guided orientation tour of the city. In the evening, join your fellow travellers for a welcome dinner.",
    bullets: [
      "Airport meet & greet with private transfer to hotel",
      "Panoramic orientation tour of key landmark highlights",
      "Welcome dinner with regional cuisine",
    ],
    photos: [
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
    ],
  },
  {
    day: 2,
    title: "Scenic Countryside & Cultural Heritage",
    desc: "Travel through scenic countryside and agricultural valleys. Experience historic monuments, subterranean cave wonders, or local heritage villages.",
    bullets: [
      "Guided excursion through landmark historic attractions",
      "Scenic countryside drive with panoramic photo stops",
      "Traditional evening feast and cultural performance",
    ],
  },
  {
    day: 3,
    title: "Nature Trails & Geothermal Wonders",
    desc: "Explore spectacular nature reserves, alpine lakes, or bubbling geothermal parks with an experienced local nature guide.",
    bullets: [
      "Guided walk through iconic natural wonders",
      "Visit to local craft workshops and wildlife sanctuaries",
      "Evening at leisure to unwind in mineral spas or boutique cafes",
    ],
  },
  {
    day: 4,
    title: "Alpine Peaks & Lake Cruise",
    desc: "Journey towards alpine mountain ranges with breathtaking vista stops, followed by an afternoon scenic lake cruise.",
    bullets: [
      "Scenic transfer across mountain passes and plains",
      "2-hour scenic nature cruise on pristine waters",
      "Evening arrival at alpine resort accommodation",
    ],
  },
  {
    day: 5,
    title: "National Park Wilderness Exploration",
    desc: "A full day dedicated to exploring World Heritage national parks, fjordlands, or majestic canyons with included picnic lunch.",
    bullets: [
      "Full-day excursion to UNESCO World Heritage natural park",
      "Boutique nature cruise or safari with scenic lunch",
      "Return journey with memorable photo viewpoints",
    ],
  },
  {
    day: 6,
    title: "Farewell Adventures & Departure",
    desc: "Enjoy your final morning with cable car rides or marketplace shopping before transferring to the airport for your onward flight.",
    bullets: [
      "Panoramic viewpoint visit with gondola ride",
      "Free time for last-minute boutique souvenir shopping",
      "Transfer to airport for departure flights",
    ],
  },
];

type SimilarItem = {
  id: number | string;
  title: string;
  country: string;
  duration: string;
  price: string;
  rating: number;
  reviews: string;
  image: string;
  slug?: string;
};

const FALLBACK_SIMILAR: SimilarItem[] = [
  {
    id: 101,
    title: "Pacific Coast Highway Explorer",
    country: "New Zealand",
    duration: "5D | 4N",
    price: "$1,120",
    rating: 4.9,
    reviews: "1,840 reviews",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 102,
    title: "Greek Islands Sunset Odyssey",
    country: "Greece",
    duration: "7D | 6N",
    price: "$1,232",
    rating: 4.8,
    reviews: "2,210 reviews",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 103,
    title: "Swiss Alps Scenic Rail & Lake",
    country: "Switzerland",
    duration: "8D | 7N",
    price: "$1,950",
    rating: 4.9,
    reviews: "3,120 reviews",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 104,
    title: "Bali Tropical Beaches & Temples",
    country: "Indonesia",
    duration: "6D | 5N",
    price: "$980",
    rating: 4.7,
    reviews: "1,560 reviews",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80",
  },
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

  // Dynamic Departure Calendar from API
  const dynamicCalendar = useMemo(() => {
    if (tour.calendar && tour.calendar.length > 0) {
      return tour.calendar
        .filter((c) => c.status !== "cancelled")
        .map((c) => ({
          date: c.date,
          price: Number(tour.price_start_per_person || 1182),
          status: c.status === "available" || c.slots > 0 ? "Available" : "Limited",
        }));
    }
    return [
      { date: "15 Sep 2026, Tuesday", price: 1182, status: "Available" },
      { date: "22 Sep 2026, Tuesday", price: 1240, status: "Available" },
      { date: "05 Oct 2026, Monday", price: 1182, status: "Available" },
      { date: "19 Oct 2026, Monday", price: 1240, status: "Available" },
      { date: "02 Nov 2026, Monday", price: 1150, status: "Available" },
    ];
  }, [tour.calendar, tour.price_start_per_person]);

  const [adults, setAdults] = useState(initialAdults || 2);
  const [children, setChildren] = useState(initialChildren || 0);
  const [infants, setInfants] = useState(0);

  const [selectedDate, setSelectedDate] = useState(
    initialTravelDate || dynamicCalendar[0]?.date || "15 Sep 2026"
  );
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);

  // Itinerary accordion
  const [openItineraryDays, setOpenItineraryDays] = useState<Record<number, boolean>>({ 1: true });

  const toggleDay = (day: number) => {
    setOpenItineraryDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const expandAll = () => {
    const allOpen: Record<number, boolean> = {};
    dynamicItinerary.forEach((d) => {
      allOpen[d.day] = true;
    });
    setOpenItineraryDays(allOpen);
  };

  const collapseAll = () => {
    setOpenItineraryDays({});
  };

  // Pricing calculations -- sourced from the same per-tier pricing[] the
  // Group Pricing table and actual checkout (booking/[id]/page.tsx) use, so
  // this preview never guesses a number the real booking wouldn't charge.
  const totalPax = adults + children;
  const matchedSlab = tour.pricing.find((row) => totalPax >= row.persons_from && (row.persons_to == null || totalPax <= row.persons_to)) ?? tour.pricing[0];
  const unitPrice = matchedSlab ? Number(matchedSlab.price_per_person) : (tour.price_start_per_person ? Number(tour.price_start_per_person) : 1182);
  const childPrice = matchedSlab ? Number(matchedSlab.child_price_per_person) : unitPrice;

  const baseFare = adults * unitPrice + children * childPrice;
  // Real active discount for this tour (see services.cms._active_discount) --
  // not a hardcoded promo. Savings per person = original - discounted, both
  // already at the 1-pax level the backend computes.
  const activeDiscountPct = tour.discount_percentage && tour.discount_percentage > 0 ? Number(tour.discount_percentage) : 0;
  const discountAmount = activeDiscountPct > 0 ? Math.round(baseFare * (activeDiscountPct / 100)) : 0;
  const savingsPerPerson = tour.original_price_per_person != null && tour.discounted_price_per_person != null
    ? Number(tour.original_price_per_person) - Number(tour.discounted_price_per_person)
    : 0;
  // Real tour-configured tax %/service fee -- matches what
  // services.bookings._price_booking actually charges (tax on the
  // discounted subtotal, service fee as a flat per-booking amount).
  const taxableAmount = Math.max(0, baseFare - discountAmount);
  const taxPercentage = Number(tour.tax_percentage ?? 0);
  const taxAmount = taxPercentage > 0 ? Math.round(taxableAmount * taxPercentage) / 100 : 0;
  const serviceFee = Number(tour.service_fee ?? 0);
  const taxesAmount = taxAmount + serviceFee;
  const totalAmount = Math.max(0, baseFare - discountAmount + taxesAmount);

  // Per-tier Group Pricing -- the same flat active_discount percentage
  // applied to each pax-range slab's own storefront price, so every tier
  // shows its own strikethrough/discounted price and "save" amount instead
  // of one flat number (tour.pricing[] is the undiscounted per-tier price
  // list already returned by the public API, see routers/public.py _pricing_rows).
  const groupPricingRows = useMemo(() => {
    return (tour.pricing || []).map((row) => {
      const original = Number(row.price_per_person);
      const discounted = activeDiscountPct > 0 ? original * (1 - activeDiscountPct / 100) : null;
      return {
        label: row.persons_to && row.persons_to !== row.persons_from
          ? `${row.persons_from}-${row.persons_to} travellers`
          : `${row.persons_from} traveller${row.persons_from > 1 ? "s" : ""}`,
        original,
        discounted,
        currency: row.currency || tour.currency || "USD",
      };
    });
  }, [tour.pricing, tour.currency, activeDiscountPct]);

  // Dynamic Photo Gallery
  const galleryImages = useMemo(() => {
    if (images && images.length >= 6) return images.slice(0, 6);
    if (tour.gallery && tour.gallery.length > 0) {
      const fromTour = tour.gallery.map((g) => mediaUrl(g.image_url));
      if (fromTour.length >= 6) return fromTour.slice(0, 6);
      return [...fromTour, ...FALLBACK_GALLERY.slice(fromTour.length)];
    }
    return FALLBACK_GALLERY;
  }, [images, tour.gallery]);

  const destination = tour.country_name || "New Zealand";
  const title = tour.title || "New Zealand Explorer";
  const dayCount = tour.number_of_days || 6;
  const nightCount = Math.max(1, dayCount - 1);

  // Dynamic Highlights
  const dynamicHighlights = useMemo(() => {
    if (tour.highlights && tour.highlights.length > 0) {
      return tour.highlights.map((h, i) => ({
        title: h.title || h.text || `Highlight ${i + 1}`,
        desc: h.description || "Discover scenic landscapes and iconic landmark experiences with expert local guidance.",
        img: h.image ? mediaUrl(h.image) : galleryImages[i % galleryImages.length],
      }));
    }
    return FALLBACK_HIGHLIGHTS;
  }, [tour.highlights, galleryImages]);

  // Dynamic Inclusions & Exclusions
  const dynamicInclusions = useMemo(() => {
    if (tour.inclusions && tour.inclusions.length > 0) {
      return tour.inclusions.map((i) => i.text);
    }
    return [
      `${nightCount} Nights 4-Star Premium Accommodation`,
      "Daily Cooked Breakfast + Welcome Dinner",
      "All National Park & Attraction Entry Fees",
      "Dedicated AC Tour Coach & Driver",
      "Professional English-Speaking Tour Guide",
      "Airport Meet & Greet Transfers",
    ];
  }, [tour.inclusions, nightCount]);

  const dynamicExclusions = useMemo(() => {
    if (tour.exclusions && tour.exclusions.length > 0) {
      return tour.exclusions.map((e) => e.text);
    }
    return [
      "International & Domestic Flights",
      "Travel Insurance & Medical Protection",
      "Optional Excursions & Personal Expenses",
      "Gratuities & Tour Guide / Driver Tipping",
    ];
  }, [tour.exclusions]);

  // Dynamic Itinerary
  const dynamicItinerary = tour.itineraries && tour.itineraries.length > 0
    ? tour.itineraries.map((it, idx) => ({
        day: it.day || idx + 1,
        title: it.title || `Day ${idx + 1} Exploration`,
        desc: it.description || "Scenic journey with guided excursions and cultural experiences.",
        bullets: it.activities ? [it.activities] : [
          it.accommodation ? `Overnight stay at ${it.accommodation}` : "Overnight at 4-star hotel",
          it.meals ? `Meals included: ${it.meals}` : "Daily breakfast included",
          it.location ? `Exploring ${it.location}` : "Guided landmark sightseeing",
        ],
        photos: galleryImages.slice(idx % 3, (idx % 3) + 2),
      }))
    : FALLBACK_ITINERARY;

  // Accommodations / Where You'll Stay
  const dynamicHotels = [
    {
      name: "Hotel Grand Chancellor Auckland",
      stars: "4-Star Hotel",
      city: "Auckland",
      desc: "Centrally located in the heart of downtown with modern rooms, indoor swimming pool, and harbor views.",
      badges: ["Breakfast Included", "Free High-speed WiFi"],
      img: "/images/hero-1.jpg",
    },
    {
      name: "Sudima Hotel Lake Rotorua",
      stars: "4-Star Hotel",
      city: "Rotorua",
      desc: "Situated on the shores of Lake Rotorua, adjacent to Polynesian Spa and Government Gardens.",
      badges: ["Thermal Spa Access", "Breakfast Included"],
      img: "/images/hero-2.jpg",
    },
    {
      name: "Heritage Queenstown Hotel",
      stars: "4.5-Star Hotel",
      city: "Queenstown",
      desc: "Crafted from schist stone and cedar, offering panoramic vistas across Lake Wakatipu and the Remarkables.",
      badges: ["Lake Wakatipu Views", "Breakfast Included"],
      img: "/images/hero-3.jpg",
    },
  ];

  // Dynamic Similar Tours
  const dynamicSimilar: SimilarItem[] = useMemo(() => {
    if (tour.similar_tours && tour.similar_tours.length > 0) {
      return tour.similar_tours.map((sim, i) => ({
        id: sim.id,
        title: sim.title || "Tour",
        country: sim.country_name || destination,
        duration: sim.number_of_days ? `${sim.number_of_days}D | ${Math.max(1, sim.number_of_days - 1)}N` : "6D | 5N",
        price: sim.price_start_per_person ? format(sim.price_start_per_person, sim.currency) : "$1,182",
        rating: sim.rating_average || 4.8,
        reviews: `${sim.rating_count || 120} reviews`,
        image: sim.banner_image ? mediaUrl(sim.banner_image) : FALLBACK_SIMILAR[i % FALLBACK_SIMILAR.length].image,
        slug: sim.slug,
      }));
    }
    return FALLBACK_SIMILAR;
  }, [tour.similar_tours, destination, format]);

  return (
    <main className="min-h-screen bg-white pb-24 pt-4 text-slate-950">
      {modal}

      <div className="mx-auto max-w-[1400px] px-5">
        {/* ── 1. Hero Landscape Banner ── */}
        <section className="relative h-[320px] sm:h-[380px] w-full overflow-hidden rounded-[20px] bg-slate-950 shadow-md">
          <img
            src={galleryImages[0]}
            alt={destination}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />

          {/* Glassmorphism Hero Card */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
            <div className="max-w-2xl rounded-2xl bg-black/40 p-5 sm:p-7 backdrop-blur-md border border-white/10 text-white shadow-xl">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {destination} Tours
              </h1>
              <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-white/90">
                {tour.short_description || `${destination} tours bring together breathtaking mountains, pristine lakes, dramatic coastlines and vibrant cities, making every journey packed with unforgettable experiences. Explore iconic destinations with scenic road trips, guided adventures and plenty of time to discover the natural beauty.`}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {tour.rating_average ? tour.rating_average.toFixed(1) : "4.8"}{" "}
                  <span className="text-white/70 font-normal">
                    ({tour.rating_count ? `${tour.rating_count} reviews` : "2,400 reviews"})
                  </span>
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Users size={13} />
                  68 Group Tours
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <User size={13} />
                  42 Private Tours
                </span>
                <span className="flex items-center gap-1 text-white/80">
                  <Compass size={13} />
                  24 City Explorers
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-white/90">
              Tourvaa travellers rate us <span className="font-bold">Excellent</span>{" "}
              <span className="inline-flex text-amber-400">★★★★★</span>{" "}
              <span className="font-bold">4.8</span> out of 5 based on 522 reviews on Ayatiworks
            </p>
          </div>
        </section>

        {/* ── 2. Clickable Breadcrumbs Navigation ── */}
        <nav className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
          >
            <Home size={13} className="text-blue-600" />
            Home
          </Link>
          <span className="text-slate-300">›</span>
          <Link
            href="/tours"
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
          >
            <MapIcon size={13} className="text-blue-600" />
            Tour
          </Link>
          <span className="text-slate-300">›</span>
          <Link
            href={`/tours?country=${encodeURIComponent(destination)}`}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
          >
            <MapPin size={13} className="text-blue-600" />
            {destination}
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-blue-600 truncate max-w-[200px] sm:max-w-none">
            {title}
          </span>
        </nav>

        {/* ── 3. Tour Title & Badges ── */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-[#E4572E] px-3.5 py-1 text-xs font-bold text-white shadow-2xs">
              {tour.category_name || "Group Tour"}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-2xs">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {tour.rating_average ? tour.rating_average.toFixed(1) : "4.9"}{" "}
              <span className="font-normal text-slate-500">
                ({tour.rating_count ? `${tour.rating_count} reviews` : "2,466 reviews"})
              </span>
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-2xs">
              Tour Code: {tour.tour_code || "NZ-EXP-01"}
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-[#0B1527]">
            {title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500">
            {dayCount} Days <span className="mx-1.5 text-slate-300">•</span>{" "}
            {tour.start_location || tour.city_name || "Auckland"} to {tour.finish_location || "Queenstown"}{" "}
            <span className="mx-1.5 text-slate-300">•</span> Min Age: 14+
          </p>

          {/* Starting-from hero price -- struck-through original vs. discounted
              when this tour has an active discount, same fields the sticky
              booking widget already uses (tour.original/discounted_price_per_person). */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Starting from</span>
            {hasActiveDiscount(tour) ? (
              <DiscountPriceLine
                original={Number(tour.original_price_per_person)}
                discounted={Number(tour.discounted_price_per_person)}
                currency={tour.currency || "USD"}
                format={format}
                size="sm"
              />
            ) : (
              <span className="text-base font-black text-[#0B1527]">
                {format(unitPrice, tour.currency || "USD")}<span className="text-xs font-semibold text-slate-400"> per person</span>
              </span>
            )}
          </div>
        </div>

        {/* ── 3. 6-Image Photo Gallery Grid ── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs group"
            >
              <img
                src={img}
                alt={`${title} photo ${idx + 1}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* ── 4. Main 2-Column Section ── */}
        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
          {/* ── Left Column ── */}
          <div className="space-y-8 min-w-0">
            {/* A. Overview & Key Perks */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0B1527]">
                  {title}
                </h2>
                <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {dayCount}D | {nightCount}N
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                {tour.long_description ||
                  tour.short_description ||
                  `Immerse yourself in breathtaking landscapes on this classic ${dayCount}-day guided journey. Experience world-renowned scenery, handpicked 4-star stays, comfortable touring transport, and unforgettable insider activities included throughout.`}
              </p>

              {/* Check Perks Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check size={14} className="stroke-[3] text-emerald-600" />
                  Free cancellation
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check size={14} className="stroke-[3] text-emerald-600" />
                  Instant confirmation
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check size={14} className="stroke-[3] text-emerald-600" />
                  Mobile voucher accepted
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check size={14} className="stroke-[3] text-emerald-600" />
                  Best price guaranteed
                </span>
              </div>
            </div>

            {/* B. Travel Essentials */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                <Compass className="text-blue-600" size={18} />
                Travel Essentials
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Calendar size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Duration</p>
                      <p className="text-slate-500 font-medium">
                        {dayCount} Days / {nightCount} Nights
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Start Point</p>
                      <p className="text-slate-500 font-medium">
                        {tour.start_location || tour.city_name || "Auckland (Airport)"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Compass size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Guide</p>
                      <p className="text-slate-500 font-medium">
                        {tour.overview?.tour_type || "Live English Guide"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <User size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Age Range</p>
                      <p className="text-slate-500 font-medium">
                        14 to 75 Years
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Users size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Tour Type</p>
                      <p className="text-slate-500 font-medium">
                        {tour.category_name || "Small Group"} (Max {tour.group_size || 24})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">End Point</p>
                      <p className="text-slate-500 font-medium">
                        {tour.finish_location || "Queenstown (Airport)"}
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
                        {tour.overview?.meal_summary || "Daily Breakfast + 2 Dinners"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Activity size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Physical Level</p>
                      <p className="text-slate-500 font-medium">
                        {tour.overview?.tour_pace || "Moderate (Walking & Sightseeing)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* C. ⭐ TOUR HIGHLIGHTS */}
            <div>
              <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                TOUR HIGHLIGHTS
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dynamicHighlights.map((h, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-36 w-full overflow-hidden bg-slate-100">
                      <img src={h.img} alt={h.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3.5">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{h.title}</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. 🛡️ Your Tour Package Details (Included / Not Included) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                <ShieldCheck size={18} className="text-blue-600" />
                Your Tour Package Details
              </h3>

              <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
                {/* INCLUDED */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                    <Check size={14} className="stroke-[3]" />
                    INCLUDED
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-xs text-slate-700 font-medium">
                    {dynamicInclusions.map((inc, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 stroke-[2.5]" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* NOT INCLUDED */}
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-600">
                    <X size={14} className="stroke-[3]" />
                    NOT INCLUDED
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-xs text-slate-700 font-medium">
                    {dynamicExclusions.map((exc, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-2">
                        <X size={14} className="mt-0.5 shrink-0 text-red-500 stroke-[2.5]" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Note callout */}
              {tour.cancellation_policy.length > 0 && (
                <div className="mt-6 rounded-xl bg-amber-50/80 p-3 text-[11px] font-medium text-amber-800 flex items-center gap-2 border border-amber-200/60">
                  <Info size={14} className="shrink-0 text-amber-600" />
                  <span>
                    {tour.cancellation_policy[0].description ||
                      `${tour.cancellation_policy[0].refund_percentage}% refund if cancelled ${tour.cancellation_policy[0].days_before_min}+ days before departure.`}
                    {" "}See full cancellation &amp; refund policy below.
                  </span>
                </div>
              )}
            </div>

            {/* D2. Cancellation & Refund Policy */}
            {tour.cancellation_policy.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                  <ShieldCheck size={18} className="text-blue-600" />
                  Cancellation &amp; Refund Policy
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  You may cancel this booking at any time. The refund you receive depends on how far ahead of departure you cancel, shown below.
                </p>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <span>Days before departure</span>
                    <span>Details</span>
                    <span className="text-right">Refund</span>
                  </div>
                  {tour.cancellation_policy.map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs">
                      <span className="font-bold text-[#0B1527]">
                        {rule.days_before_max == null ? `${rule.days_before_min}+ days` : `${rule.days_before_min}–${rule.days_before_max} days`}
                      </span>
                      <span className="text-slate-500">{rule.description || "—"}</span>
                      <span className={`text-right font-black ${rule.refund_percentage > 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {rule.refund_percentage}% refund
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E. 🗺️ Itinerary (Accordion) */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                  <Compass size={18} className="text-blue-600" />
                  Itinerary
                </h3>

                <div className="flex items-center gap-3 text-xs font-bold text-blue-600">
                  <button type="button" onClick={expandAll} className="hover:underline">
                    Expand All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button type="button" onClick={collapseAll} className="hover:underline">
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="mt-6 divide-y divide-slate-100">
                {dynamicItinerary.map((day) => {
                  const isOpen = Boolean(openItineraryDays[day.day]);

                  return (
                    <div key={day.day} className="py-4">
                      <button
                        type="button"
                        onClick={() => toggleDay(day.day)}
                        className="flex w-full items-center justify-between text-left text-xs font-bold text-[#0B1527] transition hover:text-blue-600"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-6 w-14 shrink-0 items-center justify-center rounded-md bg-[#0B1527] text-[10px] font-black text-white">
                            Day {day.day}
                          </span>
                          <span className="text-sm font-bold">{day.title}</span>
                        </span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isOpen && (
                        <div className="mt-3.5 pl-16 space-y-3">
                          <p className="text-xs leading-relaxed text-slate-600 font-medium">
                            {day.desc}
                          </p>

                          {day.bullets && day.bullets.length > 0 && (
                            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                              {day.bullets.map((b, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {day.photos && day.photos.length > 0 && (
                            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                              {day.photos.map((p, pIdx) => (
                                <div key={pIdx} className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                  <img src={p} alt="" className="h-full w-full object-cover" />
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

            {/* F. 🏨 Where You'll Stay */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                <Hotel size={18} className="text-blue-600" />
                Where You&apos;ll Stay
              </h3>

              <div className="mt-5 space-y-4">
                {dynamicHotels.map((hotel, hIdx) => (
                  <div
                    key={hIdx}
                    className="flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-slate-100 bg-[#F9FBFE] p-4 transition hover:shadow-xs"
                  >
                    <div className="h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                      <img src={hotel.img} alt={hotel.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900">{hotel.name}</h4>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                          {hotel.stars}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 font-medium">
                        {hotel.desc}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {hotel.badges.map((b, bI) => (
                          <span
                            key={bI}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700"
                          >
                            <Check size={11} className="stroke-[3]" />
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Pricing -- per pax-range tier, strikethrough/discounted when an active discount applies */}
            {groupPricingRows.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <h3 className="text-base font-black text-[#0B1527]">Group Pricing</h3>
                <div className="mt-4 divide-y divide-slate-100">
                  {groupPricingRows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs font-bold text-slate-700">{row.label}</span>
                      {row.discounted != null ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-baseline gap-2">
                            <s className="text-xs font-semibold text-red-400">{format(row.original, row.currency)} / person</s>
                            <b className="text-sm font-black text-slate-950">{format(row.discounted, row.currency)} / person</b>
                          </div>
                          <DiscountSavingsLine original={row.original} discounted={row.discounted} currency={row.currency} format={format} suffix="pp" />
                        </div>
                      ) : (
                        <span className="text-sm font-black text-slate-900">{format(row.original, row.currency)} / person</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* G. 📅 Availability & Pricing */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <h3 className="flex items-center gap-2 text-base font-black text-[#0B1527]">
                <Calendar size={18} className="text-blue-600" />
                Availability &amp; Pricing
              </h3>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3">DEPARTURE DATE</th>
                      <th className="pb-3">PRICE PER PERSON</th>
                      <th className="pb-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dynamicCalendar.map((dep, dIdx) => (
                      <tr key={dIdx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5">
                          <p className="text-xs font-bold text-slate-900">{dep.date}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">{dep.status}</p>
                        </td>
                        <td className="py-3.5 text-xs font-black text-slate-900">
                          {format(dep.price, tour.currency || "USD")}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(dep.date);
                              setSelectedDateIdx(dIdx);
                            }}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                              selectedDate === dep.date
                                ? "bg-[#0B1527] text-white shadow-xs"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {selectedDate === dep.date ? "Selected" : "Select Date"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Right Column: Sticky Booking Widget ── */}
          <div className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <h3 className="text-sm font-bold text-[#0B1527]">
                Book your {destination} tour
              </h3>

              {hasActiveDiscount(tour) && (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Starting from</span>
                  <DiscountPriceLine
                    original={Number(tour.original_price_per_person)}
                    discounted={Number(tour.discounted_price_per_person)}
                    currency={tour.currency || "USD"}
                    format={format}
                    size="sm"
                  />
                </div>
              )}

              {/* Group Pricing -- compact per-tier breakdown, mirrors the
                  main content column's Group Pricing card above. */}
              {groupPricingRows.length > 0 && (
                <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group Pricing</p>
                  {groupPricingRows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-600">{row.label}</span>
                      {row.discounted != null ? (
                        <div className="flex items-baseline gap-1.5">
                          <s className="text-[10px] font-semibold text-red-400">{format(row.original, row.currency)}</s>
                          <b className="font-black text-slate-950">{format(row.discounted, row.currency)}</b>
                          <span className="text-slate-400">/ person</span>
                        </div>
                      ) : (
                        <span className="font-black text-slate-900">{format(row.original, row.currency)} / person</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Date selection tabs */}
              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Departure
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {dynamicCalendar.slice(0, 3).map((dep, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dep.date);
                        setSelectedDateIdx(i);
                      }}
                      className={`rounded-xl border p-2 text-center transition ${
                        selectedDate === dep.date
                          ? "border-blue-600 bg-blue-50/80 shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-[9px] font-semibold text-slate-500 truncate">
                        {dep.date.split(",")[0]}
                      </p>
                      <p className="text-xs font-black text-slate-900">
                        {format(dep.price, tour.currency || "USD")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest counters */}
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Adults (12+ yrs)</p>
                    <p className="text-[10px] text-slate-400">
                      {format(unitPrice, tour.currency || "USD")} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-slate-900">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((a) => a + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Children (2-11 yrs)</p>
                    <p className="text-[10px] text-slate-400">
                      {format(childPrice, tour.currency || "USD")} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-slate-900">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((c) => c + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Infants (&lt;2 yrs)</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Free</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={infants <= 0}
                      onClick={() => setInfants((i) => Math.max(0, i - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-slate-900">{infants}</span>
                    <button
                      type="button"
                      onClick={() => setInfants((i) => i + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Summary Breakdown */}
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Base Fare ({adults} Adult{adults > 1 ? "s" : ""})</span>
                  <span className="font-semibold text-slate-900">
                    {format(baseFare, tour.currency || "USD")}
                  </span>
                </div>
                {activeDiscountPct > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({activeDiscountPct}%)</span>
                    <span>-{format(discountAmount, tour.currency || "USD")}</span>
                  </div>
                )}
                {savingsPerPerson > 0 && (
                  <div className="flex justify-end">
                    <DiscountSavingsLine
                      original={Number(tour.original_price_per_person)}
                      discounted={Number(tour.discounted_price_per_person)}
                      currency={tour.currency || "USD"}
                      format={format}
                    />
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxes &amp; Service Fees</span>
                  <span className="font-semibold text-slate-900">
                    {format(taxesAmount, tour.currency || "USD")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="text-xl font-black text-[#0B1527]">
                    {format(totalAmount, tour.currency || "USD")}
                  </span>
                </div>
              </div>

              {/* Book CTA */}
              <button
                type="button"
                onClick={() =>
                  onBook({
                    travelDate: selectedDate,
                    adults,
                    children,
                  })
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1527] py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#15233C]"
              >
                Proceed to Book
                <ArrowRight size={13} />
              </button>

              <p className="mt-3 text-center text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-2">
                <span>🔒 Secure 256-Bit SSL</span>
                <span>•</span>
                <span>⚡ Instant Confirmation</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 5. Dynamic Similar Tours Rail ── */}
        <section className="mt-16">
          <h3 className="text-xl font-black text-[#0B1527]">
            Similar Tours
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dynamicSimilar.map((sim) => {
              const simLink = sim.slug
                ? publicTourUrl({ country_name: sim.country, title: sim.title, slug: sim.slug })
                : `/tours/${sim.id}`;

              return (
                <div
                  key={sim.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img src={sim.image} alt={sim.title} className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-xs shadow-xs">
                      <MapPin size={11} className="text-slate-600" />
                      {sim.country}
                    </span>
                    <button
                      type="button"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-xs hover:scale-110 transition"
                    >
                      <Heart size={14} className="fill-current text-red-500" />
                    </button>
                  </div>

                  <div className="p-4 flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={simLink}
                          className="text-xs font-bold text-slate-900 truncate hover:text-blue-600 transition"
                        >
                          {sim.title}
                        </Link>
                        <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          {sim.duration}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-900">
                          {typeof sim.rating === "number" ? sim.rating.toFixed(1) : sim.rating}
                        </span>
                        <span className="text-[10px] text-slate-400">({sim.reviews})</span>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500">Price </span>
                        <span className="text-xs font-black text-slate-900">{sim.price}</span>
                        <span className="text-[10px] text-slate-400"> pp</span>
                      </div>
                      <Link
                        href={simLink}
                        className="rounded-xl bg-[#0B1527] px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#15233C]"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
