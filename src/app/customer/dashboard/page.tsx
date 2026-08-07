"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCompass as Compass,
  LuFileText as FileText,
  LuHeadset as Headset,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuShare2 as Share2,
  LuSquarePen as Pencil,
  LuUserPlus as UserPlus,
  LuUserRound as UserRound,
  LuWallet as Wallet,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";
import { useTravelStore } from "@/providers/TravelStoreProvider";
import { useToast } from "@/hooks/useToast";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { CustomerPageHeader, CustomerPageShell, CustomerSection } from "@/components/customer/CustomerPage";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80";
const BOOKINGS_PREVIEW = 5;
const WISHLIST_PREVIEW = 4;

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
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  final_amount?: string | number;
  amount_pending?: string | number;
  currency?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function humanStatus(value?: string) {
  return (value || "Pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value?: string) {
  const v = (value || "").toLowerCase();
  if (["confirmed", "completed"].includes(v)) return "bg-emerald-50 text-emerald-700";
  if (["cancelled", "declined"].includes(v)) return "bg-red-50 text-red-600";
  if (["ongoing", "pending_payment", "payment_authorized"].includes(v)) return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#6B7F9D]">{label}</span>
      <div className="w-full truncate rounded-xl border border-[#DDE7F3] bg-[#F9FBFF] px-4 py-2.5 text-sm font-semibold text-[#0C2043]">
        {value || "-"}
      </div>
    </label>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export default function CustomerDashboardPage() {
  const { user } = useAuthContext();
  const { format, formatExact } = useCurrency();
  const { hydrated, wishlist } = useTravelStore();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [profileResult, bookingResult] = await Promise.allSettled([
        api.get("/customers/me"),
        api.get("/customer/bookings", { params: { limit: BOOKINGS_PREVIEW } }),
      ]);
      if (profileResult.status === "fulfilled") setProfile(profileResult.value.data?.data ?? null);
      if (bookingResult.status === "fulfilled") setBookings(bookingResult.value.data?.items ?? bookingResult.value.data?.data ?? []);
      if (profileResult.status === "rejected" && bookingResult.status === "rejected") {
        setLoadError("Your dashboard could not be loaded. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const wishlistPreview = wishlist.slice(0, WISHLIST_PREVIEW);

  const shareReferral = async () => {
    const shareData = {
      title: "Tourvaa",
      text: "I'm planning my next trip with Tourvaa — check out their curated tours!",
      url: typeof window !== "undefined" ? window.location.origin : "https://tourvaa.com",
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the native share sheet - nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Account Settings"
        description="Manage your profile details, tour bookings, and saved destinations."
        icon={UserRound}
        eyebrow="Traveller Portal"
      />

      {loadError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <span>{loadError}</span>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-white px-3 py-1.5 font-bold shadow-sm ring-1 ring-amber-200 hover:bg-amber-100">
            Retry
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link href="/tours" className="flex flex-col items-center gap-2 rounded-2xl border border-[#E4EBF4] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0865D9]"><Compass size={18} /></span>
          <span className="text-xs font-black text-[#0C2043]">Book a Tour</span>
        </Link>
        <Link href="/customer/payments" className="flex flex-col items-center gap-2 rounded-2xl border border-[#E4EBF4] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Wallet size={18} /></span>
          <span className="text-xs font-black text-[#0C2043]">Make a Payment</span>
        </Link>
        <Link href="/customer/travellers" className="flex flex-col items-center gap-2 rounded-2xl border border-[#E4EBF4] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><UserPlus size={18} /></span>
          <span className="text-xs font-black text-[#0C2043]">Add Traveller</span>
        </Link>
        <Link href="/customer/invoices" className="flex flex-col items-center gap-2 rounded-2xl border border-[#E4EBF4] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><FileText size={18} /></span>
          <span className="text-xs font-black text-[#0C2043]">View Invoices</span>
        </Link>
        <Link href="/customer/support" className="flex flex-col items-center gap-2 rounded-2xl border border-[#E4EBF4] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Headset size={18} /></span>
          <span className="text-xs font-black text-[#0C2043]">Contact Support</span>
        </Link>
        <button type="button" onClick={() => void shareReferral()} className="flex flex-col items-center gap-2 rounded-2xl border border-[#E4EBF4] bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Share2 size={18} /></span>
          <span className="text-xs font-black text-[#0C2043]">Refer a Friend</span>
        </button>
      </div>

      <CustomerSection className="mt-4" title="Profile Details">
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={profile?.full_name || profile?.name || user?.name} />
              <Field label="Email Address" value={profile?.email || user?.email} />
              <Field label="Phone Number" value={profile?.phone} />
              <Field label="Home Address" value={profile?.address || profile?.address_line_1} />
              <Field label="Country" value={profile?.country_name || profile?.country} />
              <Field label="City" value={profile?.city_name || profile?.city} />
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-[#E6EDF6] px-5 py-3 sm:px-6">
          <Link href="/customer/profile" className="inline-flex items-center gap-2 rounded-xl bg-[#0868E8] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-[#075AC9]">
            <Pencil size={14} /> Edit Profile
          </Link>
        </div>
      </CustomerSection>

      <CustomerSection
        className="mt-4"
        title="My Bookings"
      >
        <div className="flex items-center justify-end border-b border-[#E6EDF6] px-5 py-3 sm:px-6">
          <Link href="/customer/bookings" className="inline-flex items-center gap-2 text-xs font-black text-[#0865D9]">
            See All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-bold text-[#0C2043]">No bookings yet</p>
            <p className="mt-1 text-xs text-[#6B7F9D]">Your booked tours will show up here.</p>
            <Link href="/tours" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0868E8] px-4 py-2.5 text-xs font-black text-white">
              Explore tours <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wide text-[#6B7F9D]">
                  <th className="px-5 py-3">Booking ID</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Tour</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF6]">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-blue-50/40">
                    <td className="px-5 py-3">
                      <Link href={`/customer/bookings/${booking.id}`} className="font-bold text-[#0865D9] hover:underline">
                        #{booking.booking_code}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[#4D6383]">{formatDate(booking.tour_date)}</td>
                    <td className="px-3 py-3 font-semibold text-[#0C2043]">{booking.tour_name || "-"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusClass(booking.booking_status)}`}>
                        {humanStatus(booking.booking_status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#0C2043]">{formatExact(booking.final_amount ?? 0, booking.currency)}</td>
                    <td className="px-5 py-3 text-right">
                      {Number(booking.amount_pending || 0) > 0 && (
                        <Link
                          href={`/customer/bookings/${booking.id}?action=pay`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          <Wallet size={13} /> Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CustomerSection>

      <CustomerSection className="mt-4" title="My Wishlist">
        <div className="flex items-center justify-end border-b border-[#E6EDF6] px-5 py-3 sm:px-6">
          <Link href="/customer/wishlist" className="inline-flex items-center gap-2 text-xs font-black text-[#0865D9]">
            See All <ArrowRight size={14} />
          </Link>
        </div>
        {!hydrated ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-40" />)}
          </div>
        ) : wishlistPreview.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#0865D9]"><Heart size={24} /></span>
            <p className="mt-3 text-sm font-bold text-[#0C2043]">No saved destinations yet</p>
            <p className="mt-1 text-xs text-[#6B7F9D]">Tours you save will appear here.</p>
            <Link href="/tours" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0868E8] px-4 py-2.5 text-xs font-black text-white">
              <Compass size={14} /> Explore tours
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {wishlistPreview.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-[#E4EBF4] bg-white">
                <Link href={item.href || `/tours/${item.id}`} className="relative block h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(item.image) || FALLBACK_IMAGE} alt={item.title} className="h-full w-full object-cover" />
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm">
                    <Heart size={15} className="fill-current" />
                  </span>
                </Link>
                <div className="p-4">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#2475E8]"><MapPin size={11} /> {item.place || "Destination"}</p>
                  <Link href={item.href || `/tours/${item.id}`} className="mt-1 block truncate text-sm font-black text-[#0C2043] hover:text-[#0865D9]">{item.title}</Link>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-base font-black text-[#0C2043]">{item.price == null ? "On request" : format(item.price, item.currency)}</p>
                    <Link href={`/booking/${item.id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D5E1EF] px-3 py-1.5 text-[10px] font-black text-[#17365F] hover:bg-[#F1F7FF]">
                      Book Now <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomerSection>
    </CustomerPageShell>
  );
}
