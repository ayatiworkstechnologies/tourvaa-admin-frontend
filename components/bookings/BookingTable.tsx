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
  search: string;
  error?: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onCancel?: (bookingId: number) => void;
  onConfirm?: (bookingId: number) => void;
};

export default function BookingTable({ onCancel, onConfirm, ...tableProps }: BookingTableProps) {
  const columns: DataTableColumn<Booking>[] = [
    { key: "booking_code", header: "Booking" },
    { key: "tour_name", header: "Tour" },
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
    { key: "final_amount", header: "Final" },
    { key: "amount_pending", header: "Pending" },
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
      {...tableProps}
    />
  );
}


