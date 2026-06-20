import { BookingStatusHistoryItem } from "@/lib/services/bookingService";

type BookingStatusTimelineProps = {
  items?: BookingStatusHistoryItem[];
};

export default function BookingStatusTimeline({ items = [] }: BookingStatusTimelineProps) {
  if (items.length === 0) {
    return <p className="text-sm text-[#667085]">No status history yet.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((historyItem) => (
        <div key={historyItem.id} className="border-l-2 border-blue-200 pl-3 text-sm">
          <b>
            {historyItem.old_status || "created"} to {historyItem.new_status}
          </b>
          <p className="text-[#667085]">{historyItem.reason || "No reason"}</p>
        </div>
      ))}
    </div>
  );
}
