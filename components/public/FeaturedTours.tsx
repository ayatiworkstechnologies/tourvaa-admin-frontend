"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFeaturedTours, PublicTour } from "@/lib/publicApi";
import { mediaUrl } from "@/lib/media-url";

const PLACEHOLDER = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75";

const STATIC_FALLBACK = [
  { id: 0, title: "Kerala Backwaters", number_of_days: 6, city_name: "Alleppey", country_name: "India", price_start_per_person: 2400, currency: "AED", category_name: "Backwaters", banner_image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Himalayan Escapes", number_of_days: 8, city_name: "Manali", country_name: "India", price_start_per_person: 3100, currency: "AED", category_name: "Mountain", banner_image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Desert Trails", number_of_days: 5, city_name: "Jaisalmer", country_name: "India", price_start_per_person: 1900, currency: "AED", category_name: "Desert", banner_image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=800&q=75" },
];

function TourCard({ tour, isStatic }: { tour: Partial<PublicTour>; isStatic?: boolean }) {
  const href = isStatic ? "/tours" : `/tours/${tour.id}`;
  return (
    <Link href={href} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E7EAF0] transition hover:shadow-md hover:ring-[#43A9F6]">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={tour.banner_image && !tour.banner_image.startsWith("http") ? mediaUrl(tour.banner_image) : (tour.banner_image || PLACEHOLDER)}
          alt={tour.title || "Tour"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold text-[#0284C7]">{tour.category_name}</p>
        <h3 className="mt-1 line-clamp-2 font-bold text-[#121826] group-hover:text-[#0284C7]">{tour.title}</h3>
        <p className="mt-0.5 text-xs text-[#667085]">{[tour.city_name, tour.country_name].filter(Boolean).join(", ")} · {tour.number_of_days} Days</p>
        <div className="mt-3 flex items-center justify-between">
          {tour.price_start_per_person
            ? <p className="text-base font-bold text-[#0284C7]">{tour.currency} {Number(tour.price_start_per_person).toLocaleString()}<span className="text-xs font-normal text-[#667085]"> /person</span></p>
            : <p className="text-sm font-semibold text-[#667085]">Price on request</p>}
          <span className="text-xs font-bold text-[#0284C7]">View →</span>
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
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E7EAF0]">
            <div className="aspect-[4/3] bg-[#E7EAF0]" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/4 rounded bg-[#E7EAF0]" />
              <div className="h-4 w-3/4 rounded bg-[#E7EAF0]" />
              <div className="h-3 w-1/2 rounded bg-[#E7EAF0]" />
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
