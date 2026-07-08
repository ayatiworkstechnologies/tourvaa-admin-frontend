"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuClock as Clock, LuEye as Eye, LuMapPinned as MapPinned, LuPencil as Pencil, LuPlus as Plus, LuSearch as Search, LuSendHorizontal as SendHorizonal } from "react-icons/lu";
import api from "@/lib/api/client";

type Tour = {
  id: number;
  tour_code: string;
  title: string;
  status: string;
  price_start_per_person: number;
  currency: string;
  number_of_days: number;
  country_name?: string;
  city_name?: string;
  category_name?: string;
};

function statusColors(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "confirmed", "published"].includes(v))
    return "bg-emerald-50 text-emerald-700";
  if (["pending", "pending_approval", "submitted", "draft"].includes(v))
    return "bg-amber-50 text-amber-700";
  if (["rejected", "cancelled", "declined", "inactive"].includes(v))
    return "bg-red-50 text-red-600";
  return "bg-slate-50 text-slate-600";
}

function statusIcon(s: string) {
  const v = (s || "").toLowerCase();
  if (["active", "published"].includes(v))
    return <CheckCircle2 size={12} className="text-emerald-600" />;
  if (["pending", "pending_approval", "submitted", "draft"].includes(v))
    return <Clock size={12} className="text-amber-600" />;
  if (["rejected", "cancelled"].includes(v))
    return <AlertCircle size={12} className="text-red-500" />;
  return null;
}

export default function SupplierToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<number | null>(null);
  const limit = 12;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { limit, page };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get("/tours", { params });
      const data = res.data;
      setTours(data?.items ?? data?.data ?? data ?? []);
      if (data?.total && data?.limit) {
        setTotalPages(Math.ceil(data.total / data.limit));
      } else {
        setTotalPages(1);
      }
    } catch {
      setError("Failed to load tours. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmitForApproval = async (tourId: number) => {
    setSubmittingId(tourId);
    try {
      await api.post(`/tours/${tourId}/submit-for-approval`);
      setSubmitSuccess(tourId);
      setTimeout(() => setSubmitSuccess(null), 3000);
      void load();
    } catch {
      // silent
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-xl shadow-emerald-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">My Tours</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-emerald-100">
              Manage and publish your tour offerings.
            </p>
          </div>
          <Link
            href="/supplier/tours/create"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Tour
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-dash-subtle"
        />
        <input
          type="text"
          placeholder="Search tours by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-dash-border/80 bg-white py-3 pl-11 pr-4 text-sm font-medium shadow-[0_2px_8px_rgb(0,0,0,0.02)] outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10 transition-all"
        />
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} />
          Tour submitted for approval successfully!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>
          <button
            type="button"
            onClick={load}
            className="text-xs font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-dash-border bg-white"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tours.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] py-16 text-center">
          <MapPinned size={36} className="mx-auto text-[#D0D5DD]" />
          <p className="mt-4 text-base font-bold text-dash-muted">
            {debouncedSearch ? "No tours found" : "No tours yet"}
          </p>
          <p className="mt-1 text-sm text-dash-subtle">
            {debouncedSearch
              ? "Try a different search term."
              : "Create your first tour to get started."}
          </p>
          {!debouncedSearch && (
            <Link
              href="/supplier/tours/create"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Plus size={16} />
              Create Tour
            </Link>
          )}
        </div>
      )}

      {/* Tours grid */}
      {!loading && tours.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => {
            const canSubmit = ["draft", "rejected"].includes(
              tour.status?.toLowerCase()
            );
            const isPending = ["pending_approval", "submitted"].includes(
              tour.status?.toLowerCase()
            );
            return (
              <div
                key={tour.id}
                className="group flex flex-col rounded-3xl border border-dash-border/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-dash-brand/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Title & status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-dash-text leading-snug line-clamp-2">
                      {tour.title}
                    </p>
                    <p className="mt-1 text-xs text-dash-subtle">
                      {tour.tour_code}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusColors(tour.status)}`}
                  >
                    {statusIcon(tour.status)}
                    {tour.status}
                  </span>
                </div>

                {/* Meta */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-dash-muted">
                  {tour.country_name && (
                    <span className="rounded-lg bg-dash-bg-muted px-2 py-1">
                      {tour.country_name}
                    </span>
                  )}
                  {tour.city_name && (
                    <span className="rounded-lg bg-dash-bg-muted px-2 py-1">
                      {tour.city_name}
                    </span>
                  )}
                  {tour.number_of_days > 0 && (
                    <span className="rounded-lg bg-dash-bg-muted px-2 py-1">
                      {tour.number_of_days} days
                    </span>
                  )}
                </div>

                {/* Price */}
                <p className="mt-3 text-sm font-bold text-dash-text">
                  {tour.currency || "AED"}{" "}
                  {Number(tour.price_start_per_person || 0).toLocaleString()}{" "}
                  <span className="text-xs font-normal text-dash-subtle">
                    / person
                  </span>
                </p>

                {/* Pending notice */}
                {isPending && (
                  <p className="mt-2 text-xs text-amber-600 font-semibold">
                    Awaiting admin review
                  </p>
                )}

                {/* Actions */}
                <div className="mt-auto flex gap-2 pt-6">
                  <Link
                    href={`/supplier/tours/${tour.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dash-border/80 bg-white px-3 py-2 text-xs font-bold text-dash-body shadow-sm hover:bg-[#F3F8FC] hover:text-dash-brand transition-all"
                  >
                    <Pencil size={14} />
                    Edit
                  </Link>
                  <Link
                    href={`/tours/${tour.id}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-dash-border/80 bg-white px-3 py-2 text-xs font-bold text-dash-body shadow-sm hover:bg-[#F3F8FC] hover:text-dash-brand transition-all"
                  >
                    <Eye size={14} />
                  </Link>
                  {canSubmit && (
                    <button
                      type="button"
                      disabled={submittingId === tour.id}
                      onClick={() => handleSubmitForApproval(tour.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-dash-brand px-3 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] hover:bg-dash-brand-hover disabled:opacity-60 transition-all"
                    >
                      {submittingId === tour.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <SendHorizonal size={14} />
                      )}
                      Submit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-xl border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-body disabled:opacity-40 hover:bg-dash-bg-muted"
          >
            <ChevronLeft size={15} />
            Prev
          </button>
          <span className="text-sm font-semibold text-dash-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-xl border border-dash-border bg-white px-3 py-2 text-sm font-semibold text-dash-body disabled:opacity-40 hover:bg-dash-bg-muted"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
