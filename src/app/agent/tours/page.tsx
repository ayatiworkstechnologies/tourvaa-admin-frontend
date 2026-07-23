"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuClock as Clock, LuMapPin as MapPin, LuRefreshCw as RefreshCw, LuSearch as Search, LuSlidersHorizontal as SlidersHorizontal } from "react-icons/lu";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { AgentPageHeader, AgentPageShell, AgentSection } from "@/components/agent/AgentPage";
import { publicTourUrl } from "@/lib/utils/tourUrl";

type Tour = {
  id: number;
  title: string;
  slug?: string;
  number_of_days?: number;
  price_start_per_person?: string | number;
  currency?: string;
  country_name?: string;
  city_name?: string;
  category_name?: string;
  banner_image?: string;
};

function money(value: string | number | undefined, currency = "USD") {
  if (!value) return "-";
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
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/public/tours", {
          params: { limit: 12, page, search: query || undefined },
        });
        if (!active) return;
        const data = res.data;
        const items: Tour[] = data?.items ?? data?.data ?? data?.tours ?? [];
        setTours(page === 1 ? items : (prev) => [...prev, ...items]);
        setTotal(data?.total ?? items.length);
        setHasMore(items.length === 12);
      } catch {
        if (active) {
          if (page === 1) setTours([]);
          setHasMore(false);
          setError("Tours could not be loaded. Please retry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [query, page, retryKey]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <AgentPageShell>
      <AgentPageHeader
        title="Browse Tours"
        description="Explore live Tourvaa inventory and start a customer booking directly from any package."
        icon={MapPin}
        eyebrow="Sales Catalogue"
      >
        <span className="rounded-full bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700">{total} published tour{total === 1 ? "" : "s"} available</span>
      </AgentPageHeader>

      {/* Search */}
      <AgentSection className="mt-4">
      <form onSubmit={handleSearch} className="flex gap-3 border-b border-[#E7EDF6] p-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tours by name, destination…"
            className="w-full rounded-xl border border-dash-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-dash-brand focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-dash-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dash-brand-hover"
        >
          <SlidersHorizontal size={15} /> Search
        </button>
      </form>

      {error && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <span className="flex items-center gap-2"><AlertCircle size={16} />{error}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm"><RefreshCw size={13} />Retry</button>
        </div>
      )}

      {/* Tours Grid */}
      {loading && page === 1 ? (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <TourSkeleton key={i} />)}
        </div>
      ) : tours.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center py-16 text-center">
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
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="group overflow-hidden rounded-2xl border border-[#DFE7F2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-[var(--portal-soft)]">
                  {tour.banner_image ? (
                    <Image
                      src={mediaUrl(tour.banner_image)}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MapPin size={32} className="text-blue-300" />
                    </div>
                  )}
                  {tour.category_name && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-dash-text shadow-sm">
                      {tour.category_name}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 font-bold text-dash-text">{tour.title}</h3>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-dash-muted">
                    {(tour.city_name || tour.country_name) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {tour.number_of_days && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {tour.number_of_days} days
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-dash-muted">From</p>
                      <p className="text-base font-black text-dash-brand">
                        {money(tour.price_start_per_person, tour.currency ?? "USD")}
                      </p>
                    </div>
                    <Link
                      href={publicTourUrl(tour)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-dash-brand px-3 py-2 text-xs font-bold text-white transition hover:bg-dash-brand-hover"
                    >
                      Book This
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
      </AgentSection>
    </AgentPageShell>
  );
}
