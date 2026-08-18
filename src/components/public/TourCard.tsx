"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { LuArrowRight as ArrowRight, LuCalendarDays as Calendar, LuHeart as Heart, LuMapPin as MapPin, LuScale as Scale, LuStar as Star } from "react-icons/lu";
import { PublicTour } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { DiscountCardBadge, DiscountPriceLine, hasActiveDiscount } from "@/components/public/DiscountPrice";

const FALLBACK = "/images/tour-card-fallback.jpg";

export type TourCardVariant = "search" | "featured" | "compact";

type Departure = { id: number; date: string; slots?: number; status?: string };

export type TourCardProps = {
  tour: Partial<PublicTour>;
  format: (amount: number | string | null | undefined, currency?: string) => string;
  variant?: TourCardVariant;
  href?: string;

  // "search" variant only - wishlist/compare are controlled by the parent
  // (which dedupes against a shared list across many cards on the page).
  view?: "grid" | "list";
  departures?: Departure[];
  wishlisted?: boolean;
  onWishlist?: () => void;
  compared?: boolean;
  compareLimitReached?: boolean;
  onCompare?: () => void;

  // "featured" variant only
  categoryLabel?: string;
};

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "2-digit" }).format(date);
}

/** Single shared tour card, styled per variant:
 *  - "search": full search-results card (wishlist/compare buttons, departure date chips, "View tour" CTA).
 *  - "featured": homepage featured-tours card (category ribbon, arrow CTA).
 *  - "compact": recommendation card used in Similar Tours rails (image + title + rating + price only).
 * All three share the same image/discount-badge/price building blocks so a
 * change like the discount badge only needs to happen once. */
export default function TourCard({ tour, format, variant = "search", href, view = "grid", departures = [], wishlisted, onWishlist, compared, compareLimitReached, onCompare, categoryLabel }: TourCardProps) {
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const image = tour.banner_image
    ? (tour.banner_image.startsWith("http") ? tour.banner_image : mediaUrl(tour.banner_image))
    : FALLBACK;
  const resolvedHref = href ?? publicTourUrl({ country_name: tour.country_name, title: tour.title || "Tour", slug: tour.slug });
  const discounted = hasActiveDiscount(tour);
  const days = tour.number_of_days || 6;

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
          <img src={image} alt={tour.title || "Tour"} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
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
            <img src={image} alt={tour.title || "Tour"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
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

  // "search" - the full search-results card, with grid/list layout support.
  return (
    <article className={`group relative rounded-xl border border-slate-100 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,.09)] transition hover:-translate-y-1 hover:shadow-xl ${view === "list" ? "grid sm:grid-cols-[340px_1fr]" : ""}`}>
      <div className="absolute right-5 top-5 z-10 flex flex-col gap-2">
        {onWishlist && (
          <button type="button" onClick={onWishlist} className={`flex h-8 w-8 items-center justify-center rounded-full ${wishlisted ? "bg-red-500 text-white" : "bg-white/90 text-red-500"}`}><Heart size={17} className={wishlisted ? "fill-current" : ""} /></button>
        )}
        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            disabled={compareLimitReached}
            aria-label={compared ? `Remove ${tour.title} from comparison` : compareLimitReached ? "Comparison list is full" : `Add ${tour.title} to comparison`}
            title={compareLimitReached ? "Comparison list is full" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${compared ? "bg-blue-600 text-white" : compareLimitReached ? "cursor-not-allowed bg-white/60 text-blue-300" : "bg-white/90 text-blue-600"}`}
          >
            <Scale size={16} />
          </button>
        )}
      </div>
      <Link href={resolvedHref} className="contents">
        <div className="relative h-48 overflow-hidden rounded-lg">
          <img src={image} alt={tour.title || "Tour"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <span className="absolute left-3 top-3 rounded-full bg-sky-400/80 px-3 py-1 text-[9px] font-bold text-white"><MapPin size={9} className="mr-1 inline" />{tour.country_name}</span>
          {discounted && <DiscountCardBadge percentage={tour.discount_percentage!} />}
        </div>
        <div className="p-1 pt-4">
          <div className="flex items-center justify-between gap-3"><h2 className="truncate text-base font-black">{tour.title}</h2><span className="shrink-0 rounded border border-blue-300 px-1 text-[8px] font-bold text-blue-600">{days}D | {Math.max(1, days - 1)}N</span></div>
          {tour.rating_average != null && <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-600"><Star size={11} className="fill-amber-400 text-amber-400" />{tour.rating_average.toFixed(1)} <span className="font-normal text-slate-400">({tour.rating_count})</span></div>}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-slate-600"><span><Calendar size={10} className="mr-1 inline text-blue-500" />{days} Days</span><span><MapPin size={10} className="mr-1 inline text-blue-500" />{tour.city_name || tour.country_name} to destination</span></div>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {departures.length
              ? departures.slice(0, 3).map((departure) => <span key={departure.id} className="rounded border border-slate-200 p-2 text-[9px]"><small>{shortDate(departure.date)}</small><b className="block text-xs">{tour.price_start_per_person ? format(tour.price_start_per_person, tour.currency || "USD") : "Request"}</b></span>)
              : <span className="col-span-3 rounded border border-slate-200 p-2 text-[9px] text-slate-500"><small>Dates on request</small><b className="block text-xs">Contact us</b></span>}
            <span className="flex items-center justify-center rounded border border-slate-200 text-xs font-black">+More</span>
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
            <span className="text-sm font-bold">{discounted ? <>From {priceBlock}</> : <>From <b className="text-xl">{tour.price_start_per_person ? format(tour.price_start_per_person, tour.currency || "USD") : "On request"}</b><small>pp</small></>}</span>
            <span className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">View tour <ArrowRight size={14} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
