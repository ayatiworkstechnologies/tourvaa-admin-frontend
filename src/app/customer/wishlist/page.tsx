"use client";

import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuShieldCheck as ShieldCheck,
  LuTrash2 as Trash,
} from "react-icons/lu";
import { CustomerPageHeader, CustomerPageShell, CustomerSection } from "@/components/customer/CustomerPage";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useTravelStore } from "@/providers/TravelStoreProvider";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80";

export default function CustomerWishlistPage() {
  const { hydrated, wishlist, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="My Wishlist"
        description="Your saved tours are securely linked to your Tourvaa account and available on every device."
        icon={Heart}
        eyebrow="Saved Adventures"
        action={{ label: "Explore Tours", href: "/tours", icon: Compass }}
      >
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 font-bold text-[#0865D9]">
            <Heart size={14} className="fill-current" />
            {hydrated ? `${wishlist.length} saved tour${wishlist.length === 1 ? "" : "s"}` : "Loading saved tours"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 font-bold text-emerald-700">
            <ShieldCheck size={14} />
            Synced to your account
          </span>
        </div>
      </CustomerPageHeader>

      <CustomerSection
        className="mt-4"
        title="Saved tours"
        description="Compare your favourites, review the details, or continue directly to booking."
      >
        {!hydrated ? (
          <WishlistSkeleton />
        ) : wishlist.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {wishlist.map((item) => {
              const tourHref = item.href || `/tours/${item.id}`;
              return (
                <article key={item.id} className="group overflow-hidden rounded-2xl border border-[#DFE8F4] bg-white shadow-[0_12px_30px_-24px_rgba(16,61,124,.7)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_-24px_rgba(8,104,232,.55)]">
                  <Link href={tourHref} className="relative block h-52 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(item.image) || FALLBACK_IMAGE}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-[10px] font-black text-[#24466F] shadow-sm backdrop-blur">
                      {item.duration}
                    </span>
                  </Link>

                  <div className="p-5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#2475E8]">
                      <MapPin size={12} />
                      {item.place || "Destination"}
                    </p>
                    <Link href={tourHref} className="mt-2 block text-lg font-black leading-snug text-[#0C2043] transition hover:text-[#0865D9]">
                      {item.title}
                    </Link>
                    <div className="mt-4 flex items-end justify-between border-t border-[#E8EEF6] pt-4">
                      <span className="text-[10px] text-[#6B7F9D]">
                        Starting from
                        <b className="mt-0.5 block text-xl text-[#0C2043]">
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
                    <Link href={`/booking/${item.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0868E8] px-4 py-3 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:bg-[#075AC9]">
                      Book Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CustomerSection>
    </CustomerPageShell>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-[#E4EBF4]">
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
    <div className="flex min-h-[430px] flex-col items-center justify-center px-5 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#0865D9]">
        <Heart size={34} />
      </span>
      <h2 className="mt-6 text-2xl font-black text-[#0C2043]">Start your travel shortlist</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7F9D]">
        Save tours that inspire you. They will appear here and stay synced with your customer account.
      </p>
      <Link href="/tours" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0868E8] px-6 py-3 text-sm font-black text-white shadow-md shadow-blue-100">
        Explore tours <ArrowRight size={15} />
      </Link>
    </div>
  );
}
