"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuChevronDown as ChevronDown, LuChevronUp as ChevronUp, LuHistory as History, LuPercent as Percent, LuSearch as Search } from "react-icons/lu";
import api from "@/lib/api/client";
import { DiscountHistoryEntry, getDiscountHistory, getDiscounts, TourDiscount } from "@/lib/api/services/tourDetailService";
import { SupplierPageHeader, SupplierPageShell, SupplierSection } from "@/components/supplier/SupplierPage";
import Loader from "@/components/ui/Loader";

type SupplierTour = { id: number; title: string; tour_code?: string; currency?: string };
type DiscountRow = TourDiscount & { tourTitle: string; tourCode?: string; currency?: string };

function formatDate(value?: string | null) {
  if (!value) return "Open";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function SupplierDiscountsPage() {
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Record<number, DiscountHistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/tours", { params: { page: 1, limit: 100 } });
        const tours = (response.data?.items ?? response.data?.data ?? []) as SupplierTour[];
        const lists = await Promise.all(tours.map(async (tour) => {
          const discounts = await getDiscounts(tour.id);
          return discounts.map((discount) => ({
            ...discount,
            tourTitle: tour.title,
            tourCode: tour.tour_code,
            currency: tour.currency,
          }));
        }));
        if (active) setRows(lists.flat().sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")));
      } catch {
        if (active) setError("Discounts could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => [row.discount_name, row.discount_code, row.tourTitle, row.tourCode]
      .some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [rows, search]);

  const toggleHistory = async (row: DiscountRow) => {
    if (!row.id || !row.tour_id) return;
    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.id);
    if (history[row.id]) return;
    setHistoryLoading(row.id);
    try {
      const entries = await getDiscountHistory(row.tour_id, row.id);
      setHistory((current) => ({ ...current, [row.id!]: entries }));
    } finally {
      setHistoryLoading(null);
    }
  };

  return (
    <SupplierPageShell className="space-y-5">
      <SupplierPageHeader
        title="Discounts & History"
        description="View every discount added to your tours and open its complete amendment history."
        icon={Percent}
        actions={[{ label: "Manage My Tours", href: "/supplier/tours" }]}
      />
      <SupplierSection title="Tour discounts" description={`${rows.length} discount${rows.length === 1 ? "" : "s"} across your tours`}>
        <div className="border-b border-[#E5EFE9] p-4">
          <label className="relative block max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#789084]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tour, discount or code..." className="w-full rounded-xl border border-[#D5E6DB] bg-[#F8FBF9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#16833A]" />
          </label>
        </div>
        {loading ? <div className="p-10"><Loader label="Loading discounts..." /></div> : error ? (
          <p className="p-8 text-center text-sm font-semibold text-rose-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#708579]">No tour discounts found.</p>
        ) : (
          <div className="divide-y divide-[#E5EFE9]">
            {filtered.map((row) => (
              <div key={row.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#123024]">{row.discount_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${row.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row.status}</span>
                      {row.discount_code && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">Code: {row.discount_code}</span>}
                    </div>
                    <p className="mt-1 text-xs text-[#647B6E]">{row.tourTitle}{row.tourCode ? ` · ${row.tourCode}` : ""}</p>
                    <p className="mt-2 text-sm font-black text-[#16833A]">{row.discount_value}{row.discount_type === "percentage" ? "%" : ` ${row.currency ?? ""}`} off</p>
                    <p className="mt-1 text-[11px] text-[#71867A]">{formatDate(row.start_date)} → {formatDate(row.end_date)} · Used {row.used_count ?? 0}{row.usage_limit ? ` / ${row.usage_limit}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/supplier/tours/${row.tour_id}/edit`} className="rounded-lg border border-[#D5E6DB] px-3 py-2 text-xs font-black text-[#365A45] hover:bg-[#F0F8F3]">Open tour</Link>
                    <button type="button" onClick={() => void toggleHistory(row)} className="inline-flex items-center gap-2 rounded-lg bg-[#16833A] px-3 py-2 text-xs font-black text-white">
                      <History size={14} /> History {expandedId === row.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>
                {expandedId === row.id && row.id && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#DCEBE2] bg-[#F8FBF9]">
                    {historyLoading === row.id ? <div className="p-5"><Loader label="Loading history..." /></div> : (history[row.id] ?? []).length === 0 ? (
                      <p className="p-4 text-xs text-[#71867A]">No history entries found.</p>
                    ) : (history[row.id] ?? []).map((entry) => (
                      <div key={entry.id} className="grid gap-1 border-b border-[#E5EFE9] px-4 py-3 text-xs last:border-0 sm:grid-cols-4">
                        <span className="font-bold text-[#123024]">Version {entry.version_number}</span>
                        <span>{entry.change_type.replaceAll("_", " ")}</span>
                        <span>{entry.discount_value}{entry.discount_type === "percentage" ? "%" : ` ${row.currency ?? ""}`}</span>
                        <span className="text-[#71867A]">{entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SupplierSection>
    </SupplierPageShell>
  );
}
