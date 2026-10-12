"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LuCompass as Compass, LuHeart as Heart, LuLayoutGrid as LayoutGrid, LuList as List, LuMapPin as MapPin, LuTrash2 as Trash } from "react-icons/lu";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";

const FALLBACK_IMAGE = "/images/tour-card-fallback.jpg";
type SortOrder = "recent" | "price-low" | "price-high" | "name";

export default function CustomerWishlistPage() {
  const { hydrated, wishlist, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const tours = useMemo(() => {
    const items = [...wishlist];
    if (sortOrder === "price-low") return items.sort((a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity));
    if (sortOrder === "price-high") return items.sort((a, b) => Number(b.price ?? -Infinity) - Number(a.price ?? -Infinity));
    if (sortOrder === "name") return items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }, [wishlist, sortOrder]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#0B1527] sm:text-[28px]"><Heart size={25} className="text-rose-500" /> My Wishlist</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">Tours you have saved to revisit later.</p>
          </div>
          <Link href="/tours" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"><Compass size={14} /> Explore tours</Link>
        </div>

        {!hydrated ? <WishlistSkeleton /> : wishlist.length === 0 ? <EmptyWishlist /> : <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[#0B1527]">{wishlist.length} saved {wishlist.length === 1 ? "tour" : "tours"}</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-500"><span className="font-semibold text-slate-400">Sort by:</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none shadow-2xs focus:border-blue-500">
                  <option value="recent">Recently added</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Tour name</option>
                </select>
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
                <button type="button" onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"} className={`rounded p-1 transition ${viewMode === "grid" ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}><LayoutGrid size={15} /></button>
                <button type="button" onClick={() => setViewMode("list")} aria-label="List view" aria-pressed={viewMode === "list"} className={`rounded p-1 transition ${viewMode === "list" ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-700"}`}><List size={15} /></button>
              </div>
            </div>
          </div>

          <div className={`mt-6 ${viewMode === "grid" ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}`}>
            {tours.map((tour) => {
              const tourHref = tour.href || `/tours/${tour.id}`;
              return <article key={tour.id} className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md ${viewMode === "list" ? "flex flex-col sm:flex-row" : ""}`}>
                <Link href={tourHref} className={`relative block overflow-hidden ${viewMode === "list" ? "h-48 sm:h-auto sm:w-64 sm:shrink-0" : "h-48"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(tour.image) || FALLBACK_IMAGE} alt={tour.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-xs shadow-xs"><MapPin size={11} />{tour.place || "Destination"}</span>
                </Link>
                <div className="flex flex-1 flex-col justify-between p-4"><div><div className="flex items-start justify-between gap-3"><Link href={tourHref} className="text-sm font-bold text-slate-900 transition hover:text-blue-600">{tour.title}</Link><button type="button" onClick={() => toggleWishlist(tour)} aria-label={`Remove ${tour.title} from wishlist`} className="shrink-0 rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"><Trash size={16} /></button></div>{tour.duration && <p className="mt-2 text-[11px] font-semibold text-slate-500">{tour.duration}</p>}</div><div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3"><span className="text-[11px] text-slate-500">Starting from <b className="ml-1 text-sm text-slate-900">{tour.price == null ? "On request" : format(tour.price, tour.currency)}</b></span><Link href={`/booking/${tour.id}`} className="rounded-xl bg-[#0B1527] px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#15233C]">Book now</Link></div></div>
              </article>;
            })}
          </div>
        </>}
      </div>
    </div>
  );
}

function WishlistSkeleton() {
  return <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="h-48 animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" /><div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" /></div></div>)}</div>;
}

function EmptyWishlist() {
  return <div className="mt-8 flex min-h-[42vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center"><Heart size={42} className="text-slate-300" /><h2 className="text-xl font-black text-slate-900">Start your travel shortlist</h2><p className="max-w-md text-sm leading-6 text-slate-500">Save tours that inspire you with the heart icon. Your saved tours will appear here automatically.</p><Link href="/tours" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Browse tours</Link></div>;
}
