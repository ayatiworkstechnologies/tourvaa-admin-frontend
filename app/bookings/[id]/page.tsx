"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import Loader from "@/components/ui/Loader";
import { Booking, getBookingDetail } from "@/lib/services/bookingService";

type DetailPanelProps = {
  title: string;
  children: React.ReactNode;
};

type DetailFieldProps = {
  label: string;
  value?: React.ReactNode;
};

function DetailPanel({ title, children }: DetailPanelProps) {
  return (
    <section className="rounded-lg border border-[#E7EAF0] bg-white p-5">
      <h2 className="mb-4 text-sm font-bold uppercase text-[#667085]">{title}</h2>
      {children}
    </section>
  );
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#98A2B3]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#121826]">{value || "-"}</p>
    </div>
  );
}

function StatusTimeline({ booking }: { booking: Booking }) {
  const historyItems = booking.status_history || [];

  if (historyItems.length === 0) {
    return <p className="text-sm text-[#667085]">No status history yet.</p>;
  }

  return (
    <div className="space-y-3">
      {historyItems.map((historyItem) => (
        <div key={historyItem.id} className="border-l-2 border-blue-200 pl-3">
          <p className="text-sm font-bold text-[#121826]">
            {historyItem.old_status || "created"} to {historyItem.new_status}
          </p>
          <p className="text-xs text-[#667085]">{historyItem.reason || "No reason"}</p>
        </div>
      ))}
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let shouldUpdateState = true;

    async function fetchBooking() {
      if (!params.id) return;

      setIsLoading(true);
      try {
        const bookingDetail = await getBookingDetail(params.id);
        if (shouldUpdateState) setBooking(bookingDetail);
      } catch {
        if (shouldUpdateState) setErrorMessage("Could not load booking.");
      } finally {
        if (shouldUpdateState) setIsLoading(false);
      }
    }

    void fetchBooking();

    return () => {
      shouldUpdateState = false;
    };
  }, [params.id]);

  return (
    <ModuleWrapper title="Booking Detail" requiredPermission="bookings.view">
      {isLoading ? <Loader label="Loading booking..." /> : null}

      {!isLoading && (errorMessage || !booking) ? (
        <p className="text-sm text-red-600">{errorMessage || "Booking not found."}</p>
      ) : null}

      {!isLoading && booking ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#121826]">{booking.booking_code}</h1>
            <p className="text-sm text-[#667085]">{booking.tour_name}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailPanel title="Summary">
              <div className="grid gap-4">
                <DetailField label="Booking Status" value={booking.booking_status} />
                <DetailField label="Supplier Status" value={booking.supplier_acceptance_status} />
                <DetailField label="Payment Status" value={booking.payment_status} />
                <DetailField label="Travellers" value={booking.total_travellers} />
              </div>
            </DetailPanel>

            <DetailPanel title="Money">
              <div className="grid gap-4">
                <DetailField label="Final" value={`${booking.currency} ${booking.final_amount}`} />
                <DetailField label="Paid" value={`${booking.currency} ${booking.amount_paid}`} />
                <DetailField label="Pending" value={`${booking.currency} ${booking.amount_pending}`} />
                <DetailField label="Payment Type" value={booking.payment_type} />
              </div>
            </DetailPanel>

            <DetailPanel title="Travel">
              <div className="grid gap-4">
                <DetailField label="Date" value={booking.tour_date} />
                <DetailField label="Country" value={booking.country} />
                <DetailField label="Supplier" value={booking.supplier_name} />
              </div>
            </DetailPanel>
          </div>

          <DetailPanel title="Status Timeline">
            <StatusTimeline booking={booking} />
          </DetailPanel>

          <DetailPanel title="Notes">
            <p className="text-sm text-[#667085]">{booking.notes || "No notes."}</p>
          </DetailPanel>
        </div>
      ) : null}
    </ModuleWrapper>
  );
}
