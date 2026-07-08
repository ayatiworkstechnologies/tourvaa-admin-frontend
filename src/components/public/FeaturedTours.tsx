"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight as ArrowRight } from "react-icons/lu";
import { fetchFeaturedTours, PublicTour } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75";

const STATIC_FALLBACK = [
  { id: 0, title: "Kerala Backwaters", number_of_days: 6, city_name: "Alleppey", country_name: "India", price_start_per_person: 2400, currency: "AED", category_name: "Backwaters", banner_image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Himalayan Escapes", number_of_days: 8, city_name: "Manali", country_name: "India", price_start_per_person: 3100, currency: "AED", category_name: "Mountain", banner_image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Desert Trails", number_of_days: 5, city_name: "Jaisalmer", country_name: "India", price_start_per_person: 1900, currency: "AED", category_name: "Desert", banner_image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=800&q=75" },
];

function TourCard({ tour, isStatic }: { tour: Partial<PublicTour>; isStatic?: boolean }) {
  const href = isStatic ? "/tours" : `/tours/${tour.id}`;
  return (
    <Link href={href} className="group overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={tour.banner_image && !tour.banner_image.startsWith("http") ? mediaUrl(tour.banner_image) : (tour.banner_image || PLACEHOLDER)}
          alt={tour.title || "Tour"}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
      </div>
      <div className="p-6">
        <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">{tour.category_name}</p>
        <h3 className="font-heading mt-2 line-clamp-2 text-lg font-black text-zinc-950 transition-colors group-hover:text-sky-600">{tour.title}</h3>
        <p className="mt-1 text-xs font-semibold text-zinc-500">{[tour.city_name, tour.country_name].filter(Boolean).join(", ")} · {tour.number_of_days} Days</p>
        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-5">
          {tour.price_start_per_person
            ? <p className="text-lg font-black text-zinc-950">{tour.currency} {Number(tour.price_start_per_person).toLocaleString()}<span className="text-xs font-semibold text-zinc-400"> /person</span></p>
            : <p className="text-sm font-semibold text-zinc-400">Price on request</p>}
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
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
    fetchFeaturedTours(6)
      .then(setTours)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="grid gap-5 md:grid-cols-3">
      {display.map((tour, i) => (
        <TourCard key={isStatic ? i : (tour as PublicTour).id} tour={tour as Partial<PublicTour>} isStatic={isStatic} />
      ))}
    </div>
  );
}
