import { BookingTraveller } from "@/lib/api/services/bookingService";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type BookingTravellerTableProps = {
  travellers?: BookingTraveller[];
};

export default function BookingTravellerTable({ travellers = [] }: BookingTravellerTableProps) {
  const columns: DataTableColumn<BookingTraveller>[] = [
    { key: "name", header: "Name", className: "font-medium text-dash-text", render: (t) => t.full_name },
    { key: "type", header: "Type", className: "text-dash-muted", render: (t) => t.traveller_type || "-" },
    { key: "age", header: "Age", className: "text-dash-muted", render: (t) => t.age ?? "-" },
    { key: "passport", header: "Passport", className: "text-dash-muted", render: (t) => t.passport_number || "-" },
  ];

  return (
    <div className="p-0">
      <DataTable
        ariaLabel="Travellers"
        columns={columns}
        rows={travellers}
        emptyTitle="No travellers added."
      />
    </div>
  );
}
