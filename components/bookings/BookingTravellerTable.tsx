import { BookingTraveller } from "@/lib/services/bookingService";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";

type BookingTravellerTableProps = {
  travellers?: BookingTraveller[];
};

export default function BookingTravellerTable({ travellers = [] }: BookingTravellerTableProps) {
  const columns: DataTableColumn<BookingTraveller>[] = [
    { key: "name", header: "Name", className: "font-medium text-[#121826]", render: (t) => t.full_name },
    { key: "type", header: "Type", className: "text-[#667085]", render: (t) => t.traveller_type || "-" },
    { key: "age", header: "Age", className: "text-[#667085]", render: (t) => t.age ?? "-" },
    { key: "passport", header: "Passport", className: "text-[#667085]", render: (t) => t.passport_number || "-" },
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
