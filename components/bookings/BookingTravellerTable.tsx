import { BookingTraveller } from "@/lib/services/bookingService";

type BookingTravellerTableProps = {
  travellers?: BookingTraveller[];
};

export default function BookingTravellerTable({ travellers = [] }: BookingTravellerTableProps) {
  if (travellers.length === 0) {
    return <p className="text-sm text-[#667085]">No travellers added.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E7EAF0]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-[#F7F9FC] text-xs uppercase text-[#667085]">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Age</th>
            <th className="px-4 py-3">Passport</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6] bg-white">
          {travellers.map((traveller, index) => (
            <tr key={traveller.id ?? index}>
              <td className="px-4 py-3 font-medium text-[#121826]">{traveller.full_name}</td>
              <td className="px-4 py-3 text-[#667085]">{traveller.traveller_type || "-"}</td>
              <td className="px-4 py-3 text-[#667085]">{traveller.age ?? "-"}</td>
              <td className="px-4 py-3 text-[#667085]">{traveller.passport_number || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
