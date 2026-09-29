"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as CalendarDays,
  LuCheck as Check,
  LuCircleAlert as AlertCircle,
  LuCircleCheckBig as CheckCircle2,
  LuCircleDollarSign as CircleDollarSign,
  LuClock3 as Clock,
  LuCopy as Copy,
  LuExternalLink as ExternalLink,
  LuHistory as History,
  LuMapPin as MapPin,
  LuPencil as Pencil,
  LuPercent as Percent,
  LuRefreshCw as RefreshCw,
  LuSearch as Search,
  LuSparkles as Sparkles,
  LuTag as Tag,
  LuTicket as Ticket,
  LuUsers as Users,
  LuX as X,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
} from "react-icons/lu";
import api from "@/lib/api/client";
import {
  DiscountHistoryEntry,
  getDiscountHistory,
  getDiscounts,
  TourDiscount,
} from "@/lib/api/services/tourDetailService";
import {
  SupplierPageHeader,
  SupplierPageShell,
  SupplierSection,
} from "@/components/supplier/SupplierPage";
import Loader from "@/components/ui/Loader";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type SupplierTour = {
  id: number;
  title: string;
  tour_code?: string;
  currency?: string;
  city_name?: string;
  country_name?: string;
  banner_image?: string;
  number_of_days?: number;
};

type DiscountRow = TourDiscount & {
  tourId: number;
  tourTitle: string;
  tourCode?: string;
  currency?: string;
  cityName?: string;
  countryName?: string;
  bannerImage?: string;
  numberOfDays?: number;
};

function humanize(val?: string | null) {
  if (!val) return "";
  return val.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Ongoing";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function getComputedStatus(row: TourDiscount): {
  key: "active" | "scheduled" | "expired" | "inactive";
  label: string;
  badgeStyle: string;
  dotStyle: string;
} {
  const raw = (row.status || "active").toLowerCase();
  const now = new Date();

  if (raw === "inactive" || raw === "cancelled" || raw === "disabled") {
    return {
      key: "inactive",
      label: humanize(raw) || "Inactive",
      badgeStyle: "bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10",
      dotStyle: "bg-rose-500",
    };
  }

  if (row.start_date) {
    const start = new Date(row.start_date);
    if (!Number.isNaN(start.getTime()) && start > now) {
      return {
        key: "scheduled",
        label: "Scheduled",
        badgeStyle: "bg-sky-50 text-sky-700 border-sky-200/80 ring-1 ring-sky-500/10",
        dotStyle: "bg-sky-500",
      };
    }
  }

  if (row.end_date) {
    const end = new Date(row.end_date);
    end.setHours(23, 59, 59, 999);
    if (!Number.isNaN(end.getTime()) && end < now) {
      return {
        key: "expired",
        label: "Expired",
        badgeStyle: "bg-slate-100 text-slate-600 border-slate-200 ring-1 ring-slate-400/10",
        dotStyle: "bg-slate-400",
      };
    }
  }

  return {
    key: "active",
    label: "Active",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10",
    dotStyle: "bg-emerald-500 animate-pulse",
  };
}

function getValidityNote(startDate?: string | null, endDate?: string | null, statusKey?: string) {
  if (statusKey === "inactive") return "Campaign paused";

  const now = new Date();
  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime()) && start > now) {
      const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Starts in ${days} day${days === 1 ? "" : "s"}`;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (!Number.isNaN(end.getTime())) {
      if (end < now) {
        return "Campaign ended";
      }
      const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 0) return "Expires today";
      if (days <= 7) return `Expires in ${days} day${days === 1 ? "" : "s"}`;
      return `${days} days remaining`;
    }
  }

  return "No expiry date";
}

export default function SupplierDiscountsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<DiscountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "expired" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "percentage" | "fixed" | "code">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "usage" | "expiring">("newest");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Record<number, DiscountHistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get("/tours", { params: { page: 1, limit: 100 } });
      const tours = (response.data?.items ?? response.data?.data ?? []) as SupplierTour[];

      const lists = await Promise.all(
        tours.map(async (tour) => {
          try {
            const discounts = await getDiscounts(tour.id);
            return discounts.map((discount) => ({
              ...discount,
              tourId: tour.id,
              tourTitle: tour.title,
              tourCode: tour.tour_code,
              currency: tour.currency,
              cityName: tour.city_name,
              countryName: tour.country_name,
              bannerImage: tour.banner_image,
              numberOfDays: tour.number_of_days,
            }));
          } catch {
            return [];
          }
        }),
      );

      const flat = lists.flat();
      setRows(flat);
    } catch {
      setError("Discounts could not be loaded. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Counts for tabs & KPI cards
  const counts = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let inactive = 0;
    let totalUsed = 0;
    const tourIds = new Set<number>();

    for (const r of rows) {
      if (r.tourId) tourIds.add(r.tourId);
      totalUsed += Number(r.used_count || 0);

      const meta = getComputedStatus(r);
      if (meta.key === "active") active++;
      else if (meta.key === "scheduled") scheduled++;
      else if (meta.key === "expired") expired++;
      else inactive++;
    }

    return {
      all: rows.length,
      active,
      scheduled,
      expired,
      inactive,
      totalUsed,
      uniqueTours: tourIds.size,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows
      .filter((row) => {
        // Status filter
        if (statusFilter !== "all") {
          const meta = getComputedStatus(row);
          if (meta.key !== statusFilter) return false;
        }

        // Type filter
        if (typeFilter === "percentage" && row.discount_type !== "percentage") return false;
        if (typeFilter === "fixed" && row.discount_type !== "fixed") return false;
        if (typeFilter === "code" && !row.discount_code) return false;

        // Search text
        if (query) {
          const match = [
            row.discount_name,
            row.discount_code,
            row.tourTitle,
            row.tourCode,
            row.cityName,
            row.countryName,
          ].some((val) => String(val ?? "").toLowerCase().includes(query));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "highest") {
          return Number(b.discount_value || 0) - Number(a.discount_value || 0);
        }
        if (sortBy === "usage") {
          return Number(b.used_count || 0) - Number(a.used_count || 0);
        }
        if (sortBy === "expiring") {
          const timeA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
          const timeB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
          return timeA - timeB;
        }
        // Default newest
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
  }, [rows, search, statusFilter, typeFilter, sortBy]);

  const toggleHistory = async (row: DiscountRow) => {
    if (!row.id || !row.tourId) return;
    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.id);
    if (history[row.id]) return;
    setHistoryLoading(row.id);
    try {
      const entries = await getDiscountHistory(row.tourId, row.id);
      setHistory((current) => ({ ...current, [row.id!]: entries }));
    } catch {
      toast.error("Could not load amendment history.");
    } finally {
      setHistoryLoading(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Promo code "${code}" copied to clipboard!`);
      window.setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      toast.error("Unable to copy promo code.");
    }
  };

  return (
    <SupplierPageShell className="space-y-6">
      {/* Header */}
      <SupplierPageHeader
        title="Discounts & History"
        description="Monitor promotional offers added to your tours, track real-time redemption usage, and inspect complete amendment audit trails."
        icon={Percent}
        eyebrow="Supplier Workspace"
        actions={[
          {
            label: "Manage My Tours",
            href: "/supplier/tours",
            icon: ArrowRight,
            variant: "primary",
          },
        ]}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
              <Sparkles size={13} className="text-emerald-600" />
              {counts.active} active promotion{counts.active === 1 ? "" : "s"} live
            </span>
            <span className="rounded-full bg-slate-50 px-3 py-1 font-semibold text-[#61776A]">
              Discounts are managed per tour in Tour Wizard → Step 04
            </span>
          </div>
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5E6DB] bg-white px-3 py-1.5 text-xs font-bold text-[#2A4D39] transition hover:bg-[#F0F8F3] disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-[#16833A]" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </SupplierPageHeader>

      {/* KPI Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Campaigns */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_4px_16px_-12px_rgba(15,82,48,.3)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#688172]">
              Total Campaigns
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Tag size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-[#123024]">{counts.all}</p>
          <p className="mt-1 text-xs text-[#6B8375]">
            Across {counts.uniqueTours} tour{counts.uniqueTours === 1 ? "" : "s"}
          </p>
        </div>

        {/* Active Promotions */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_4px_16px_-12px_rgba(15,82,48,.3)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#688172]">
              Active Now
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Sparkles size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-700">{counts.active}</p>
            {counts.active > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#6B8375]">Applying to customer checkouts</p>
        </div>

        {/* Scheduled Deals */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_4px_16px_-12px_rgba(15,82,48,.3)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#688172]">
              Scheduled
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <CalendarDays size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-sky-800">{counts.scheduled}</p>
          <p className="mt-1 text-xs text-[#6B8375]">Upcoming start dates</p>
        </div>

        {/* Total Redemptions */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCEBE2] bg-white p-4 shadow-[0_4px_16px_-12px_rgba(15,82,48,.3)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#688172]">
              Total Redemptions
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Users size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-violet-900">{counts.totalUsed}</p>
          <p className="mt-1 text-xs text-[#6B8375]">Claimed across bookings</p>
        </div>
      </div>

      {/* Main Section */}
      <SupplierSection
        title="Tour Discounts"
        description={`${filtered.length} discount${filtered.length === 1 ? "" : "s"} found`}
      >
        {/* Controls Bar: Search, Status Tabs, Filter by Type & Sort */}
        <div className="border-b border-[#E5EFE9] bg-[#FAFDFB] p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            {/* Top row: Search & Secondary Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-lg">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B9285]"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by discount name, promo code, tour title..."
                  className="h-10.5 w-full rounded-xl border border-[#D2E4DA] bg-white pl-10 pr-9 text-xs font-medium text-[#123024] placeholder-[#81998C] outline-none transition focus:border-[#16833A] focus:ring-3 focus:ring-emerald-50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B9285] hover:text-[#123024]"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Type & Sort dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  aria-label="Filter discounts by offer type"
                  className="h-10.5 rounded-xl border border-[#D2E4DA] bg-white px-3 text-xs font-bold text-[#2C4F3C] outline-none transition focus:border-[#16833A]"
                >
                  <option value="all">All Offer Types</option>
                  <option value="percentage">Percentage (% Off)</option>
                  <option value="fixed">Fixed Price ($ Off)</option>
                  <option value="code">Promo Codes Only</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort discounts by criteria"
                  className="h-10.5 rounded-xl border border-[#D2E4DA] bg-white px-3 text-xs font-bold text-[#2C4F3C] outline-none transition focus:border-[#16833A]"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Discount Value</option>
                  <option value="usage">Most Redeemed</option>
                  <option value="expiring">Expiring Soonest</option>
                </select>
              </div>
            </div>

            {/* Bottom row: Status Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
              {[
                { id: "all", label: "All Campaigns", count: counts.all },
                { id: "active", label: "Active", count: counts.active },
                { id: "scheduled", label: "Scheduled", count: counts.scheduled },
                { id: "expired", label: "Expired", count: counts.expired },
                { id: "inactive", label: "Inactive", count: counts.inactive },
              ].map((tab) => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 font-bold transition ${
                      isSelected
                        ? "bg-[#16833A] text-white shadow-sm"
                        : "border border-[#D6E7DC] bg-white text-[#567262] hover:bg-[#F0F7F2]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#EBF3ED] text-[#3E5C4B]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader label="Loading discount campaigns..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle size={24} />
            </div>
            <p className="mt-3 text-sm font-bold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#16833A] px-4 py-2 text-xs font-black text-white hover:bg-[#127031]"
            >
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F6ED] text-[#16833A]">
              <Tag size={28} />
            </div>
            <h3 className="mt-3 text-base font-black text-[#123024]">No discounts found</h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#688172]">
              {search || statusFilter !== "all" || typeFilter !== "all"
                ? "No discounts match your current filter selections. Try clearing your search or filters."
                : "You have not added any promotional discounts yet. Add discounts to attract early birds and boost tour bookings."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {search || statusFilter !== "all" || typeFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="rounded-xl border border-[#D5E6DB] bg-white px-4 py-2 text-xs font-bold text-[#355944] hover:bg-[#F0F8F3]"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/supplier/tours"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#16833A] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#117331]"
                >
                  <span>Go to My Tours</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="divide-y divide-[#E7F0EA]">
            {filtered.map((row) => {
              const statusMeta = getComputedStatus(row);
              const validityNote = getValidityNote(row.start_date, row.end_date, statusMeta.key);
              const isExpanded = expandedId === row.id;

              return (
                <article
                  key={`${row.tourId}-${row.id}`}
                  className="p-5 transition hover:bg-[#FAFDFB] sm:p-6"
                >
                  {/* Card Header Row */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                      {/* Big Visual Discount Tag */}
                      <div className="flex h-13 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-linear-to-br from-[#16833A] to-[#0D5C29] text-white shadow-md shadow-emerald-900/15">
                        <span className="text-base font-black leading-none tracking-tight">
                          {row.discount_value}
                          {row.discount_type === "percentage" ? "%" : ""}
                        </span>
                        <span className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-100">
                          {row.discount_type === "percentage" ? "OFF" : row.currency || "OFF"}
                        </span>
                      </div>

                      {/* Title & Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-[#123024]">
                            {row.discount_name}
                          </h3>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusMeta.badgeStyle}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotStyle}`} />
                            {statusMeta.label}
                          </span>

                          {/* Funded By */}
                          <span className="rounded-full bg-[#EAF5EF] px-2 py-0.5 text-[10px] font-bold text-[#1C663B]">
                            {row.funded_by === "TOURVAA"
                              ? "TourVaa Funded"
                              : row.funded_by === "SHARED"
                              ? "Shared Funding"
                              : "Supplier Funded"}
                          </span>

                          {/* Visibility */}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {row.show_on_website !== false ? "Public Deal" : "Private Voucher"}
                          </span>
                        </div>

                        {/* Validity subtitle note */}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#637C6E]">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} className="text-[#839C8E]" />
                            {validityNote}
                          </span>
                          <span>•</span>
                          <span>
                            {row.discount_scope ? humanize(row.discount_scope) : "Entire Package"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start">
                      <Link
                        href={`/supplier/tours/${row.tourId}/edit?step=pricing`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5E6DB] bg-white px-3.5 py-2 text-xs font-black text-[#2D533E] transition hover:border-emerald-400 hover:bg-[#F0F8F3]"
                      >
                        <Pencil size={13} />
                        <span>Edit in Tour</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => void toggleHistory(row)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                          isExpanded
                            ? "bg-[#123024] text-white"
                            : "bg-[#16833A] text-white shadow-xs shadow-emerald-200 hover:bg-[#117331]"
                        }`}
                      >
                        <History size={13} />
                        <span>Audit Log</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Tour Banner Preview Box */}
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E3EFE7] bg-[#F7FAF8] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {row.bannerImage ? (
                        <img
                          src={mediaUrl(row.bannerImage)}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg border border-[#D5E6DB] object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#D5E6DB] bg-emerald-50 text-[#16833A]">
                          <MapPin size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/supplier/tours/${row.tourId}/preview`}
                            className="truncate text-xs font-black text-[#123024] hover:text-[#16833A] hover:underline"
                          >
                            {row.tourTitle}
                          </Link>
                          {row.tourCode && (
                            <span className="shrink-0 rounded-md border border-[#DCEBE2] bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#566E61]">
                              {row.tourCode}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[#657C70]">
                          {[row.cityName, row.countryName].filter(Boolean).join(", ") ||
                            (row.numberOfDays ? `${row.numberOfDays} Days Trip` : "Tour Package")}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/supplier/tours/${row.tourId}/preview`}
                      className="inline-flex shrink-0 items-center gap-1 self-start text-[11px] font-bold text-[#16833A] hover:underline sm:self-auto"
                    >
                      <span>Preview Tour</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  {/* Promo Code Box (if promo code exists) */}
                  {row.discount_code && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#16833A]/40 bg-[#F0F8F3] px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Ticket size={16} className="text-[#16833A]" />
                        <span className="text-xs font-bold text-[#4B6858]">Promo Code:</span>
                        <code className="rounded-md border border-emerald-200 bg-white px-2.5 py-0.5 font-mono text-xs font-black text-[#123024]">
                          {row.discount_code}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyCode(row.discount_code!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#16833A] transition hover:bg-emerald-50"
                      >
                        {copiedCode === row.discount_code ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* 4-Pillar Metadata Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E8F0EB] pt-3.5 sm:grid-cols-4">
                    {/* Validity Window */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#799084]">
                        <CalendarDays size={12} /> Validity Window
                      </span>
                      <p className="text-xs font-black text-[#123024]">
                        {formatDate(row.start_date)} → {formatDate(row.end_date)}
                      </p>
                      <p className="text-[10px] font-semibold text-[#16833A]">{validityNote}</p>
                    </div>

                    {/* Redemptions & Quota */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#799084]">
                        <Users size={12} /> Redemptions
                      </span>
                      <p className="text-xs font-black text-[#123024]">
                        {row.used_count ?? 0} {row.usage_limit ? `/ ${row.usage_limit} limit` : "claims"}
                      </p>
                      {row.usage_limit ? (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5EFE9]">
                          <div
                            className="h-full rounded-full bg-[#16833A] transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                ((row.used_count ?? 0) / row.usage_limit) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-[#799084]">Unlimited quota</p>
                      )}
                    </div>

                    {/* Minimum Booking */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#799084]">
                        <CircleDollarSign size={12} /> Min. Booking
                      </span>
                      <p className="text-xs font-black text-[#123024]">
                        {row.minimum_booking_amount > 0
                          ? `${row.currency ?? "$"} ${row.minimum_booking_amount.toLocaleString()}`
                          : "No minimum"}
                      </p>
                      <p className="text-[10px] font-medium text-[#799084]">
                        {row.minimum_booking_amount > 0 ? "Threshold required" : "Any order size"}
                      </p>
                    </div>

                    {/* Channel & Scope */}
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#799084]">
                        <Tag size={12} /> Scope & Channel
                      </span>
                      <p className="text-xs font-black text-[#123024]">
                        {row.discount_scope ? humanize(row.discount_scope) : "Tour Package"}
                      </p>
                      <p className="text-[10px] font-medium text-[#799084]">
                        {row.show_on_website !== false ? "Website Storefront" : "Direct Promo Only"}
                      </p>
                    </div>
                  </div>

                  {/* Expandable Amendment History Drawer */}
                  {isExpanded && row.id && (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-[#D5E6DB] bg-[#F7FAF8] p-4 sm:p-5">
                      <div className="flex items-center justify-between border-b border-[#E3EFE7] pb-3">
                        <div className="flex items-center gap-2">
                          <History size={16} className="text-[#16833A]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#123024]">
                            Amendment Audit Trail ({history[row.id]?.length ?? 0} versions)
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-[#6F867A]">
                          Tour #{row.tourId} · Discount #{row.id}
                        </span>
                      </div>

                      {historyLoading === row.id ? (
                        <div className="p-6">
                          <Loader label="Fetching version history..." />
                        </div>
                      ) : (history[row.id] ?? []).length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-xs text-[#71867A]">
                            No previous revisions recorded. Original discount parameters are active.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 divide-y divide-[#E6EFE9]">
                          {(history[row.id] ?? []).map((entry) => (
                            <div
                              key={entry.id}
                              className="py-3 text-xs first:pt-1 last:pb-1"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md bg-[#E8F5ED] px-2 py-0.5 font-mono text-[11px] font-black text-[#156E34]">
                                    v{entry.version_number}
                                  </span>
                                  <span className="font-bold text-[#123024]">
                                    {humanize(entry.change_type)}
                                  </span>
                                </div>
                                <span className="text-[11px] text-[#71867A]">
                                  {entry.created_at
                                    ? new Date(entry.created_at).toLocaleString()
                                    : "—"}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#556F61]">
                                <span>
                                  Value:{" "}
                                  <b className="text-[#123024]">
                                    {entry.discount_value}
                                    {entry.discount_type === "percentage"
                                      ? "%"
                                      : ` ${row.currency ?? "$"}`}
                                  </b>
                                </span>
                                {(entry.start_date || entry.end_date) && (
                                  <span>
                                    Dates:{" "}
                                    <b className="text-[#123024]">
                                      {formatDate(entry.start_date)} → {formatDate(entry.end_date)}
                                    </b>
                                  </span>
                                )}
                              </div>

                              {entry.reason && (
                                <p className="mt-2 rounded-lg border border-[#DDEBE2] bg-white p-2.5 text-[11px] text-[#476052] italic">
                                  "{entry.reason}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </SupplierSection>
    </SupplierPageShell>
  );
}
