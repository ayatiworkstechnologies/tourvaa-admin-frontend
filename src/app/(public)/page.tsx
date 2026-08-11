"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowRight as ArrowRight,
  LuAward as Award,
  LuBadgeCheck as BadgeCheck,
  LuBed as Bed,
  LuChevronDown as ChevronDown,
  LuClock3 as Clock,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuHotel as Hotel,
  LuMapPin as MapPin,
  LuPlane as Plane,
  LuQuote as Quote,
  LuScale as Scale,
  LuShieldCheck as ShieldCheck,
  LuStar as Star,
  LuUsers as Users,
} from "react-icons/lu";
import { useToast } from "@/hooks/useToast";
import HeroFilterBar from "@/components/public/HeroFilterBar";
import {
  CmsBanner,
  CmsDestination,
  CmsReview,
  fetchCustomerReviews,
  fetchFeaturedTours,
  fetchHomepageBanners,
  fetchPopularDestinations,
  fetchPublicCountries,
  fetchPublicTours,
  PublicCountry,
  PublicTour,
} from "@/lib/api/publicClient";
import { MAX_COMPARE_ITEMS, useTravelStore } from "@/providers/TravelStoreProvider";
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
  currency?: string;
  slug?: string;
  badge?: string;
};

const PLACEHOLDER_IMAGE = "/images/tour-card-fallback.jpg";

function stableHash(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 33) ^ value.charCodeAt(i);
  return hash >>> 0;
}

const DEMO_TRENDING_TOURS: Tour[] = [
  {
    id: 101,
    title: "New Zealand Explorer",
    place: "New Zealand",
    image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80",
    days: "9 Days",
    reviews: "2,050 reviews",
    rating: 4.8,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "9 Days" },
      { icon: MapPin, text: "Auckland + 3 Southland" },
      { icon: Users, text: "Age Range: 12 - 70" },
      { icon: Users, text: "Max Group Size: 24" },
    ],
    rawPrice: 1102,
    originalPrice: 1470,
    currency: "USD",
    slug: "new-zealand-explorer",
  },
  {
    id: 102,
    title: "Golden Triangle Escape",
    place: "India",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    reviews: "1,889 reviews",
    rating: 4.7,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "7 Days / 6 Nights" },
      { icon: MapPin, text: "Delhi + Agra + Jaipur" },
      { icon: Users, text: "Age Range: 10 - 75" },
      { icon: Users, text: "Max Group Size: 20" },
    ],
    rawPrice: 639,
    originalPrice: 852,
    currency: "USD",
    slug: "golden-triangle-escape",
  },
  {
    id: 103,
    title: "Swiss Alpine Adventure",
    place: "Switzerland",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    days: "8 Days",
    reviews: "3,412 reviews",
    rating: 4.9,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "8 Days / 7 Nights" },
      { icon: MapPin, text: "Zurich + Lucerne" },
      { icon: Users, text: "Age Range: 15 - 65" },
      { icon: Users, text: "Max Group Size: 18" },
    ],
    rawPrice: 1575,
    originalPrice: 2100,
    currency: "USD",
    slug: "swiss-alpine-adventure",
  },
  {
    id: 104,
    title: "Cherry Blossom Express",
    place: "Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    days: "8 Days",
    reviews: "1,689 reviews",
    rating: 4.9,
    badge: "Save 25%",
    features: [
      { icon: Clock, text: "8 Days / 7 Nights" },
      { icon: MapPin, text: "Tokyo + Kyoto" },
      { icon: Users, text: "Age Range: 12 - 70" },
      { icon: Users, text: "Max Group Size: 16" },
    ],
    rawPrice: 1800,
    originalPrice: 2400,
    currency: "USD",
    slug: "cherry-blossom-express",
  },
];

const DEMO_HANDPICKED_TOURS: Tour[] = [
  {
    id: 201,
    title: "South Island Explorer",
    place: "New Zealand",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    durationTag: "7D / 6N",
    reviews: "2,050 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Including accommodation" },
      { icon: Award, text: "100% 5-Star Service" },
      { icon: Plane, text: "Airport Transfers available" },
    ],
    rawPrice: 2699,
    originalPrice: 3599,
    currency: "USD",
    slug: "south-island-explorer",
  },
  {
    id: 202,
    title: "Golden Triangle Escape",
    place: "India",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    durationTag: "7D / 6N",
    reviews: "2,050 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Premium accommodation" },
      { icon: Award, text: "Guided heritage tour" },
      { icon: Plane, text: "Daily breakfast included" },
    ],
    rawPrice: 799,
    originalPrice: 999,
    currency: "USD",
    slug: "golden-triangle-escape-handpicked",
  },
  {
    id: 203,
    title: "Swiss Alps Escape",
    place: "Switzerland",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    days: "6 Days",
    durationTag: "6D / 5N",
    reviews: "3,128 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Mountain view accommodation" },
      { icon: Award, text: "Scenic Train Experience" },
      { icon: Plane, text: "Daily breakfast included" },
    ],
    rawPrice: 780,
    originalPrice: 990,
    currency: "USD",
    slug: "swiss-alps-escape",
  },
  {
    id: 204,
    title: "Paris & Provence",
    place: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    days: "7 Days",
    durationTag: "7D / 6N",
    reviews: "2,650 reviews",
    rating: 4.8,
    features: [
      { icon: Hotel, text: "Central city accommodation" },
      { icon: Award, text: "Expert local tour guide" },
      { icon: Plane, text: "Wine & food tasting included" },
    ],
    rawPrice: 870,
    originalPrice: 1150,
    currency: "USD",
    slug: "paris-and-provence",
  },
];

const DEMO_PLACES = [
  {
    name: "New Zealand",
    count: "125 Packages",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    price: 1102,
    currency: "USD",
  },
  {
    name: "India",
    count: "75 Packages",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    price: 639,
    currency: "USD",
  },
  {
    name: "Switzerland",
    count: "85 Packages",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    price: 780,
    currency: "USD",
  },
  {
    name: "France",
    count: "110 Packages",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    price: 870,
    currency: "USD",
  },
];

function mapPublicTour(tour: PublicTour, isHandpicked = false): Tour {
  const durationLabel = tour.number_of_days
    ? `${tour.number_of_days} Day${tour.number_of_days === 1 ? "" : "s"}`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hour${tour.number_of_hours === 1 ? "" : "s"}`
      : "Flexible";

  const durationTag = tour.number_of_days
    ? `${tour.number_of_days}D / ${Math.max(0, tour.number_of_days - 1)}N`
    : tour.number_of_hours
      ? `${tour.number_of_hours} Hours`
      : undefined;

  let features: TourFeature[] = [];

  if (isHandpicked) {
    features = [
      { icon: Hotel, text: "Including accommodation" },
      { icon: Award, text: "100% 5-Star Service" },
      { icon: Plane, text: "Airport Transfers available" },
    ];
  } else {
    features = [{ icon: Clock, text: durationLabel }];
    if (tour.start_location && tour.end_location) {
      features.push({ icon: MapPin, text: `${tour.start_location} → ${tour.end_location}` });
    } else if (tour.city_name) {
      features.push({ icon: MapPin, text: `${tour.city_name} & Region` });
    } else {
      features.push({ icon: MapPin, text: `${tour.country_name || "Destination"} Route` });
    }
    features.push({ icon: Users, text: `Age Range: 12 - 70` });
    if (tour.group_size) {
      features.push({ icon: Users, text: `Max Group Size: ${tour.group_size}` });
    } else {
      features.push({ icon: Users, text: `Max Group Size: 24` });
    }
  }

  const rawPrice = tour.price_start_per_person;
  const originalPrice = rawPrice != null ? Math.round(rawPrice / 0.75) : null;

  return {
    id: tour.id,
    title: tour.title,
    place: tour.country_name || tour.city_name || "Worldwide",
    image: tour.banner_image ? mediaUrl(tour.banner_image) : PLACEHOLDER_IMAGE,
    days: durationLabel,
    durationTag,
    reviews: tour.rating_count ? `${tour.rating_count} reviews` : "2,050 reviews",
    rating: tour.rating_average ?? 4.8,
    features,
    rawPrice,
    originalPrice,
    currency: tour.currency || "USD",
    slug: tour.slug,
    badge: "Save 25%",
  };
}

function mapDestination(item: CmsDestination, tourCounts: Map<string, number>) {
  const matchedCount = tourCounts.get(item.title.trim().toLowerCase());
  const count = matchedCount != null ? `${matchedCount} package${matchedCount === 1 ? "" : "s"}` : item.description || "Explore packages";
  return { name: item.title, count, rating: "4.9", image: item.image || PLACEHOLDER_IMAGE, price: null as number | null, currency: "USD" };
}

function mapReview(item: CmsReview) {
  const initials = item.reviewer_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return { quote: item.review_text, name: item.reviewer_name, city: item.country || "Verified traveller", tourName: item.tour_name || "", initials, rating: Math.max(1, Math.min(5, item.rating || 5)) };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && node.classList.add("is-visible"), { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal-block ${className}`}>{children}</div>;
}


function TrustBadge({ icon: Icon, title, note }: { icon: React.ElementType; title: string; note: string }) {
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

function Stars({ reviews: count }: { reviews?: string }) {
  return <div className="mt-1 flex items-center gap-1 text-[10px]"><span className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="fill-current" />)}</span><b className="text-slate-700">4.8</b>{count && <span className="text-slate-400">{count} reviews</span>}</div>;
}

function TrendingTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useTravelStore();
  const { format } = useCurrency();
  const toast = useToast();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const compared = tour.id != null && isCompared(tour.id);
  const href = tour.id ? publicTourUrl(tour) : `/tours?search=${encodeURIComponent(tour.title)}`;
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

  const originalPrice = tour.originalPrice ?? (tour.rawPrice != null ? Math.round(tour.rawPrice / 0.75) : null);

  return (
    <article className="group relative w-[290px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[310px] lg:w-[315px] xl:w-[325px]">
      <div className="absolute right-6 top-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`}
          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart size={15} className={wishlisted ? "fill-current" : ""} />
        </button>
        {tour.id != null && (
          <button
            type="button"
            onClick={() => {
              const { limitReached } = toggleCompare(travelItem);
              if (limitReached) toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} tours at a time.`);
            }}
            aria-label={compared ? `Remove ${tour.title} from comparison` : `Add ${tour.title} to comparison`}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
              compared ? "bg-blue-600 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:bg-blue-600 hover:text-white"
            }`}
          >
            <Scale size={14} />
          </button>
        )}
      </div>

      <Link href={href} aria-label={`View ${tour.title}`} className="block focus-visible:outline-none">
        <div className="relative h-48 overflow-hidden rounded-xl">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
            <MapPin size={10} className="text-sky-500" /> {tour.place}
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-[#1478f2] px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
            {tour.badge || "Save 25%"}
          </span>
        </div>

        <div className="pt-3.5">
          <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {tour.title}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} className="fill-current" />
              ))}
            </span>
            <b className="font-bold text-slate-900">{tour.rating || "4.8"}</b>
            <span className="text-slate-400">({tour.reviews})</span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            {tour.features.map((feature, index) => (
              <p key={index} className="flex items-center gap-2">
                <feature.icon size={13} className="shrink-0 text-sky-500" />
                <span className="truncate">{feature.text}</span>
              </p>
            ))}
          </div>

          <div className="mt-3.5 flex items-baseline gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-slate-500">From</span>
            {originalPrice != null && (
              <span className="text-xs text-slate-400 line-through">
                {format(originalPrice, tour.currency || "USD")}
              </span>
            )}
            <strong className="text-xl font-black text-slate-950">
              {tour.rawPrice != null ? format(tour.rawPrice, tour.currency || "USD") : "Price on request"}
            </strong>
            <span className="text-[10px] font-medium text-slate-400">pp</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function HandpickedTourCard({ tour }: { tour: Tour }) {
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useTravelStore();
  const { format } = useCurrency();
  const toast = useToast();
  const itemId = tour.id ?? stableHash(tour.slug || tour.title);
  const wishlisted = isWishlisted(itemId);
  const compared = tour.id != null && isCompared(tour.id);
  const href = tour.id ? publicTourUrl(tour) : `/tours?search=${encodeURIComponent(tour.title)}`;
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

  const originalPrice = tour.originalPrice ?? (tour.rawPrice != null ? Math.round(tour.rawPrice / 0.75) : null);

  return (
    <article className="group relative w-[290px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[310px] lg:w-[315px] xl:w-[325px]">
      <div className="absolute right-6 top-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(travelItem)}
          aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`}
          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart size={15} className={wishlisted ? "fill-current" : ""} />
        </button>
        {tour.id != null && (
          <button
            type="button"
            onClick={() => {
              const { limitReached } = toggleCompare(travelItem);
              if (limitReached) toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} tours at a time.`);
            }}
            aria-label={compared ? `Remove ${tour.title} from comparison` : `Add ${tour.title} to comparison`}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110 ${
              compared ? "bg-blue-600 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:bg-blue-600 hover:text-white"
            }`}
          >
            <Scale size={14} />
          </button>
        )}
      </div>

      <Link href={href} aria-label={`View ${tour.title}`} className="block focus-visible:outline-none">
        <div className="relative h-48 overflow-hidden rounded-xl">
          <img
            src={tour.image}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
            <MapPin size={10} className="text-sky-500" /> {tour.place}
          </span>
        </div>

        <div className="pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
              {tour.title}
            </h3>
            {tour.durationTag && (
              <span className="shrink-0 rounded border border-blue-200 bg-blue-50/50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                {tour.durationTag}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={11} className="fill-current" />
              ))}
            </span>
            <b className="font-bold text-slate-900">{tour.rating || "4.8"}</b>
            <span className="text-slate-400">({tour.reviews})</span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            {tour.features.map((feature, index) => (
              <p key={index} className="flex items-center gap-2">
                <feature.icon size={13} className="shrink-0 text-sky-500" />
                <span className="truncate">{feature.text}</span>
              </p>
            ))}
          </div>

          <div className="mt-3.5 flex items-baseline gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-slate-500">From</span>
            {originalPrice != null && (
              <span className="text-xs text-slate-400 line-through">
                {format(originalPrice, tour.currency || "USD")}
              </span>
            )}
            <strong className="text-xl font-black text-slate-950">
              {tour.rawPrice != null ? format(tour.rawPrice, tour.currency || "USD") : "Price on request"}
            </strong>
            <span className="text-[10px] font-medium text-slate-400">pp</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function TourCardSkeleton() {
  return (
    <div className="w-[290px] shrink-0 animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 sm:w-[310px] lg:w-[315px]">
      <div className="h-48 rounded-xl bg-slate-100" />
      <div className="pt-3">
        <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        <div className="mt-3 h-3 w-1/2 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-2/3 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function CarouselSection({
  title,
  tours,
  cardType = "trending",
  loading,
}: {
  title: string;
  tours: Tour[];
  cardType?: "trending" | "handpicked";
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  const displayTours = tours;

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous tours"
            onClick={() => move(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next tours"
            onClick={() => move(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div className="snap-start" key={index}>
                <TourCardSkeleton />
              </div>
            ))
          : displayTours.map((tour, index) => (
              <div className="snap-start" key={`${tour.title}-${index}`}>
                {cardType === "handpicked" ? <HandpickedTourCard tour={tour} /> : <TrendingTourCard tour={tour} />}
              </div>
            ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);
  const [trendingTours, setTrendingTours] = useState<Tour[]>([]);
  const [handpickedTours, setHandpickedTours] = useState<Tour[]>([]);
  const [dynamicPlaces, setDynamicPlaces] = useState<{ name: string; count: string; rating: string; image: string; price: number | null; currency: string }[]>([]);
  const [dynamicReviews, setDynamicReviews] = useState<{ quote: string; name: string; city: string; tourName: string; initials: string; rating: number }[]>([]);
  const [searchCountries, setSearchCountries] = useState<PublicCountry[]>([]);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchHomepageBanners(), fetchFeaturedTours(10), fetchPopularDestinations(), fetchCustomerReviews(), fetchPublicCountries()]).then(([bannerResult, tourResult, destinationResult, reviewResult, countryResult]) => {
      if (!active) return;
      if (bannerResult.status === "fulfilled" && bannerResult.value.length) setBanners(bannerResult.value);
      if (tourResult.status === "fulfilled" && tourResult.value.length) {
        const mapped = tourResult.value.map((tour) => mapPublicTour(tour));
        setTrendingTours(mapped.slice(0, 5));
        setHandpickedTours((mapped.length > 5 ? mapped.slice(5, 10) : mapped).slice(0, 5).map((tour) => ({ ...tour, features: [{ icon: Hotel, text: "Including accommodation" }, { icon: Award, text: "100% 5-Star Service" }, { icon: Plane, text: "Airport Transfers available" }] })));
      }
      if (destinationResult.status === "fulfilled" && destinationResult.value.length) {
        const tourCounts = new Map<string, number>();
        if (countryResult.status === "fulfilled") {
          countryResult.value.forEach((country) => tourCounts.set(country.country_name.trim().toLowerCase(), country.tour_count || 0));
        }
        const places = destinationResult.value.slice(0, 5).map((item) => mapDestination(item, tourCounts));
        setDynamicPlaces(places);
        // Not available_only -- that requires a configured TourCalendar
        // departure and would silently return no price for every
        // destination whose tours don't have one set up yet (see
        // CountryTourListing.tsx's identical fix).
        Promise.allSettled(places.map((place) => fetchPublicTours({ country: place.name, sort: "price_asc", limit: 1 }))).then((priceResults) => {
          if (!active) return;
          setDynamicPlaces((current) => current.map((place, index) => {
            const result = priceResults[index];
            if (result.status !== "fulfilled" || !result.value.items.length) return place;
            const cheapest = result.value.items[0];
            return { ...place, price: cheapest.price_start_per_person, currency: cheapest.currency || "USD" };
          }));
        });
      }
      if (countryResult.status === "fulfilled") setSearchCountries(countryResult.value);
      if (reviewResult.status === "fulfilled" && reviewResult.value.length) setDynamicReviews(reviewResult.value.slice(0, 6).map(mapReview));
      setLoadingHome(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[bannerIndex];
  const heroImage = banner?.image ;
  const heroTitle = banner?.title || "Endless destinations. One easy search.";

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      <section className="relative z-30 flex min-h-screen items-center justify-center overflow-visible pt-20 text-center text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img key={heroImage} src={heroImage} alt={banner?.title || "Dramatic green mountain landscape"} className="animate-hero-img h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/25 to-slate-950/60" />
        </div>
        <div className="relative z-10 w-full px-4">
          <span className="animate-fade-up mx-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-5 py-2 text-xs font-semibold text-white backdrop-blur">◔ Discover the world with confidence</span>
          <h1 key={heroTitle} className="animate-fade-up mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{heroTitle}</h1>
          {banner?.subtitle && <p className="animate-fade-up delay-100 mx-auto mt-4 max-w-xl text-base text-white/85">{banner.subtitle}</p>}
          <div className="animate-fade-up delay-200 mt-12"><HeroFilterBar countries={searchCountries} onPanelOpenChange={setSearchPanelOpen} /></div>
          <div className="animate-fade-up delay-400 mt-12">
            {/* Separate from the animate-fade-up entrance animation above: that
             * animation's `both` fill-mode pins opacity:1 after it finishes,
             * which otherwise fights this state-driven opacity toggle for
             * cascade priority. Keeping them on different elements avoids that. */}
            <div className={`relative z-0 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-medium text-white/90 transition-opacity duration-200 ${searchPanelOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}>
              <TrustBadge icon={Star} title="4.8/5 Traveller Rating" note="from 20,000+ reviews" />
              <TrustBadge icon={ShieldCheck} title="Secure Payments" note="100% secure & protected" />
              <TrustBadge icon={BadgeCheck} title="Verified Tour Partners" note="Handpicked experts" />
              <TrustBadge icon={Headset} title="24/7 Travel Assistance" note="We're here for you" />
            </div>
          </div>
        </div>
        <span className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce text-white/70 sm:block">
          <ChevronDown size={22} />
        </span>
      </section>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">
        <Reveal><CarouselSection title="Trending Tour Packages" tours={trendingTours} cardType="trending" loading={loadingHome} /></Reveal>

        <Reveal><CarouselSection title="Handpicked Tours for You" tours={handpickedTours} cardType="handpicked" loading={loadingHome} /></Reveal>

        <Reveal className="py-6">
          <section className="grid gap-6 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:grid-cols-2 md:items-center">
            <img
              src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85"
              alt="Group of travellers hiking a mountain trail"
              className="h-60 sm:h-72 md:h-80 w-full rounded-xl object-cover shadow-sm"
            />
            <div className="flex flex-col items-start justify-center py-2 text-left">
              <h2 className="max-w-lg text-2xl font-extrabold leading-tight text-[#1478f2] sm:text-3xl lg:text-4xl">
                Travel stories, guides and inspiration for every journey
              </h2>
              <p className="mt-4 max-w-md text-xs sm:text-sm leading-relaxed text-slate-500">
                Explore travel guides, insider tips and inspiring stories from destinations around the world.
              </p>
              <Link
                href="/blogs"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#1478f2] px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
              >
                Read Stories
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal><PlacesCarousel places={dynamicPlaces} loading={loadingHome} /></Reveal>

        <Reveal><WhyTourvaa /></Reveal>

        <Reveal><Testimonials reviews={dynamicReviews} loading={loadingHome} /></Reveal>
      </div>
    </main>
  );
}

function WhyTourvaa() {
  const items = [
    { icon: ShieldCheck, color: "bg-blue-100 text-blue-600", title: "Verified Experiences", note: "Every tour is carefully reviewed and quality-checked before being published." },
    { icon: BadgeCheck, color: "bg-emerald-100 text-emerald-600", title: "Transparent Pricing", note: "Clear package pricing with no hidden charges or unexpected costs." },
    { icon: Headset, color: "bg-violet-100 text-violet-600", title: "Flexible Support", note: "Get assistance before, during and after your trip from our travel experts." },
    { icon: Users, color: "bg-orange-100 text-orange-600", title: "Trusted Local Partners", note: "Travel with verified destination specialists and reliable local partners." },
  ];
  return (
    <section className="rounded-2xl bg-slate-50 py-10 sm:px-10">
      <h2 className="text-center text-xl font-bold sm:text-2xl">Why travel with Tourvaa?</h2>
      <div className="mt-8 grid gap-6 px-5 sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {items.map(({ icon: Icon, color, title, note }) => (
          <div key={title} className="text-center">
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${color}`}><Icon size={22} /></span>
            <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlacesCarousel({
  places: items,
  loading,
}: {
  places: { name: string; count: string; rating: string; image: string; price: number | null; currency: string }[];
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 270, behavior: "smooth" });
  const displayPlaces = items.length > 0 ? items : DEMO_PLACES;

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">Places Worth Exploring</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous places"
            onClick={() => move(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next places"
            onClick={() => move(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-52 w-[240px] shrink-0 animate-pulse rounded-2xl bg-slate-100" />
            ))
          : displayPlaces.map((place) => <PlaceCard key={place.name} place={place} />)}
      </div>
    </section>
  );
}

function PlaceCard({ place }: { place: { name: string; count: string; rating: string; image: string } }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link
      href={`/tours?country=${place.name}`}
      className="group block w-[230px] sm:w-[250px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-40 overflow-hidden rounded-xl">
        <img
          src={place.image}
          alt={place.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm">
          <MapPin size={10} className="text-sky-500" /> {place.name}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSaved((value) => !value);
          }}
          aria-label={saved ? `Remove ${place.name} from wishlist` : `Add ${place.name} to wishlist`}
          className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition hover:scale-110 ${
            saved ? "bg-red-500 text-white" : "bg-white/80 text-slate-700 hover:bg-white hover:text-red-500"
          }`}
        >
          <Heart size={13} className={saved ? "fill-current" : ""} />
        </button>
      </div>
      <div className="pt-3 px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {place.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-800">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {place.rating}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin size={11} className="text-sky-500" />
          {place.count}
        </p>
      </div>
    </Link>
  );
}

function Testimonials({ reviews: items, loading }: { reviews: { quote: string; name: string; city: string; tourName: string; initials: string; rating: number }[]; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  if (!loading && items.length === 0) return null;
  return (
    <section className="py-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">What Tourvaa travellers are saying</h2>
        <div className="flex gap-2">
          <button aria-label="Previous reviews" onClick={() => move(-1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowLeft size={15} /></button>
          <button aria-label="Next reviews" onClick={() => move(1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white transition hover:border-blue-500 hover:text-blue-600"><ArrowRight size={15} /></button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-5 overflow-x-auto pb-2">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-[320px] shrink-0 animate-pulse rounded-2xl border border-slate-100 bg-white p-7">
                <div className="h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
                <div className="mt-6 flex items-center border-t border-slate-100 pt-4"><div className="h-10 w-10 rounded-full bg-slate-100" /><div className="ml-3 space-y-2"><div className="h-3 w-20 rounded-full bg-slate-100" /><div className="h-3 w-14 rounded-full bg-slate-100" /></div></div>
              </div>
            ))
          : items.map((review) => (
              <article key={review.name} className="w-[320px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-white p-7 text-left shadow-[0_8px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-1">
                <Quote size={25} className="text-slate-200" />
                <p className="mt-4 min-h-24 text-xs leading-relaxed text-slate-700">“{review.quote}”</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{review.initials}</span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[11px] font-bold">{review.name}</h3>
                    <p className="truncate text-[9px] text-slate-400">{review.city}</p>
                  </div>
                </div>
                <span className="mt-2.5 flex text-amber-400">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={12} className="fill-current" />)}</span>
              </article>
            ))}
      </div>
    </section>
  );
}
