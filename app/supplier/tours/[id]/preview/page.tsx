"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, MapPin, Star, Users, X } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/media-url";
type Tour = { id: number; title: string; description?: string; duration_days?: number; max_group_size?: number; price?: string; currency?: string; approval_status?: string; country_name?: string; city_name?: string; category_name?: string; highlights?: string[]; inclusions?: string[]; exclusions?: string[]; cover_image?: string };
export default function SupplierTourPreviewPage() {
  const toast = useToast(); const router = useRouter(); const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null); const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview"|"inclusions">("overview");
  useEffect(() => {
    if (!id) return;
    api.get("/tours/" + id).then(res => { setTour(res.data?.data ?? res.data ?? null); }).catch(() => { toast.error("Could not load tour."); }).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4"><div className="h-64 rounded-2xl bg-[#F5F7FA]" /><div className="h-8 w-2/3 rounded-xl bg-[#F5F7FA]" /></div></div>;
  if (!tour) return <div className="p-8 text-center"><p className="font-bold">Tour not found.</p><button onClick={() => router.back()} className="mt-4 text-sm text-emerald-600 hover:underline">Go back</button></div>;
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-[#E7EAF0] px-3 py-2 text-sm font-bold hover:bg-[#F5F7FA]"><ArrowLeft size={14} /> Back</button>
        <div><h1 className="text-xl font-black text-[#121826]">{tour.title}</h1><p className="text-xs text-[#667085]">Preview — how customers see this tour</p></div>
        {tour.approval_status && <span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-bold ${tour.approval_status === "approved" ? "bg-emerald-50 text-emerald-700" : tour.approval_status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>{tour.approval_status}</span>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white shadow-sm">
        {tour.cover_image ? <img src={mediaUrl(tour.cover_image)} alt={tour.title} className="h-72 w-full object-cover" /> : <div className="flex h-72 items-center justify-center bg-emerald-50"><MapPin size={48} className="text-emerald-300" /></div>}
        <div className="p-6">
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-[#667085]">
            {tour.country_name && <span className="flex items-center gap-1"><MapPin size={14} /> {tour.city_name ? tour.city_name + ", " : ""}{tour.country_name}</span>}
            {tour.duration_days && <span className="flex items-center gap-1"><Clock size={14} /> {tour.duration_days} days</span>}
            {tour.max_group_size && <span className="flex items-center gap-1"><Users size={14} /> Max {tour.max_group_size}</span>}
            {tour.category_name && <span className="flex items-center gap-1"><Star size={14} /> {tour.category_name}</span>}
          </div>
          {tour.price && <div className="mb-4"><span className="text-2xl font-black text-emerald-600">{tour.currency || "AED"} {Number(tour.price).toLocaleString()}</span><span className="ml-2 text-sm text-[#667085]">per person</span></div>}
          <div className="mb-4 flex gap-2 border-b border-[#E7EAF0]">
            {(["overview","inclusions"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-bold capitalize ${tab === t ? "border-b-2 border-emerald-600 text-emerald-700" : "text-[#667085]"}`}>{t}</button>)}
          </div>
          {tab === "overview" && <div className="text-sm text-[#344054]">{tour.description ? <p>{tour.description}</p> : <p className="text-[#98A2B3]">No description yet.</p>}{tour.highlights && tour.highlights.length > 0 && <div className="mt-4"><h3 className="mb-2 font-bold">Highlights</h3><ul className="space-y-1">{tour.highlights.map((h, i) => <li key={i} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />{h}</li>)}</ul></div>}</div>}
          {tab === "inclusions" && <div className="grid gap-4 sm:grid-cols-2 text-sm">{tour.inclusions && tour.inclusions.length > 0 && <div><h3 className="mb-2 font-bold text-emerald-700">Included</h3><ul className="space-y-1">{tour.inclusions.map((item, i) => <li key={i} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />{item}</li>)}</ul></div>}{tour.exclusions && tour.exclusions.length > 0 && <div><h3 className="mb-2 font-bold text-red-600">Not Included</h3><ul className="space-y-1">{tour.exclusions.map((item, i) => <li key={i} className="flex gap-2"><X size={14} className="mt-0.5 shrink-0 text-red-400" />{item}</li>)}</ul></div>}</div>}
        </div>
      </div>
    </div>
  );
}