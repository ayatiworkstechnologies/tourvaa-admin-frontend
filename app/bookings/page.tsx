"use client";

import { useEffect, useState } from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import BookingFilters from "@/components/bookings/BookingFilters";
import BookingTable from "@/components/bookings/BookingTable";
import { Booking, getBookings, updateBookingStatus, cancelBooking } from "@/lib/services/bookingService";

const PAGE_SIZE = 10;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchBookings() {
      setIsLoading(true);
      try {
        const bookingResponse = await getBookings({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchTerm,
          booking_status: bookingStatus,
          payment_status: paymentStatus,
        });

        if (!shouldUpdateState) return;

        setBookings(bookingResponse.items || bookingResponse.data || []);
        setTotalBookings(bookingResponse.total || 0);
        setTotalPages(bookingResponse.total_pages || 1);
        setErrorMessage("");
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load bookings.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchBookings();

    return () => {
      shouldUpdateState = false;
    };
  }, [currentPage, searchTerm, bookingStatus, paymentStatus]);

  function resetToFirstPage(nextValue: string, setter: (value: string) => void) {
    setCurrentPage(1);
    setter(nextValue);
  }

  function clearFilters() {
    setCurrentPage(1);
    setSearchTerm("");
    setBookingStatus("");
    setPaymentStatus("");
  }

  async function confirmBooking(bookingId: number) {
    await updateBookingStatus(bookingId, "confirmed", "Confirmed from admin panel");
    const refreshedBooking = await getBookings({ page: currentPage, limit: PAGE_SIZE, search: searchTerm });
    setBookings(refreshedBooking.items || refreshedBooking.data || []);
  }

  async function cancelSelectedBooking(bookingId: number) {
    await cancelBooking(bookingId, "Cancelled from admin panel");
    const refreshedBooking = await getBookings({ page: currentPage, limit: PAGE_SIZE, search: searchTerm });
    setBookings(refreshedBooking.items || refreshedBooking.data || []);
  }

  return (
    <ModuleWrapper title="Bookings" requiredPermission="bookings.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121826]">Bookings</h1>
          <p className="text-sm text-[#667085]">
            Manage booking lifecycle, supplier acceptance, payment status, and history.
          </p>
        </div>

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
          search={searchTerm}
          onSearchChange={(value) => resetToFirstPage(value, setSearchTerm)}
          onPageChange={setCurrentPage}
          onCancel={cancelSelectedBooking}
          onConfirm={confirmBooking}
        />
      </div>
    </ModuleWrapper>
  );
}
