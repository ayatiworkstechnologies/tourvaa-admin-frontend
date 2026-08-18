"use client";

import { useEffect, useState } from "react";
import { fetchFeaturedTours, PublicTour } from "@/lib/api/publicClient";
import { useCurrency } from "@/hooks/useCurrency";
import TourCard from "@/components/public/TourCard";

const STATIC_FALLBACK = [
  { id: 0, title: "Magical Maldives Escape", number_of_days: 5, city_name: "Malé", country_name: "Maldives", price_start_per_person: 4599, currency: "USD", category_name: "Best Seller", banner_image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Dubai Luxury Getaway", number_of_days: 6, city_name: "Dubai", country_name: "UAE", price_start_per_person: 2299, currency: "USD", category_name: "Popular", banner_image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Kashmir Paradise Tour", number_of_days: 7, city_name: "Srinagar", country_name: "India", price_start_per_person: 1899, currency: "USD", category_name: "Trending", banner_image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=75" },
  { id: 0, title: "Bali Relaxation Holiday", number_of_days: 6, city_name: "Bali", country_name: "Indonesia", price_start_per_person: 2899, currency: "USD", category_name: "Limited Offer", banner_image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=75" },
];

export default function FeaturedTours() {
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { formatCompact } = useCurrency();

  useEffect(() => {
    fetchFeaturedTours(4)
      .then(setTours)
      .catch(() => setTours([]))
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
        <TourCard
          key={isStatic ? i : (tour as PublicTour).id}
          tour={tour as Partial<PublicTour>}
          format={formatCompact}
          variant="featured"
          href={isStatic ? "/tours" : undefined}
        />
      ))}
    </div>
  );
}
