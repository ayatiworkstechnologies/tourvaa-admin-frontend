"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuTrash2 as Trash,
} from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80";

export default function PublicWishlistPage() {
  const { hydrated, wishlist, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();

  return (
    <main className="min-h-screen bg-white pb-24 pt-28 text-slate-950">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black"><Heart size={26} className="text-blue-600" /> My Wishlist</h1>
            <p className="mt-2 text-sm text-slate-500">Tours you have saved to come back to. Sign in to keep this list synced across your devices.</p>
          </div>
          <Link href="/tours" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
            <Compass size={14} /> Explore tours
          </Link>
        </div>

        {!hydrated ? (
          <WishlistSkeleton />
        ) : wishlist.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {wishlist.map((item) => {
              const tourHref = item.href || `/tours/${item.id}`;
              return (
                <article key={item.id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,.35)] transition hover:-translate-y-1">
                  <Link href={tourHref} className="relative block h-52 overflow-hidden">
                    <img
                      src={mediaUrl(item.image) || FALLBACK_IMAGE}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-[10px] font-black text-slate-700 shadow-sm backdrop-blur">
                      {item.duration}
                    </span>
                  </Link>

                  <div className="p-5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-blue-600">
                      <MapPin size={12} />
                      {item.place || "Destination"}
                    </p>
                    <Link href={tourHref} className="mt-2 block text-lg font-black leading-snug text-slate-950 transition hover:text-blue-600">
                      {item.title}
                    </Link>
                    <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                      <span className="text-[10px] text-slate-500">
                        Starting from
                        <b className="mt-0.5 block text-xl text-slate-950">
                          {item.price == null ? "On request" : format(item.price, item.currency)}
                        </b>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item)}
                        aria-label={`Remove ${item.title} from wishlist`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                    <Link href={`/booking/${item.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:bg-blue-700">
                      Book Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function WishlistSkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="h-52 animate-pulse bg-slate-100" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <Heart size={42} className="text-slate-300" />
      <h2 className="text-xl font-black">Start your travel shortlist</h2>
      <p className="max-w-md text-sm text-slate-500">Save tours that inspire you by tapping the heart icon on any tour card.</p>
      <Link href="/tours" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Browse tours</Link>
    </div>
  );
}
