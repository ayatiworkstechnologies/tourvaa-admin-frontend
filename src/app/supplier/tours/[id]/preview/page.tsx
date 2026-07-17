"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuArrowLeft as ArrowLeft, LuCheck as Check, LuClock as Clock, LuMapPin as MapPin, LuStar as Star, LuUsers as Users, LuX as X } from "react-icons/lu";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type TourItem = { id: number; title: string; description?: string; short_description?: string };
type TourOverview = { duration_text?: string; group_size?: string; physical_rating?: string };
type Tour = {
  id: number;
  title: string;
  short_description?: string;
  long_description?: string;
  number_of_days?: number;
  price_start_per_person?: string | number;
  currency?: string;
  status?: string;
  country_name?: string;
  city_name?: string;
  category_name?: string;
  banner_image?: string;
};

export default function SupplierTourPreviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [overview, setOverview] = useState<TourOverview | null>(null);
  const [highlights, setHighlights] = useState<TourItem[]>([]);
  const [inclusions, setInclusions] = useState<TourItem[]>([]);
  const [exclusions, setExclusions] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "inclusions">("overview");

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.allSettled([
      api.get(`/tours/${id}`),
      api.get(`/tours/${id}/overview`),
      api.get(`/tours/${id}/highlights`),
      api.get(`/tours/${id}/inclusions`),
      api.get(`/tours/${id}/exclusions`),
    ]).then(([tourResult, overviewResult, highlightsResult, inclusionsResult, exclusionsResult]) => {
      if (!active) return;
      if (tourResult.status === "rejected") {
        setError("Could not load this tour preview.");
        return;
      }
      setTour(tourResult.value.data?.data ?? tourResult.value.data);
      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value.data?.data ?? overviewResult.value.data ?? null);
      if (highlightsResult.status === "fulfilled") setHighlights(highlightsResult.value.data?.data ?? []);
      if (inclusionsResult.status === "fulfilled") setInclusions(inclusionsResult.value.data?.data ?? []);
      if (exclusionsResult.status === "fulfilled") setExclusions(exclusionsResult.value.data?.data ?? []);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4"><div className="h-64 rounded-2xl bg-dash-bg-muted" /><div className="h-8 w-2/3 rounded-xl bg-dash-bg-muted" /></div></div>;
  if (error || !tour) return <div className="p-8 text-center"><p className="font-bold text-red-600">{error || "Tour not found."}</p><button type="button" onClick={() => router.back()} className="mt-4 text-sm font-bold text-emerald-600 hover:underline">Go back</button></div>;

  const description = tour.long_description || tour.short_description;
  const duration = overview?.duration_text || (tour.number_of_days ? `${tour.number_of_days} days` : "");

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-dash-border px-3 py-2 text-sm font-bold hover:bg-dash-bg-muted"><ArrowLeft size={14} /> Back</button>
        <div><h1 className="text-xl font-black text-dash-text">{tour.title}</h1><p className="text-xs text-dash-muted">Private supplier preview</p></div>
        {tour.status && <span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold capitalize ${tour.status === "approved" || tour.status === "active" ? "bg-emerald-50 text-emerald-700" : tour.status === "pending_approval" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{tour.status.replaceAll("_", " ")}</span>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-dash-border bg-white shadow-sm">
        {tour.banner_image ? <img src={mediaUrl(tour.banner_image)} alt={tour.title} className="h-72 w-full object-cover" /> : <div className="flex h-72 items-center justify-center bg-emerald-50"><MapPin size={48} className="text-emerald-300" /></div>}
        <div className="p-6">
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-dash-muted">
            {tour.country_name && <span className="flex items-center gap-1"><MapPin size={14} /> {tour.city_name ? `${tour.city_name}, ` : ""}{tour.country_name}</span>}
            {duration && <span className="flex items-center gap-1"><Clock size={14} /> {duration}</span>}
            {overview?.group_size && <span className="flex items-center gap-1"><Users size={14} /> {overview.group_size}</span>}
            {tour.category_name && <span className="flex items-center gap-1"><Star size={14} /> {tour.category_name}</span>}
            {overview?.physical_rating && <span className="flex items-center gap-1"><Star size={14} /> {overview.physical_rating}</span>}
          </div>
          {tour.price_start_per_person !== undefined && <div className="mb-4"><span className="text-2xl font-black text-emerald-600">{tour.currency || "AED"} {Number(tour.price_start_per_person).toLocaleString()}</span><span className="ml-2 text-sm text-dash-muted">per person</span></div>}
          <div className="mb-4 flex gap-2 border-b border-dash-border">{(["overview", "inclusions"] as const).map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`px-4 py-2.5 text-sm font-bold capitalize ${tab === item ? "border-b-2 border-emerald-600 text-emerald-700" : "text-dash-muted"}`}>{item}</button>)}</div>
          {tab === "overview" && <div className="text-sm leading-6 text-dash-body">{description ? <p className="whitespace-pre-wrap">{description}</p> : <p className="text-dash-subtle">No description yet.</p>}{highlights.length > 0 && <div className="mt-5"><h3 className="mb-2 font-bold">Highlights</h3><ul className="space-y-2">{highlights.map((item) => <li key={item.id} className="flex gap-2"><Check size={14} className="mt-1 shrink-0 text-emerald-500" /><span><strong>{item.title}</strong>{item.short_description ? ` — ${item.short_description}` : ""}</span></li>)}</ul></div>}</div>}
          {tab === "inclusions" && <div className="grid gap-6 text-sm sm:grid-cols-2"><div><h3 className="mb-2 font-bold text-emerald-700">Included</h3>{inclusions.length ? <ul className="space-y-2">{inclusions.map((item) => <li key={item.id} className="flex gap-2"><Check size={14} className="mt-1 shrink-0 text-emerald-500" /><span><strong>{item.title}</strong>{item.description ? ` — ${item.description}` : ""}</span></li>)}</ul> : <p className="text-dash-subtle">No inclusions added.</p>}</div><div><h3 className="mb-2 font-bold text-red-600">Not Included</h3>{exclusions.length ? <ul className="space-y-2">{exclusions.map((item) => <li key={item.id} className="flex gap-2"><X size={14} className="mt-1 shrink-0 text-red-400" /><span><strong>{item.title}</strong>{item.description ? ` — ${item.description}` : ""}</span></li>)}</ul> : <p className="text-dash-subtle">No exclusions added.</p>}</div></div>}
        </div>
      </div>
    </div>
  );
}
