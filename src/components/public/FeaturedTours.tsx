"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import { fetchFeaturedTours, PublicTour } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";
import { publicTourUrl } from "@/lib/utils/tourUrl";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75";

const STATIC_FALLBACK = [
  { id: 0, title: "Magical Maldives Escape", number_of_days: 5, city_name: "Malé", country_name: "Maldives", price_start_per_person: 4599, currency: "AED", category_name: "Best Seller", banner_image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Dubai Luxury Getaway", number_of_days: 6, city_name: "Dubai", country_name: "UAE", price_start_per_person: 2299, currency: "AED", category_name: "Popular", banner_image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Kashmir Paradise Tour", number_of_days: 7, city_name: "Srinagar", country_name: "India", price_start_per_person: 1899, currency: "AED", category_name: "Trending", banner_image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Bali Relaxation Holiday", number_of_days: 6, city_name: "Bali", country_name: "Indonesia", price_start_per_person: 2899, currency: "AED", category_name: "Limited Offer", banner_image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=75" },
];

function TourCard({ tour, isStatic }: { tour: Partial<PublicTour>; isStatic?: boolean }) {
  const href = isStatic ? "/tours" : publicTourUrl({ country_name: tour.country_name, title: tour.title || "Tour", slug: tour.slug });
  const { formatCompact } = useCurrency();
  return (
    <Link href={href} className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={tour.banner_image && !tour.banner_image.startsWith("http") ? mediaUrl(tour.banner_image) : (tour.banner_image || PLACEHOLDER)}
          alt={tour.title || "Tour"}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <span className="absolute bottom-3 left-3 rounded-md bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow">{tour.category_name || "Featured"}</span>
      </div>
      <div className="p-4">
        <h3 className="font-heading line-clamp-2 text-base font-black text-zinc-950 transition-colors group-hover:text-teal-700">{tour.title}</h3>
        <p className="mt-1 text-xs font-semibold text-zinc-500">{[tour.city_name, tour.country_name].filter(Boolean).join(", ")} · {tour.number_of_days} Days</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          {tour.price_start_per_person
            ? <p className="text-lg font-black text-zinc-950">{formatCompact(tour.price_start_per_person, tour.currency || "USD")}<span className="text-xs font-semibold text-zinc-400"> /person</span></p>
            : <p className="text-sm font-semibold text-zinc-400">Price on request</p>}
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-700 group-hover:text-white">
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedTours() {
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchFeaturedTours(4)
      .then(setTours)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-dash-border">
            <div className="aspect-[4/3] bg-dash-border" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/4 rounded bg-dash-border" />
              <div className="h-4 w-3/4 rounded bg-dash-border" />
              <div className="h-3 w-1/2 rounded bg-dash-border" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const display = tours.length > 0 ? tours : STATIC_FALLBACK;
  const isStatic = tours.length === 0;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {display.map((tour, i) => (
        <TourCard key={isStatic ? i : (tour as PublicTour).id} tour={tour as Partial<PublicTour>} isStatic={isStatic} />
      ))}
    </div>
  );
}
