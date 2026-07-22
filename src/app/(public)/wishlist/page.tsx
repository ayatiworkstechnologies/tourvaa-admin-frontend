"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { LuArrowRight as ArrowRight, LuHeart as Heart, LuMapPin as MapPin, LuShoppingCart as Cart, LuTrash2 as Trash } from "react-icons/lu";
import { useCurrency } from "@/hooks/useCurrency";
import { useTravelStore } from "@/providers/TravelStoreProvider";

export default function WishlistPage() {
  const { hydrated, wishlist, toggleWishlist, addToCart, cart } = useTravelStore();
  const { format } = useCurrency();
  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-28">
      <section className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">Saved for later</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Your wishlist</h1><p className="mt-2 text-sm text-slate-500">Keep your favourite journeys together while you decide.</p></div>{wishlist.length > 0 && <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">{wishlist.length} saved tour{wishlist.length === 1 ? "" : "s"}</span>}</div>

        {!hydrated ? <WishlistSkeleton /> : wishlist.length === 0 ? <EmptyWishlist /> : <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{wishlist.map((item) => { const inCart = cart.some((cartItem) => cartItem.id === item.id); const href = item.id > 0 ? `/tours/${item.id}` : `/tours?search=${encodeURIComponent(item.title)}`; return <article key={item.id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,.07)] transition hover:-translate-y-1 hover:shadow-xl"><Link href={href} className="relative block h-52 overflow-hidden"><img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-700 backdrop-blur">{item.duration}</span></Link><div className="p-5"><p className="flex items-center gap-1 text-[10px] font-semibold text-blue-600"><MapPin size={11} />{item.place}</p><Link href={href} className="mt-2 block text-lg font-black text-slate-950 hover:text-blue-600">{item.title}</Link><p className="mt-3 text-sm text-slate-500">From <b className="text-xl text-slate-950">{item.price == null ? "On request" : format(item.price, item.currency)}</b></p><div className="mt-5 grid grid-cols-[1fr_auto] gap-2">{item.id > 0 ? <button type="button" onClick={() => addToCart(item)} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition ${inCart ? "bg-emerald-50 text-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}><Cart size={14} />{inCart ? "Added to cart" : "Add to cart"}</button> : <Link href={href} className="flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white">View similar tours</Link>}<button type="button" onClick={() => toggleWishlist(item)} aria-label={`Remove ${item.title} from wishlist`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"><Trash size={15} /></button></div></div></article>; })}</div>}
      </section>
    </main>
  );
}

function EmptyWishlist() { return <div className="mx-auto flex max-w-xl flex-col items-center py-24 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Heart size={34} /></span><h2 className="mt-6 text-2xl font-black">Your wishlist is ready for inspiration</h2><p className="mt-3 text-sm leading-6 text-slate-500">Save tours you love and compare them here whenever you’re ready.</p><Link href="/tours" className="mt-7 flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Explore tours <ArrowRight size={15} /></Link></div>; }
function WishlistSkeleton() { return <div className="mt-8 grid gap-5 md:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-slate-200" />)}</div>; }
