"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Clock, RefreshCw, TicketX, Wallet } from "lucide-react";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import BookingFilters from "@/components/bookings/BookingFilters";
import BookingTable from "@/components/bookings/BookingTable";
import { useDebounce } from "@/hooks/useDebounce";
import { Booking, getBookings, updateBookingStatus, cancelBooking } from "@/lib/services/bookingService";

const PAGE_SIZE = 10;
const AUTO_REFRESH_MS = 10000;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pendingSupplier: 0, cancelled: 0 });

  const debouncedSearch = useDebounce(searchTerm, 350);

  const fetchBookings = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const bookingResponse = await getBookings({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        booking_status: bookingStatus,
        payment_status: paymentStatus,
        _ts: Date.now(),
      });
      setBookings(bookingResponse.items || bookingResponse.data || []);
      setTotalBookings(bookingResponse.total || 0);
      setTotalPages(bookingResponse.total_pages || 1);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not load bookings.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, debouncedSearch, bookingStatus, paymentStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const stamp = Date.now();
      const [allRes, confirmedRes, pendingRes, cancelledRes] = await Promise.all([
        getBookings({ page: 1, limit: 1, _ts: stamp }),
        getBookings({ page: 1, limit: 1, booking_status: "confirmed", _ts: stamp }),
        getBookings({ page: 1, limit: 1, booking_status: "pending_supplier_acceptance", _ts: stamp }),
        getBookings({ page: 1, limit: 1, booking_status: "cancelled", _ts: stamp }),
      ]);
      setStats({
        total: allRes.total || 0,
        confirmed: confirmedRes.total || 0,
        pendingSupplier: pendingRes.total || 0,
        cancelled: cancelledRes.total || 0,
      });
    } catch {
      // Non-critical: stat cards stay at their current values.
    }
  }, []);

  const refreshAll = useCallback(async (background = false) => {
    await Promise.all([fetchBookings(background), fetchStats()]);
  }, [fetchBookings, fetchStats]);

  useEffect(() => {
    void refreshAll(false);
  }, [refreshAll]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, bookingStatus, paymentStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshAll(true);
    }, AUTO_REFRESH_MS);

    function refreshOnFocus() {
      if (document.visibilityState === "visible") void refreshAll(true);
    }

    document.addEventListener("visibilitychange", refreshOnFocus);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refreshAll]);

  function resetToFirstPage(nextValue: string, setter: (value: string) => void) {
    setter(nextValue);
  }

  function clearFilters() {
    setSearchTerm("");
    setBookingStatus("");
    setPaymentStatus("");
  }

  async function confirmBooking(bookingId: number) {
    await updateBookingStatus(bookingId, "confirmed", "Confirmed from admin panel");
    await refreshAll(true);
  }

  async function cancelSelectedBooking(bookingId: number) {
    await cancelBooking(bookingId, "Cancelled from admin panel");
    await refreshAll(true);
  }

  const statCards = useMemo(
    () => [
      { label: "Total Bookings", value: stats.total, icon: CalendarCheck, accent: "text-[#2F9FE9] bg-[#EDF5FF]" },
      { label: "Confirmed", value: stats.confirmed, icon: Wallet, accent: "text-emerald-600 bg-emerald-50" },
      { label: "Pending Supplier", value: stats.pendingSupplier, icon: Clock, accent: "text-amber-700 bg-amber-50" },
      { label: "Cancelled", value: stats.cancelled, icon: TicketX, accent: "text-red-600 bg-red-50" },
    ],
    [stats]
  );

  return (
    <ModuleWrapper title="Bookings" requiredPermission="bookings.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-[#121826]">Bookings</h1>
            <p className="mt-1 text-sm font-medium text-[#667085]">
              Manage booking lifecycle, supplier acceptance, payment status, and history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7EAF0] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] shadow-sm transition hover:bg-[#F7F9FC] disabled:opacity-60"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-2xl border border-[#E9EDF3] bg-white p-5 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#98A2B3]">{label}</p>
              <p className="mt-1 text-xl font-black text-[#121826]">{value}</p>
            </div>
          ))}
        </section>

        <BookingFilters
          search={searchTerm}
          bookingStatus={bookingStatus}
          paymentStatus={paymentStatus}
          onSearchChange={(value) => resetToFirstPage(value, setSearchTerm)}
          onBookingStatusChange={(value) => resetToFirstPage(value, setBookingStatus)}
          onPaymentStatusChange={(value) => resetToFirstPage(value, setPaymentStatus)}
          onClear={clearFilters}
        />

        <BookingTable
          rows={bookings}
          loading={isLoading}
          error={errorMessage}
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={totalBookings}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onCancel={cancelSelectedBooking}
          onConfirm={confirmBooking}
        />
      </div>
    </ModuleWrapper>
  );
}
