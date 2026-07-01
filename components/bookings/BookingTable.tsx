import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { Booking } from "@/lib/services/bookingService";
import BookingActionMenu from "./BookingActionMenu";
import BookingStatusBadge from "./BookingStatusBadge";

type BookingTableProps = {
  rows: Booking[];
  loading: boolean;
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
  error?: string;
  onPageChange: (page: number) => void;
  onCancel?: (bookingId: number) => void;
  onConfirm?: (bookingId: number) => void;
};

function money(value: string | number | undefined, currency: string) {
  const amount = Number(value || 0).toLocaleString();
  return `${currency || ""} ${amount}`.trim();
}

export default function BookingTable({ onCancel, onConfirm, ...tableProps }: BookingTableProps) {
  const columns: DataTableColumn<Booking>[] = [
    { key: "booking_code", header: "Booking", className: "font-bold text-[#121826]" },
    {
      key: "customer_name",
      header: "Customer",
      render: (booking) => (
        <div>
          <p className="font-semibold text-[#121826]">{booking.customer_name || `Customer #${booking.customer_id}`}</p>
          {booking.customer_email && <p className="text-xs text-[#98A2B3]">{booking.customer_email}</p>}
        </div>
      ),
    },
    {
      key: "tour_name",
      header: "Tour",
      render: (booking) => (
        <div>
          <p className="font-semibold text-[#344054]">{booking.tour_name}</p>
          {booking.tour_date && <p className="text-xs text-[#98A2B3]">{booking.tour_date}</p>}
        </div>
      ),
    },
    {
      key: "booking_status",
      header: "Status",
      render: (booking) => <BookingStatusBadge value={booking.booking_status} />,
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (booking) => <BookingStatusBadge value={booking.payment_status} />,
    },
    { key: "final_amount", header: "Final", className: "font-semibold text-[#121826]", render: (booking) => money(booking.final_amount, booking.currency) },
    { key: "amount_pending", header: "Pending", className: "font-semibold text-amber-700", render: (booking) => money(booking.amount_pending, booking.currency) },
    {
      key: "id",
      header: "Actions",
      render: (booking) => (
        <BookingActionMenu
          bookingId={booking.id}
          bookingStatus={booking.booking_status}
          paymentStatus={booking.payment_status}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel="Bookings"
      columns={columns}
      emptyTitle="No bookings found"
      emptyDescription="Try adjusting your filters or search terms."
      {...tableProps}
    />
  );
}
