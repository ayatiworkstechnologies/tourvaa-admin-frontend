"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuLightbulb as Lightbulb,
  LuMapPin as MapPin,
  LuStar as Star,
} from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import { useTravelStore, type TravelItem } from "@/providers/TravelStoreProvider";
import {
  fetchPublicTourDetail,
  fetchToursOnDeals,
  type CmsDealTour,
  type PublicTour,
} from "@/lib/api/publicClient";
import HomeNewsletterBanner from "@/components/public/home/HomeNewsletterBanner";
import WishlistButton from "@/components/public/WishlistButton";
import { publicTourUrl } from "@/lib/utils/tourUrl";

type DealCardItem = {
  id: number;
  title: string;
  href: string;
  country: string;
  category: string;
  image: string;
  currency: string;
  originalPrice: number | null;
  dealPrice: number | null;
  discountPercent: number | null;
  dealLabel: string | null;
  rating: number | null;
  reviewCount: number;
  days: number | null;
};

const FALLBACK_IMAGE = "/images/tour-card-fallback.jpg";

function buildDeal(ref: CmsDealTour, tour: PublicTour): DealCardItem {
  const dealPrice = tour.discounted_price_per_person ?? tour.supplier_discounted_price_per_person ?? tour.price_start_per_person ?? null;
  const originalPrice = tour.storefront_original_price_per_person ?? tour.original_price_per_person ?? tour.price_start_per_person ?? null;
  const calculatedDiscount = originalPrice && dealPrice && originalPrice > dealPrice
    ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
    : null;

  return {
    id: tour.id,
    title: tour.title,
    href: publicTourUrl(tour),
    country: tour.country_name || "Destination",
    category: tour.category_name || "Tours",
    image: tour.banner_image || FALLBACK_IMAGE,
    currency: tour.currency || "USD",
    originalPrice: originalPrice && dealPrice && originalPrice > dealPrice ? originalPrice : null,
    dealPrice,
    discountPercent: ref.discount_percentage ?? tour.discount_percentage ?? calculatedDiscount,
    dealLabel: ref.deal_label || tour.tourvaa_discount_name || tour.supplier_discount_name || null,
    rating: tour.rating_average ?? null,
    reviewCount: tour.rating_count ?? 0,
    days: tour.number_of_days ?? null,
  };
}

function toTravelItem(deal: DealCardItem): TravelItem {
  return {
    id: deal.id,
    title: deal.title,
    place: deal.country,
    image: deal.image,
    price: deal.dealPrice,
    currency: deal.currency,
    duration: deal.days ? `${deal.days} days` : "",
    href: deal.href,
  };
}

function DealsSkeleton() {
  return (
    <div className="flex gap-4 sm:gap-5" aria-label="Loading deals">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[300px] min-w-[260px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 sm:min-w-[300px]" />
      ))}
    </div>
  );
}

function DealCard({ deal }: { deal: DealCardItem }) {
  const { format } = useCurrency();
  const { isWishlisted, toggleWishlist } = useTravelStore();
  const rating = deal.rating && deal.rating > 0 ? deal.rating.toFixed(1) : null;
  const discountLabel = deal.dealLabel || (deal.discountPercent ? `Save ${deal.discountPercent}%` : null);

  return (
    <article data-deal-item className="group flex min-w-[260px] max-w-[330px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-w-[300px]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img src={deal.image} alt={deal.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 inline-flex max-w-[70%] items-center gap-1 truncate rounded-full bg-pub-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
          <MapPin size={11} aria-hidden="true" />
          <span className="truncate">{deal.country}</span>
        </span>
        <WishlistButton item={toTravelItem(deal)} variant="badge" className="absolute right-3 top-3" wishlisted={isWishlisted(deal.id)} onToggle={() => toggleWishlist(toTravelItem(deal))} />
        {discountLabel && <span className="absolute bottom-3 right-3 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">{discountLabel}</span>}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={deal.href} className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-pub-secondary">{deal.title}</Link>
        <div className="mt-2 flex min-h-5 items-center gap-1.5 text-xs text-slate-600">
          {rating ? <><Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" /><span className="font-bold text-slate-900">{rating}</span>{deal.reviewCount > 0 && <span>({deal.reviewCount.toLocaleString()} reviews)</span>}</> : <span>{deal.days ? `${deal.days} days` : deal.category}</span>}
        </div>
        <div className="mt-auto flex min-h-7 items-baseline gap-1.5 pt-3">
          {deal.dealPrice != null ? <><span className="text-xs font-semibold text-slate-600">From</span>{deal.originalPrice != null && <span className="text-xs text-slate-400 line-through">{format(deal.originalPrice, deal.currency)}</span>}<strong className="text-base font-bold text-slate-950">{format(deal.dealPrice, deal.currency)}</strong><span className="text-xs text-slate-500">pp</span></> : <span className="text-sm font-semibold text-slate-700">Price on request</span>}
        </div>
      </div>
    </article>
  );
}

function DealRail({ title, deals, loading }: { title: string; deals: DealCardItem[]; loading: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    const container = railRef.current;
    if (!container) return;
    const item = container.querySelector<HTMLElement>("[data-deal-item]");
    container.scrollBy({ left: direction * (item ? item.offsetWidth + 20 : 320), behavior: "smooth" });
  };

  if (!loading && deals.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
        {!loading && deals.length > 1 && <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => scroll(-1)} aria-label={`Previous ${title}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:translate-y-px"><ChevronLeft size={16} /></button><button type="button" onClick={() => scroll(1)} aria-label={`Next ${title}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:translate-y-px"><ChevronRight size={16} /></button></div>}
      </div>
      {loading ? <DealsSkeleton /> : <div ref={railRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth sm:gap-5">{deals.map((deal) => <DealCard key={deal.id} deal={deal} />)}</div>}
    </section>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadDeals() {
      try {
        const assignments = await fetchToursOnDeals();
        const records = await Promise.allSettled(assignments.map(async (assignment) => ({ assignment, tour: await fetchPublicTourDetail(assignment.tour_id) })));
        if (!active) return;
        setDeals(records.flatMap((record) => record.status === "fulfilled" ? [buildDeal(record.value.assignment, record.value.tour)] : []));
        setFailed(false);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDeals();
    return () => { active = false; };
  }, []);

  const byCountry = useMemo(() => {
    const groups = new Map<string, DealCardItem[]>();
    deals.forEach((deal) => groups.set(deal.country, [...(groups.get(deal.country) || []), deal]));
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  }, [deals]);
  const byCategory = useMemo(() => {
    const groups = new Map<string, DealCardItem[]>();
    deals.forEach((deal) => groups.set(deal.category, [...(groups.get(deal.category) || []), deal]));
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  }, [deals]);

  return (
    <main className="w-full overflow-x-clip bg-white pb-12 text-slate-900">
      <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="relative overflow-hidden rounded-[20px] bg-pub-primary px-6 py-12 text-white shadow-lg sm:rounded-[28px] sm:px-10 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_5%_100%,rgba(255,255,255,0.10),transparent_38%)]" />
          <div className="relative max-w-2xl"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tour deals</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">Discover current offers selected by Tourvaa. Every card below comes from an active, published deal assignment.</p>{!loading && deals.length > 0 && <p className="mt-5 text-sm font-semibold text-white">{deals.length} live {deals.length === 1 ? "deal" : "deals"} available now</p>}</div>
        </div>
      </section>

      <DealRail title="Current deals" deals={deals} loading={loading} />
      {byCountry.map(([country, countryDeals]) => <DealRail key={country} title={`Deals in ${country}`} deals={countryDeals} loading={loading} />)}
      {byCategory.map(([category, categoryDeals]) => <DealRail key={category} title={`${category} offers`} deals={categoryDeals} loading={loading} />)}

      {!loading && deals.length === 0 && <section className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-14"><div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center"><h2 className="text-xl font-bold text-slate-900">No active deals right now</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">New offers appear here after Tourvaa activates a deal for a published tour.</p><Link href="/tours" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pub-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-pub-primary-dark active:translate-y-px">Browse all tours <ArrowRight size={15} /></Link></div></section>}
      {failed && <p role="status" className="mx-auto mt-8 max-w-[1400px] px-4 text-center text-sm text-slate-600 sm:px-6">Deals could not be refreshed. Please try again shortly.</p>}

      <section className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-12"><div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/75 px-5 py-3.5 text-xs text-slate-600 sm:flex-row"><div className="flex items-center gap-2 font-medium"><Lightbulb size={15} className="shrink-0 text-amber-500" /><span>Deals are shown only while the related tour is published and the offer is active.</span></div><Link href="/tours" className="font-semibold text-pub-secondary hover:underline">Browse all tours</Link></div></section>
      <div className="mt-8 sm:mt-12"><HomeNewsletterBanner /></div>
    </main>
  );
}
