import { BookingStatusHistoryItem } from "@/lib/api/services/bookingService";

type BookingStatusTimelineProps = {
  items?: BookingStatusHistoryItem[];
};

export default function BookingStatusTimeline({ items = [] }: BookingStatusTimelineProps) {
  if (items.length === 0) {
    return <p className="text-sm text-dash-muted">No status history yet.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((historyItem) => (
        <div key={historyItem.id} className="border-l-2 border-blue-200 pl-3 text-sm">
          <b>
            {historyItem.old_status || "created"} to {historyItem.new_status}
          </b>
          <p className="text-dash-muted">{historyItem.reason || "No reason"}</p>
        </div>
      ))}
    </div>
  );
}
