"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuHeart as Heart,
  LuLayoutGrid as LayoutGrid,
  LuList as List,
  LuMapPin as MapPin,
  LuStar as Star,
} from "react-icons/lu";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type WishlistTour = {
  id: string | number;
  title: string;
  location: string;
  duration: string;
  rating: number;
  reviews: string;
  price: string | number;
  currency?: string;
  image: string;
  href: string;
};

const DEFAULT_WISHLIST_TOURS: WishlistTour[] = [
  {
    id: "tour-1",
    title: "Bali Beach Retreat",
    location: "Indonesia",
    duration: "7D | 6N",
    rating: 4.9,
    reviews: "3,120 reviews",
    price: "₹85,000",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-2",
    title: "Swiss Alps Adventure",
    location: "Switzerland",
    duration: "8D | 7N",
    rating: 4.7,
    reviews: "1,845 reviews",
    price: "₹1,95,000",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-3",
    title: "Kerala Backwaters",
    location: "India",
    duration: "5D | 4N",
    rating: 4.8,
    reviews: "2,890 reviews",
    price: "₹42,000",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-4",
    title: "Santorini Escape",
    location: "Greece",
    duration: "6D | 5N",
    rating: 4.9,
    reviews: "2,210 reviews",
    price: "₹1,50,000",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-5",
    title: "Tokyo Discovery",
    location: "Japan",
    duration: "9D | 8N",
    rating: 4.6,
    reviews: "1,560 reviews",
    price: "₹1,75,000",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-6",
    title: "Maldives Paradise",
    location: "Maldives",
    duration: "5D | 4N",
    rating: 4.9,
    reviews: "4,320 reviews",
    price: "₹2,20,000",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-7",
    title: "Iceland Explorer",
    location: "Iceland",
    duration: "7D | 6N",
    rating: 4.8,
    reviews: "1,980 reviews",
    price: "₹2,10,000",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-8",
    title: "Vietnam Heritage",
    location: "Vietnam",
    duration: "10D | 9N",
    rating: 4.7,
    reviews: "2,540 reviews",
    price: "₹65,000",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "tour-9",
    title: "Patagonia Trek",
    location: "Argentina",
    duration: "12D | 11N",
    rating: 4.8,
    reviews: "1,120 reviews",
    price: "₹2,50,000",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
];

export default function CustomerWishlistPage() {
  const { wishlist, toggleWishlist } = useTravelStore();
  const { format } = useCurrency();
  const [sortBy, setSortBy] = useState("Recently Added");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // Combine user saved wishlist items with default tour cards
  const toursList: WishlistTour[] = useMemo(() => {
    if (wishlist.length === 0) {
      return DEFAULT_WISHLIST_TOURS;
    }

    const userItems: WishlistTour[] = wishlist.map((w, idx) => ({
      id: w.id,
      title: w.title || `Tour Experience #${w.id}`,
      location: w.place || "Destination",
      duration: w.duration || "7D | 6N",
      rating: 4.8,
      reviews: "2,460 reviews",
      price: w.price ? format(w.price, w.currency) : "₹85,000",
      image: mediaUrl(w.image) || DEFAULT_WISHLIST_TOURS[idx % DEFAULT_WISHLIST_TOURS.length].image,
      href: w.href || `/tours/${w.id}`,
    }));

    // If user has fewer than 9 items, append curated ones to maintain full layout
    if (userItems.length < 9) {
      const remaining = DEFAULT_WISHLIST_TOURS.slice(userItems.length);
      return [...userItems, ...remaining];
    }

    return userItems;
  }, [wishlist, format]);

  const totalCount = wishlist.length > 0 ? wishlist.length : 8;

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#0B1527]">
            My Wishlist
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Your saved dream destinations and tours
          </p>
        </div>

        {/* Top Controls Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-[#0B1527]">
            {totalCount} saved tours
          </p>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                <option value="Recently Added">Recently Added</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
                <option value="Highest Rated">Highest Rated</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`rounded p-1 transition ${
                  viewMode === "grid"
                    ? "bg-slate-100 text-blue-600 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`rounded p-1 transition ${
                  viewMode === "list"
                    ? "bg-slate-100 text-blue-600 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Cards Grid (3 Columns) ── */}
        <div
          className={`mt-6 ${
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
          }`}
        >
          {toursList.map((tour) => (
            <div
              key={tour.id}
              className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md ${
                viewMode === "list" ? "flex flex-col sm:flex-row" : ""
              }`}
            >
              {/* Image & Badges */}
              <div
                className={`relative w-full overflow-hidden ${
                  viewMode === "list" ? "h-48 sm:h-auto sm:w-64 shrink-0" : "h-48"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {/* Top-Left Location Badge */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-xs shadow-xs">
                  <MapPin size={11} className="text-slate-600" />
                  {tour.location}
                </span>
                {/* Top-Right Heart Button */}
                <button
                  type="button"
                  onClick={() =>
                    toggleWishlist({
                      id: Number(tour.id) || 1,
                      title: tour.title,
                      price: typeof tour.price === "number" ? tour.price : 85000,
                      currency: tour.currency || "INR",
                      image: tour.image,
                      place: tour.location,
                      duration: tour.duration,
                    })
                  }
                  aria-label="Wishlist"
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-xs hover:scale-110 transition"
                >
                  <Heart size={14} className="fill-current text-blue-600" />
                </button>
              </div>

              {/* Card Content */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  {/* Title & Duration */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{tour.title}</h3>
                    <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                      {tour.duration}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className="fill-current text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">{tour.rating}</span>
                    <span className="text-[10px] text-slate-400">({tour.reviews})</span>
                  </div>
                </div>

                {/* Price & Book Now */}
                <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-500">Price </span>
                    <span className="text-xs font-black text-slate-900">
                      {typeof tour.price === "number" ? format(tour.price, tour.currency || "INR") : tour.price}
                    </span>
                    <span className="text-[10px] text-slate-400"> pp</span>
                  </div>
                  <Link
                    href={tour.href || "/tours"}
                    className="rounded-xl bg-[#0B1527] px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#15233C]"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pagination ── */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                currentPage === page
                  ? "bg-[#0B1527] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === 3}
            onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
