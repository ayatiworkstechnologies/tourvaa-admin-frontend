"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuArrowRight as ArrowRight, LuCalendarDays as Calendar, LuCheck as Check, LuHeart as Heart, LuMapPin as MapPin, LuStar as Star, LuUsers as Users } from "react-icons/lu";
import { PublicTour } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { DiscountCardBadge, DiscountPriceLine, hasActiveDiscount } from "@/components/public/DiscountPrice";

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
    <p className={variant === "featured" ? "text-lg font-black text-zinc-950" : "text-sm font-black text-slate-900"}>
      {format(tour.price_start_per_person, tour.currency || "USD")} <span className="text-xs font-semibold text-slate-400">{variant === "featured" ? "/person" : "pp"}</span>
    </p>
  ) : (
    <p className="text-sm font-semibold text-slate-400">Price on request</p>
  );

  if (variant === "featured") {
    return (
      <Link href={resolvedHref} className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={imgSrc} alt={tour.title || "Tour"} onError={() => setImgSrc(FALLBACK)} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
          <span className="absolute bottom-3 left-3 rounded-md bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow">{categoryLabel || tour.category_name || "Featured"}</span>
          {discounted && <DiscountCardBadge percentage={tour.discount_percentage!} />}
        </div>
        <div className="p-4">
          <h3 className="font-heading line-clamp-2 text-base font-black text-zinc-950 transition-colors group-hover:text-teal-700">{tour.title}</h3>
          <p className="mt-1 text-xs font-semibold text-zinc-500">{[tour.city_name, tour.country_name].filter(Boolean).join(", ")} · {tour.number_of_days} Days</p>
          {tour.rating_average != null && <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-zinc-600"><Star size={11} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)} <span className="font-normal text-zinc-400">({tour.rating_count})</span></p>}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            {priceBlock}
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-700 group-hover:text-white">
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
            <img src={imgSrc} alt={tour.title || "Tour"} onError={() => setImgSrc(FALLBACK)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            {discounted && <DiscountCardBadge percentage={tour.discount_percentage!} />}
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-blue-600">{tour.city_name || tour.country_name}</p>
            <h4 className="mt-2 line-clamp-2 text-base font-black">{tour.title}</h4>
            {tour.rating_average != null && <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500"><Star size={12} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)} {tour.rating_count ? `(${tour.rating_count})` : ""}</p>}
            <div className="mt-3">{priceBlock}</div>
          </div>
        </a>
      </div>
    );
  }

  // Rating is the only per-tour signal that varies enough to stand in for a
  // "Best Seller" flag (there's no such field from the API).
  const isBestSeller = (tour.rating_average ?? 0) >= 4.7;

  // "search" - the full search-results card, with grid/list layout support.
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,.14)] ${view === "list" ? "sm:grid sm:grid-cols-[340px_1fr]" : ""}`}>
      <Link href={resolvedHref} className={`relative block h-52 shrink-0 overflow-hidden ${view === "list" ? "sm:h-full" : ""}`}>
        <img src={imgSrc} alt={tour.title || "Tour"} onError={() => setImgSrc(FALLBACK)} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isBestSeller && <span className="rounded-full bg-orange-500 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-md shadow-orange-500/30">Best Seller</span>}
          <span className="rounded-full bg-sky-500/90 px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">Private Tour</span>
        </div>
        {discounted && <span className="absolute right-14 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white shadow-md">{tour.discount_percentage}% OFF</span>}
        {tour.rating_average != null && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-900 shadow-md"><Star size={11} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)}</span>
        )}
      </Link>
      {onWishlist && (
        <button
          type="button"
          onClick={onWishlist}
          aria-label={wishlisted ? `Remove ${tour.title} from wishlist` : `Add ${tour.title} to wishlist`}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all hover:scale-110 ${wishlisted ? "bg-red-500 text-white" : "bg-white/90 text-slate-500 hover:text-red-500"}`}
        >
          <Heart size={15} className={wishlisted ? "fill-current" : ""} />
        </button>
      )}
      <div className="flex flex-1 flex-col p-4">
        <Link href={resolvedHref}>
          <h2 className="truncate text-base font-black transition-colors group-hover:text-[#E4572E]">{tour.title}</h2>
          <div className="mt-2.5 flex flex-col gap-1.5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2"><MapPin size={12} className="shrink-0 text-sky-500" /><span className="truncate">{tour.city_name ? `${tour.city_name}, ${tour.country_name}` : tour.country_name}</span></span>
            <span className="flex items-center gap-2"><Calendar size={12} className="shrink-0 text-sky-500" />{days} Days / {Math.max(1, days - 1)} Nights</span>
            <span className="flex items-center gap-2"><Users size={12} className="shrink-0 text-sky-500" />{groupSizeLabel}</span>
          </div>
          {tour.subtitle && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600"><Check size={13} className="shrink-0" />{tour.subtitle}</p>}
        </Link>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-bold">{discounted ? <>From {priceBlock}</> : <>From <b className="text-xl">{tour.price_start_per_person ? format(tour.price_start_per_person, tour.currency || "USD") : "On request"}</b><small>pp</small></>}</span>
          <Link href={resolvedHref} className="flex items-center gap-2 rounded-md bg-[#E4572E] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-orange-200 transition-all hover:bg-[#d95d2c] hover:shadow-md hover:shadow-orange-200">View tour <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></Link>
        </div>
      </div>
    </article>
  );
}
