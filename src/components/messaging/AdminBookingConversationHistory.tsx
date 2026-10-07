"use client";

import { useCallback, useEffect, useState } from "react";
import { LuMessageSquare as MessageSquare, LuRefreshCw as RefreshCw, LuSend as Send } from "react-icons/lu";
import Loader from "@/components/ui/Loader";
import { BookingConversationThread, BookingMessage, getAdminBookingConversations, replyToAdminBookingConversation } from "@/lib/api/services/messagingService";

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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

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

  async function reply(conversation: BookingConversationThread, recipientRole: "supplier" | "agent" | "customer") {
    const key = `${conversation.id}:${recipientRole}`;
    const body = (drafts[key] || "").trim();
    if (!body) return;
    setSending(key);
    try {
      const message = await replyToAdminBookingConversation(conversation.id, body, recipientRole);
      setConversations((previous) => previous.map((item) => item.id === conversation.id ? { ...item, messages: [...item.messages, message] } : item));
      setDrafts((previous) => ({ ...previous, [key]: "" }));
    } catch {
      setError("Could not send the portal reply. Please try again.");
    } finally {
      setSending(null);
    }
  }

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
      <div key={conversation.id} className="grid gap-4 lg:grid-cols-2">
        {(["supplier", conversation.initiator_role] as const).map((recipientRole) => {
          const isSupplier = recipientRole === "supplier";
          const label = isSupplier ? "Supplier" : `${conversation.initiator_role === "agent" ? "Agent" : "Customer"} Portal`;
          const key = `${conversation.id}:${recipientRole}`;
          const messages = conversation.messages.filter((message) => message.sender_role === recipientRole || (message.sender_role === "admin" && message.recipient_role === recipientRole));
          return <div key={key} className="rounded-xl border border-dash-border-soft bg-dash-bg p-4">
            <div className="flex items-center gap-2 border-b border-dash-border-soft pb-3 text-xs font-bold text-dash-text"><MessageSquare size={14} className="text-dash-brand" /> {label}</div>
            <div className="mt-3 min-h-24 space-y-2">
              {messages.length === 0 ? <p className="text-xs text-dash-muted">No messages yet.</p> : messages.map((message: BookingMessage) => <div key={message.id} className="rounded-lg bg-white px-3 py-2.5"><div className="flex justify-between gap-2 text-[11px]"><span className="font-bold capitalize text-dash-text">{message.sender_name || message.sender_role}</span><span className="text-dash-subtle">{displayTime(message.created_at)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm text-dash-body">{message.is_deleted ? "This message was deleted." : message.body}</p></div>)}
            </div>
            <div className="mt-3 flex gap-2 border-t border-dash-border-soft pt-3"><input value={drafts[key] || ""} onChange={(event) => setDrafts((previous) => ({ ...previous, [key]: event.target.value }))} placeholder={`Reply to ${isSupplier ? "supplier" : conversation.initiator_role}...`} className="min-w-0 flex-1 rounded-lg border border-dash-border bg-white px-3 py-2 text-xs outline-none focus:border-dash-brand" /><button type="button" disabled={!drafts[key]?.trim() || sending === key} onClick={() => void reply(conversation, recipientRole)} className="inline-flex items-center gap-1 rounded-lg bg-dash-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Send size={12} />Reply</button></div>
          </div>;
        })}
      </div>
    ))}
  </div>;
}
