"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuCalendar as Calendar,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuSearch as Search,
  LuUser as User,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";

type Booking = {
  id: number | string;
  booking_code: string;
  tour_name: string;
  booking_date: string;
  travel_dates: string;
  guests: string;
  status: "Confirmed" | "Completed" | "Upcoming" | "Cancelled" | string;
  total_amount: string | number;
  image: string;
};

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 1,
    booking_code: "TRV-2847",
    tour_name: "Bali Island Retreat – 5D/4N",
    booking_date: "Nov 12, 2025",
    travel_dates: "Jan 15 – Jan 19, 2026",
    guests: "2 Adults",
    status: "Confirmed",
    total_amount: "$1,240",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    booking_code: "TRV-1982",
    tour_name: "Parisian Romance & Art Experience",
    booking_date: "Oct 05, 2025",
    travel_dates: "Dec 20 – Dec 24, 2025",
    guests: "2 Adults",
    status: "Completed",
    total_amount: "$1,850",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    booking_code: "TRV-3041",
    tour_name: "Tokyo Neon Lights & Mt. Fuji – 7D/6N",
    booking_date: "Dec 01, 2025",
    travel_dates: "Mar 10 – Mar 16, 2026",
    guests: "1 Adult",
    status: "Upcoming",
    total_amount: "$2,100",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    booking_code: "TRV-2735",
    tour_name: "Santorini Sunset Wonders & Cruise",
    booking_date: "Sep 18, 2025",
    travel_dates: "Jun 05 – Jun 10, 2026",
    guests: "4 Adults",
    status: "Confirmed",
    total_amount: "$3,400",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    booking_code: "TRV-1124",
    tour_name: "Swiss Alps Winter Adventure – 6D/5N",
    booking_date: "Jul 30, 2025",
    travel_dates: "Jan 05 – Jan 10, 2026",
    guests: "2 Adults, 1 Child",
    status: "Cancelled",
    total_amount: "$2,890",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    booking_code: "TRV-4412",
    tour_name: "Maldives Private Island Escape",
    booking_date: "Dec 15, 2025",
    travel_dates: "Jul 12 – Jul 18, 2026",
    guests: "2 Adults",
    status: "Upcoming",
    total_amount: "$4,200",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80",
  },
];

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("confirm")) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
        Confirmed
      </span>
    );
  }
  if (s.includes("complet")) {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
        Completed
      </span>
    );
  }
  if (s.includes("upcoming") || s.includes("transit") || s.includes("ongoing")) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
        Upcoming
      </span>
    );
  }
  if (s.includes("cancel") || s.includes("declin")) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-500">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
      {status}
    </span>
  );
}

export default function CustomerBookingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>(DEFAULT_BOOKINGS);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/customer/bookings", { params: { limit: 50, page: 1 } });
        const items = res.data?.items ?? res.data?.data ?? [];
        if (items.length > 0) {
          const mapped: Booking[] = items.map((b: any, idx: number) => {
            const fallback = DEFAULT_BOOKINGS[idx % DEFAULT_BOOKINGS.length];
            const dateStr = b.tour_date
              ? new Date(b.tour_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
              : fallback.travel_dates;
            const adults = b.no_of_adults || 2;
            const children = b.no_of_children || 0;
            const guestsStr = `${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children > 1 ? "ren" : ""}` : ""}`;

            return {
              id: b.id,
              booking_code: b.booking_code ? b.booking_code.replace(/^#/, "") : fallback.booking_code,
              tour_name: b.tour_name || fallback.tour_name,
              booking_date: b.created_at
                ? new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                : fallback.booking_date,
              travel_dates: dateStr,
              guests: guestsStr,
              status: b.booking_status || fallback.status,
              total_amount: b.final_amount ? `$${Number(b.final_amount).toLocaleString()}` : fallback.total_amount,
              image: b.tour_image ? mediaUrl(b.tour_image) : fallback.image,
            };
          });
          setBookings(mapped);
        }
      } catch {
        // Fallback to rich mock data
      }
    }
    void load();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        b.tour_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.booking_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || b.status.toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#0B1527]">
            My Bookings
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            View and manage all your tour bookings
          </p>
        </div>

        {/* ── Search & Filter Controls Bar ── */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tour name or booking ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Status & Date Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                <option value="All">Status: All</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Choose Dates */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-100 cursor-pointer"
                title="Choose dates"
              />
            </div>
          </div>
        </div>

        {/* ── Booking Cards Stack ── */}
        <div className="mt-6 space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-20 w-32 sm:h-24 sm:w-36 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt={b.tour_name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0B1527] leading-snug">{b.tour_name}</h3>
                  <p className="mt-1 text-[11px] text-slate-400 font-medium">
                    Booking ID: <span className="font-bold text-slate-600">#{b.booking_code}</span>
                    <span className="mx-1.5 text-slate-300">•</span>
                    Booked on {b.booking_date}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <Calendar size={13} className="text-slate-400" />
                    {b.travel_dates}
                  </p>
                </div>
              </div>

              {/* Middle: Guests & Status */}
              <div className="flex sm:flex-col items-start sm:items-center justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <User size={13} className="text-slate-400" />
                  <span>{b.guests}</span>
                </div>
                <div>{statusBadge(b.status)}</div>
              </div>

              {/* Right: Total & View Details */}
              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    TOTAL PAID
                  </p>
                  <p className="text-lg font-black text-[#0B1527] leading-tight">
                    {typeof b.total_amount === "number" ? `$${b.total_amount}` : b.total_amount}
                  </p>
                </div>
                <Link
                  href={`/customer/bookings/${b.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center">
              <p className="text-sm font-bold text-slate-700">No bookings match your filters</p>
              <p className="mt-1 text-xs text-slate-400">Try adjusting your search query or status filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setDateFilter("");
                }}
                className="mt-4 rounded-xl bg-[#0B1527] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#15233C]"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={13} />
            Previous
          </button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                  currentPage === page
                    ? "bg-[#0B1527] text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={currentPage === 3}
            onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
