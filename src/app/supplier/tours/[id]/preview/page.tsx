"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LuArrowLeft as ArrowLeft,
  LuCheck as Check,
  LuClock3 as Clock,
  LuEye as Eye,
  LuMapPin as MapPin,
  LuPencil as Pencil,
  LuStar as Star,
  LuUsersRound as Users,
  LuX as X,
} from "react-icons/lu";
import { SupplierPageHeader, SupplierPageShell, SupplierSection } from "@/components/supplier/SupplierPage";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type TourItem = { id: number; title: string; description?: string; short_description?: string };
type TourOverview = { duration_text?: string; group_size?: string; physical_rating?: string };
type Tour = {
  id: number;
  title: string;
  subtitle?: string;
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

function statusTone(status?: string) {
  if (["approved", "active", "published"].includes(status || "")) return "bg-emerald-50 text-emerald-700";
  if (["pending_approval", "submitted"].includes(status || "")) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function SupplierTourPreviewPage() {
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
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <SupplierPageShell><div className="h-32 animate-pulse rounded-2xl bg-white" /><div className="mt-4 h-[650px] animate-pulse rounded-2xl bg-white" /></SupplierPageShell>;
  }

  if (error || !tour) {
    return (
      <SupplierPageShell>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
          <p className="font-bold text-rose-700">{error || "Tour not found."}</p>
          <Link href="/supplier/tours" className="mt-4 inline-flex text-sm font-black text-[#16833A]">Return to My Tours</Link>
        </div>
      </SupplierPageShell>
    );
  }

  const description = tour.long_description || tour.short_description;
  const duration = overview?.duration_text || (tour.number_of_days ? `${tour.number_of_days} days` : "");

  return (
    <SupplierPageShell>
      <SupplierPageHeader
        title="Traveller Preview"
        description="Review how the essential tour content reads before you submit or publish changes."
        icon={Eye}
        eyebrow="Private Supplier View"
        actions={[
          { label: "My Tours", href: "/supplier/tours", icon: ArrowLeft, variant: "secondary" },
          { label: "Continue Editing", href: `/supplier/tours/${id}/edit`, icon: Pencil },
        ]}
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <SupplierSection>
          <div className="relative h-[340px] overflow-hidden bg-[#EAF7EF]">
            {tour.banner_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(tour.banner_image)} alt={tour.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><MapPin size={52} className="text-emerald-300" /></div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="flex flex-wrap items-center gap-2">
                {tour.category_name && <span className="rounded-full bg-white/15 px-3 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur">{tour.category_name}</span>}
                {tour.status && <span className={`rounded-full px-3 py-1 text-[9px] font-black ${statusTone(tour.status)}`}>{tour.status.replaceAll("_", " ")}</span>}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">{tour.title}</h1>
              {tour.subtitle && <p className="mt-1 text-sm text-white/80">{tour.subtitle}</p>}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2 text-[11px] text-[#5F776A]">
              {(tour.country_name || tour.city_name) && <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2F8F4] px-3 py-2"><MapPin size={13} /> {[tour.city_name, tour.country_name].filter(Boolean).join(", ")}</span>}
              {duration && <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2F8F4] px-3 py-2"><Clock size={13} /> {duration}</span>}
              {overview?.group_size && <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2F8F4] px-3 py-2"><Users size={13} /> {overview.group_size}</span>}
              {overview?.physical_rating && <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2F8F4] px-3 py-2"><Star size={13} /> {overview.physical_rating}</span>}
            </div>

            <div className="mt-5 flex gap-1 border-b border-[#E1ECE5]">
              {(["overview", "inclusions"] as const).map((item) => (
                <button type="button" key={item} onClick={() => setTab(item)} className={`rounded-t-xl px-4 py-3 text-xs font-black capitalize ${tab === item ? "border-b-2 border-[#16833A] bg-emerald-50 text-[#16833A]" : "text-[#6A8073]"}`}>{item}</button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="py-5 text-sm leading-7 text-[#4E6759]">
                {description ? <p className="whitespace-pre-wrap">{description}</p> : <p className="text-[#899A90]">No description yet.</p>}
                {highlights.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-sm font-black text-[#123024]">Experience highlights</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {highlights.map((item) => <div key={item.id} className="flex gap-2 rounded-xl bg-[#F5FAF7] p-3"><Check size={15} className="mt-1 shrink-0 text-emerald-600" /><span><strong className="text-[#123024]">{item.title}</strong>{item.short_description ? <span className="block text-xs leading-5 text-[#71867A]">{item.short_description}</span> : null}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "inclusions" && (
              <div className="grid gap-5 py-5 text-sm sm:grid-cols-2">
                <ItemList title="Included" items={inclusions} icon={Check} tone="text-emerald-600 bg-emerald-50" empty="No inclusions added." />
                <ItemList title="Not Included" items={exclusions} icon={X} tone="text-rose-500 bg-rose-50" empty="No exclusions added." />
              </div>
            )}
          </div>
        </SupplierSection>

        <aside className="space-y-4">
          <SupplierSection title="Booking summary" description="The key information a traveller sees first.">
            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#74887C]">Starting from</p>
              <p className="mt-2 text-3xl font-black text-[#16833A]">{tour.currency || "USD"} {Number(tour.price_start_per_person || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs text-[#74887C]">per person</p>
              <div className="mt-5 space-y-3 border-t border-[#E5EFE9] pt-5">
                <SummaryRow label="Duration" value={duration || "Not added"} />
                <SummaryRow label="Group size" value={overview?.group_size || "Not added"} />
                <SummaryRow label="Category" value={tour.category_name || "Not added"} />
                <SummaryRow label="Location" value={[tour.city_name, tour.country_name].filter(Boolean).join(", ") || "Not added"} />
              </div>
            </div>
          </SupplierSection>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-black text-amber-950">Preview checklist</h2>
            <p className="mt-2 text-xs leading-5 text-amber-800">Confirm the title, banner, destination, price, description, highlights, and inclusions before requesting review.</p>
          </div>
        </aside>
      </div>
    </SupplierPageShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 text-xs"><span className="text-[#74887C]">{label}</span><b className="text-right text-[#274536]">{value}</b></div>;
}

function ItemList({ title, items, icon: Icon, tone, empty }: { title: string; items: TourItem[]; icon: React.ElementType; tone: string; empty: string }) {
  return (
    <div className="rounded-xl border border-[#E1ECE5] p-4">
      <h2 className="font-black text-[#123024]">{title}</h2>
      {items.length ? <ul className="mt-3 space-y-3">{items.map((item) => <li key={item.id} className="flex gap-2"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={13} /></span><span><strong className="text-xs text-[#274536]">{item.title}</strong>{item.description ? <span className="block text-[11px] leading-5 text-[#74887C]">{item.description}</span> : null}</span></li>)}</ul> : <p className="mt-3 text-xs text-[#899A90]">{empty}</p>}
    </div>
  );
}
