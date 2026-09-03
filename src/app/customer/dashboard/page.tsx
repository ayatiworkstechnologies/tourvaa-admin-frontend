"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuCompass as Compass,
  LuCreditCard as CreditCard,
  LuFileText as FileText,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuLayoutGrid as LayoutGrid,
  LuMapPin as MapPin,
  LuPencil as Pencil,
  LuShare2 as Share2,
  LuStar as Star,
  LuUserPlus as UserPlus,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";

type Profile = {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line_1?: string;
  country_name?: string;
  country?: string;
  city_name?: string;
  city?: string;
  pincode?: string;
  postal_code?: string;
  passport_no?: string;
  nationality?: string;
};

type Booking = {
  id: number | string;
  booking_code: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  final_amount?: string | number;
  amount_pending?: string | number;
  currency?: string;
};

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 1,
    booking_code: "TRV-2847",
    tour_date: "2025-12-15",
    tour_name: "Bali Island Retreat – 5D/4N",
    booking_status: "Confirmed",
    final_amount: 1240.0,
    currency: "USD",
  },
  {
    id: 2,
    booking_code: "TRV-9281",
    tour_date: "2025-11-22",
    tour_name: "Paris City Explorer – 4D/3N",
    booking_status: "In Transit",
    final_amount: 985.0,
    currency: "USD",
  },
  {
    id: 3,
    booking_code: "TRV-4102",
    tour_date: "2025-10-10",
    tour_name: "Tokyo Cultural Tour – 7D/6N",
    booking_status: "Completed",
    final_amount: 2125.0,
    currency: "USD",
  },
  {
    id: 4,
    booking_code: "TRV-1029",
    tour_date: "2025-09-05",
    tour_name: "Santorini Sunset Package – 3D/2N",
    booking_status: "Cancelled",
    final_amount: 799.0,
    currency: "USD",
  },
];

const DEFAULT_WISHLIST = [
  {
    id: "1",
    title: "South Island Explorer",
    location: "New Zealand",
    duration: "10D | 9N",
    rating: 4.8,
    reviews: "2,466 reviews",
    price: "$2,699",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "2",
    title: "South Island Explorer",
    location: "New Zealand",
    duration: "10D | 9N",
    rating: 4.8,
    reviews: "2,466 reviews",
    price: "$2,699",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
  {
    id: "3",
    title: "South Island Explorer",
    location: "New Zealand",
    duration: "10D | 9N",
    rating: 4.8,
    reviews: "2,466 reviews",
    price: "$2,699",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
    href: "/tours",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatStatus(status: string) {
  const s = status.toLowerCase();
  if (s.includes("confirm")) {
    return <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">Confirmed</span>;
  }
  if (s.includes("transit") || s.includes("ongoing") || s.includes("upcoming") || s.includes("pending")) {
    return <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">In Transit</span>;
  }
  if (s.includes("complete")) {
    return <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">Completed</span>;
  }
  if (s.includes("cancel") || s.includes("declin")) {
    return <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-500">Cancelled</span>;
  }
  return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{status}</span>;
}

function formatPrice(amount?: number | string) {
  if (amount == null) return "$0.00";
  const num = typeof amount === "number" ? amount : parseFloat(String(amount)) || 0;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomerDashboardPage() {
  const { user } = useAuthContext();
  const { wishlist } = useTravelStore();
  const { format } = useCurrency();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(DEFAULT_BOOKINGS);

  const handleReferralShare = useCallback(async () => {
    const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${encodeURIComponent(String(user?.id ?? ""))}` : "";
    const text = "Book your next trip with Tourvaa - join me and explore curated tours worldwide!";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tourvaa", text, url: link });
      } catch {
        // User cancelled the native share sheet - nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied to clipboard.");
    } catch {
      toast.error("Could not copy the referral link.");
    }
  }, [user, toast]);

  const load = useCallback(async () => {
    try {
      const [profileResult, bookingResult] = await Promise.allSettled([
        api.get("/customers/me"),
        api.get("/customer/bookings", { params: { limit: 5 } }),
      ]);
      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data?.data ?? null);
      }
      if (bookingResult.status === "fulfilled") {
        const items = bookingResult.value.data?.items ?? bookingResult.value.data?.data ?? [];
        if (items.length > 0) {
          setBookings(items);
        }
      }
    } catch {
      // Use fallback data
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fullName = profile?.full_name || profile?.name || user?.name || "Sarah Mitchell";
  const email = profile?.email || user?.email || "sarah.mitchell@tourvaaa.com";
  const phone = profile?.phone || "+1 (555) 743-2190";
  const passportNo = profile?.passport_no || (profile?.pincode ? `US-${profile.pincode}` : "US-X4829301");
  const nationality = profile?.nationality || profile?.country_name || profile?.country || "American";
  const homeAddress = profile?.address || profile?.address_line_1 || "58 Sunset Blvd, Los Angeles, CA 90028";

  // Wishlist items or defaults
  const wishlistItems = wishlist.length > 0
    ? wishlist.slice(0, 3).map((w) => ({
        id: String(w.id),
        title: w.title || "South Island Explorer",
        location: w.place || "New Zealand",
        duration: "10D | 9N",
        rating: 4.8,
        reviews: "2,466 reviews",
        price: w.price ? format(w.price, w.currency || "USD") : "$2,699",
        image: mediaUrl(w.image) || DEFAULT_WISHLIST[0].image,
        href: w.href || `/tours/${w.id}`,
      }))
    : DEFAULT_WISHLIST;

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Page Title & Subtitle */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#0B1527]">
              Account Settings
            </h1>
            <p className="mt-1 text-xs text-slate-400 font-medium">
              Manage your profile details, tour bookings, and saved destinations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReferralShare}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B1527] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C]"
          >
            <Share2 size={13} />
            Refer & Earn
          </button>
        </div>

        {/* ── Quick Actions ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link href="/tours" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Compass size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Book a Tour</span>
          </Link>
          <Link href="/customer/payments" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Make a Payment</span>
          </Link>
          <Link href="/customer/travellers" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><UserPlus size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Add Traveller</span>
          </Link>
          <Link href="/customer/invoices" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><FileText size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">View Invoices</span>
          </Link>
          <Link href="/customer/support" className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-4 text-center shadow-[0_4px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Headset size={16} /></span>
            <span className="text-[11px] font-bold text-slate-800">Contact Support</span>
          </Link>
        </div>

        {/* ── Card 1: Profile Details ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B1527]">Profile Details</h2>
            <Link
              href="/customer/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1527] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C]"
            >
              <Pencil size={13} />
              Edit Profile
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                FULL NAME
              </label>
              <input
                type="text"
                readOnly
                value={fullName}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-default"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                EMAIL ADDRESS
              </label>
              <input
                type="text"
                readOnly
                value={email}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-default"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PHONE NUMBER
              </label>
              <input
                type="text"
                readOnly
                value={phone}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-default"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PASSPORT NO.
              </label>
              <input
                type="text"
                readOnly
                value={passportNo}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-default"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                NATIONALITY
              </label>
              <input
                type="text"
                readOnly
                value={nationality}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-default"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                HOME ADDRESS
              </label>
              <input
                type="text"
                readOnly
                value={homeAddress}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none cursor-default"
              />
            </div>
          </div>
        </div>

        {/* ── Card 2: My Bookings ── */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0B1527]">My Bookings</h2>
            <Link
              href="/customer/bookings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1527] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C]"
            >
              <LayoutGrid size={13} />
              See All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pt-1">BOOKING ID</th>
                  <th className="pb-3 pt-1">DATE</th>
                  <th className="pb-3 pt-1">TOUR</th>
                  <th className="pb-3 pt-1 text-center">STATUS</th>
                  <th className="pb-3 pt-1 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4">
                      <Link
                        href={`/customer/bookings/${b.id}`}
                        className="text-xs font-bold text-[#1B64F2] hover:underline"
                      >
                        #{b.booking_code.replace(/^#/, "")}
                      </Link>
                    </td>
                    <td className="py-4 text-xs font-medium text-slate-500">
                      {formatDate(b.tour_date)}
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-800">
                      {b.tour_name || "Tour Package"}
                    </td>
                    <td className="py-4 text-center">
                      {formatStatus(b.booking_status)}
                    </td>
                    <td className="py-4 text-right text-xs font-bold text-slate-900">
                      {Number(b.amount_pending || 0) > 0 ? (
                        <Link href={`/customer/bookings/${b.id}?action=pay`} className="text-amber-600 hover:underline">
                          {formatPrice(b.amount_pending)} due
                        </Link>
                      ) : (
                        formatPrice(b.final_amount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Card 3: My Wishlist ── */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[#0B1527]">My Wishlist</h2>
            <Link
              href="/customer/wishlist"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1527] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#15233C]"
            >
              <LayoutGrid size={13} />
              See All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {wishlistItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Image & Badges */}
                <div className="relative h-44 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                  {/* Top-Left Location Badge */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-800 backdrop-blur-xs shadow-xs">
                    <MapPin size={11} className="text-slate-600" />
                    {item.location}
                  </span>
                  {/* Top-Right Heart Button */}
                  <button
                    type="button"
                    aria-label="Wishlist"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-xs hover:scale-110 transition"
                  >
                    <Heart size={14} className="fill-current text-blue-600" />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  {/* Title & Duration */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{item.title}</h3>
                    <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                      {item.duration}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className="fill-current text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">{item.rating}</span>
                    <span className="text-[10px] text-slate-400">({item.reviews})</span>
                  </div>

                  {/* Price & Book Now */}
                  <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-500">Price </span>
                      <span className="text-xs font-black text-slate-900">{item.price}</span>
                      <span className="text-[10px] text-slate-400"> pp</span>
                    </div>
                    <Link
                      href={item.href || "/tours"}
                      className="rounded-xl bg-[#0B1527] px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#15233C]"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
