"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuCalendarDays as Calendar, LuMapPin as MapPin, LuScale as Scale, LuStar as Star, LuTrash2 as Trash2, LuUsers as Users, LuX as X } from "react-icons/lu";
import { fetchPublicTourDetail, PublicTourDetail } from "@/lib/api/publicClient";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { publicTourUrl } from "@/lib/utils/tourUrl";
import { useCurrency } from "@/hooks/useCurrency";
import { useTravelStore } from "@/providers/TravelStoreProvider";

const FALLBACK = "/images/tour-card-fallback.jpg";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <th scope="row" className="sticky left-0 w-40 bg-white px-4 py-3 text-left text-xs font-bold text-slate-500 sm:w-52">{label}</th>
      {children}
    </tr>
  );
}

export default function ComparePage() {
  const { compareList, toggleCompare, clearCompare } = useTravelStore();
  const { format } = useCurrency();
  const [details, setDetails] = useState<Record<number, PublicTourDetail | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareList.length === 0) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.allSettled(compareList.map((item) => fetchPublicTourDetail(item.id))).then((results) => {
      if (!active) return;
      const next: Record<number, PublicTourDetail | null> = {};
      results.forEach((result, index) => {
        next[compareList[index].id] = result.status === "fulfilled" ? result.value : null;
      });
      setDetails(next);
      setLoading(false);
    });
    return () => { active = false; };
  }, [compareList]);

  return (
    <main className="min-h-screen bg-white pb-24 pt-28 text-slate-950">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black"><Scale size={26} className="text-blue-600" /> Compare Tours</h1>
            <p className="mt-2 text-sm text-slate-500">Compare price, duration, inclusions, and ratings side by side.</p>
          </div>
          {compareList.length > 0 && (
            <button type="button" onClick={clearCompare} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600">
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>

        {compareList.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Scale size={42} className="text-slate-300" />
            <h2 className="text-xl font-black">No tours selected for comparison</h2>
            <p className="max-w-md text-sm text-slate-500">Tap the compare icon on any tour card to add it here — you can compare up to 4 tours at once.</p>
            <Link href="/tours" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Browse tours</Link>
          </div>
        ) : loading ? (
          <div className="flex min-h-[30vh] items-center justify-center"><div className="h-11 w-11 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" /></div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100 shadow-[0_12px_30px_rgba(15,23,42,.06)]">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 w-40 bg-white px-4 py-3 sm:w-52" />
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    return (
                      <th key={item.id} scope="col" className="min-w-[220px] border-b border-slate-100 bg-slate-50 p-4 text-left align-top">
                        <button type="button" onClick={() => toggleCompare(item)} aria-label={`Remove ${item.title} from comparison`} className="mb-2 ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-rose-600"><X size={14} /></button>
                        <img src={detail?.banner_image ? mediaUrl(detail.banner_image) : (item.image || FALLBACK)} alt={item.title} className="h-32 w-full rounded-lg object-cover" />
                        <p className="mt-3 line-clamp-2 text-sm font-black text-slate-900">{item.title}</p>
                        {detail && (
                          <Link href={publicTourUrl(detail)} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-700">View tour</Link>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <Row label="Price">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    return <td key={item.id} className="px-4 py-3 text-sm font-bold text-slate-900">{detail?.price_start_per_person != null ? format(detail.price_start_per_person, detail.currency || "USD") : "On request"} <span className="font-normal text-slate-400">pp</span></td>;
                  })}
                </Row>
                <Row label="Duration">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    const days = detail?.number_of_days;
                    return <td key={item.id} className="px-4 py-3 text-slate-700"><Calendar size={13} className="mr-1 inline text-blue-500" />{days ? `${days} Days | ${Math.max(0, days - 1)} Nights` : detail?.number_of_hours ? `${detail.number_of_hours} Hours` : "Flexible"}</td>;
                  })}
                </Row>
                <Row label="Destination">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    return <td key={item.id} className="px-4 py-3 text-slate-700"><MapPin size={13} className="mr-1 inline text-blue-500" />{detail?.city_name || detail?.country_name || "-"}</td>;
                  })}
                </Row>
                <Row label="Tour type">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    return <td key={item.id} className="px-4 py-3 text-slate-700">{detail?.category_name || detail?.overview?.tour_type || "-"}</td>;
                  })}
                </Row>
                <Row label="Group size">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    return <td key={item.id} className="px-4 py-3 text-slate-700">{detail?.overview?.group_size ? <><Users size={13} className="mr-1 inline text-blue-500" />{detail.overview.group_size}</> : "-"}</td>;
                  })}
                </Row>
                <Row label="Rating">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    return (
                      <td key={item.id} className="px-4 py-3 text-slate-700">
                        {detail?.rating_average != null ? <><Star size={13} className="mr-1 inline fill-amber-400 text-amber-400" />{detail.rating_average.toFixed(1)} <span className="text-slate-400">({detail.rating_count ?? 0})</span></> : "No reviews yet"}
                      </td>
                    );
                  })}
                </Row>
                <Row label="Highlights">
                  {compareList.map((item) => {
                    const detail = details[item.id];
                    const highlights = detail?.highlights?.slice(0, 4) ?? [];
                    return (
                      <td key={item.id} className="px-4 py-3 align-top text-slate-700">
                        {highlights.length ? (
                          <ul className="space-y-1 text-xs">{highlights.map((h, i) => <li key={i}>• {h.text}</li>)}</ul>
                        ) : "-"}
                      </td>
                    );
                  })}
                </Row>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
