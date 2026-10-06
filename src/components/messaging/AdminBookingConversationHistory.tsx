"use client";

import { useCallback, useEffect, useState } from "react";
import { LuMessageSquare as MessageSquare, LuRefreshCw as RefreshCw } from "react-icons/lu";
import Loader from "@/components/ui/Loader";
import { BookingConversationThread, getAdminBookingConversations } from "@/lib/api/services/messagingService";

function displayTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

/** Read-only Admin view of the portal conversation that belongs to a booking.
 * It complements, rather than replaces, the internal BookingCommunication log. */
export default function AdminBookingConversationHistory({ bookingId }: { bookingId: number }) {
  const [conversations, setConversations] = useState<BookingConversationThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConversations(await getAdminBookingConversations(bookingId));
      setError("");
    } catch {
      setError("Could not load portal messages for this booking.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader label="Loading portal messages..." compact />;
  if (error) {
    return <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
      {error}
      <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-rose-700 shadow-sm"><RefreshCw size={12} /> Retry</button>
    </div>;
  }
  if (conversations.length === 0) {
    return <p className="rounded-xl border border-dashed border-dash-border px-4 py-6 text-center text-xs text-dash-muted">No customer, agent, or supplier portal messages for this booking yet.</p>;
  }

  return <div className="space-y-5">
    {conversations.map((conversation) => (
      <div key={conversation.id} className="rounded-xl border border-dash-border-soft bg-dash-bg p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dash-border-soft pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-dash-text"><MessageSquare size={14} className="text-dash-brand" /> {conversation.initiator_name || conversation.initiator_role} and supplier</div>
          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold capitalize text-dash-muted">{conversation.initiator_role} portal</span>
        </div>
        <div className="mt-3 space-y-2">
          {conversation.messages.length === 0 ? <p className="text-xs text-dash-muted">No messages in this conversation yet.</p> : conversation.messages.map((message) => (
            <div key={message.id} className="rounded-lg bg-white px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold capitalize text-dash-text">{message.sender_name || message.sender_role}</span>
                <span className="text-dash-subtle">{displayTime(message.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-dash-body">{message.is_deleted ? "This message was deleted." : message.body}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>;
}
