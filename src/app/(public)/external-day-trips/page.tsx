"use client";

import { useEffect, useState } from "react";
import {
  LuClock as Clock,
  LuCompass as Compass,
  LuExternalLink as ExternalLink,
  LuStar as Star,
} from "react-icons/lu";
import { ExternalDayTrip, fetchExternalDayTrips } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";

/* eslint-disable @next/next/no-img-element */

const FALLBACK_IMAGE = "/images/tour-card-fallback.jpg";

export default function ExternalDayTripsPage() {
  const { formatCompact } = useCurrency();
  const [items, setItems] = useState<ExternalDayTrip[]>([]);
  const [destinationName, setDestinationName] = useState("");
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExternalDayTrips()
      .then((res) => {
        setItems(res.items);
        setDestinationName(res.destination_name);
        setConfigured(res.configured);
      })
      .catch(() => {
        setItems([]);
        setConfigured(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="relative overflow-hidden bg-[#063c42] pb-20 pt-32 text-white md:pb-24 md:pt-40">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-teal-50 backdrop-blur-md">
            <Compass size={14} /> Powered by Viator
          </div>
          <h1 className="mt-5 max-w-2xl font-heading text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
            External Day Trips{destinationName ? ` in ${destinationName}` : ""}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
            Day trips and activities from our travel partner Viator. Booking, payment, and cancellation for
            these happen on viator.com, not on Tourvaa.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-5 md:px-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <a
                key={item.product_code}
                href={item.booking_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                  <img
                    src={item.image_url || FALLBACK_IMAGE}
                    alt={item.title}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                    Viator <ExternalLink size={11} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-base font-black text-slate-950">{item.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                    {item.rating != null && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star size={13} className="fill-amber-500 text-amber-500" />
                        {item.rating.toFixed(1)}
                        {item.review_count != null && <span className="text-slate-400">({item.review_count})</span>}
                      </span>
                    )}
                    {item.duration_label && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {item.duration_label}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div>
                      {item.from_price != null ? (
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">From</span>
                          <p className="text-lg font-black text-slate-950">
                            {formatCompact(item.from_price, item.currency || "USD")}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">See price on Viator</span>
                      )}
                    </div>
                    <span className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white transition group-hover:bg-orange-600">
                      View on Viator
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Compass size={28} />
            </span>
            <h3 className="mt-5 text-xl font-black text-slate-950">
              {configured ? "No day trips available right now" : "Coming soon"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {configured
                ? "Check back shortly, or browse our own tours in the meantime."
                : "This section is being set up. Check back soon."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
