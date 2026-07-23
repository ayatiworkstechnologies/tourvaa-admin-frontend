"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as CalendarDays,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle2,
  LuClock3 as Clock,
  LuEye as Eye,
  LuMapPin as MapPin,
  LuMapPinned as MapPinned,
  LuPencil as Pencil,
  LuPlus as Plus,
  LuSearch as Search,
  LuSendHorizontal as SendHorizontal,
} from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell, SupplierSection } from "@/components/supplier/SupplierPage";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";

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
  banner_image?: string;
};

const STATUS_FILTERS = [
  { value: "", label: "All Tours" },
  { value: "draft", label: "Drafts" },
  { value: "pending_approval", label: "In Review" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Needs Changes" },
];

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColors(status: string) {
  const value = (status || "").toLowerCase();
  if (["active", "published"].includes(value)) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (["pending", "pending_approval", "submitted", "draft"].includes(value)) return "bg-amber-50 text-amber-700 ring-amber-100";
  if (["rejected", "cancelled", "inactive"].includes(value)) return "bg-rose-50 text-rose-600 ring-rose-100";
  return "bg-slate-50 text-slate-600 ring-slate-100";
}

export default function SupplierToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<number | null>(null);
  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { limit, page };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      const response = await api.get("/tours", { params });
      const data = response.data;
      setTours(data?.items ?? data?.data ?? data ?? []);
      setTotal(Number(data?.total ?? 0));
      setTotalPages(Number(data?.total_pages ?? Math.max(1, Math.ceil(Number(data?.total ?? 0) / limit))));
    } catch {
      setError("Tours could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmitForApproval(tourId: number) {
    setSubmittingId(tourId);
    setActionError("");
    try {
      await api.post(`/tours/${tourId}/submit-for-approval`);
      setSubmitSuccess(tourId);
      window.setTimeout(() => setSubmitSuccess(null), 3000);
      await load();
    } catch {
      setActionError("This tour could not be submitted. Complete the required tour details and try again.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <SupplierPageShell>
      <SupplierPageHeader
        title="My Tours"
        description="Create, improve, preview, and submit every package from one organised catalogue."
        icon={MapPinned}
        eyebrow="Tour Workspace"
        actions={[{ label: "Create New Tour", href: "/supplier/tours/create", icon: Plus }]}
      >
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="rounded-full bg-emerald-50 px-3 py-2 font-bold text-emerald-700">{total} tour{total === 1 ? "" : "s"} in this view</span>
          <span className="rounded-full bg-slate-50 px-3 py-2 font-bold text-[#61776A]">Edit drafts anytime · Published changes return to review</span>
        </div>
      </SupplierPageHeader>

      {(submitSuccess || actionError || error) && (
        <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
          submitSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-700" : actionError ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700"
        }`}>
          <span className="flex items-center gap-2">{submitSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{submitSuccess ? "Tour submitted for approval successfully." : actionError || error}</span>
          {error && <button type="button" onClick={() => void load()} className="text-xs font-black underline">Retry</button>}
        </div>
      )}

      <SupplierSection className="mt-4">
        <div className="border-b border-[#E5EFE9] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-lg flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B9084]" />
              <input
                type="search"
                placeholder="Search by tour name or code..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#D5E6DB] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#16833A] focus:ring-4 focus:ring-emerald-50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setStatus(item.value); setPage(1); }}
                  className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition ${
                    status === item.value ? "bg-[#16833A] text-white shadow-sm" : "border border-[#D8E7DE] bg-white text-[#5F776A] hover:bg-[#F0F8F3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : !error && tours.length === 0 ? (
          <EmptyTours
            filtered={Boolean(debouncedSearch || status)}
            onClear={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
          />
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {tours.map((tour) => {
              const normalizedStatus = tour.status?.toLowerCase();
              const canSubmit = ["draft", "rejected"].includes(normalizedStatus);
              const isPending = ["pending_approval", "submitted"].includes(normalizedStatus);
              return (
                <article key={tour.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#DCE8E0] bg-white shadow-[0_10px_30px_-25px_rgba(15,82,48,.75)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_38px_-25px_rgba(15,82,48,.65)]">
                  <div className="relative h-40 overflow-hidden bg-[#EAF7EF]">
                    {tour.banner_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(tour.banner_image)} alt={tour.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><MapPinned size={38} className="text-emerald-300" /></div>
                    )}
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-black ring-1 backdrop-blur ${statusColors(tour.status)}`}>
                      {humanize(tour.status)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[9px] font-black uppercase tracking-[.12em] text-[#16833A]">{tour.tour_code || `Tour #${tour.id}`}</p>
                    <h2 className="mt-2 line-clamp-2 text-base font-black leading-snug text-[#123024]">{tour.title}</h2>

                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#647A6E]">
                      {(tour.city_name || tour.country_name) && <span className="inline-flex items-center gap-1 rounded-lg bg-[#F2F8F4] px-2 py-1.5"><MapPin size={11} /> {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}</span>}
                      {tour.number_of_days > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-[#F2F8F4] px-2 py-1.5"><CalendarDays size={11} /> {tour.number_of_days} days</span>}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#E8F0EB] pt-4">
                      <span>
                        <span className="block text-[9px] text-[#788C80]">Starting from</span>
                        <b className="mt-0.5 block text-lg text-[#123024]">{tour.currency || "USD"} {Number(tour.price_start_per_person || 0).toLocaleString()}</b>
                      </span>
                      {isPending && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700"><Clock size={11} /> Admin review</span>}
                    </div>

                    <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-5">
                      <Link href={`/supplier/tours/${tour.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16833A] px-3 py-2.5 text-xs font-black text-white hover:bg-[#117331]">
                        <Pencil size={14} /> Edit Tour
                      </Link>
                      <Link href={`/supplier/tours/${tour.id}/preview`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D5E6DB] text-[#527060] hover:bg-[#F0F8F3] hover:text-[#16833A]" aria-label={`Preview ${tour.title}`}>
                        <Eye size={15} />
                      </Link>
                      {canSubmit && (
                        <button
                          type="button"
                          disabled={submittingId === tour.id}
                          onClick={() => void handleSubmitForApproval(tour.id)}
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#CFE3D6] bg-[#F0F8F3] px-3 py-2.5 text-xs font-black text-[#16833A] hover:bg-[#E4F4E9] disabled:opacity-60"
                        >
                          {submittingId === tour.id ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#16833A] border-t-transparent" /> : <SendHorizontal size={14} />}
                          Submit for Approval
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SupplierSection>

      {!loading && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-1 rounded-xl border border-[#D5E6DB] bg-white px-3 py-2 text-xs font-black text-[#527060] disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
          <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#647A6E] ring-1 ring-[#DCEBE2]">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-1 rounded-xl border border-[#D5E6DB] bg-white px-3 py-2 text-xs font-black text-[#527060] disabled:opacity-40">Next <ChevronRight size={14} /></button>
        </div>
      )}
    </SupplierPageShell>
  );
}

function EmptyTours({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF7EF] text-[#16833A]"><MapPinned size={34} /></span>
      <h2 className="mt-5 text-xl font-black text-[#123024]">{filtered ? "No tours match this view" : "Create your first tour"}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#6B8074]">{filtered ? "Try another status or search term." : "Build your catalogue with pricing, itinerary, availability, and polished traveller-facing content."}</p>
      {filtered ? (
        <button type="button" onClick={onClear} className="mt-6 text-sm font-black text-[#16833A]">Clear filters <ArrowRight size={14} className="ml-1 inline" /></button>
      ) : (
        <Link href="/supplier/tours/create" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-5 py-3 text-sm font-black text-white"><Plus size={16} /> Create New Tour</Link>
      )}
    </div>
  );
}
