"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowRight as ArrowRight,
  LuBadgeCheck as BadgeCheck,
  LuBookOpen as BookOpen,
  LuChevronDown as ChevronDown,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronUp as ChevronUp,
  LuClock as Clock,
  LuGlobe as Globe,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuPlane as Plane,
  LuQuote as Quote,
  LuScale as Scale,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuStar as Star,
  LuUser as User,
  LuUsers as Users,
  LuX as X,
  LuSquareCheckBig as SquareCheckBig,
} from "react-icons/lu";
import { useToast } from "@/hooks/useToast";
import { usePublicSettings } from "@/providers/PublicSettingsProvider";
import HeroFilterBar from "@/components/public/HeroFilterBar";
import {
  CmsBanner,
  CmsDestination,
  CmsReview,
  fetchCustomerReviews,
  fetchFeaturedTours,
  fetchHelpCentre,
  fetchHomepageBanners,
  fetchPopularDestinations,
  fetchPopularTours,
  fetchPublicCategories,
  fetchPublicCities,
  fetchPublicCountries,
  fetchPublicTourDetail,
  fetchPublicTours,
  fetchToursOnDeals,
  PublicCountry,
  PublicTour,
} from "@/lib/api/publicClient";
import {
  MAX_COMPARE_ITEMS,
  useTravelStore,
} from "@/providers/TravelStoreProvider";
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

  const rawPrice = tour.price_start_per_person;
  const originalPrice =
    tour.discount_percentage && tour.original_price_per_person
      ? tour.original_price_per_person
      : null;
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

// "Places Worth Exploring" is driven off the real per-country tour counts
// (not the admin-curated CMS destination list) so a newly-added country with
// published tours shows up here automatically, with an accurate package
// count, instead of requiring someone to remember to add a matching CMS
// "popular destination" card. The CMS list is only consulted for a nicer
// destination image when one happens to match by name.
function topDestinationsFromCountries(
  countries: PublicCountry[],
  cmsDestinations: CmsDestination[],
  limit: number,
) {
  const cmsByName = new Map(
    cmsDestinations.map((item) => [item.title.trim().toLowerCase(), item]),
  );
  return [...countries]
    .filter((country) => (country.tour_count || 0) > 0)
    .sort((a, b) => (b.tour_count || 0) - (a.tour_count || 0))
    .slice(0, limit)
    .map((country) => {
      const cmsMatch = cmsByName.get(country.country_name.trim().toLowerCase());
      const count = `${country.tour_count} package${country.tour_count === 1 ? "" : "s"}`;
      return {
        name: country.country_name,
        count,
        image: cmsMatch?.image ? mediaUrl(cmsMatch.image) : PLACEHOLDER_IMAGE,
        price: null as number | null,
        currency: "USD",
      };
    });
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

function TrustBadge({
  icon: Icon,
  title,
  note,
}: {
  icon: React.ElementType;
  title: string;
  note: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon size={16} className="shrink-0 text-blue-300" />
      <span className="text-left leading-tight">
        <b className="block">{title}</b>
        <span className="block text-white/70">{note}</span>
      </span>
    </span>
  );
}

function TourRating({ tour }: { tour: Tour }) {
  if (tour.rating == null || !tour.reviews) {
    return (
      <p className="mt-1 text-[11px] font-semibold text-slate-400">New tour</p>
    );
  }
  return (
    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
      <Star size={11} className="fill-amber-400 text-amber-400" />
      <b className="font-bold text-slate-900">{tour.rating.toFixed(1)}</b>
      <span className="text-slate-400">({tour.reviews})</span>
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
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E4572E] transition hover:text-[#d95d2c]"
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

  return (
    <article className="group relative w-[310px] sm:w-[350px] lg:w-[380px] shrink-0 overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Image with Location badge & Wishlist button */}
      <div className="relative h-52 w-full overflow-hidden rounded-[16px] bg-slate-100">
        <Link href={href} className="block h-full w-full">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Location pill badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white">
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
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 hover:scale-115 focus:outline-none"
        >
          <Heart
            size={18}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-white text-white"
            }
          />
        </button>
      </div>

      {/* Tour details */}
      <div className="pt-4">
        {/* Title and duration badge */}
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="block flex-1 min-w-0">
            <h3 className="truncate text-base sm:text-[17px] font-extrabold text-slate-900 transition-colors group-hover:text-[#E4572E]">
              {tour.title}
            </h3>
          </Link>
          <span className="shrink-0 rounded-md border border-[#E4572E]/40 bg-orange-50/40 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E4572E] tracking-wide">
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
          <span className="text-slate-400 font-normal">{reviewCountStr}</span>
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
              : "$999"}
          </strong>
          <span className="text-xs font-bold text-slate-900">pp</span>
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

  const tabs = useMemo(() => {
    const placesMap = new Map<string, string>();
    for (const t of tours) {
      if (!t.place) continue;
      const parts = t.place
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const dest = parts[parts.length - 1] || t.place.trim();
      if (
        dest &&
        !/worldwide/i.test(dest) &&
        !placesMap.has(dest.toLowerCase())
      ) {
        placesMap.set(dest.toLowerCase(), dest);
      }
    }

    const uniquePlaces = Array.from(placesMap.values());
    if (uniquePlaces.length > 0) {
      return [
        "Top deals",
        ...uniquePlaces.slice(0, 6).map((place) => `${place} deals`),
      ];
    }

    return ["Top deals", "New Zealand deals", "Turkey deals", "Italy deals"];
  }, [tours]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab("Top deals");
    }
  }, [tabs, activeTab]);

  const filteredTours = useMemo(() => {
    if (activeTab === "Top deals") {
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
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  return (
    <section className="py-8 sm:py-10">
      {/* Top Filter Pills + View all deals link */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#E4572E] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <Link
          href={
            activeTab === "Top deals"
              ? "/tours?sort=price_asc"
              : `/tours?sort=price_asc&search=${encodeURIComponent(
                  activeTab.replace(/\s+deals$/i, "").trim(),
                )}`
          }
          className="text-xs sm:text-sm font-semibold text-[#E4572E] hover:underline"
        >
          View all deals
        </Link>
      </div>

      {/* Header Row: Title & Arrow Buttons */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Top Deals
        </h2>

        {!loading && displayTours.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous deals"
              onClick={() => move(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#E4572E] hover:text-[#E4572E] hover:bg-slate-50"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
            <button
              type="button"
              aria-label="Next deals"
              onClick={() => move(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#E4572E] hover:text-[#E4572E] hover:bg-slate-50"
            >
              <ChevronRight size={16} className="stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel list */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x gap-5 overflow-x-auto pb-4 pt-1"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="snap-start" key={index}>
              <TourCardSkeleton />
            </div>
          ))
        ) : displayTours.length > 0 ? (
          displayTours.map((tour, index) => (
            <div className="snap-start" key={`${tour.title}-${index}`}>
              <TopDealCard tour={tour} />
            </div>
          ))
        ) : (
          <EmptyCollection
            message="No deals found for this destination."
            href="/tours?sort=price_asc"
            linkLabel="Browse all deals"
          />
        )}
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
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
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
            className="group relative h-[420px] w-full overflow-hidden rounded-[20px] bg-white p-4 border border-slate-100/90 shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none flex flex-col"
          >
            {/* Inner Image Container with 16px radius */}
            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-slate-900">
              <img
                src={country.image}
                alt={country.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
              />

              {/* Gradient overlays for crisp contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/15" />

              {/* Top-Left Location Badge */}
              <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white">
                <MapPin size={11} className="shrink-0 text-white" />
                <span>{country.badge || country.name}</span>
              </span>

              {/* Bottom Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm transition-colors group-hover:text-[#ff7a45]">
                  {`${country.name} tours`}
                </h3>
                <div className="mt-2.5 flex items-start gap-2 text-xs text-white/90 leading-relaxed font-medium">
                  <SquareCheckBig
                    size={14}
                    className="mt-0.5 shrink-0 text-orange-400 stroke-[2.2] transition-colors group-hover:text-[#ff7a45]"
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

function AboutTourvaaBanner() {
  return (
    <section className="relative w-full overflow-hidden my-6 sm:my-10 py-14 sm:py-20 lg:py-24 shadow-sm">
      {/* High-res Panoramic Mountain Background */}
      <img
        src="/images/about-mountain.jpg"
        alt="About Tourvaa - Alpine mountain landscape"
        className="absolute inset-0 h-full w-full object-cover object-center scale-105"
      />
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-black/55 backdrop-brightness-90" />

      {/* Text Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-10 text-center text-white">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
          About Tourvaa
        </h2>
        <p className="mx-auto mt-4 max-w-4xl text-xs sm:text-sm md:text-[15px] leading-relaxed text-white/95 drop-shadow">
          Tourvaa is a premier travel platform dedicated to crafting
          extraordinary group travel experiences across the globe. We connect
          passionate travellers with expertly curated tours, handpicked
          destinations, and seamless end-to-end booking — from visa assistance
          to on-ground coordination. Whether it&apos;s the serene backwaters of
          Kerala, the alpine trails of Switzerland, or the vibrant streets of
          Tokyo, Tourvaa makes every journey effortless, memorable, and truly
          unforgettable.
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

  return (
    <article className="group relative w-[310px] sm:w-[350px] lg:w-[380px] shrink-0 overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Top Image Container */}
      <div className="relative h-52 w-full overflow-hidden rounded-[16px] bg-slate-100">
        <Link href={href} className="block h-full w-full">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Location pill badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white">
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
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 hover:scale-115 focus:outline-none"
        >
          <Heart
            size={18}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-white text-white"
            }
          />
        </button>

        {/* Red Discount Pill (floating bottom-right of image) - only shown for a real discount */}
        {tour.discountBadge && (
          <span className="absolute -bottom-0.5 right-2.5 z-20 rounded-xl bg-[#e51d2e] px-3 py-1.5 text-xs font-black text-white shadow-md">
            {tour.discountBadge}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="pt-4">
        {/* Title */}
        <Link href={href} className="block min-w-0">
          <h3 className="truncate text-base sm:text-[17px] font-extrabold text-slate-900 transition-colors group-hover:text-[#E4572E]">
            {tour.title}
          </h3>
        </Link>

        {/* 5 Yellow Stars + Rating + Review count */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <Star size={12} className="fill-amber-400 text-amber-400" />
          </div>
          <b className="font-bold text-slate-900">{ratingVal}</b>
          <span className="text-slate-400 font-normal">{reviewCountStr}</span>
        </div>

        {/* 4 Features Row (Clock, MapPin, User, Users) */}
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600 font-medium">
          {tour.features.map((feature, index) => (
            <p key={index} className="flex items-center gap-2">
              <feature.icon size={13} className="shrink-0 text-sky-500" />
              <span className="truncate">{feature.text}</span>
            </p>
          ))}
        </div>

        {/* Pricing Row: From $oldpp $newpp */}
        <div className="mt-3.5 flex items-baseline gap-1.5 border-t border-slate-100 pt-3 text-xs">
          <span className="font-extrabold text-slate-900 text-sm">From</span>
          {tour.originalPrice != null && (
            <span className="text-xs font-normal text-slate-400 line-through">
              {format(tour.originalPrice, tour.currency || "USD")}
              <span className="text-[10px]">pp</span>
            </span>
          )}
          <strong className="text-xl font-black text-slate-950">
            {tour.rawPrice != null
              ? format(tour.rawPrice, tour.currency || "USD")
              : "$1,575"}
          </strong>
          <span className="text-[11px] font-bold text-slate-900">pp</span>
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
  const move = (direction: number) =>
    scrollRef.current?.scrollBy({ left: direction * 330, behavior: "smooth" });

  const displayTours = tours;

  return (
    <section className="py-8 sm:py-10">
      {/* Section Header with Arrows on right */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Trending Tour Packages
        </h2>

        {!loading && displayTours.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous tours"
              onClick={() => move(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#E4572E] hover:text-[#E4572E] hover:bg-slate-50"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
            <button
              type="button"
              aria-label="Next tours"
              onClick={() => move(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#E4572E] hover:text-[#E4572E] hover:bg-slate-50"
            >
              <ChevronRight size={16} className="stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel list */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x gap-5 overflow-x-auto pb-4 pt-1"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="snap-start" key={index}>
              <TourCardSkeleton />
            </div>
          ))
        ) : displayTours.length > 0 ? (
          displayTours.map((tour, index) => (
            <div className="snap-start" key={`${tour.title}-${index}`}>
              <TrendingTourCard tour={tour} />
            </div>
          ))
        ) : (
          <EmptyCollection
            message="No featured tours are available yet."
            href="/tours"
            linkLabel="Browse all tours"
          />
        )}
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
    <article className="group relative w-[310px] sm:w-[350px] lg:w-[380px] shrink-0 overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      {/* Image with Location badge & Wishlist */}
      <div className="relative h-52 w-full overflow-hidden rounded-[16px] bg-slate-100">
        <Link href={href} className="block h-full w-full">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Location pill badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-3 py-1 text-[11px] font-bold text-white">
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
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 hover:scale-115 focus:outline-none"
        >
          <Heart
            size={18}
            className={
              wishlisted ? "fill-red-500 text-red-500" : "fill-white text-white"
            }
          />
        </button>
      </div>

      {/* Tour details */}
      <div className="pt-4">
        {/* Title and duration tag */}
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="block flex-1 min-w-0">
            <h3 className="truncate text-base sm:text-[17px] font-extrabold text-slate-900 transition-colors group-hover:text-[#E4572E]">
              {tour.title}
            </h3>
          </Link>
          <span className="shrink-0 rounded-md border border-[#E4572E]/40 bg-orange-50/40 px-2.5 py-0.5 text-[10px] font-extrabold text-[#E4572E] tracking-wide">
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
          <span className="text-slate-400 font-normal">{reviewCountStr}</span>
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
              : "$999"}
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
  const move = (direction: number) =>
    scrollRef.current?.scrollBy({ left: direction * 330, behavior: "smooth" });

  const displayTours = tours;

  return (
    <section className="py-8 sm:py-10">
      {/* Section Header with Arrows on right */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Handpicked Tours for You
        </h2>

        {!loading && displayTours.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous tours"
              onClick={() => move(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#d95d2c] hover:text-[#d95d2c] hover:bg-slate-50"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
            <button
              type="button"
              aria-label="Next tours"
              onClick={() => move(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#d95d2c] hover:text-[#d95d2c] hover:bg-slate-50"
            >
              <ChevronRight size={16} className="stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel list */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="snap-start" key={index}>
              <TourCardSkeleton />
            </div>
          ))
        ) : displayTours.length > 0 ? (
          displayTours.map((tour, index) => (
            <div className="snap-start" key={`${tour.title}-${index}`}>
              <HandpickedTourCard tour={tour} />
            </div>
          ))
        ) : (
          <EmptyCollection
            message="No handpicked tours are available yet."
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
  const move = (direction: number) =>
    scrollRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });

  const displayCountries = countries;

  return (
    <section className="py-8 sm:py-10">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Countries Worth Exploring
        </h2>

        {!loading && displayCountries.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous countries"
              onClick={() => move(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#d95d2c] hover:text-[#d95d2c] hover:bg-slate-50"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
            <button
              type="button"
              aria-label="Next countries"
              onClick={() => move(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#d95d2c] hover:text-[#d95d2c] hover:bg-slate-50"
            >
              <ChevronRight size={16} className="stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-56 w-[260px] shrink-0 animate-pulse rounded-2xl bg-slate-100"
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
    </section>
  );
}

function CountryWorthExploringCard({
  country,
}: {
  country: CountryWorthExploring;
}) {
  return (
    <Link
      href={`/tours?country=${encodeURIComponent(country.name)}`}
      className="group block w-[310px] sm:w-[350px] lg:w-[380px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl focus:outline-none"
    >
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-[16px] bg-slate-100">
        <img
          src={country.image}
          alt={country.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        {/* Popular orange badge (top-left) */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#E4572E] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
          <Sparkles size={10} className="shrink-0" />
          <span>{country.badge || "Popular"}</span>
        </span>
      </div>

      <div className="pt-3 px-0.5">
        {/* Name and Rating */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-[#E4572E]">
            {country.name}
          </h3>
          {country.rating != null && (
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 shrink-0">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{country.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Packages count with map/book icon */}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <BookOpen size={13} className="text-sky-500 shrink-0" />
          <span>{country.count}</span>
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);
  const [topDeals, setTopDeals] = useState<Tour[]>([]);
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
      ]) => {
        if (!active) return;
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

          // Enrich favourite countries with matched CMS images
          setFavouriteCountries((prev) =>
            prev.map((item) => {
              const match = cmsMap.get(item.name.toLowerCase());
              if (match?.image) {
                return { ...item, image: mediaUrl(match.image) };
              }
              return item;
            }),
          );

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

        // "Trending Tour Packages" AND "Handpicked Tours for You" - both
        // admin-picked via the same CMS "Popular Tours"/"Handpicked" tabs
        // (admin/cms), since there's no separate backend list for Handpicked
        // yet. Each entry only carries the tour id, so the full tour record is
        // resolved separately before rendering.
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
            if (tours.length) {
              setTrendingTours(tours);
              setHandpickedTours(tours);
            }
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

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      {/* Contained Hero Section */}
      <div className="relative z-30 mx-auto max-w-[1400px] px-5 pt-3 pb-4 sm:pb-6">
        <section className="relative flex h-[480px] w-full flex-col justify-between items-center rounded-[20px] p-4 sm:p-6 text-center text-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
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
              <img
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
              className="animate-fade-up max-w-4xl text-2xl sm:text-4xl md:text-[40px] font-black tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
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
              <span className="font-bold text-white">Excellent</span>
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
              <span className="font-bold text-white">4.5</span>
              <span className="text-white/90">
                out of 5 based on 522 reviews on Ayatiworks
              </span>
            </div>
          </div>

          {/* Bottom Offer Capsule */}
          {showOfferBanner && (
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
                <p className="min-w-0 flex-1 text-center font-semibold text-white truncate sm:text-clip text-xs sm:text-[13px]">
                  Global Getaways 2026: Up To 50% Off – Limited Availability,
                  Book Today!
                </p>
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

      <div className="relative z-10 mx-auto max-w-[1380px] ">
        <Reveal>
          <TopDealsSection
            tours={topDeals}
            loading={loadingHome && !topDeals.length}
          />
        </Reveal>

        <Reveal>
          <FavouriteCountriesSection destinations={favouriteCountries} />
        </Reveal>
      </div>

      <Reveal>
        <AboutTourvaaBanner />
      </Reveal>

      <div className="relative z-10 mx-auto max-w-[1380px]">
        <Reveal>
          <TrendingToursSection
            tours={trendingTours}
            loading={loadingHome && !trendingTours.length}
          />
        </Reveal>

        <Reveal className="py-6 sm:py-8">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center overflow-hidden rounded-[20px] border border-slate-100/90 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            {/* Left Image: 602px x 394px on desktop, rounded-[16px] with 16px outer padding */}
            <div className="relative h-[280px] sm:h-[340px] lg:h-[394px] w-full overflow-hidden rounded-[16px] bg-slate-100">
              <img
                src="/images/hero-2.jpg"
                alt="Travellers with backpacks hiking on a trail"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Right Content */}
            <div className="flex flex-col items-start justify-center py-2 px-2 sm:px-4 lg:px-6 text-left">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E4572E]">
                BLOG
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-black leading-tight text-slate-950 tracking-tight">
                Travel stories, guides and inspiration for every journey
              </h2>
              <p className="mt-4 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-slate-500 font-medium">
                Explore travel guides, insider tips and inspiring stories from
                destinations around the world.
              </p>
              <Link
                href="/blogs"
                className="mt-7 inline-flex h-[60px] items-center justify-center gap-3 rounded-2xl bg-[#0B1527] px-8 text-base font-black text-white shadow-md transition-all duration-200 hover:bg-[#15233C] hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                <span>Read Stories</span>
                <ArrowRight
                  size={18}
                  className="text-[#E4572E] stroke-[2.5]"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <HandpickedToursSection
            tours={handpickedTours}
            loading={loadingHome && !handpickedTours.length}
          />
        </Reveal>

        <Reveal>
          <CountriesWorthExploringSection
            countries={countriesWorthExploring}
            loading={loadingHome && !countriesWorthExploring.length}
          />
        </Reveal>

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

        <Reveal>
          <AirportTransfersBanner />
        </Reveal>

        <Reveal>
          <FaqSection faqs={dynamicFaqs} />
        </Reveal>
      </div>
    </main>
  );
}

const TRANSFER_FEATURES = ["RELIABLE", "CLEAN", "AFFORDABLE", "24/7", "SECURE"];

function AirportTransfersBanner() {
  const { settings } = usePublicSettings();
  const brightlaneLink =
    settings.brightlane_external_link?.trim() ||
    "https://www.brightlane.co.nz/";

  return (
    <section className="py-6 sm:py-8">
      <div className="grid gap-6 lg:gap-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-100/90 bg-white p-6 sm:p-4 lg:p-10 shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:grid-cols-2 md:items-center">
        <div className="flex flex-col items-start justify-center py-2 text-left">
          {/* Tag / Badge */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#d95d2c]">
            <Plane size={14} className="rotate-45" />
            <span>PREMIUM TRANSFER PARTNER</span>
          </div>

          {/* Heading */}
          <h2 className="mt-2.5 text-2xl font-black leading-tight text-slate-950 sm:text-3xl lg:text-[36px] tracking-tight">
            Book Your Airport Transfers
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-slate-500">
            Effortless, reliable transfers from the world&apos;s leading
            airports to your hotel
          </p>

          {/* Feature Pills */}
          <div className="mt-4 sm:mt-5 flex flex-wrap gap-2">
            {TRANSFER_FEATURES.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[#d95d2c] px-3 py-1 text-[11px] font-bold text-white shadow-sm"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <a
            href={brightlaneLink}
            target={brightlaneLink.startsWith("http") ? "_blank" : undefined}
            rel={
              brightlaneLink.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="mt-6 sm:mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0f2439] px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition-all hover:bg-[#18395c] hover:shadow-lg hover:-translate-y-0.5"
          >
            <span>Book Airport Pickup</span>
            <ArrowRight
              size={18}
              className="text-[#d95d2c] stroke-[2.5]"
              aria-hidden="true"
            />
          </a>
        </div>

        {/* Right Image */}
        <a
          href={brightlaneLink}
          target={brightlaneLink.startsWith("http") ? "_blank" : undefined}
          rel={
            brightlaneLink.startsWith("http")
              ? "noopener noreferrer"
              : undefined
          }
          aria-label="Visit Brightlane Airport Transfers"
          className="relative block h-[280px] sm:h-[340px] lg:h-[394px] w-full overflow-hidden rounded-[16px] bg-slate-100"
        >
          <img
            src="/images/airport-transfers.jpg"
            alt="Luxury airport chauffeur transfer in front of international arrivals terminal"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </a>
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
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-950 text-center tracking-tight mb-8 sm:mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`transition-all duration-300 ${
                  isOpen
                    ? "rounded-2xl border border-blue-200 bg-blue-50/30 p-5 sm:p-6 shadow-sm ring-1 ring-blue-100"
                    : "rounded-2xl border-b border-slate-200/80 bg-white px-5 sm:px-6 py-4 sm:py-5 hover:bg-slate-50/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bold text-slate-900 text-sm sm:text-base focus:outline-none group cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span
                    className={
                      isOpen
                        ? "text-slate-950 font-bold"
                        : "text-slate-900 font-semibold group-hover:text-slate-950"
                    }
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      isOpen
                        ? "bg-[#d95d2c] text-white shadow-sm rotate-180"
                        : "text-[#d95d2c] bg-slate-100/80 group-hover:bg-[#d95d2c]/10"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3.5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal animate-in fade-in slide-in-from-top-1 duration-200">
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
  const move = (direction: number) =>
    ref.current?.scrollBy({ left: direction * 360, behavior: "smooth" });

  const displayReviews = items.length > 0 ? items : CURATED_REVIEWS;

  return (
    <section className="py-12 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-950 tracking-tight">
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
          className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:border-[#d95d2c] hover:text-[#d95d2c] hover:scale-105"
        >
          <ChevronLeft size={18} className="stroke-[2.2]" />
        </button>

        <button
          type="button"
          aria-label="Next reviews"
          onClick={() => move(1)}
          className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:border-[#d95d2c] hover:text-[#d95d2c] hover:scale-105"
        >
          <ChevronRight size={18} className="stroke-[2.2]" />
        </button>

        <div
          ref={ref}
          className="no-scrollbar flex snap-x gap-5 overflow-x-auto px-2 py-2"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[300px] sm:w-[360px] shrink-0 animate-pulse rounded-3xl border border-slate-100 bg-white p-7 shadow-sm"
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
                  className="w-[290px] sm:w-[350px] lg:w-[370px] shrink-0 snap-start flex flex-col justify-between rounded-3xl border border-slate-100/90 bg-white p-6 sm:p-7 text-left shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div>
                    <span className="block text-slate-300 text-3xl sm:text-4xl font-serif leading-none select-none mb-3">
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
                          className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm border border-slate-100"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1478f2] text-xs font-bold text-white shadow-sm">
                          {review.initials}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-xs sm:text-sm font-bold text-slate-900">
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
      <div className="rounded-2xl sm:rounded-3xl border border-slate-100/90 bg-white p-6 sm:p-8 lg:p-10 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
        {/* Tabs Bar */}
        <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200/80 text-xs sm:text-sm md:text-base overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("countries")}
            className={`shrink-0 pb-3 font-bold transition-colors whitespace-nowrap -mb-[1px] ${
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
            className={`shrink-0 pb-3 font-bold transition-colors whitespace-nowrap -mb-[1px] ${
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
            className={`shrink-0 pb-3 font-bold transition-colors whitespace-nowrap -mb-[1px] ${
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
              className="group flex items-start gap-1.5 transition-colors hover:text-[#d95d2c]"
            >
              <span className="font-semibold text-slate-900 group-hover:text-[#d95d2c]">
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
