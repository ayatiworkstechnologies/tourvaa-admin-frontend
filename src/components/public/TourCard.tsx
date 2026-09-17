"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as Calendar,
  LuCheck as Check,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuStar as Star,
  LuUsers as Users,
  LuCompass as Compass,
  LuSun as Sun,
  LuUser as User,
} from "react-icons/lu";
import { PublicTour } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { DiscountCardBadge, DiscountPriceLine, hasActiveDiscount } from "@/components/public/DiscountPrice";
import PrimaryCtaButton from "@/components/public/PrimaryCtaButton";

const FALLBACK = "/images/tour-card-fallback.jpg";

export type TourCardVariant = "search" | "featured" | "compact";

export type TourCardProps = {
  tour: Partial<PublicTour>;
  format: (amount: number | string | null | undefined, currency?: string) => string;
  variant?: TourCardVariant;
  href?: string;

  // "search" variant only - wishlist is controlled by the parent (which
  // dedupes against a shared list across many cards on the page).
  view?: "grid" | "list";
  wishlisted?: boolean;
  onWishlist?: () => void;

  // "featured" variant only
  categoryLabel?: string;
};

/** Single shared tour card, styled per variant:
 *  - "search": full search-results card (wishlist heart on the image, "View tour" CTA).
 *  - "featured": homepage featured-tours card (category ribbon, arrow CTA).
 *  - "compact": recommendation card used in Similar Tours rails (image + title + rating + price only).
 * All three share the same image/discount-badge/price building blocks so a
 * change like the discount badge only needs to happen once. */
export default function TourCard({ tour, format, variant = "search", href, view = "grid", wishlisted, onWishlist, categoryLabel }: TourCardProps) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const image = tour.banner_image
    ? (tour.banner_image.startsWith("http") ? tour.banner_image : mediaUrl(tour.banner_image))
    : FALLBACK;
  // A stored banner_image path can 404 (deleted file, bad upload, stale
  // record) - without a fallback the browser just renders nothing there,
  // which reads as a "broken" card in a grid of otherwise-fine photos.
  const [imgSrc, setImgSrc] = useState(image);
  useEffect(() => setImgSrc(image), [image]);
  const resolvedHref = href ?? publicTourUrl({ country_name: tour.country_name, title: tour.title || "Tour", slug: tour.slug });
  const discounted = hasActiveDiscount(tour);
  const days = tour.number_of_days || 6;
  // group_size sometimes comes through as a bare number ("16") rather than a
  // range/label - shown as-is that reads as a broken/truncated line, so a
  // purely numeric value gets a "Up to N people" wrapper instead.
  const groupSizeLabel = tour.group_size?.trim()
    ? (/^\d+$/.test(tour.group_size.trim()) ? `Up to ${tour.group_size.trim()} people` : tour.group_size)
    : "2–8 people";

  // "compact" manages its own wishlist state via the shared travel store;
  // "search" is controlled externally so the parent can dedupe/limit across
  // the whole results grid.
  const isCompact = variant === "compact";
  const compactWishlisted = isCompact && tour.id != null ? isWishlisted(tour.id) : false;
  const compactToggleWishlist = () => {
    if (!isCompact || tour.id == null) return;
    toggleWishlist({ id: tour.id, title: tour.title || "Tour", place: tour.city_name || tour.country_name || "", image, price: tour.price_start_per_person ?? null, currency: tour.currency || "USD", duration: tour.number_of_days ? `${tour.number_of_days}D` : "Flexible", href: resolvedHref });
  };

  const priceBlock = discounted ? (
    <DiscountPriceLine
      original={tour.original_price_per_person!}
      discounted={tour.discounted_price_per_person!}
      currency={tour.currency || "USD"}
      format={format}
      suffix={variant === "featured" ? "/person" : "pp"}
      size="sm"
    />
  ) : tour.price_start_per_person != null ? (
    <p className={variant === "featured" ? "text-lg font-black text-slate-900" : "text-sm font-black text-slate-900"}>
      {format(tour.price_start_per_person, tour.currency || "USD")} <span className="text-xs font-semibold text-slate-400">{variant === "featured" ? "/person" : "pp"}</span>
    </p>
  ) : (
    <p className="text-sm font-semibold text-slate-400">Price on request</p>
  );

  if (variant === "featured") {
    return (
      <Link href={resolvedHref} className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={imgSrc} alt={tour.title || "Tour"} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" onError={() => setImgSrc(FALLBACK)} className="object-cover transition duration-700 group-hover:scale-110" />
          <span className="absolute bottom-3 left-3 rounded-md bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow">{categoryLabel || tour.category_name || "Featured"}</span>
          {discounted && <DiscountCardBadge percentage={tour.discount_percentage!} />}
        </div>
        <div className="p-4">
          <h3 className="font-heading line-clamp-2 text-base font-black text-slate-900 transition-colors group-hover:text-pub-secondary">{tour.title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{[tour.city_name, tour.country_name].filter(Boolean).join(", ")} · {tour.number_of_days} Days</p>
          {tour.rating_average != null && <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-600"><Star size={11} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)} <span className="font-normal text-slate-400">({tour.rating_count})</span></p>}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            {priceBlock}
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-pub-secondary/10 text-pub-secondary transition-colors group-hover:bg-pub-secondary group-hover:text-white">
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (isCompact) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <button type="button" onClick={compactToggleWishlist} aria-label={compactWishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`} className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition hover:scale-110 ${compactWishlisted ? "bg-red-500 text-white" : "bg-black/20 text-white hover:bg-white hover:text-red-500"}`}><Heart size={15} className={compactWishlisted ? "fill-current" : ""} /></button>
        <a href={resolvedHref} className="block">
          <div className="relative h-48 overflow-hidden">
            <Image src={imgSrc} alt={tour.title || "Tour"} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" onError={() => setImgSrc(FALLBACK)} className="object-cover transition duration-700 group-hover:scale-105" />
            {discounted && <DiscountCardBadge percentage={tour.discount_percentage!} />}
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-blue-600">{tour.city_name || tour.country_name}</p>
            <h4 className="font-heading mt-2 line-clamp-2 text-base font-black">{tour.title}</h4>
            {tour.rating_average != null && <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500"><Star size={12} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)} {tour.rating_count ? `(${tour.rating_count})` : ""}</p>}
            <div className="mt-3">{priceBlock}</div>
          </div>
        </a>
      </div>
    );
  }

  // "search" - the full search-results card, with grid/list layout support.
  const isTourWishlisted = wishlisted ?? (tour.id != null ? isWishlisted(tour.id) : false);
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) {
      onWishlist();
    } else if (tour.id != null) {
      toggleWishlist({
        id: tour.id,
        title: tour.title || "Tour",
        place: tour.city_name || tour.country_name || "",
        image,
        price: tour.price_start_per_person ?? null,
        currency: tour.currency || "USD",
        duration: tour.number_of_days ? `${tour.number_of_days}D` : "Flexible",
        href: resolvedHref,
      });
    }
  };

  const basePrice = tour.price_start_per_person || (discounted ? tour.discounted_price_per_person : 1182) || 1182;
  const currency = tour.currency || "USD";
  const originalPrice = tour.original_price_per_person || Math.round(basePrice * 1.33);
  const routeSummary = tour.city_name?.includes(",")
    ? tour.city_name.split(",").slice(0, 2).join(" → ")
    : tour.city_name
      ? `${tour.city_name} Circuit`
      : `${tour.country_name || "Regional"} Circuit`;

  const departureChips = [
    { date: "5 Oct '26", price: format(basePrice, currency) },
    { date: "12 Oct '26", price: format(Math.round(basePrice * 1.05), currency) },
    { date: "19 Oct '26", price: format(Math.round(basePrice * 0.98), currency) },
  ];

  return (
    <article className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${view === "list" ? "sm:grid sm:grid-cols-[320px_1fr] sm:gap-5" : ""}`}>
      {/* ── Image Header ── */}
      <div className={`relative w-full overflow-hidden rounded-xl bg-slate-100 ${view === "list" ? "h-56 sm:h-full" : "h-52"}`}>
        <Link href={resolvedHref} className="relative block h-full w-full">
          <Image
            src={imgSrc}
            alt={tour.title || "Tour"}
            fill
            sizes="(min-width: 640px) 340px, 100vw"
            onError={() => setImgSrc(FALLBACK)}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Wishlist Heart Button Top Right */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isTourWishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`}
          className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-xs shadow-xs transition hover:scale-110 cursor-pointer ${
            isTourWishlisted ? "bg-red-500 text-white" : "bg-white/85 text-slate-600 hover:text-red-500 hover:bg-white"
          }`}
        >
          <Heart size={15} className={isTourWishlisted ? "fill-current" : ""} />
        </button>
      </div>

      {/* ── Card Body ── */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          {/* Title & Duration Badge Row */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={resolvedHref}
              className="text-base font-semibold text-slate-900 tracking-tight line-clamp-1 group-hover:text-[#DF6951] transition"
            >
              {tour.title}
            </Link>
            <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {days}D | {Math.max(1, days - 1)}N
            </span>
          </div>

          {/* 2-Column Specifications Grid with sky blue icons */}
          <div className="mt-3.5 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-slate-600 font-medium">
            {/* Left Column */}
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 truncate">
                <Sun size={12} className="text-sky-500 shrink-0" />
                <span>{days} Days</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-sky-500 shrink-0" />
                <span className="truncate">{routeSummary}</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <Compass size={12} className="text-sky-500 shrink-0" />
                <span>{tour.category_name || "Full Guided"}</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <Users size={12} className="text-sky-500 shrink-0" />
                <span>Max Group Size: {tour.group_size ? tour.group_size.replace(/^Max\s*/i, "") : "16"}</span>
              </p>
            </div>

            {/* Right Column */}
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 truncate">
                <User size={12} className="text-sky-500 shrink-0" />
                <span>Minimum age: 16</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <User size={12} className="text-sky-500 shrink-0" />
                <span>Maximum age: 65</span>
              </p>
              <p className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-sky-500 shrink-0" />
                <span className="truncate">{tour.city_name || tour.country_name || "Destinations"} +3 More</span>
              </p>
            </div>
          </div>

          {/* Upcoming Available Departure Date Chips */}
          <div className="mt-3.5 grid grid-cols-4 gap-1.5">
            {departureChips.map((chip, cIdx) => (
              <div
                key={cIdx}
                className="rounded-lg border border-slate-200/90 bg-white py-1 px-1 text-center shadow-2xs"
              >
                <p className="text-[9px] font-medium text-slate-500 truncate">{chip.date}</p>
                <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">{chip.price}</p>
              </div>
            ))}
            <Link
              href={resolvedHref}
              className="rounded-lg border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 py-1 px-1 text-center shadow-2xs flex items-center justify-center text-[11px] font-bold text-slate-800 transition"
            >
              +More
            </Link>
          </div>
        </div>

        {/* Bottom Pricing & CTA Button Row */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div className="text-xs text-slate-500 font-medium">
            <span>From </span>
            {discounted ? (
              <>
                <span className="line-through text-slate-400 mr-1 text-xs">{format(originalPrice, currency)}</span>
                <span className="text-base font-bold text-slate-900">{format(basePrice, currency)}</span>
              </>
            ) : (
              <span className="text-base font-bold text-slate-900">{format(basePrice, currency)}</span>
            )}
            <span className="text-[11px] text-slate-400 ml-0.5">pp</span>
          </div>

          <PrimaryCtaButton href={resolvedHref} size="sm">
            View tour
          </PrimaryCtaButton>
        </div>
      </div>
    </article>
  );
}
