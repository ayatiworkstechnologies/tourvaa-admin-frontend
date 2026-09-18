"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuHeart as Heart,
  LuStar as Star,
  LuArrowRight as ArrowRight,
  LuLightbulb as Lightbulb,
} from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import { useTravelStore, type TravelItem } from "@/providers/TravelStoreProvider";
import { fetchToursOnDeals } from "@/lib/api/publicClient";
import HomeNewsletterBanner from "@/components/public/home/HomeNewsletterBanner";
import { destinationUrl } from "@/lib/utils/tourUrl";

interface DealCardItem {
  id: string | number;
  title: string;
  slug?: string;
  country: string;
  image: string;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
}

interface DestinationCardItem {
  id: string | number;
  country: string;
  slug?: string;
  image: string;
  rating: number;
  operatorsCount: number;
}

interface TravelWayCategory {
  id: string;
  title: string;
  discountBadge: string;
  image: string;
  description: string;
  tags: { label: string; bg: string; text: string }[];
  ctaUrl: string;
}

// Sample fallback deal records matching the design reference when dynamic API data is loading or empty
const TOURVAA_SPECIALS: DealCardItem[] = [
  {
    id: "spec-1",
    title: "China Explorer",
    slug: "china-explorer",
    country: "China",
    image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1299,
    dealPrice: 1039,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 2490,
  },
  {
    id: "spec-2",
    title: "Tuscan Getaway",
    slug: "tuscan-getaway",
    country: "Italy",
    image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1050,
    dealPrice: 892,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 1820,
  },
  {
    id: "spec-3",
    title: "Tokyo & Kyoto",
    slug: "tokyo-kyoto",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1499,
    dealPrice: 1199,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 3120,
  },
  {
    id: "spec-4",
    title: "Machu Picchu Trek",
    slug: "machu-picchu-trek",
    country: "Peru",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1699,
    dealPrice: 1444,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 920,
  },
];

const BEST_OFFERS: DealCardItem[] = [
  {
    id: "best-1",
    title: "Bali Paradise Escape",
    slug: "bali-paradise-escape",
    country: "Bali",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    originalPrice: 999,
    dealPrice: 749,
    discountPercent: 25,
    rating: 4.8,
    reviewCount: 1500,
  },
  {
    id: "best-2",
    title: "Pyramids & Nile Cruise",
    slug: "pyramids-nile-cruise",
    country: "Egypt",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1350,
    dealPrice: 1080,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 2120,
  },
  {
    id: "best-3",
    title: "Barcelona & Andalusia",
    slug: "barcelona-andalusia",
    country: "Spain",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1150,
    dealPrice: 978,
    discountPercent: 15,
    rating: 4.7,
    reviewCount: 1150,
  },
  {
    id: "best-4",
    title: "Maldives Overwater",
    slug: "maldives-overwater",
    country: "Maldives",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
    originalPrice: 2499,
    dealPrice: 1999,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 4500,
  },
];

const NEW_ZEALAND_DEALS: DealCardItem[] = [
  {
    id: "nz-1",
    title: "Milford Sound Cruise",
    slug: "milford-sound-cruise",
    country: "New Zealand",
    image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1200,
    dealPrice: 1020,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 1850,
  },
  {
    id: "nz-2",
    title: "Hobbiton & Rotorua",
    slug: "hobbiton-rotorua",
    country: "New Zealand",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    originalPrice: 990,
    dealPrice: 792,
    discountPercent: 20,
    rating: 4.8,
    reviewCount: 1340,
  },
  {
    id: "nz-3",
    title: "Queenstown Explorer",
    slug: "queenstown-explorer",
    country: "New Zealand",
    image: "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1450,
    dealPrice: 1232,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 2100,
  },
  {
    id: "nz-4",
    title: "South Island Road Trip",
    slug: "south-island-road-trip",
    country: "New Zealand",
    image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1850,
    dealPrice: 1480,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 1670,
  },
];

const SRI_LANKA_DEALS: DealCardItem[] = [
  {
    id: "sl-1",
    title: "Sigiriya Rock Fortress",
    slug: "sigiriya-rock-fortress",
    country: "Sri Lanka",
    image: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1000,
    dealPrice: 850,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 1420,
  },
  {
    id: "sl-2",
    title: "Kandy & Tea Country",
    slug: "kandy-tea-country",
    country: "Sri Lanka",
    image: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80",
    originalPrice: 890,
    dealPrice: 712,
    discountPercent: 20,
    rating: 4.8,
    reviewCount: 1150,
  },
  {
    id: "sl-3",
    title: "Galle Fort & Beaches",
    slug: "galle-fort-beaches",
    country: "Sri Lanka",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    originalPrice: 950,
    dealPrice: 807,
    discountPercent: 15,
    rating: 4.8,
    reviewCount: 980,
  },
  {
    id: "sl-4",
    title: "Yala Safari Adventure",
    slug: "yala-safari-adventure",
    country: "Sri Lanka",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80",
    originalPrice: 1250,
    dealPrice: 1000,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 1650,
  },
];

const COUNTRIES_WORTH_EXPLORING: DestinationCardItem[] = [
  {
    id: "c-1",
    country: "China",
    slug: "china",
    image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    operatorsCount: 24,
  },
  {
    id: "c-2",
    country: "India",
    slug: "india",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    operatorsCount: 18,
  },
  {
    id: "c-3",
    country: "Slovenia",
    slug: "slovenia",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    operatorsCount: 15,
  },
  {
    id: "c-4",
    country: "France",
    slug: "france",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    operatorsCount: 32,
  },
];

const TRAVEL_WAYS: TravelWayCategory[] = [
  {
    id: "hiking",
    title: "Hiking and Trekking",
    discountBadge: "Up to 30% off",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    description:
      "Recharge and escape routine on inspiring trails every route chosen for stunning views and natural connection.",
    tags: [
      { label: "Guided treks", bg: "bg-blue-50", text: "text-blue-700" },
      { label: "Scenic trails", bg: "bg-blue-50", text: "text-blue-700" },
      { label: "Active trips", bg: "bg-blue-50", text: "text-blue-700" },
    ],
    ctaUrl: "/tours?search=hiking",
  },
  {
    id: "safari",
    title: "Safari and Wildlife",
    discountBadge: "Up to 25% off",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    description:
      "Private drives, expert guides, and lodge stays that bring you face-to-face with the world's most incredible animals.",
    tags: [
      { label: "Private vehicle", bg: "bg-amber-50", text: "text-amber-700" },
      { label: "Big five safari", bg: "bg-amber-50", text: "text-amber-700" },
      { label: "Eco-friendly camps", bg: "bg-amber-50", text: "text-amber-700" },
    ],
    ctaUrl: "/tours?search=safari",
  },
  {
    id: "cruises",
    title: "River Cruises",
    discountBadge: "Up to 20% off",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    description:
      "Unpack once and enjoy world-class meals while sailing right into the heart of historic cities and scenic countryside.",
    tags: [
      { label: "Deluxe cabins", bg: "bg-rose-50", text: "text-rose-700" },
      { label: "Guided shore visits", bg: "bg-rose-50", text: "text-rose-700" },
      { label: "All meals", bg: "bg-rose-50", text: "text-rose-700" },
    ],
    ctaUrl: "/tours?search=cruise",
  },
  {
    id: "adventure",
    title: "Adventure and Adrenaline",
    discountBadge: "Up to 30% off",
    image: "https://images.unsplash.com/photo-1533692328991-08159ff19fca?auto=format&fit=crop&w=800&q=80",
    description:
      "High-energy experiences with expert guides: whitewater rafting, deep jungle treks, and cliffside via ferratas.",
    tags: [
      { label: "Expert guides", bg: "bg-rose-50", text: "text-rose-700" },
      { label: "All safety gear", bg: "bg-rose-50", text: "text-rose-700" },
      { label: "Small groups", bg: "bg-rose-50", text: "text-rose-700" },
    ],
    ctaUrl: "/tours?search=adventure",
  },
  {
    id: "food-wine",
    title: "Food and Wine",
    discountBadge: "Up to 15% off",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
    description:
      "Bespoke culinary journeys hosted by master chefs, vineyard cellarmasters, and local gastronomy historians.",
    tags: [
      { label: "Vineyard stays", bg: "bg-emerald-50", text: "text-emerald-700" },
      { label: "Cellar access", bg: "bg-emerald-50", text: "text-emerald-700" },
      { label: "Wine pairing", bg: "bg-emerald-50", text: "text-emerald-700" },
    ],
    ctaUrl: "/tours?search=wine",
  },
  {
    id: "cycling",
    title: "Cycling Tours",
    discountBadge: "Up to 20% off",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80",
    description:
      "Curated cycling routes across scenic wine country, coastal cliffs, and peaceful historic villages at an easy pace.",
    tags: [
      { label: "E-bike option", bg: "bg-indigo-50", text: "text-indigo-700" },
      { label: "Luggage transfers", bg: "bg-indigo-50", text: "text-indigo-700" },
      { label: "Flex distance", bg: "bg-indigo-50", text: "text-indigo-700" },
    ],
    ctaUrl: "/tours?search=cycling",
  },
];

function toNumericId(id: string | number): number {
  if (typeof id === "number") return id;
  const parsed = parseInt(id.replace(/\D/g, ""), 10);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function toTravelItem(deal: DealCardItem): TravelItem {
  return {
    id: toNumericId(deal.id),
    title: deal.title,
    place: deal.country,
    image: deal.image,
    price: deal.dealPrice,
    currency: "USD",
    duration: "7 days",
    href: deal.slug ? `/tours/${deal.slug}` : "/tours",
  };
}

export default function DealsPage() {
  const { format } = useCurrency();
  const { isWishlisted, toggleWishlist } = useTravelStore();

  const [specials, setSpecials] = useState<DealCardItem[]>(TOURVAA_SPECIALS);
  const [bestOffers, setBestOffers] = useState<DealCardItem[]>(BEST_OFFERS);

  // Carousel refs for smooth horizontal navigation
  const specialsRef = useRef<HTMLDivElement>(null);
  const bestOffersRef = useRef<HTMLDivElement>(null);
  const nzRef = useRef<HTMLDivElement>(null);
  const slRef = useRef<HTMLDivElement>(null);
  const countriesRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: number) => {
    if (!ref.current) return;
    const card = ref.current.querySelector<HTMLElement>("[data-deal-item]");
    const step = card ? card.offsetWidth + 20 : 300;
    ref.current.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  // Connect to dynamic CMS / tours API when available
  useEffect(() => {
    let active = true;
    fetchToursOnDeals()
      .then((items) => {
        if (!active || !items || !items.length) return;
        const mapped: DealCardItem[] = items.map((item, idx) => {
          const raw = item as unknown as Record<string, unknown>;
          return {
            id: item.id || `api-deal-${idx}`,
            title: item.tour_title || (raw.title as string) || "Special Deal Tour",
            slug: (raw.slug as string) || (item.tour_code ? `tour-${item.tour_code}` : `tour-${item.tour_id || item.id}`),
            country: (raw.destination_country as string) || "Featured",
            image: (raw.featured_image as string) || (raw.cover_image as string) || TOURVAA_SPECIALS[idx % TOURVAA_SPECIALS.length].image,
            originalPrice: Number(raw.original_price || raw.price || 1200),
            dealPrice: Number(raw.deal_price || Math.round(Number(raw.price || 1200) * 0.8)),
            discountPercent: Number(item.discount_percentage || raw.discount_percentage || 20),
            rating: Number(raw.rating || 4.9),
            reviewCount: Number(raw.review_count || 1200),
          };
        });
        setSpecials(mapped.slice(0, 8));
      })
      .catch(() => {
        /* Keep curated baseline */
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="w-full bg-white text-slate-900 overflow-x-clip pb-12">
      {/* 1. Hero Section: Panoramic Alpine Mountain Banner with Center Glass Card */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="relative min-h-[360px] sm:min-h-[440px] md:min-h-[500px] w-full overflow-hidden rounded-[20px] sm:rounded-[28px] shadow-lg flex items-center justify-center p-5 sm:p-8 md:p-12">
          {/* Panoramic Mountain Landscape Background */}
          <img
            src="/images/about-mountain.png"
            alt="Tourvaa Travel Specials Mountain Panorama"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={(e) => {
              // Graceful fallback to Unsplash mountain if local file isn't available
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=85";
            }}
          />
          {/* Subtle natural vignette */}
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />

          {/* Center Glassmorphism Content Box */}
          <div className="relative z-10 max-w-2xl w-full rounded-2xl sm:rounded-[24px] border border-white/20 bg-black/45 backdrop-blur-md p-6 sm:p-8 md:p-10 text-center text-white shadow-2xl">
            <h1 className="text-2xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-white drop-shadow-md">
              Tourvaa Travel Specials
            </h1>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-[14.5px] leading-relaxed text-white/95 font-normal">
              Welcome to your portal for exceptional discounts on inspiring travel experiences. From
              limited-time promotions to exclusive packages, our Travel Specials page is your first
              stop for discovering more of the world for less. Find the latest deals and begin your next
              adventure today.
            </p>

            {/* Trust highlights horizontal row */}
            <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[11px] sm:text-xs font-semibold text-white/90">
              <span className="flex items-center gap-1.5">
                <span className="text-white text-xs">•</span>
                15,000+ happy travellers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-white text-xs">•</span>
                2,500+ Handpicked Tours
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-white text-xs">•</span>
                150+ Trusted Operators
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-white text-xs">•</span>
                50+ Top Destinations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Carousel 1: "Tourvaa Travel Specials" with "Ends Soon" Badge */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-950 tracking-tight">
              Tourvaa Travel Specials
            </h2>
            <span className="rounded-full bg-[#E53935] px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
              Ends Soon
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollContainer(specialsRef, -1)}
              aria-label="Previous deals"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollContainer(specialsRef, 1)}
              aria-label="Next deals"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={specialsRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
        >
          {specials.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              format={format}
              isWishlisted={isWishlisted(toNumericId(deal.id))}
              onToggleWishlist={() => toggleWishlist(toTravelItem(deal))}
            />
          ))}
        </div>
      </section>

      {/* 3. Carousel 2: "Best Offers" */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-950 tracking-tight">
            Best Offers
          </h2>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollContainer(bestOffersRef, -1)}
              aria-label="Previous offers"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollContainer(bestOffersRef, 1)}
              aria-label="Next offers"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={bestOffersRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
        >
          {bestOffers.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              format={format}
              isWishlisted={isWishlisted(toNumericId(deal.id))}
              onToggleWishlist={() => toggleWishlist(toTravelItem(deal))}
            />
          ))}
        </div>
      </section>

      {/* 4. Carousel 3: "New Zealand" */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-950 tracking-tight">
            New Zealand
          </h2>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollContainer(nzRef, -1)}
              aria-label="Previous New Zealand deals"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollContainer(nzRef, 1)}
              aria-label="Next New Zealand deals"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={nzRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
        >
          {NEW_ZEALAND_DEALS.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              format={format}
              isWishlisted={isWishlisted(toNumericId(deal.id))}
              onToggleWishlist={() => toggleWishlist(toTravelItem(deal))}
            />
          ))}
        </div>
      </section>

      {/* 5. Panoramic Travel Club Membership Banner: "Explore More. Spend Less." */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="relative min-h-[190px] sm:min-h-[220px] w-full overflow-hidden rounded-[20px] sm:rounded-[24px] bg-slate-950 shadow-md flex items-center p-6 sm:p-8 lg:p-10">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
            alt="Explore More Spend Less"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/45" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 w-full">
            <div className="max-w-2xl text-left">
              <span className="inline-flex items-center rounded-full bg-pub-accent px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-xs">
                EXCLUSIVE ACCESS
              </span>
              <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                Explore More. Spend Less.
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-200 font-normal leading-relaxed max-w-xl">
                Join the Tourvaa Travel Club to get special member-only savings, exclusive early access
                to flash sales, and tailored travel suggestions delivered straight to your inbox.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-pub-primary hover:bg-pub-primary-dark active:scale-95 px-6 py-3 text-sm font-bold text-white border border-white/10 shadow-sm transition-all cursor-pointer"
              >
                <span>Sign up now</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/60 hover:bg-white/10 active:scale-95 px-6 py-3 text-sm font-bold text-white transition-all cursor-pointer"
              >
                <span>Log In</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Carousel 4: "Sri Lanka" */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-950 tracking-tight">
            Sri Lanka
          </h2>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollContainer(slRef, -1)}
              aria-label="Previous Sri Lanka deals"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollContainer(slRef, 1)}
              aria-label="Next Sri Lanka deals"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={slRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
        >
          {SRI_LANKA_DEALS.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              format={format}
              isWishlisted={isWishlisted(toNumericId(deal.id))}
              onToggleWishlist={() => toggleWishlist(toTravelItem(deal))}
            />
          ))}
        </div>
      </section>

      {/* 7. Carousel 5: "Countries Worth Exploring" */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-950 tracking-tight">
            Countries Worth Exploring
          </h2>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollContainer(countriesRef, -1)}
              aria-label="Previous countries"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollContainer(countriesRef, 1)}
              aria-label="Next countries"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={countriesRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
        >
          {COUNTRIES_WORTH_EXPLORING.map((item) => (
            <Link
              key={item.id}
              href={destinationUrl(item.country)}
              data-deal-item
              className="group min-w-[240px] sm:min-w-[280px] lg:min-w-[310px] max-w-[330px] rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shrink-0"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.country}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-full bg-pub-accent px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  📍 {item.country}
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 group-hover:text-pub-secondary transition-colors text-base">
                  {item.country}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{item.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({item.operatorsCount}+ operators)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Section 6: "Travel Your Way" Category Grid (6 Cards) */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-12 sm:pt-16">
        <div className="mb-6 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Travel Your Way
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {TRAVEL_WAYS.map((cat) => (
            <div
              key={cat.id}
              className="group rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header Image with Overlay Title & Discount Badge */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Badge top-right */}
                  <span className="absolute top-3 right-3 rounded-full bg-pub-accent px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                    {cat.discountBadge}
                  </span>

                  {/* Title bottom-left */}
                  <h3 className="absolute bottom-3 left-4 text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow">
                    {cat.title}
                  </h3>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-5">
                  <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${tag.bg} ${tag.text}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 flex items-center justify-between border-t border-slate-100 mt-2">
                <div className="text-left">
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Available departures
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    See open dates
                  </span>
                </div>

                <Link
                  href={cat.ctaUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-pub-primary hover:bg-pub-primary-dark active:scale-95 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                >
                  <span>Explore Deals</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Tip Banner Strip */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 sm:pt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/75 px-5 py-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <Lightbulb size={15} className="text-amber-500 shrink-0" />
            <span>
              <strong className="text-slate-900">Tip:</strong> Search for last-minute deals to save up to 50% extra.
            </span>
          </div>
          <div className="text-slate-500 font-normal">
            Limited time offers. T&Cs apply.{" "}
            <Link href="/tours" className="text-pub-secondary font-semibold hover:underline">
              Discover more tours
            </Link>
          </div>
        </div>
      </section>

      {/* 10. 24/7 Travel Support Registration Banner */}
      <div className="mt-8 sm:mt-12">
        <HomeNewsletterBanner />
      </div>
    </main>
  );
}

// Reusable Deal Tour Card matching media_1789555125221.png
function DealCard({
  deal,
  format,
  isWishlisted,
  onToggleWishlist,
}: {
  deal: DealCardItem;
  format: (amount: number, currencyCode?: string) => string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}) {
  return (
    <div
      data-deal-item
      className="group min-w-[240px] sm:min-w-[280px] lg:min-w-[310px] max-w-[330px] rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shrink-0 flex flex-col justify-between"
    >
      {/* Top Image + Overlay badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={deal.image}
          alt={deal.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Location Pill Top Left */}
        <span className="absolute top-3 left-3 rounded-full bg-pub-accent px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
          📍 {deal.country}
        </span>

        {/* Wishlist Heart Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist();
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs transition hover:scale-110 cursor-pointer shadow-xs"
        >
          <Heart
            size={15}
            className={
              isWishlisted
                ? "fill-[#E53935] text-[#E53935]"
                : "fill-none text-slate-700 hover:text-[#E53935]"
            }
          />
        </button>

        {/* Discount Badge Bottom Right */}
        <span className="absolute bottom-3 right-3 rounded-md bg-[#E53935] px-2.5 py-1 text-xs font-bold text-white shadow-md">
          Save {deal.discountPercent}%
        </span>
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 text-left">
        <Link href={deal.slug ? `/tours/${deal.slug}` : "/tours"} className="block">
          <h3 className="font-bold text-slate-900 group-hover:text-pub-secondary transition-colors text-sm sm:text-base line-clamp-1">
            {deal.title}
          </h3>
        </Link>

        {/* Stars + Rating count */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-0.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <Star size={11} className="fill-amber-400 text-amber-400" />
          </div>
          <span className="font-bold text-slate-900">{deal.rating.toFixed(1)}</span>
          <span className="text-slate-500">({deal.reviewCount.toLocaleString()} reviews)</span>
        </div>

        {/* Price Row: From $original $deal pp */}
        <div className="mt-2.5 flex items-baseline gap-1.5 text-slate-900">
          <span className="text-xs font-bold text-slate-700">From</span>
          <span className="text-xs text-slate-400 line-through">
            {format(deal.originalPrice, "USD")}
          </span>
          <strong className="text-sm sm:text-base font-bold text-slate-950">
            {format(deal.dealPrice, "USD")}
          </strong>
          <span className="text-xs text-slate-500 font-normal">pp</span>
        </div>
      </div>
    </div>
  );
}

