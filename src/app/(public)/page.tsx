"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import MarketingImage from "@/components/public/MarketingImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuArrowRight as ArrowRight, LuBookOpen as BookOpen, LuChevronDown as ChevronDown, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuClock as Clock, LuGlobe as Globe, LuHeart as Heart, LuMapPin as MapPin, LuPlane as Plane, LuSparkles as Sparkles, LuStar as Star, LuUser as User, LuUsers as Users, LuX as X, LuSquareCheckBig as SquareCheckBig } from "react-icons/lu";

import { usePublicSettings } from "@/providers/PublicSettingsProvider";
import HeroFilterBar from "@/components/public/HeroFilterBar";
import { AboutSectionBlock, AirportTransferBlock, BlogTeaserBlock, CmsBanner, CmsDestination, CmsReview, fetchContentBlock, fetchCustomerReviews, fetchFavouriteCountries, fetchFeaturedTours, fetchHandpickedTours, fetchHelpCentre, fetchHomepageBanners, fetchPopularDestinations, fetchPopularTours, fetchPublicCategories, fetchPublicCities, fetchPublicCountries, fetchPublicTourDetail, fetchToursOnDeals, HeroExtrasBlock, PublicCountry, PublicTour, subscribeNewsletter } from "@/lib/api/publicClient";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";

type TourFeature = { icon: React.ElementType; text: string };

type Tour = {
  id?: number;
  title: string;
  place: string;
  image: string;
  days: string;
  durationTag?: string;
  reviews: string;
  rating?: number;
  features: TourFeature[];
  rawPrice?: number | null;
  originalPrice?: number | null;
  discountBadge?: string;
  currency?: string;
  slug?: string;
};

const PLACEHOLDER_IMAGE = "/images/tour-card-fallback.jpg";

type CountryWorthExploring = {
  name: string;
  count: string;
  image: string;
  rating?: number;
  badge?: string;
  price?: number | null;
  currency?: string;
};

type CountryDestination = {
  name: string;
  image: string;
  snippet: string;
  tourCount?: number;
  badge?: string;
  href?: string;
};

const DEFAULT_FAVOURITE_COUNTRIES: CountryDestination[] = [
  {
    name: "Morocco",
    badge: "Morocco",
    image: "/images/destination-desert.jpg",
    snippet:
      "Trek the Sahara aboard a camel. Browse the vibrant souks of Marrakech. Uncover the imperial cities.",
    href: "/tours?country=Morocco",
  },
  {
    name: "Egypt",
    badge: "Egypt",
    image: "/images/destination-alpine.jpg",
    snippet:
      "Our best-selling destination! Cruise the Nile, marvel at the Pyramids, explore the tombs of Luxor.",
    href: "/tours?country=Egypt",
  },
  {
    name: "Iceland",
    badge: "Iceland",
    image: "/images/hero-1.jpg",
    snippet:
      "Iceland in winter is home to the Northern Lights, while in summer the waterfalls are breathtaking.",
    href: "/tours?country=Iceland",
  },
  {
    name: "Sri Lanka",
    badge: "Sri Lanka",
    image: "/images/hero-2.jpg",
    snippet:
      "Sri Lanka's Cultural Triangle offers such attractions as the Sigiriya Fortress and Dambulla caves.",
    href: "/tours?country=Sri+Lanka",
  },
  {
    name: "Turkey",
    badge: "Turkey",
    image: "/images/hero-3.jpg",
    snippet:
      "From the city in two continents, Istanbul, to the cave cities of Cappadocia, make Turkey your next trip.",
    href: "/tours?country=Turkey",
  },
  {
    name: "India",
    badge: "India",
    image: "/images/destination-desert.jpg",
    snippet:
      "First timers to India will want to take in the Golden Triangle of Delhi, Jaipur and Agra.",
    href: "/tours?country=India",
  },
  {
    name: "Vietnam",
    badge: "Vietnam",
    image: "/images/destination-alpine.jpg",
    snippet:
      "Visitors to Vietnam can cruise Halong Bay. They can ride a rickshaw around Hanoi. And so much more.",
    href: "/tours?country=Vietnam",
  },
  {
    name: "China",
    badge: "China",
    image: "/images/hero-1.jpg",
    snippet:
      "Walk the Great Wall, stand before the Terracotta Army, and explore the Forbidden City.",
    href: "/tours?country=China",
  },
];

function stableHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1)
    hash = (hash * 33) ^ value.charCodeAt(i);
  return hash >>> 0;
}

function mapPublicTour(tour: PublicTour): Tour {
  const durationLabel = tour.number_of_days
    ? `${tour.number_of_days} Day${tour.number_of_days === 1 ? "" : "s"}${tour.number_of_days > 1 ? ` / ${tour.number_of_days - 1} Nights` : ""}`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hour${tour.number_of_hours === 1 ? "" : "s"}`
      : "Flexible";

  const durationTag = tour.number_of_days
    ? `${tour.number_of_days}D | ${Math.max(0, tour.number_of_days - 1)}N`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hours`
      : undefined;

  const route =
    tour.start_location && tour.end_location
      ? `${tour.start_location} → ${tour.end_location}`
      : tour.city_name || tour.country_name || "Multiple Destinations";

  const features: TourFeature[] = [
    { icon: Clock, text: durationLabel },
    { icon: MapPin, text: route },
    { icon: User, text: "Age Range: 12–70" },
    { icon: Users, text: `Max Group Size: ${tour.group_size || 20}` },
  ];

  const hasDiscount = Boolean(
    tour.discount_percentage && tour.original_price_per_person != null && tour.discounted_price_per_person != null
  );
  const rawPrice = hasDiscount ? tour.discounted_price_per_person : tour.price_start_per_person;
  const originalPrice = hasDiscount ? tour.original_price_per_person : null;
  const discountBadge = tour.discount_percentage
    ? `Save ${Math.round(tour.discount_percentage)}%`
    : undefined;

  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER_IMAGE,
    days: durationLabel,
    durationTag,
    reviews: tour.rating_count
      ? `${tour.rating_count.toLocaleString()} reviews`
      : "",
    rating: tour.rating_count ? (tour.rating_average ?? undefined) : undefined,
    features,
    rawPrice,
    originalPrice,
    discountBadge,
    currency: tour.currency || "USD",
    slug: tour.slug,
  };
}

// "Countries Worth Exploring" shows every country the admin has curated in
// the CMS "Countries" list (matched to its real tour count by country_id,
// falling back to a name match), even one with 0 published tours yet - the
// admin picked it deliberately, so it stays visible with an honest count
// rather than silently disappearing until a tour is published. When the
// admin hasn't curated anything, it falls back to the top countries by real
// published tour count so the section isn't empty.
function topDestinationsFromCountries(
  countries: PublicCountry[],
  cmsDestinations: CmsDestination[],
  limit: number,
) {
  const countryById = new Map(countries.map((c) => [c.id, c]));
  const countryByName = new Map(
    countries.map((c) => [c.country_name.trim().toLowerCase(), c]),
  );

  if (cmsDestinations.length) {
    return [...cmsDestinations]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .slice(0, limit)
      .map((item) => {
        const match =
          (item.country_id != null ? countryById.get(item.country_id) : undefined) ??
          countryByName.get(item.title.trim().toLowerCase());
        const tourCount = match?.tour_count || 0;
        return {
          name: match?.country_name || item.title,
          count: `${tourCount} package${tourCount === 1 ? "" : "s"}`,
          image: item.image ? mediaUrl(item.image) : PLACEHOLDER_IMAGE,
          price: null as number | null,
          currency: "USD",
        };
      });
  }

  return [...countries]
    .filter((country) => (country.tour_count || 0) > 0)
    .sort((a, b) => (b.tour_count || 0) - (a.tour_count || 0))
    .slice(0, limit)
    .map((country) => ({
      name: country.country_name,
      count: `${country.tour_count} package${country.tour_count === 1 ? "" : "s"}`,
      image: PLACEHOLDER_IMAGE,
      price: null as number | null,
      currency: "USD",
    }));
}

function mapReview(item: CmsReview) {
  const name = item.reviewer_name || "Verified traveller";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VT";
  return {
    quote: item.review_text,
    name,
    image: item.reviewer_image ? mediaUrl(item.reviewer_image) : null,
    city: item.country || "Verified traveller",
    tourName: item.tour_name || "",
    initials,
    rating: Math.max(1, Math.min(5, item.rating || 5)),
  };
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.01, rootMargin: "250px" },
    );
    observer.observe(node);

    const timer = setTimeout(() => {
      node.classList.add("is-visible");
    }, 800);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);
  return (
    <div ref={ref} className={`reveal-block ${className}`}>
      {children}
    </div>
  );
}

function TourCardSkeleton() {
  return (
    <div className="w-[285px] sm:w-[305px] lg:w-[315px] shrink-0 animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5">
      <div className="h-44 sm:h-48 rounded-xl bg-slate-100" />
      <div className="pt-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyCollection({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <p className="text-sm font-semibold text-slate-600">{message}</p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E4572E] transition hover:text-pub-secondary"
      >
        <span>{linkLabel}</span>
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

function TopDealCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const href = tour.id
    ? publicTourUrl(tour)
    : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = {
    id: itemId,
    title: tour.title,
    place: tour.place,
    image: tour.image,
    price: tour.rawPrice ?? null,
    currency: tour.currency || "USD",
    duration: tour.days,
    href,
  };

  const ratingVal = tour.rating ? tour.rating.toFixed(1) : "4.9";
  const reviewCountStr = tour.reviews || "1,842 reviews";

  // Dynamic discount badge calculation
  const calculatedPct =
    tour.originalPrice && tour.rawPrice && tour.originalPrice > tour.rawPrice
      ? Math.round(
          ((tour.originalPrice - tour.rawPrice) / tour.originalPrice) * 100,
        )
      : null;
  const dealBadge =
    tour.discountBadge ||
    (calculatedPct ? `Save ${calculatedPct}%` : "Special Deal");

  return (
    <article
      data-deal-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 h-full"
    >
      {/* Image with Deal badge, Location badge & Wishlist button */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100 shrink-0">
        <Link href={href} className="block h-full w-full">
          <MarketingImage
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Subtle vignette for badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

        {/* Top-Left Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-600/30">
            <Sparkles size={11} className="fill-white animate-sparkle-glow" />
            <span>{dealBadge}</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
            <MapPin size={11} className="text-orange-400 shrink-0" />
            <span className="truncate max-w-[110px]">{tour.place}</span>
          </span>
        </div>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={
            wishlisted
              ? `Remove ${tour.title} from wishlist`
              : `Add ${tour.title} to wishlist`
          }
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md transition-all duration-200 hover:scale-115 active:scale-90 hover:bg-white focus:outline-none cursor-pointer"
        >
          <Heart
            size={16}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-slate-400/40 text-slate-700"
            }
          />
        </button>
      </div>

      {/* Tour details */}
      <div className="pt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Title and duration badge - fixed min-h so 1-line and 2-line titles match in height */}
          <div className="flex items-start justify-between gap-2.5 min-h-[46px] sm:min-h-[48px]">
            <Link href={href} className="block flex-1 min-w-0">
              <h3 className="line-clamp-2 text-base sm:text-[17px] font-bold text-slate-900 transition-colors group-hover:text-pub-secondary leading-snug">
                {tour.title}
              </h3>
            </Link>
            <span className="shrink-0 rounded-lg border border-orange-200/80 bg-orange-50/70 px-2 py-0.5 text-[10px] font-extrabold text-[#E4572E] tracking-wide">
              {tour.durationTag || "8D | 7N"}
            </span>
          </div>

          {/* 5 Yellow Stars + Rating + Review count */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <b className="font-extrabold text-slate-900">{ratingVal}</b>
            <span className="text-slate-400 font-medium">({reviewCountStr})</span>
          </div>
        </div>

        {/* Price Row: From $old $new pp + View Deal button */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-slate-400">From</span>
              {tour.originalPrice != null && (
                <span className="text-xs font-normal text-slate-400 line-through">
                  {format(tour.originalPrice, tour.currency || "USD")}
                </span>
              )}
              <strong className="text-xl sm:text-2xl font-black text-slate-950">
                {tour.rawPrice != null
                  ? format(tour.rawPrice, tour.currency || "USD")
                  : format(999, "USD")}
              </strong>
              <span className="text-xs font-bold text-slate-500">pp</span>
            </div>
          </div>

          <Link
            href={href}
            aria-label={`View deal: ${tour.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1527] text-white shadow-xs transition-all duration-300 group-hover:bg-[#E4572E] group-hover:scale-108 group-hover:shadow-md active:scale-95"
          >
            <ArrowRight size={15} className="stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function TopDealsSection({
  tours,
  loading,
}: {
  tours: Tour[];
  loading?: boolean;
}) {
  const [activeTab, setActiveTab] = useState("Top deals");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 100% Dynamic tabs based on real tour destinations in the current deals
  const tabs = useMemo(() => {
    const placesMap = new Map<string, number>();
    for (const t of tours) {
      if (!t.place) continue;
      const parts = t.place
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const dest = parts[parts.length - 1] || t.place.trim();
      if (dest && !/worldwide/i.test(dest)) {
        const canonical = dest.charAt(0).toUpperCase() + dest.slice(1);
        placesMap.set(canonical, (placesMap.get(canonical) || 0) + 1);
      }
    }

    const uniquePlaces = Array.from(placesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([place]) => place);

    if (uniquePlaces.length > 0) {
      return [
        "Top deals",
        ...uniquePlaces.map((place) => `${place} deals`),
      ];
    }

    return ["Top deals"];
  }, [tours]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0] || "Top deals");
    }
  }, [tabs, activeTab]);

  const filteredTours = useMemo(() => {
    if (activeTab === "Top deals" || activeTab === "All deals") {
      return tours;
    }
    const keyword = activeTab
      .replace(/\s+deals$/i, "")
      .toLowerCase()
      .trim();
    return tours.filter((t) => {
      const place = (t.place || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      return place.includes(keyword) || title.includes(keyword);
    });
  }, [activeTab, tours]);

  const displayTours = filteredTours;

  const move = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-deal-card]");
    const gap = 20; // 1.25rem gap-5
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section className="relative w-full overflow-hidden my-8 sm:my-12 py-10 sm:py-16 bg-gradient-to-b from-white via-[#FAF7F2] to-[#F5F0E8] border-y border-slate-200/60 shadow-2xs">
      {/* Ambient decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-orange-200/20 via-amber-100/15 to-transparent blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tl from-amber-200/15 via-orange-100/10 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        {/* Top Filter Pills + View all deals link */}
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-auto sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-[#E4572E] text-white shadow-md shadow-orange-500/25 scale-[1.02]"
                      : "border border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white hover:border-orange-300 hover:text-slate-900 hover:scale-[1.02] shadow-2xs"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <Link
            href={
              activeTab === "All deals" || activeTab === "Top deals"
                ? "/tours?sort=price_asc"
                : `/tours?sort=price_asc&search=${encodeURIComponent(
                    activeTab.replace(/\s+deals$/i, "").trim(),
                  )}`
            }
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#E4572E] hover:text-[#c4411b] transition-colors group"
          >
            <span>View all deals</span>
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Header Row: Title & Arrow Buttons */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E4572E] mb-2">
              <Sparkles size={12} className="fill-current animate-sparkle-glow" />
              <span>Limited Time Offers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-slate-950 tracking-tight">
              Top Deals
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Handpicked guided tours with verified discounts. Book early to lock in the lowest rates.
            </p>
          </div>

          {!loading && displayTours.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous deals"
                onClick={() => move(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Next deals"
                onClick={() => move(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronRight size={18} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel list: No left/right cut off, full show on all viewports */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start"
              >
                <TourCardSkeleton />
              </div>
            ))
          ) : displayTours.length > 0 ? (
            displayTours.map((tour, index) => (
              <TopDealCard key={`${tour.title}-${index}`} tour={tour} />
            ))
          ) : (
            <EmptyCollection
              message="No deals found for this destination."
              href="/tours?sort=price_asc"
              linkLabel="Browse all deals"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function FavouriteCountriesSection({
  destinations = DEFAULT_FAVOURITE_COUNTRIES,
  title = "Favourite Countries for Travellers from UK",
  subtitle = "Explore the destinations our UK travellers love most from sun-soaked coastlines to iconic cultural gems.",
}: {
  destinations?: CountryDestination[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="py-10 sm:py-14">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">
          {title}
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* 8 Country Cards in Responsive Grid */}
      <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {destinations.map((country) => (
          <Link
            key={country.name}
            href={
              country.href ||
              `/tours?country=${encodeURIComponent(country.name)}`
            }
            className="group relative h-[420px] w-full overflow-hidden rounded-[20px] bg-white p-4 border border-slate-200/80 shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none flex flex-col"
          >
            {/* Inner Image Container with 16px radius */}
            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-slate-900">
              <img
                src={country.image}
                alt={country.name}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />

              {/* Gradient overlays for crisp contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/15" />

              {/* Top-Left Location Badge */}
              <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                <MapPin size={11} className="shrink-0 text-white" />
                <span>{country.badge || country.name}</span>
              </span>

              {/* Bottom Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 text-left">
                <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight drop-shadow-sm transition-colors duration-200 group-hover:text-pub-secondary">
                  {`${country.name} tours`}
                </h3>
                <div className="mt-2.5 flex items-start gap-2 text-xs text-white/90 leading-relaxed font-medium">
                  <SquareCheckBig
                    size={14}
                    className="mt-0.5 shrink-0 text-orange-400 stroke-[2.2] transition-transform duration-300 group-hover:scale-110 group-hover:text-pub-secondary"
                  />
                  <p className="line-clamp-3 text-white/90 drop-shadow">
                    {country.snippet}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const DEFAULT_ABOUT_HEADING = "About Tourvaa";
const DEFAULT_ABOUT_BODY =
  "Tourvaa is a premier travel platform dedicated to crafting extraordinary group travel experiences across the globe. We connect passionate travellers with expertly curated tours, handpicked destinations, and seamless end-to-end booking — from visa assistance to on-ground coordination. Whether it's the serene backwaters of Kerala, the alpine trails of Switzerland, or the vibrant streets of Tokyo, Tourvaa makes every journey effortless, memorable, and truly unforgettable.";

function AboutTourvaaBanner({
  heading = DEFAULT_ABOUT_HEADING,
  body = DEFAULT_ABOUT_BODY,
  image = "/images/about-mountain.png",
}: {
  heading?: string;
  body?: string;
  image?: string;
}) {
  return (
    <section className="relative w-full overflow-hidden my-6 sm:my-10 py-14 sm:py-20 lg:py-24 shadow-sm">
      {/* High-res Panoramic Mountain Background */}
      <img
        src={image}
        alt="About Tourvaa - Alpine mountain landscape"
        className="absolute inset-0 h-full w-full object-full object-center "
      />
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-brightness-90" />

      {/* Text Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-10 text-center text-white">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-tight text-white drop-shadow-md">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-4xl text-xs sm:text-sm md:text-[15px] leading-relaxed text-white/95 drop-shadow">
          {body}
        </p>
      </div>
    </section>
  );
}

function TrendingTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const href = tour.id
    ? publicTourUrl(tour)
    : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = {
    id: itemId,
    title: tour.title,
    place: tour.place,
    image: tour.image,
    price: tour.rawPrice ?? null,
    currency: tour.currency || "USD",
    duration: tour.days,
    href,
  };

  const ratingVal = tour.rating ? tour.rating.toFixed(1) : "4.8";
  const reviewCountStr = tour.reviews || "3,692 reviews";

  // Dynamic discount badge calculation
  const calculatedPct =
    tour.originalPrice && tour.rawPrice && tour.originalPrice > tour.rawPrice
      ? Math.round(
          ((tour.originalPrice - tour.rawPrice) / tour.originalPrice) * 100,
        )
      : null;
  const discountLabel =
    tour.discountBadge ||
    (calculatedPct ? `Save ${calculatedPct}%` : undefined);

  return (
    <article
      data-trending-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 h-full"
    >
      {/* Top Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100 shrink-0">
        <Link href={href} className="block h-full w-full">
          <MarketingImage
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

        {/* Location pill badge (top-left) */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
            <MapPin size={11} className="text-orange-400 shrink-0" />
            <span className="truncate max-w-[120px]">{tour.place}</span>
          </span>
        </div>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={
            wishlisted
              ? `Remove ${tour.title} from wishlist`
              : `Add ${tour.title} to wishlist`
          }
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md transition-all duration-200 hover:scale-115 active:scale-90 hover:bg-white focus:outline-none cursor-pointer"
        >
          <Heart
            size={16}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-slate-400/40 text-slate-700"
            }
          />
        </button>

        {/* Discount Pill (floating bottom-right of image) */}
        {discountLabel && (
          <span className="absolute bottom-3 right-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-red-600/30 animate-gentle-pulse">
            <Sparkles size={11} className="fill-white animate-sparkle-glow" />
            <span>{discountLabel}</span>
          </span>
        )}
      </div>

      {/* Tour details */}
      <div className="pt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Title and Duration - fixed min-h matches 1-line and 2-line cards */}
          <div className="flex items-start justify-between gap-2.5 min-h-[46px] sm:min-h-[48px]">
            <Link href={href} className="block flex-1 min-w-0">
              <h3 className="line-clamp-2 text-base sm:text-[17px] font-bold text-slate-900 transition-colors group-hover:text-pub-secondary leading-snug">
                {tour.title}
              </h3>
            </Link>
            <span className="shrink-0 rounded-lg border border-sky-200/80 bg-sky-50/70 px-2 py-0.5 text-[10px] font-extrabold text-sky-700 tracking-wide">
              {tour.durationTag || "7D | 6N"}
            </span>
          </div>

          {/* 5 Yellow Stars + Rating + Reviews */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <b className="font-extrabold text-slate-900">{ratingVal}</b>
            <span className="text-slate-400 font-medium">({reviewCountStr})</span>
          </div>

          {/* 4 Feature bullets grid */}
          {tour.features && tour.features.length > 0 && (
            <div className="mt-3.5 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-slate-600 font-medium">
              {tour.features.map((feature, index) => (
                <p key={index} className="flex items-center gap-2">
                  <feature.icon size={13} className="shrink-0 text-sky-500 stroke-[2]" />
                  <span className="truncate">{feature.text}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Row: From $old $new pp + Action button */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-slate-400">From</span>
              {tour.originalPrice != null && (
                <span className="text-xs font-normal text-slate-400 line-through">
                  {format(tour.originalPrice, tour.currency || "USD")}
                </span>
              )}
              <strong className="text-xl sm:text-2xl font-black text-slate-950">
                {tour.rawPrice != null
                  ? format(tour.rawPrice, tour.currency || "USD")
                  : format(1575, "USD")}
              </strong>
              <span className="text-xs font-bold text-slate-500">pp</span>
            </div>
          </div>

          <Link
            href={href}
            aria-label={`View tour: ${tour.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1527] text-white shadow-xs transition-all duration-300 group-hover:bg-[#E4572E] group-hover:scale-108 group-hover:shadow-md active:scale-95"
          >
            <ArrowRight size={15} className="stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function TrendingToursSection({
  tours,
  loading,
}: {
  tours: Tour[];
  loading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-trending-card]");
    const gap = 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const displayTours = tours;

  return (
    <section className="relative w-full overflow-hidden my-8 sm:my-12 py-10 sm:py-16 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9] border-y border-slate-200/70 shadow-2xs">
      {/* Ambient decorative glowing blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-bl from-sky-200/20 via-blue-100/15 to-transparent blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-sky-200/15 via-slate-100/20 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        {/* Section Header with Arrows on right */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-800 mb-2">
              <Sparkles size={12} className="fill-current text-sky-600 animate-sparkle-glow" />
              <span>Trending Worldwide</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-slate-950 tracking-tight">
              Trending Tour Packages
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
              Most-booked itineraries loved by our global travel community this season.
            </p>
          </div>

          {!loading && displayTours.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous tours"
                onClick={() => move(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-sky-500 hover:text-sky-600 hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Next tours"
                onClick={() => move(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-sky-500 hover:text-sky-600 hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronRight size={18} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel list: No left/right cut off, full show on all viewports */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start"
              >
                <TourCardSkeleton />
              </div>
            ))
          ) : displayTours.length > 0 ? (
            displayTours.map((tour, index) => (
              <TrendingTourCard key={`${tour.title}-${index}`} tour={tour} />
            ))
          ) : (
            <EmptyCollection
              message="No featured tours are available yet."
              href="/tours"
              linkLabel="Browse all tours"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function HandpickedTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const href = tour.id
    ? publicTourUrl(tour)
    : `/tours?search=${encodeURIComponent(tour.title)}`;
  const travelItem = {
    id: itemId,
    title: tour.title,
    place: tour.place,
    image: tour.image,
    price: tour.rawPrice ?? null,
    currency: tour.currency || "USD",
    duration: tour.days,
    href,
  };

  const ratingVal = tour.rating ? tour.rating.toFixed(1) : "4.9";
  const reviewCountStr = tour.reviews || "1,842 reviews";

  return (
    <article
      data-handpicked-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 h-full"
    >
      {/* Image with Location badge & Wishlist */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100 shrink-0">
        <Link href={href} className="block h-full w-full">
          <MarketingImage
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />

        {/* Location pill badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white shadow-xs transition-transform duration-300 group-hover:scale-105">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate max-w-[120px]">{tour.place}</span>
        </span>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={
            wishlisted
              ? `Remove ${tour.title} from wishlist`
              : `Add ${tour.title} to wishlist`
          }
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md transition-all duration-200 hover:scale-115 active:scale-90 hover:bg-white focus:outline-none cursor-pointer"
        >
          <Heart
            size={16}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-slate-400/40 text-slate-700"
            }
          />
        </button>
      </div>

      {/* Tour details */}
      <div className="pt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Title and duration tag - fixed min-h ensures 1-line and 2-line cards match in height */}
          <div className="flex items-start justify-between gap-2 min-h-[46px] sm:min-h-[48px]">
            <Link href={href} className="block flex-1 min-w-0">
              <h3 className="line-clamp-2 text-base sm:text-[17px] font-semibold text-slate-900 transition-colors duration-200 group-hover:text-pub-secondary leading-snug">
                {tour.title}
              </h3>
            </Link>
            <span className="shrink-0 rounded-md border border-[#E4572E]/40 bg-orange-50/40 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E4572E] tracking-wide transition-colors duration-200 group-hover:bg-orange-100/50">
              {tour.durationTag || "8D | 7N"}
            </span>
          </div>

          {/* 5 Yellow Stars + Rating + Review count */}
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <b className="font-bold text-slate-900">{ratingVal}</b>
            <span className="text-slate-400 font-normal">({reviewCountStr})</span>
          </div>
        </div>

        {/* Price Row: From $old $new pp */}
        <div className="mt-5 flex items-baseline gap-1.5 text-xs border-t border-slate-100 pt-3">
          <span className="font-extrabold text-slate-900 text-sm">From</span>
          {tour.originalPrice != null && (
            <span className="text-xs font-normal text-slate-400 line-through">
              {format(tour.originalPrice, tour.currency || "USD")}
            </span>
          )}
          <strong className="text-xl font-black text-slate-950">
            {tour.rawPrice != null
              ? format(tour.rawPrice, tour.currency || "USD")
              : format(999, "USD")}
          </strong>
          <span className="text-xs font-bold text-slate-900">pp</span>
        </div>
      </div>
    </article>
  );
}

function HandpickedToursSection({
  tours,
  loading,
}: {
  tours: Tour[];
  loading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-handpicked-card]");
    const gap = 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const displayTours = tours;

  return (
    <section className="py-8 sm:py-10">
      {/* Section Header with Arrows on right */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">
          Handpicked Tours for You
        </h2>

        {!loading && displayTours.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous tours"
              onClick={() => move(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 hover:border-pub-secondary hover:text-pub-secondary hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
            <button
              type="button"
              aria-label="Next tours"
              onClick={() => move(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 hover:border-pub-secondary hover:text-pub-secondary hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight size={16} className="stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel list: No left/right cut off, full show on all viewports */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start"
            >
              <TourCardSkeleton />
            </div>
          ))
        ) : displayTours.length > 0 ? (
          displayTours.map((tour, index) => (
            <HandpickedTourCard key={`${tour.title}-${index}`} tour={tour} />
          ))
        ) : (
          <EmptyCollection
            message="No tours found in this selection."
            href="/tours"
            linkLabel="Browse all tours"
          />
        )}
      </div>
    </section>
  );
}

function CountriesWorthExploringSection({
  countries,
  loading,
}: {
  countries: CountryWorthExploring[];
  loading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-country-card]");
    const gap = 20;
    const step = firstCard ? firstCard.offsetWidth + gap : 320;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const displayCountries = countries;

  return (
    <section className="relative w-full overflow-hidden my-8 sm:my-14 py-12 sm:py-20 bg-gradient-to-b from-white via-[#FAF7F2] to-[#F4EFE7] border-y border-slate-200/60 shadow-2xs">
      {/* Ambient decorative glowing blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-bl from-amber-200/20 via-orange-100/15 to-transparent blur-3xl animate-float-orb" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-100/20 via-slate-100/20 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 mb-2">
              <Sparkles size={12} className="fill-current text-amber-600 animate-sparkle-glow" />
              <span>Global Destinations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-slate-950 tracking-tight">
              Countries Worth Exploring
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
              Iconic landscapes, rich cultures, and unforgettable adventures across the world&apos;s most sought-after countries.
            </p>
          </div>

          {!loading && displayCountries.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous countries"
                onClick={() => move(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                aria-label="Next countries"
                onClick={() => move(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-[#E4572E] hover:text-[#E4572E] hover:scale-110 active:scale-90 hover:shadow-sm cursor-pointer"
              >
                <ChevronRight size={18} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel: No left/right cut off, full show on all viewports */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start h-72 animate-pulse rounded-[22px] bg-white/60 border border-slate-200/60"
              />
            ))
          ) : displayCountries.length > 0 ? (
            displayCountries.map((country, index) => (
              <CountryWorthExploringCard
                key={`${country.name}-${index}`}
                country={country}
              />
            ))
          ) : (
            <EmptyCollection
              message="No destinations are available yet."
              href="/tours"
              linkLabel="Browse all tours"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function CountryWorthExploringCard({
  country,
}: {
  country: CountryWorthExploring;
}) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const itemId = stableHash(`country-${country.name}`);
  const wishlisted = isWishlisted(itemId);
  const href = `/tours?country=${encodeURIComponent(country.name)}`;

  const travelItem = {
    id: itemId,
    title: `${country.name} Tours`,
    place: country.name,
    image: country.image,
    price: null,
    currency: "USD",
    duration: country.count,
    href,
  };

  const ratingVal = (country.rating ?? 4.9).toFixed(1);

  return (
    <div
      data-country-card
      className="group relative w-full sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] shrink-0 snap-start overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-full"
    >
      {/* Top Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100 shrink-0">
        <Link href={href} className="block h-full w-full">
          <img
            src={country.image}
            alt={country.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </Link>

        {/* Subtle vignette for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

        {/* Popular orange badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-orange-600/30">
          <Sparkles size={11} className="fill-white animate-sparkle-glow" />
          <span>{country.badge || "Popular"}</span>
        </span>

        {/* Wishlist button (top-right) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(travelItem);
          }}
          aria-label={
            wishlisted
              ? `Remove ${country.name} from wishlist`
              : `Add ${country.name} to wishlist`
          }
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md transition-all duration-200 hover:scale-115 active:scale-90 hover:bg-white focus:outline-none cursor-pointer"
        >
          <Heart
            size={16}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-slate-400/40 text-slate-700"
            }
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="pt-4 flex flex-col justify-between flex-1">
        <div>
          {/* Name and Rating */}
          <div className="flex items-center justify-between gap-2 min-h-[32px]">
            <Link href={href} className="block min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-pub-secondary">
                {country.name}
              </h3>
            </Link>
            <div className="flex items-center gap-1 text-xs font-extrabold text-slate-800 shrink-0 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{ratingVal}</span>
            </div>
          </div>

          {/* Packages count with map/book icon */}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <BookOpen size={13} className="text-sky-500 shrink-0 stroke-[2]" />
            <span>{country.count}</span>
          </p>
        </div>

        {/* Bottom Explore action */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500">
            Explore packages
          </span>
          <Link
            href={href}
            aria-label={`Explore ${country.name} tours`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1527] text-white shadow-xs transition-all duration-300 group-hover:bg-[#E4572E] group-hover:scale-110 active:scale-95"
          >
            <ArrowRight size={14} className="stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);
  const [topDeals, setTopDeals] = useState<Tour[]>([]);
  const [heroExtras, setHeroExtras] = useState<Partial<HeroExtrasBlock>>({});
  const [aboutSection, setAboutSection] = useState<Partial<AboutSectionBlock>>({});
  const [blogTeaser, setBlogTeaser] = useState<Partial<BlogTeaserBlock>>({});
  const [airportTransfer, setAirportTransfer] = useState<Partial<AirportTransferBlock>>({});
  const [favouriteCountries, setFavouriteCountries] = useState<
    CountryDestination[]
  >(DEFAULT_FAVOURITE_COUNTRIES);
  const [trendingTours, setTrendingTours] = useState<Tour[]>([]);
  const [handpickedTours, setHandpickedTours] = useState<Tour[]>([]);
  const [countriesWorthExploring, setCountriesWorthExploring] = useState<
    CountryWorthExploring[]
  >([]);
  const [dynamicReviews, setDynamicReviews] = useState<
    {
      quote: string;
      name: string;
      city: string;
      tourName: string;
      initials: string;
      rating: number;
      image?: string | null;
    }[]
  >(CURATED_REVIEWS);
  const [dynamicFaqs, setDynamicFaqs] =
    useState<{ question: string; answer: string }[]>(FAQS);
  const [directoryCountries, setDirectoryCountries] =
    useState<string[]>(DIRECTORY_COUNTRIES);
  const [directoryCities, setDirectoryCities] =
    useState<string[]>(DIRECTORY_CITIES);
  const [directoryCategories, setDirectoryCategories] =
    useState<string[]>(DIRECTORY_CATEGORIES);
  const [searchCountries, setSearchCountries] = useState<PublicCountry[]>([]);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetchHomepageBanners(),
      fetchFeaturedTours(20),
      fetchPopularDestinations(),
      fetchCustomerReviews(),
      fetchPublicCountries(),
      fetchPublicCities(),
      fetchPublicCategories(),
      fetchPopularTours(),
      fetchToursOnDeals(),
      fetchHelpCentre(),
      fetchHandpickedTours(),
      fetchFavouriteCountries(),
      fetchContentBlock<HeroExtrasBlock>("hero_extras"),
      fetchContentBlock<AboutSectionBlock>("about_section"),
      fetchContentBlock<BlogTeaserBlock>("blog_teaser"),
      fetchContentBlock<AirportTransferBlock>("airport_transfer"),
    ]).then(
      ([
        bannerResult,
        tourResult,
        destinationResult,
        reviewResult,
        countryResult,
        cityResult,
        categoryResult,
        popularTourResult,
        dealTourResult,
        helpResult,
        handpickedTourResult,
        favouriteCountryResult,
        heroExtrasResult,
        aboutSectionResult,
        blogTeaserResult,
        airportTransferResult,
      ]) => {
        if (!active) return;
        if (heroExtrasResult.status === "fulfilled") setHeroExtras(heroExtrasResult.value.data);
        if (aboutSectionResult.status === "fulfilled") setAboutSection(aboutSectionResult.value.data);
        if (blogTeaserResult.status === "fulfilled") setBlogTeaser(blogTeaserResult.value.data);
        if (airportTransferResult.status === "fulfilled") setAirportTransfer(airportTransferResult.value.data);
        if (bannerResult.status === "fulfilled" && bannerResult.value.length)
          setBanners(bannerResult.value);
        if (tourResult.status === "fulfilled" && tourResult.value.length) {
          const mapped = tourResult.value.map((tour) => mapPublicTour(tour));
          // Each section gets its own non-overlapping slice of live tours so the
          // three "sections" don't just repeat the same items; curated data is
          // kept only as a per-section fallback when that slice comes up empty.
          // Trending/Top Deals get overridden below by their CMS-picked lists
          // when the admin has pinned tours there, so Handpicked (which has no
          // CMS list of its own) gets the larger share of this generic fetch.
          const trendingSlice = mapped.slice(0, 6);
          const topDealsSlice = mapped.slice(6, 12);
          const handpickedSlice = mapped.slice(12, 20);
          if (trendingSlice.length) setTrendingTours(trendingSlice);
          if (topDealsSlice.length) setTopDeals(topDealsSlice);
          if (handpickedSlice.length) setHandpickedTours(handpickedSlice);
        }
        if (
          countryResult.status === "fulfilled" &&
          countryResult.value.length
        ) {
          const cmsDestinations =
            destinationResult.status === "fulfilled"
              ? destinationResult.value
              : [];
          const cmsMap = new Map(
            cmsDestinations.map((d) => [d.title.trim().toLowerCase(), d]),
          );

          // Favourite Countries falls back to the hardcoded list (enriched
          // with matched CMS "Countries" images) only when the admin hasn't
          // curated a dedicated Favourite Countries list of their own.
          const curatedFavourites =
            favouriteCountryResult.status === "fulfilled"
              ? favouriteCountryResult.value.filter((r) => r.is_active !== false)
              : [];
          if (curatedFavourites.length) {
            setFavouriteCountries(
              [...curatedFavourites]
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((item) => ({
                  name: item.title,
                  badge: item.title,
                  image: item.image ? mediaUrl(item.image) : PLACEHOLDER_IMAGE,
                  snippet: item.snippet || "",
                  href: item.href || undefined,
                })),
            );
          } else {
            setFavouriteCountries((prev) =>
              prev.map((item) => {
                const match = cmsMap.get(item.name.toLowerCase());
                if (match?.image) {
                  return { ...item, image: mediaUrl(match.image) };
                }
                return item;
              }),
            );
          }

          // "Countries Worth Exploring" - the top countries by real published
          // tour count, not a hardcoded name list; images come from the CMS
          // Destinations list when a title match exists.
          const topCountries = topDestinationsFromCountries(
            countryResult.value,
            cmsDestinations,
            6,
          );
          if (topCountries.length) setCountriesWorthExploring(topCountries);

          setSearchCountries(countryResult.value);
          setDirectoryCountries(countryResult.value.map((c) => c.country_name));
        }
        if (cityResult.status === "fulfilled" && cityResult.value.length) {
          setDirectoryCities(cityResult.value.map((c) => c.city_name));
        }
        if (
          categoryResult.status === "fulfilled" &&
          categoryResult.value.length
        ) {
          setDirectoryCategories(
            categoryResult.value.map((c) => c.category_name),
          );
        }
        if (reviewResult.status === "fulfilled" && reviewResult.value.length) {
          const cmsReviews = reviewResult.value
            .filter((r) => r.is_active !== false)
            .map(mapReview);
          if (cmsReviews.length > 0) {
            setDynamicReviews(cmsReviews);
          }
        }
        if (helpResult.status === "fulfilled" && helpResult.value.length) {
          const cmsFaqs = helpResult.value
            .filter((h) => h.is_active !== false)
            .map((h) => ({ question: h.question, answer: h.answer }));
          if (cmsFaqs.length > 0) setDynamicFaqs(cmsFaqs);
        }

        // "Trending Tour Packages" - admin-picked via CMS "Popular Tours"
        // (admin/cms). Each entry only carries the tour id, so the full tour
        // record is resolved separately before rendering.
        if (
          popularTourResult.status === "fulfilled" &&
          popularTourResult.value.length
        ) {
          const refs = popularTourResult.value.filter(
            (r) => r.is_active !== false,
          );
          Promise.allSettled(
            refs.map((ref) => fetchPublicTourDetail(ref.tour_id)),
          ).then((results) => {
            if (!active) return;
            const tours = results
              .filter(
                (
                  r,
                ): r is PromiseFulfilledResult<
                  Awaited<ReturnType<typeof fetchPublicTourDetail>>
                > => r.status === "fulfilled",
              )
              .map((r) => mapPublicTour(r.value));
            if (tours.length) setTrendingTours(tours);
          });
        }

        // "Handpicked Tours for You" - admin-picked via its own CMS
        // "Handpicked" list, separate from Trending. Falls back to mirroring
        // whatever's pinned to Trending when no dedicated Handpicked list has
        // been curated yet, so existing sites don't suddenly go empty.
        const handpickedRefs =
          handpickedTourResult.status === "fulfilled" && handpickedTourResult.value.length
            ? handpickedTourResult.value.filter((r) => r.is_active !== false)
            : popularTourResult.status === "fulfilled"
              ? popularTourResult.value.filter((r) => r.is_active !== false)
              : [];
        if (handpickedRefs.length) {
          Promise.allSettled(
            handpickedRefs.map((ref) => fetchPublicTourDetail(ref.tour_id)),
          ).then((results) => {
            if (!active) return;
            const tours = results
              .filter(
                (
                  r,
                ): r is PromiseFulfilledResult<
                  Awaited<ReturnType<typeof fetchPublicTourDetail>>
                > => r.status === "fulfilled",
              )
              .map((r) => mapPublicTour(r.value));
            if (tours.length) setHandpickedTours(tours);
          });
        }

        // "Top Deals" - admin-picked via CMS "Deals" (admin/cms > Deals), same
        // resolve-by-id pattern, plus the admin's deal_label overrides the
        // tour's own real discount badge (from discount_percentage) when set.
        if (
          dealTourResult.status === "fulfilled" &&
          dealTourResult.value.length
        ) {
          const refs = dealTourResult.value.filter(
            (r) => r.is_active !== false,
          );
          Promise.allSettled(
            refs.map((ref) => fetchPublicTourDetail(ref.tour_id)),
          ).then((results) => {
            if (!active) return;
            const tours = refs
              .map((ref, index) => ({ ref, result: results[index] }))
              .filter(
                (
                  entry,
                ): entry is {
                  ref: (typeof refs)[number];
                  result: PromiseFulfilledResult<
                    Awaited<ReturnType<typeof fetchPublicTourDetail>>
                  >;
                } => entry.result.status === "fulfilled",
              )
              .map(({ ref, result }) => {
                const mapped = mapPublicTour(result.value);
                return ref.deal_label
                  ? { ...mapped, discountBadge: ref.deal_label }
                  : mapped;
              });
            if (tours.length) setTopDeals(tours);
          });
        }

        setLoadingHome(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const banner = banners[bannerIndex];
  const heroImage = banner?.image
    ? mediaUrl(banner.image)
    : "/images/hero-1.jpg";
  const heroVideo = banner?.video ? mediaUrl(banner.video) : null;

  // A video banner advances on its own "ended" event (below) so it always
  // plays in full instead of getting cut off mid-playback by a fixed timer -
  // the interval below only drives rotation while the CURRENT banner is a
  // plain image.
  useEffect(() => {
    if (banners.length < 2 || heroVideo) return;
    const timer = window.setInterval(
      () => setBannerIndex((index) => (index + 1) % banners.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [banners.length, heroVideo]);

  const [showOfferBanner, setShowOfferBanner] = useState(true);
  const heroTitle = banner?.title || "Endless destinations. One easy search.";

  // Hero trust badge + offer strip: a customized field (even one left blank
  // on purpose, e.g. to hide the offer strip) always wins over the default.
  const heroRating = heroExtras.rating !== undefined ? Number(heroExtras.rating) : 4.5;
  const heroReviewCount = heroExtras.review_count !== undefined ? Number(heroExtras.review_count) : 522;
  const heroReviewSource = heroExtras.review_source !== undefined ? heroExtras.review_source : "Ayatiworks";
  const heroOfferText =
    heroExtras.offer_text !== undefined
      ? heroExtras.offer_text
      : "Global Getaways 2026: Up To 50% Off – Limited Availability, Book Today!";
  const heroOfferCtaUrl = heroExtras.offer_cta_url?.trim() || "";
  const heroOfferCtaText = heroExtras.offer_cta_text?.trim() || "";

  // Dynamic visual banner & trust hook data
  const promoCmsBanner = useMemo(() => {
    return banners.length > 1 ? banners[1] : null;
  }, [banners]);

  const maxDealDiscount = useMemo(() => {
    let max = 0;
    for (const t of topDeals) {
      if (t.discountBadge) {
        const match = t.discountBadge.match(/\d+/);
        if (match) max = Math.max(max, parseInt(match[0], 10));
      }
    }
    return max > 0 ? max : 60;
  }, [topDeals]);

  const visualBannerBadge = ((heroExtras as Record<string, unknown>).deal_badge as string) || "Offer Ends Soon";
  const visualBannerTitle = promoCmsBanner?.title ||
    ((heroExtras as Record<string, unknown>).deal_title as string) ||
    `Big Adventures. Smaller Prices. Save up to ${maxDealDiscount}% off.`;
  const visualBannerSubtitle = promoCmsBanner?.subtitle ||
    ((heroExtras as Record<string, unknown>).deal_subtitle as string) ||
    "Explore handpicked tours at special prices and make your next journey one to remember.";
  const visualBannerCtaText = promoCmsBanner?.cta_text ||
    ((heroExtras as Record<string, unknown>).deal_cta_text as string) ||
    "Explore Deals";
  const visualBannerCtaUrl = promoCmsBanner?.cta_url ||
    ((heroExtras as Record<string, unknown>).deal_cta_url as string) ||
    "/tours?sort=price_asc";
  const visualBannerImage = promoCmsBanner?.image
    ? mediaUrl(promoCmsBanner.image)
    : "/images/destination-alpine.jpg";

  const subHeroText = ((heroExtras as Record<string, unknown>).sub_hero_text as string) ||
    "Explore handpicked tours from trusted travel partners and book your next adventure with confidence.";

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      {/* Contained Hero Section */}
      <div className="relative z-30 mx-auto max-w-[1400px] px-5 pt-3 pb-4 sm:pb-6">
        <section className="relative flex min-h-[480px] w-full flex-col justify-between items-center rounded-[20px] p-4 sm:p-6 text-center text-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
          {/* Background image/video & gradient overlay (clipped to rounded corners) */}
          <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
            {heroVideo ? (
              <video
                key={heroVideo}
                src={heroVideo}
                poster={heroImage}
                autoPlay
                loop={banners.length < 2}
                onEnded={
                  banners.length > 1
                    ? () =>
                        setBannerIndex((index) => (index + 1) % banners.length)
                    : undefined
                }
                muted
                playsInline
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <MarketingImage fill sizes="100vw" preload
                key={heroImage}
                src={heroImage}
                alt={banner?.title || "Scenic mountain lake landscape"}
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/50" />
          </div>

          {/* Hero Top & Center Content */}
          <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-2 sm:pt-4 pb-2">
            <h1
              key={heroTitle}
              className="animate-fade-up max-w-4xl text-2xl sm:text-4xl md:text-[40px] font-semibold tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            >
              {heroTitle}
            </h1>

            {banner?.subtitle && (
              <p className="animate-fade-up delay-100 mx-auto mt-2 max-w-xl text-xs sm:text-sm text-white/90 drop-shadow">
                {banner.subtitle}
              </p>
            )}

            {banner?.cta_text && banner?.cta_url && (
              <Link
                href={banner.cta_url}
                className="animate-fade-up delay-100 mt-3 inline-flex items-center gap-2 rounded-full bg-pub-accent px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                {banner.cta_text}
              </Link>
            )}

            {/* Filter Search Bar */}
            <div
              className={`mt-4 sm:mt-5 w-full relative z-50 transition-all duration-300`}
            >
              <HeroFilterBar
                countries={searchCountries}
                onPanelOpenChange={setSearchPanelOpen}
              />
            </div>

            {/* Social Proof / Traveller Rating */}
            <div
              className={`mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] relative z-10 transition-all duration-200 ${searchPanelOpen ? "opacity-0 pointer-events-none invisible" : "opacity-100"}`}
            >
              <span className="font-normal text-white/95">
                Tourvaa travellers rate us
              </span>
              <span className="font-semibold text-white">Excellent</span>
              <span className="inline-flex items-center gap-0.5 mx-1">
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star
                  size={14}
                  className="fill-pub-secondary text-pub-secondary"
                />
                <Star size={14} className="fill-white/40 text-white/60" />
              </span>
              <span className="font-bold text-white">{heroRating.toFixed(1)}</span>
              <span className="text-white/90">
                {`out of 5 based on ${heroReviewCount.toLocaleString()} reviews on ${heroReviewSource}`}
              </span>
            </div>
          </div>

          {/* Bottom Offer Capsule */}
          {showOfferBanner && heroOfferText && (
            <div
              className={`relative z-10 w-full max-w-[1020px] mx-auto mt-2 transition-all duration-200 ${searchPanelOpen ? "opacity-0 pointer-events-none invisible" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-slate-950/40 backdrop-blur-md px-4 sm:px-6 py-2 text-xs sm:text-sm text-white shadow-xl transition-all">
                <div className="flex items-center gap-2 shrink-0">
                  <Globe size={14} className="text-white/80 shrink-0" />
                  <span className="rounded-md bg-pub-accent px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
                    OFFER
                  </span>
                </div>
                {heroOfferCtaUrl ? (
                  <Link
                    href={heroOfferCtaUrl}
                    className="min-w-0 flex-1 text-center font-semibold text-white truncate sm:text-clip text-xs sm:text-[13px] hover:underline"
                  >
                    {heroOfferText}
                    {heroOfferCtaText && (
                      <span className="ml-1.5 font-black text-pub-secondary">{heroOfferCtaText} →</span>
                    )}
                  </Link>
                ) : (
                  <p className="min-w-0 flex-1 text-center font-semibold text-white truncate sm:text-clip text-xs sm:text-[13px]">
                    {heroOfferText}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowOfferBanner(false)}
                  aria-label="Dismiss offer"
                  className="shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sub-hero Trust Indicator */}
      <div className="mx-auto max-w-[1400px] px-5 pt-1 pb-4 text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          <Sparkles size={16} className="text-[#3B82F6] shrink-0 fill-[#3B82F6]/20" />
          <span>{subHeroText}</span>
        </p>
      </div>

      {/* Visual Promo Banner Card */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-5 mb-4 sm:mb-6">
        <Reveal>
          <section className="group relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] border border-slate-100/90 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={visualBannerImage}
                alt={visualBannerTitle}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 lg:p-10 min-h-[170px] sm:min-h-[190px]">
              <div className="max-w-2xl text-left">
                {visualBannerBadge && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                    {visualBannerBadge}
                  </span>
                )}
                <h2 className="mt-3 text-xl sm:text-2xl lg:text-[32px] font-bold text-white tracking-tight leading-tight">
                  {visualBannerTitle}
                </h2>
                <p className="mt-2 text-xs sm:text-sm md:text-[15px] text-white/90 font-normal leading-relaxed max-w-xl">
                  {visualBannerSubtitle}
                </p>
              </div>

              <div className="shrink-0 flex items-center">
                <Link
                  href={visualBannerCtaUrl}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0B1527] px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                >
                  <span>{visualBannerCtaText}</span>
                  <ArrowRight size={16} className="text-[#E4572E] stroke-[2.5]" />
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      <Reveal>
        <TopDealsSection
          tours={topDeals}
          loading={loadingHome && !topDeals.length}
        />
      </Reveal>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        <Reveal>
          <FavouriteCountriesSection destinations={favouriteCountries} />
        </Reveal>
      </div>

      <Reveal>
        <AboutTourvaaBanner
          heading={aboutSection.heading}
          body={aboutSection.body}
          image={aboutSection.image ? mediaUrl(aboutSection.image) : undefined}
        />
      </Reveal>

      <Reveal>
        <TrendingToursSection
          tours={trendingTours}
          loading={loadingHome && !trendingTours.length}
        />
      </Reveal>

      {/* Blog Teaser with Amber & Sky Ambient Gradient Backdrop */}
      <Reveal>
        <section className="relative w-full overflow-hidden my-8 sm:my-14 py-12 sm:py-20 bg-gradient-to-br from-[#FFF9EE] via-[#FDFAFB] to-[#F0F7FF] border-y border-slate-100 shadow-xs">
          {/* Top-left golden glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-amber-400/35 via-orange-300/20 to-transparent blur-3xl animate-float-orb" />
          {/* Bottom-right sky-blue glow */}
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-tl from-sky-400/25 via-blue-300/15 to-transparent blur-3xl animate-float-orb-alt" />

          <div className="relative z-10 mx-auto max-w-[1380px] px-5">
            <div className="group grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 lg:p-7 shadow-xs hover:border-slate-300 hover:shadow-lg transition-all duration-300 ease-out">
              {/* Left Image: rounded-[18px] with smooth hover zoom */}
              <div className="relative h-[280px] sm:h-[340px] lg:h-[400px] w-full overflow-hidden rounded-[18px] bg-slate-100 shadow-sm">
                <img
                  src={blogTeaser.image ? mediaUrl(blogTeaser.image) : "/images/img-1.png"}
                  alt="Travellers with backpacks hiking on a trail"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                />
              </div>

              {/* Right Content */}
              <div className="flex flex-col items-start justify-center py-2 px-2 sm:px-4 lg:px-6 text-left">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E4572E]">
                  <Sparkles size={14} className="text-[#E4572E] animate-sparkle-glow" />
                  <span>{blogTeaser.eyebrow ?? "BLOG"}</span>
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-extrabold leading-tight text-slate-950 tracking-tight">
                  {blogTeaser.heading ?? "Travel stories, guides and inspiration for every journey"}
                </h2>
                <p className="mt-4 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-slate-600 font-medium">
                  {blogTeaser.subtitle ??
                    "Explore travel guides, insider tips and inspiring stories from destinations around the world."}
                </p>
                <Link
                  href={blogTeaser.cta_url || "/blogs"}
                  className="group/btn mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0B1527] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>{blogTeaser.cta_text ?? "Read Stories"}</span>
                  <ArrowRight
                    size={16}
                    className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        <Reveal>
          <HandpickedToursSection
            tours={handpickedTours}
            loading={loadingHome && !handpickedTours.length}
          />
        </Reveal>
      </div>

      <Reveal>
        <CountriesWorthExploringSection
          countries={countriesWorthExploring}
          loading={loadingHome && !countriesWorthExploring.length}
        />
      </Reveal>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">

        <Reveal>
          <TestimonialsSection
            reviews={dynamicReviews}
            loading={loadingHome && !dynamicReviews.length}
          />
        </Reveal>

        <Reveal>
          <ExploreDirectorySection
            countries={directoryCountries}
            cities={directoryCities}
            categories={directoryCategories}
          />
        </Reveal>

        {/* Airport Transfers Banner */}
        <Reveal>
          <AirportTransfersBanner
            eyebrow={airportTransfer.eyebrow}
            heading={airportTransfer.heading}
            subtitle={airportTransfer.subtitle}
            features={airportTransfer.features?.length ? airportTransfer.features : undefined}
            ctaText={airportTransfer.cta_text}
            ctaUrl={airportTransfer.cta_url}
            image={airportTransfer.image ? mediaUrl(airportTransfer.image) : undefined}
          />
        </Reveal>

        <Reveal>
          <FaqSection faqs={dynamicFaqs} />
        </Reveal>
      </div>

      {/* 24/7 Travel Support Banner */}
      <Reveal>
        <TravelSupportBanner image="/images/offer.png" />
      </Reveal>

      {/* Panoramic Travel Newsletter / Registration Banner */}
      <Reveal>
        <HomeNewsletterBanner image="/images/register.png" />
      </Reveal>
    </main>
  );
}

const DEFAULT_TRANSFER_FEATURES = ["RELIABLE", "CLEAN", "AFFORDABLE", "24/7", "SECURE"];

function AirportTransfersBanner({
  eyebrow = "PREMIUM TRANSFER PARTNER",
  heading = "Book Your Airport Transfers",
  subtitle = "Effortless, reliable transfers from the world's leading airports to your hotel",
  features = DEFAULT_TRANSFER_FEATURES,
  ctaText = "Book Airport Pickup",
  ctaUrl,
  image = "/images/img-2.png",
}: {
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  features?: string[];
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
}) {
  const { settings } = usePublicSettings();
  const brightlaneLink =
    ctaUrl?.trim() ||
    settings.brightlane_external_link?.trim() ||
    "https://www.brightlane.co.nz/";

  const isExternal = brightlaneLink.startsWith("http");

  return (
    <section className="py-6 sm:py-10">
      <div className="group grid gap-6 lg:gap-10 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-8 lg:p-10 md:grid-cols-2 md:items-center shadow-xs hover:border-slate-300 hover:shadow-lg transition-all duration-300 ease-out">
        <div className="flex flex-col items-start justify-center py-2 text-left">
          {/* Tag / Badge */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E4572E]">
            <Plane size={14} className="rotate-45" />
            <span>{eyebrow}</span>
          </div>

          {/* Heading */}
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-extrabold leading-tight text-slate-950 tracking-tight">
            {heading}
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-sm md:text-base leading-relaxed text-slate-600 font-medium">
            {subtitle}
          </p>

          {/* Feature Pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {(features && features.length > 0 ? features : DEFAULT_TRANSFER_FEATURES).map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] font-bold text-white shadow-xs transition-transform duration-200 hover:scale-105 select-none"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <a
            href={brightlaneLink}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="group/btn mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0B1527] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowRight
              size={16}
              className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
              aria-hidden="true"
            />
          </a>
        </div>

        {/* Right Image */}
        <a
          href={brightlaneLink}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          aria-label="Visit Brightlane Airport Transfers"
          className="relative block h-[280px] sm:h-[340px] lg:h-[380px] w-full overflow-hidden rounded-[18px] bg-slate-100 shadow-sm"
        >
          <img
            src={image}
            alt="Luxury airport chauffeur transfer in front of international arrivals terminal"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
          />
        </a>
      </div>
    </section>
  );
}

function TravelSupportBanner({
  eyebrow = "Offer Ends Soon",
  heading = "24/7 Travel Support",
  subtitle = "From booking questions to on-trip assistance, our travel support team is here to make your Tourvaa journey smooth, simple and stress-free.",
  ctaText = "Explore Deals",
  ctaUrl = "/tours?sort=price_asc",
  image = "/images/offer.png",
}: {
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
}) {
  return (
    <section className="group relative w-full overflow-hidden my-6 sm:my-10 py-14 sm:py-16 md:py-20 lg:py-24 bg-white border-y border-slate-200/60 shadow-2xs">
      {/* Full panoramic background image */}
      <img
        src={image}
        alt={heading}
        className="absolute inset-0 h-full w-full object-cover object-left md:object-[12%_center] transition-transform duration-700 ease-out group-hover:scale-102"
      />

      {/* Subtle responsive wash ensuring razor-sharp readability on any display */}
      <div className="absolute inset-0 bg-white/75 sm:bg-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-white/30 sm:via-45% sm:to-white/85 pointer-events-none" />

      {/* Foreground Content Aligned to the Right Half */}
      <div className="relative z-10 mx-auto max-w-[1380px] px-6 sm:px-10 lg:px-12">
        <div className="flex flex-col items-start justify-center ml-auto max-w-lg lg:max-w-xl text-left">
          {/* Eyebrow / Offer Ends Soon Badge */}
          <span className="inline-flex items-center rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-xs">
            {eyebrow}
          </span>

          {/* Heading */}
          <h2 className="mt-3.5 text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-950 leading-tight">
            {heading}
          </h2>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-sm md:text-[15px] leading-relaxed text-slate-600 font-normal">
            {subtitle}
          </p>

          {/* Action Button */}
          <Link
            href={ctaUrl}
            className="group/btn mt-6 sm:mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0B1527] px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowRight
              size={16}
              className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomeNewsletterBanner({
  badge = "Special Offers",
  heading = "Get Exclusive Deals & Travel Updates",
  subtitle = "Subscribe to Tourvaa's newsletter for secret sales, handpicked itineraries, and member-only discounts delivered straight to your inbox.",
  image = "/images/register.png",
}: {
  badge?: string;
  heading?: string;
  subtitle?: string;
  image?: string;
}) {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || subscribing) return;

    try {
      setSubscribing(true);
      setMessage(null);
      await subscribeNewsletter(email.trim());
      setMessage({
        type: "success",
        text: "Thank you for registering! Special offers and updates are on their way.",
      });
      setEmail("");
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Registration failed. Please try again.",
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <section className="relative w-full overflow-hidden my-6 sm:my-10 py-10 sm:py-16 bg-gradient-to-b from-[#F8FAFC] via-[#F1F6FB] to-[#E9F2FA] border-y border-slate-100 shadow-xs">
      {/* Top-left sky blue ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-300/10 to-transparent blur-3xl animate-float-orb" />
      {/* Bottom-right soft warm glow */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-tl from-amber-400/20 via-orange-300/10 to-transparent blur-3xl animate-float-orb-alt" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-5">
        <div className="group relative w-full overflow-hidden rounded-[24px] border border-white/20 shadow-sm transition-all duration-300 ease-out hover:shadow-xl">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={image}
              alt={heading}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/45" />
          </div>

          {/* Foreground content */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 sm:p-8 lg:p-12 min-h-[180px]">
            {/* Left Content */}
            <div className="max-w-xl text-left">
              {badge && (
                <span className="inline-flex items-center rounded-full bg-[#E4572E] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                  {badge}
                </span>
              )}
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-white tracking-tight leading-tight">
                {heading}
              </h2>
              <p className="mt-2 text-xs sm:text-sm md:text-[15px] text-white/90 font-medium leading-relaxed max-w-lg">
                {subtitle}
              </p>
            </div>

            {/* Right Registration / Newsletter Form */}
            <div className="w-full lg:max-w-md">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/30 bg-black/25 backdrop-blur-md px-4 text-sm text-white placeholder:text-white/70 focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/40 focus:bg-black/50 focus:outline-none transition-all duration-200 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="group/btn h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1527] px-7 text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#15233C] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 whitespace-nowrap disabled:opacity-60 cursor-pointer"
                >
                  <span>{subscribing ? "Registering..." : "Register"}</span>
                  <ArrowRight size={16} className="text-[#E4572E] stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1" />
                </button>
              </form>

              {message && (
                <p
                  className={`mt-2.5 text-xs font-bold ${
                    message.type === "success" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    question: "How do I book a tour package with Tourvaa?",
    answer:
      "Booking with Tourvaa is simple. Browse our curated tours, select your preferred departure date, choose your group size, and click 'Book Now'. Our travel specialists will confirm your itinerary and assist with all pre-trip preparations.",
  },
  {
    question: "What is your cancellation and refund policy?",
    answer:
      "You can cancel your booking up to 14 days before your departure date for a full refund. For cancellations made between 7 to 13 days prior, we offer a 50% refund. Unfortunately, cancellations made within 7 days of the tour start date are non-refundable. Please read our detailed Terms & Conditions for specific destination and partner policies.",
  },
  {
    question: "Are group discounts available for larger bookings?",
    answer:
      "Yes! We offer exclusive group discounts for bookings of 6 or more travellers. Contact our dedicated support team or submit a custom inquiry on our group booking page to receive customized rates.",
  },
  {
    question: "Does Tourvaa provide comprehensive travel insurance?",
    answer:
      "We partner with leading global insurers to offer comprehensive travel protection plans covering trip cancellations, medical emergencies, baggage loss, and flight delays during your tour.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards (Visa, MasterCard, American Express), Apple Pay, Google Pay, and direct bank wire transfers with secure SSL encryption.",
  },
  {
    question: "Do you offer visa assistance for international tours?",
    answer:
      "Yes, our travel desk provides full visa guidance, documentation checklists, and application support for all international destinations included in our tour packages.",
  },
];

function FaqSection({
  faqs = FAQS,
}: {
  faqs?: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(1); // Question 2 open by default as shown in mockup

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 text-center tracking-tight mb-8 sm:mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`transition-all duration-300 ease-out ${
                  isOpen
                    ? "rounded-2xl border border-blue-200 bg-blue-50/30 p-5 sm:p-6 shadow-sm ring-1 ring-blue-100"
                    : "rounded-2xl border border-slate-200/80 bg-white px-5 sm:px-6 py-4 sm:py-5 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-slate-900 text-sm sm:text-base focus:outline-none group cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`transition-colors duration-200 ${
                      isOpen
                        ? "text-slate-950 font-bold"
                        : "text-slate-900 font-semibold group-hover:text-pub-secondary"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                      isOpen
                        ? "bg-[#d95d2c] text-white shadow-sm rotate-180 scale-105"
                        : "text-[#d95d2c] bg-slate-100/80 group-hover:bg-pub-secondary/10 group-hover:scale-110"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3.5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal animate-in fade-in-50 slide-in-from-top-1.5 duration-300 ease-out">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type ReviewItem = {
  quote: string;
  name: string;
  city: string;
  tourName: string;
  initials: string;
  rating: number;
  image?: string | null;
};

const CURATED_REVIEWS: ReviewItem[] = [
  {
    quote:
      "Booked a 7-day Rajasthan tour through Tourvaa. Everything was flawless — hotels, transport, guides. I didn't have to think once.",
    name: "Priya Menon",
    city: "Kerala, India",
    tourName: "Rajasthan Heritage Tour",
    initials: "PM",
    rating: 5,
  },
  {
    quote:
      "The Golden Triangle package was absolutely worth every dirham. The team was responsive and the itinerary was perfectly paced.",
    name: "Khalid Al-Rashid",
    city: "Dubai, UAE",
    tourName: "Golden Triangle Escape",
    initials: "KA",
    rating: 5,
  },
  {
    quote:
      "Discovered Tourvaa on Instagram and booked a Kerala houseboat trip on a whim. Genuinely the best holiday I've ever had.",
    name: "Anjali Sharma",
    city: "Bengaluru, India",
    tourName: "Kerala Backwaters & Hills",
    initials: "AS",
    rating: 5,
  },
  {
    quote:
      "Our Swiss Alps trip was organized down to the minute. The train passes, hotel vouchers and local guides were top notch!",
    name: "David Miller",
    city: "London, UK",
    tourName: "Swiss Alps Explorer",
    initials: "DM",
    rating: 5,
  },
  {
    quote:
      "Exploring Japan during cherry blossom season with Tourvaa was a dream come true. Unbeatable value and service.",
    name: "Sophie Laurent",
    city: "Paris, France",
    tourName: "Cherry Blossom Odyssey",
    initials: "SL",
    rating: 5,
  },
];

const DIRECTORY_COUNTRIES = [
  "New Zealand",
  "Spain",
  "Italy",
  "Greece",
  "United States",
  "France",
  "Portugal",
  "Türkiye",
  "Poland",
  "Netherlands",
  "Croatia",
  "Ireland",
  "Australia",
  "Morocco",
  "Thailand",
  "Malta",
  "Germany",
  "Canada",
  "Norway",
  "Hungary",
  "Japan",
  "Czechia",
  "Indonesia",
  "Switzerland",
];

const DIRECTORY_CITIES = [
  "Rome",
  "Paris",
  "Tokyo",
  "London",
  "Barcelona",
  "Dubai",
  "New York",
  "Istanbul",
  "Bangkok",
  "Amsterdam",
  "Singapore",
  "Vienna",
  "Prague",
  "Cairo",
  "Sydney",
  "Kyoto",
  "Queenstown",
  "Marrakech",
  "Athens",
  "Zurich",
  "Edinburgh",
  "Lisbon",
  "Dubrovnik",
  "Bali",
];

const DIRECTORY_CATEGORIES = [
  "Wildlife & Safari",
  "Cultural Heritage",
  "Mountain Trekking",
  "Beach & Island Escapes",
  "Historic Architecture",
  "Wine & Culinary Tours",
  "Glacier & Fjord Cruises",
  "Desert Expeditions",
  "City Sightseeing",
  "Northern Lights",
  "Ancient Ruins",
  "River Cruises",
  "Photography Expeditions",
  "Wellness & Ayurveda",
  "Honeymoon Getaways",
  "Luxury Train Journeys",
  "Scuba & Snorkeling",
  "Alpine Skiing",
  "Volcano Trails",
  "Festivals & Events",
  "Island Hopping",
  "Sacred Temples",
  "Rainforest Adventures",
  "Road Trips & Caravans",
];

function TestimonialsSection({
  reviews: items,
  loading,
}: {
  reviews: {
    quote: string;
    name: string;
    city: string;
    tourName: string;
    initials: string;
    rating: number;
    image?: string | null;
  }[];
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const carousel = ref.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>("[data-review-card]");
    if (!card) return;

    // Card width is responsive (and is narrower on iPhone). A fixed 360px
    // jump over-scrolls mobile cards, leaving the next one clipped on the
    // left. Move by the rendered card width plus the real flex gap instead.
    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
    const step = card.offsetWidth + gap;
    if (step <= 0) return;

    // Clicking the arrow again before the previous smooth-scroll settles
    // used to scrollBy() from whatever mid-animation position the browser
    // was at, so repeated clicks drifted off the card boundaries and landed
    // between two cards - showing empty gutter instead of a full card.
    // Rounding to the nearest card index first re-snaps before moving, so
    // every click always lands exactly one full card away.
    const currentIndex = Math.round(carousel.scrollLeft / step);
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    const target = Math.max(0, Math.min(maxScrollLeft, (currentIndex + direction) * step));
    carousel.scrollTo({ left: target, behavior: "smooth" });
  };

  const displayReviews = items.length > 0 ? items : CURATED_REVIEWS;

  return (
    <section className="py-12 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-slate-950 tracking-tight">
          What Tourvaa travellers are saying
        </h2>
        <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-500">
          Real stories and honest reviews from travellers who explored the world
          with Tourvaa.
        </p>
      </div>

      {/* Outer Carousel Container with Left and Right Arrows */}
      <div className="relative px-2 sm:px-6">
        <button
          type="button"
          aria-label="Previous reviews"
          onClick={() => move(-1)}
          className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-200 hover:border-pub-secondary hover:text-pub-secondary hover:scale-110 active:scale-90 cursor-pointer"
        >
          <ChevronLeft size={18} className="stroke-[2.2]" />
        </button>

        <button
          type="button"
          aria-label="Next reviews"
          onClick={() => move(1)}
          className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all duration-200 hover:border-pub-secondary hover:text-pub-secondary hover:scale-110 active:scale-90 cursor-pointer"
        >
          <ChevronRight size={18} className="stroke-[2.2]" />
        </button>

        <div
          ref={ref}
          className="no-scrollbar flex snap-x snap-mandatory scroll-px-2 scroll-smooth touch-pan-x gap-5 overflow-x-auto overscroll-x-contain px-2 py-2"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  data-review-card
                  className="w-[calc(100%-1rem)] max-w-[300px] sm:w-[360px] sm:max-w-none shrink-0 snap-start animate-pulse rounded-3xl border border-slate-100 bg-white p-7 shadow-sm"
                >
                  <div className="h-6 w-8 rounded bg-slate-100 mb-4" />
                  <div className="h-4 w-full rounded-full bg-slate-100" />
                  <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-20 rounded bg-slate-100" />
                        <div className="h-2.5 w-14 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-3 w-16 rounded bg-slate-100" />
                  </div>
                </div>
              ))
            : displayReviews.map((review, index) => (
                <article
                  key={`${review.name}-${index}`}
                  data-review-card
                  className="group w-[calc(100%-1rem)] max-w-[290px] sm:w-[350px] sm:max-w-none lg:w-[370px] shrink-0 snap-start flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 text-left shadow-xs transition-all duration-300 ease-out hover:border-slate-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div>
                    <span className="block text-slate-300 text-3xl sm:text-4xl font-serif leading-none select-none mb-3 transition-colors duration-200 group-hover:text-amber-400">
                      “
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal min-h-[72px]">
                      “{review.quote}”
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {review.image ? (
                        <img
                          src={review.image}
                          alt={review.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm border border-slate-100 transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1478f2] text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                          {review.initials}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-xs sm:text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-pub-secondary">
                          {review.name}
                        </h3>
                        <p className="truncate text-[11px] text-slate-400">
                          {review.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 text-[#e85d26]">
                      {Array.from({ length: review.rating || 5 }).map(
                        (_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className="fill-[#e85d26] text-[#e85d26]"
                          />
                        ),
                      )}
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
}

function ExploreDirectorySection({
  countries = DIRECTORY_COUNTRIES,
  cities = DIRECTORY_CITIES,
  categories = DIRECTORY_CATEGORIES,
}: {
  countries?: string[];
  cities?: string[];
  categories?: string[];
}) {
  const [activeTab, setActiveTab] = useState<
    "countries" | "cities" | "categories"
  >("countries");

  const items =
    activeTab === "countries"
      ? countries.length > 0
        ? countries.slice(0, 24)
        : DIRECTORY_COUNTRIES
      : activeTab === "cities"
        ? cities.length > 0
          ? cities.slice(0, 24)
          : DIRECTORY_CITIES
        : categories.length > 0
          ? categories.slice(0, 24)
          : DIRECTORY_CATEGORIES;

  const getHref = (item: string) => {
    if (activeTab === "countries")
      return `/tours?country=${encodeURIComponent(item)}`;
    if (activeTab === "cities")
      return `/tours?search=${encodeURIComponent(item)}`;
    return `/tours?category=${encodeURIComponent(item)}`;
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-8 lg:p-10 shadow-xs">
        {/* Tabs Bar */}
        <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200/80 text-xs sm:text-sm md:text-base overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("countries")}
            className={`shrink-0 pb-3 font-bold transition-all duration-200 whitespace-nowrap -mb-[1px] active:scale-95 ${
              activeTab === "countries"
                ? "border-b-2 border-slate-950 text-slate-950"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Top countries to visit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cities")}
            className={`shrink-0 pb-3 font-bold transition-all duration-200 whitespace-nowrap -mb-[1px] active:scale-95 ${
              activeTab === "cities"
                ? "border-b-2 border-slate-950 text-slate-950"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Top Cities to Visit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`shrink-0 pb-3 font-bold transition-all duration-200 whitespace-nowrap -mb-[1px] active:scale-95 ${
              activeTab === "categories"
                ? "border-b-2 border-slate-950 text-slate-950"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Top attraction categories
          </button>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-4 gap-x-4 pt-6 sm:pt-8 text-xs sm:text-sm text-slate-700">
          {items.map((item, index) => (
            <Link
              key={item}
              href={getHref(item)}
              className="group flex items-start gap-1.5 transition-all duration-200 hover:translate-x-1 hover:text-pub-secondary"
            >
              <span className="font-semibold text-slate-900 group-hover:text-pub-secondary transition-colors duration-200">
                {index + 1}.
              </span>
              <span className="truncate group-hover:underline">{item}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
