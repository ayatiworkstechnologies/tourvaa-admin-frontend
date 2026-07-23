"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight as ArrowRight,
  LuCalendarDays as CalendarDays,
  LuCircleCheckBig as CircleCheck,
  LuClock3 as Clock3,
  LuCreditCard as CreditCard,
  LuGift as Gift,
  LuHeadphones as Headphones,
  LuHeart as Heart,
  LuMapPin as MapPin,
  LuPlane as Plane,
  LuPlus as Plus,
  LuReceiptText as ReceiptText,
  LuShieldCheck as ShieldCheck,
  LuLuggage as Luggage,
  LuUsersRound as UsersRound,
  LuWalletCards as WalletCards,
} from "react-icons/lu";
import api from "@/lib/api/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuthContext } from "@/providers/AuthProvider";
import { useTravelStore } from "@/providers/TravelStoreProvider";

type Summary = {
  total_bookings?: number;
  upcoming_tours?: number;
  completed_tours?: number;
  pending_payments?: number;
};

type Booking = {
  id: number;
  booking_code: string;
  tour_name?: string;
  tour_date?: string | null;
  booking_status: string;
  payment_status: string;
  final_amount?: string | number;
  amount_pending?: string | number;
  currency?: string;
  country?: string;
};

type Payment = {
  id: number;
  booking_id?: number;
  booking_code?: string;
  payment_status?: string;
  paid_amount?: string | number;
  total_amount?: string | number;
  currency?: string;
  created_at?: string;
};

const TRIP_IMAGES = [
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=86",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(value?: string | null) {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return days > 0 ? `${days} day${days === 1 ? "" : "s"} to go` : null;
}

function humanStatus(value?: string) {
  return (value || "Pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPaid(value?: string) {
  return ["paid", "captured", "completed", "success"].includes((value || "").toLowerCase());
}

function isUpcoming(booking: Booking) {
  return ["confirmed", "upcoming", "ongoing", "pending_payment", "payment_authorized"].includes(booking.booking_status.toLowerCase());
}

function isRequest(booking: Booking) {
  return ["pending", "pending_supplier_acceptance", "payment_authorized"].includes(booking.booking_status.toLowerCase());
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export default function CustomerDashboardPage() {
  const { isLoggedIn, user } = useAuthContext();
  const { wishlistCount } = useTravelStore();
  const { formatCompact } = useCurrency();
  const [summary, setSummary] = useState<Summary>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcome, setWelcome] = useState("Welcome back");
  const [shared, setShared] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [summaryResult, bookingResult, paymentResult] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/customer/bookings", { params: { limit: 6 } }),
        api.get("/customer/payments", { params: { limit: 3 } }),
      ]);

      if (summaryResult.status === "fulfilled") setSummary(summaryResult.value.data?.data ?? {});
      if (bookingResult.status === "fulfilled") setBookings(bookingResult.value.data?.items ?? bookingResult.value.data?.data ?? []);
      if (paymentResult.status === "fulfilled") setPayments(paymentResult.value.data?.items ?? paymentResult.value.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setWelcome(greeting());
  }, []);

  const upcomingTrips = useMemo(() => bookings.filter(isUpcoming).slice(0, 2), [bookings]);
  const tripRequests = useMemo(() => bookings.filter(isRequest).slice(0, 2), [bookings]);
  const pendingBooking = useMemo(() => bookings.find((booking) => Number(booking.amount_pending || 0) > 0), [bookings]);
  const pendingAmount = useMemo(
    () => bookings.reduce((total, booking) => total + Number(booking.amount_pending || 0), 0) || Number(summary.pending_payments || 0),
    [bookings, summary.pending_payments],
  );
  const totalSpent = useMemo(
    () => payments.filter((payment) => isPaid(payment.payment_status)).reduce((total, payment) => total + Number(payment.paid_amount ?? payment.total_amount ?? 0), 0),
    [payments],
  );
  const firstName = user?.name?.split(" ")[0] || "Traveller";

  async function shareTourvaa() {
    const shareData = {
      title: "Tourvaa",
      text: "Discover curated tours and memorable travel experiences with Tourvaa.",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2500);
      }
    } catch {
      // The native share sheet was dismissed.
    }
  }

  const stats = [
    {
      label: "Upcoming Trips",
      value: summary.upcoming_tours ?? bookings.filter(isUpcoming).length,
      icon: Luggage,
      iconClass: "bg-[#EAF3FF] text-[#176FE2]",
      borderClass: "border-[#D7E8FD]",
      action: "View all bookings",
      href: "/customer/bookings",
      actionClass: "text-[#0865D9]",
    },
    {
      label: "Pending Payment",
      value: formatCompact(pendingAmount),
      icon: WalletCards,
      iconClass: "bg-[#EAF9F4] text-[#129B6E]",
      borderClass: "border-[#D6F0E7]",
      action: pendingAmount > 0 ? "Pay now" : "View payments",
      href: pendingBooking ? `/customer/bookings/${pendingBooking.id}?action=pay` : "/customer/payments",
      actionClass: "text-[#079267]",
    },
    {
      label: "Trip Requests",
      value: bookings.filter(isRequest).length,
      icon: Clock3,
      iconClass: "bg-[#F1EEFF] text-[#4F2DE1]",
      borderClass: "border-[#E2DBFF]",
      action: "View requests",
      href: "/customer/bookings?status=pending_supplier_acceptance",
      actionClass: "text-[#4F2DE1]",
    },
    {
      label: "Saved Items",
      value: wishlistCount,
      icon: Heart,
      iconClass: "bg-[#FFF4E9] text-[#F26A16]",
      borderClass: "border-[#F8E2CC]",
      action: "View wishlist",
      href: "/customer/wishlist",
      actionClass: "text-[#EC650E]",
    },
    {
      label: "Total Spent",
      value: formatCompact(totalSpent),
      icon: CreditCard,
      iconClass: "bg-[#FFF0F3] text-[#D7264E]",
      borderClass: "border-[#F8D9E0]",
      action: "View breakdown",
      href: "/customer/payments",
      actionClass: "text-[#D7264E]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FBFF] px-4 py-6 text-[#0C2043] sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section>
          <h1 className="text-[23px] font-black tracking-tight">
            {welcome}, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-[#536B8D]">Ready for your next adventure?</p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-[126px]" />)
            : stats.map(({ label, value, icon: Icon, iconClass, borderClass, action, href, actionClass }) => (
                <Link key={label} href={href} className={`group rounded-xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${borderClass}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                      <Icon size={23} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[22px] font-black leading-tight">{value}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#324B70]">{label}</p>
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center justify-end gap-2 text-[11px] font-bold ${actionClass}`}>
                    {action} <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
        </section>

        <section className="mt-4 overflow-hidden rounded-xl border border-[#DDE7F3] bg-white">
          <div className="flex flex-col border-b border-[#E6EDF6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-[13px] font-black">Quick Actions</h2><p className="mt-0.5 text-[10px] text-[#6E829F]">Start the most common traveller tasks in one click.</p></div>
            <Link href="/customer/support" className="mt-2 text-[10px] font-bold text-[#0865D9] sm:mt-0">Need help?</Link>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5">
            <QuickAction href="/tours" icon={Plus} label="Book a Tour" note="Explore new trips" />
            <QuickAction href={pendingBooking ? `/customer/bookings/${pendingBooking.id}?action=pay` : "/customer/payments"} icon={CreditCard} label="Make a Payment" note={pendingBooking ? "Balance is pending" : "View payment history"} />
            <QuickAction href="/customer/travellers#add-traveller" icon={UsersRound} label="Add Traveller" note="Save passenger details" />
            <QuickAction href="/customer/invoices" icon={ReceiptText} label="View Invoices" note="Access billing records" />
            <QuickAction href="/customer/support" icon={Headphones} label="Contact Support" note="Get travel assistance" />
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.58fr_.92fr]">
          <Panel title="Upcoming Trips" actionLabel="View all bookings" actionHref="/customer/bookings">
            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
              </div>
            ) : upcomingTrips.length ? (
              <div className="space-y-3 p-4">
                {upcomingTrips.map((booking, index) => (
                  <TripCard key={booking.id} booking={booking} image={TRIP_IMAGES[index % TRIP_IMAGES.length]} money={formatCompact} />
                ))}
              </div>
            ) : (
              <EmptyTrips />
            )}
          </Panel>

          <div className="space-y-4">
            <Panel title="Trip Requests" actionLabel="View all" actionHref="/customer/bookings">
              {loading ? (
                <div className="space-y-3 p-4"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
              ) : tripRequests.length ? (
                <div className="divide-y divide-[#E8EEF6]">
                  {tripRequests.map((booking, index) => (
                    <Link key={booking.id} href={`/customer/bookings/${booking.id}`} className="group grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 px-4 py-3 hover:bg-blue-50/45 sm:grid-cols-[76px_minmax(0,1fr)_auto]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={TRIP_IMAGES[(index + 2) % TRIP_IMAGES.length]} alt="" className="h-14 w-16 rounded-lg object-cover sm:w-[76px]" />
                      <span className="min-w-0">
                        <b className="block truncate text-[12px]">{booking.tour_name || booking.booking_code}</b>
                        <span className="mt-1 block truncate text-[10px] text-[#5E7391]">{formatDate(booking.tour_date)} · {booking.country || "Destination pending"}</span>
                      </span>
                      <span className="col-start-2 text-left text-[10px] font-bold text-[#4F2DE1] sm:col-start-auto sm:text-right">{humanStatus(booking.booking_status)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <Clock3 size={25} className="mx-auto text-blue-300" />
                  <p className="mt-2 text-sm font-bold">No open trip requests</p>
                  <p className="mt-1 text-xs text-[#6E829F]">New requests will appear here.</p>
                </div>
              )}
            </Panel>

            <Panel title="Recent Payments" actionLabel="View all" actionHref="/customer/payments">
              {loading ? (
                <div className="space-y-3 p-4"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
              ) : payments.length ? (
                <div className="divide-y divide-[#E8EEF6]">
                  {payments.map((payment) => {
                    const relatedBooking = bookings.find((booking) => booking.id === payment.booking_id);
                    const paid = isPaid(payment.payment_status);
                    return (
                      <Link key={payment.id} href={payment.booking_id ? `/customer/bookings/${payment.booking_id}` : "/customer/payments"} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 hover:bg-blue-50/45 sm:grid-cols-[28px_minmax(0,1fr)_auto_auto] sm:gap-3">
                        <ReceiptText size={18} className="text-[#30557F]" />
                        <span className="min-w-0">
                          <b className="block truncate text-[11px]">{relatedBooking?.tour_name || payment.booking_code || `Payment #${payment.id}`}</b>
                          <span className="text-[10px] text-[#6E829F]">{formatDate(payment.created_at)}</span>
                        </span>
                        <b className="text-[11px]">{formatCompact(payment.paid_amount ?? payment.total_amount, payment.currency)}</b>
                        <span className={`col-start-2 flex items-center gap-1 text-[10px] font-semibold sm:col-start-auto ${paid ? "text-emerald-600" : "text-amber-600"}`}>
                          {humanStatus(payment.payment_status)} {paid ? <CircleCheck size={14} /> : <Clock3 size={14} />}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-xs text-[#6E829F]">No payment activity yet.</div>
              )}
            </Panel>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.58fr_.92fr]">
          <div className="relative min-h-[126px] overflow-hidden rounded-xl border border-[#DCE8F6] bg-[#F1F7FF] px-5 py-5 sm:pl-24">
            <span className="absolute left-5 top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#E1EEFF] text-[#0865D9] sm:flex">
              <Gift size={26} />
            </span>
            <div className="relative max-w-[510px]">
              <h2 className="text-sm font-black">Refer a friend &amp; earn rewards</h2>
              <p className="mt-1 text-[11px] leading-5 text-[#536B8D]">Invite your friends to Tourvaa and earn exciting rewards on every successful booking.</p>
              <button type="button" onClick={() => void shareTourvaa()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0868E8] px-4 py-2 text-[11px] font-black text-white shadow-md shadow-blue-200">
                {shared ? "Link copied!" : "Share Tourvaa"} <ArrowRight size={13} />
              </button>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-5 hidden items-end gap-2 md:flex">
              <span className="h-20 w-14 rounded-t-full bg-[#0B61C8]" />
              <Gift size={54} className="mb-2 text-[#0C82F5]" />
              <span className="h-16 w-14 rounded-t-full bg-[#19A07A]" />
            </div>
          </div>

          <div className="relative min-h-[126px] overflow-hidden rounded-xl border border-[#DCE8F6] bg-white p-5">
            <h2 className="text-sm font-black">Need Help?</h2>
            <p className="mt-2 text-[11px] text-[#536B8D]">Our travel experts are here 24/7 to assist you.</p>
            <Link href="/customer/support" className="mt-4 inline-flex rounded-lg border border-[#D5E1EF] bg-white px-5 py-2 text-[11px] font-black text-[#0865D9]">
              Contact Support
            </Link>
            <Headphones size={67} className="absolute bottom-3 right-8 text-[#1555A0]" strokeWidth={1.3} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 rounded-xl border border-[#DDE7F3] bg-white px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <TrustItem icon={ShieldCheck} title="Best Price Guarantee" text="We offer the best prices" />
          <TrustItem icon={CalendarDays} title="Secure Payments" text="100% secure payments" />
          <TrustItem icon={Headphones} title="24/7 Travel Support" text="We are here to help" />
          <TrustItem icon={UsersRound} title="Verified Partners" text="Trusted & verified partners" />
        </section>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, note }: { href: string; icon: React.ElementType; label: string; note: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 border-b border-[#E8EEF6] px-4 py-4 transition hover:bg-blue-50/45 sm:border-r xl:border-b-0 xl:last:border-r-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0865D9] transition group-hover:bg-[#0868E8] group-hover:text-white">
        <Icon size={18} />
      </span>
      <span className="min-w-0"><b className="block truncate text-[11px]">{label}</b><span className="mt-0.5 block truncate text-[9px] text-[#7184A0]">{note}</span></span>
      <ArrowRight size={13} className="ml-auto shrink-0 text-[#8DA0B8] transition group-hover:translate-x-1 group-hover:text-[#0865D9]" />
    </Link>
  );
}

function Panel({ title, actionLabel, actionHref, children }: { title: string; actionLabel: string; actionHref: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE7F3] bg-white shadow-[0_6px_24px_-20px_rgba(24,68,126,.55)]">
      <div className="flex h-[50px] items-center justify-between border-b border-[#E6EDF6] px-4">
        <h2 className="text-[14px] font-black">{title}</h2>
        <Link href={actionHref} className="group flex items-center gap-2 text-[11px] font-bold text-[#0865D9]">
          {actionLabel} <ArrowRight size={14} className="transition group-hover:translate-x-1" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function TripCard({ booking, image, money }: { booking: Booking; image: string; money: (amount: string | number | null | undefined, currency?: string) => string }) {
  const countdown = daysUntil(booking.tour_date);
  const pending = Number(booking.amount_pending || 0) > 0 || !isPaid(booking.payment_status);

  return (
    <article className="grid overflow-hidden rounded-xl border border-[#E2EAF4] bg-white shadow-[0_5px_18px_-15px_rgba(22,61,112,.7)] md:grid-cols-[200px_1fr]">
      <div className="relative min-h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {countdown && <span className="absolute left-3 top-3 rounded-lg bg-[#0870EB] px-3 py-1.5 text-[10px] font-black text-white">{countdown}</span>}
      </div>
      <div className="flex min-w-0 flex-col p-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-black">{booking.tour_name || booking.booking_code}</h3>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[#4D6383]">
              <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(booking.tour_date)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {booking.country || "Destination pending"}</span>
            </p>
          </div>
          <span className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold ${pending ? "bg-[#FFF0E3] text-[#D65F0A]" : "bg-[#E8F8F2] text-[#078866]"}`}>
            {humanStatus(pending ? booking.payment_status : booking.booking_status)}
          </span>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[10px] text-[#4D6383]">
          <UsersRound size={13} /> Traveller booking <span>•</span> Tour package
        </p>
        <div className="mt-auto flex flex-col gap-3 border-t border-[#E8EEF6] pt-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 gap-8">
            <span>
              <small className="block text-[9px] text-[#6E829F]">Booking ID</small>
              <b className="mt-1 block text-[11px]">{booking.booking_code}</b>
            </span>
            <span>
              <small className="block text-[9px] text-[#6E829F]">Amount</small>
              <b className="mt-1 block text-[12px]">{money(booking.final_amount, booking.currency)}</b>
            </span>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Link href={`/customer/bookings/${booking.id}`} className="rounded-lg border border-[#D5E1EF] px-4 py-2 text-center text-[10px] font-bold text-[#17365F]">View Details</Link>
            <Link href={pending ? `/customer/bookings/${booking.id}?action=pay` : `/customer/bookings/${booking.id}`} className="rounded-lg bg-[#0868E8] px-4 py-2 text-center text-[10px] font-bold text-white">
              {pending ? "Pay Now" : "Trip Details"}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyTrips() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#0865D9]"><Plane size={25} /></span>
      <h3 className="mt-4 text-base font-black">Your next adventure starts here</h3>
      <p className="mt-1 text-xs text-[#6E829F]">Browse curated tours and your upcoming trips will appear here.</p>
      <Link href="/tours" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0868E8] px-4 py-2.5 text-xs font-bold text-white">
        Explore tours <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function TrustItem({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 xl:border-r xl:border-[#E0E8F2] xl:last:border-r-0">
      <Icon size={25} className="shrink-0 text-[#1976E9]" />
      <span>
        <b className="block text-[11px]">{title}</b>
        <span className="mt-0.5 block text-[10px] text-[#6E829F]">{text}</span>
      </span>
    </div>
  );
}
