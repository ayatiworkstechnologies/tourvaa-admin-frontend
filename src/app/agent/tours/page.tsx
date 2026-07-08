"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuClock as Clock, LuMapPin as MapPin, LuPlus as Plus, LuSearch as Search, LuSlidersHorizontal as SlidersHorizontal } from "react-icons/lu";
import api from "@/lib/api/client";

type Tour = {
  id: number;
  title: string;
  slug?: string;
  duration?: string;
  duration_days?: number;
  price?: string | number;
  price_from?: string | number;
  currency?: string;
  country?: string;
  city?: string;
  location?: string;
  category?: string;
  category_name?: string;
  thumbnail?: string;
  image_url?: string;
};

function money(value: string | number | undefined, currency = "AED") {
  if (!value) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function TourSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-dash-border bg-white shadow-sm">
      <div className="h-44 bg-dash-border" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-dash-border" />
        <div className="h-3 w-1/2 rounded bg-dash-border" />
        <div className="h-3 w-1/3 rounded bg-dash-border" />
        <div className="mt-3 h-9 rounded-lg bg-dash-border" />
      </div>
    </div>
  );
}

export default function AgentToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        let res;
        try {
          res = await api.get("/public/tours", {
            params: { limit: 12, page, search: query || undefined },
          });
        } catch {
          res = await api.get("/tours", { params: { limit: 12, page, search: query || undefined } });
        }
        if (!active) return;
        const data = res.data;
        const items: Tour[] = data?.items ?? data?.data ?? data?.tours ?? [];
        setTours(page === 1 ? items : (prev) => [...prev, ...items]);
        setTotal(data?.total ?? items.length);
        setHasMore(items.length === 12);
      } catch {
        if (active) setTours([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [query, page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-orange-700 p-7 text-white shadow-xl shadow-orange-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Browse Tours</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-orange-100">
              Find and book tours for your customers.{total > 0 && ` ${total} tours available.`}
            </p>
          </div>
          <Link
            href="/agent/bookings/create"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50"
          >
            <Plus size={16} /> Create Booking
          </Link>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tours by name, destination…"
            className="w-full rounded-xl border border-dash-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700"
        >
          <SlidersHorizontal size={15} /> Search
        </button>
      </form>

      {/* Tours Grid */}
      {loading && page === 1 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <TourSkeleton key={i} />)}
        </div>
      ) : tours.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D9DEE8] py-16 text-center">
          <MapPin size={36} className="text-dash-subtle" />
          <p className="mt-3 font-bold text-dash-text">No tours found</p>
          <p className="mt-1 text-sm text-dash-muted">Try a different search term or clear the filter.</p>
          {query && (
            <button
              type="button"
              onClick={() => { setSearch(""); setQuery(""); setPage(1); }}
              className="mt-4 rounded-lg border border-dash-border px-4 py-2 text-sm font-bold text-dash-body hover:bg-dash-bg-muted"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="group overflow-hidden rounded-xl border border-dash-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-orange-50">
                  {tour.thumbnail || tour.image_url ? (
                    <img
                      src={tour.thumbnail ?? tour.image_url}
                      alt={tour.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MapPin size={32} className="text-orange-300" />
                    </div>
                  )}
                  {(tour.category_name || tour.category) && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-dash-text shadow-sm">
                      {tour.category_name ?? tour.category}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 font-bold text-dash-text">{tour.title}</h3>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-dash-muted">
                    {(tour.location || tour.city || tour.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {tour.location ?? [tour.city, tour.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {(tour.duration || tour.duration_days) && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {tour.duration ?? `${tour.duration_days} days`}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-dash-muted">From</p>
                      <p className="text-base font-black text-orange-600">
                        {money(tour.price ?? tour.price_from, tour.currency ?? "AED")}
                      </p>
                    </div>
                    <Link
                      href={`/agent/bookings/create?tour_id=${tour.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
                    >
                      <Plus size={13} /> Book This
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-dash-border bg-white px-6 py-2.5 text-sm font-bold text-dash-body shadow-sm transition hover:bg-dash-bg-muted disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
