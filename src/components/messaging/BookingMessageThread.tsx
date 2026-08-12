"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuSend as Send } from "react-icons/lu";

import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { BookingConversationThread, BookingMessage, getBookingConversation, sendBookingConversationMessage } from "@/lib/api/services/messagingService";

function timeAgo(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/** Direct chat between whoever booked a tour (customer, or the agent who
 * booked it for them) and the supplier fulfilling it. Mount on a booking
 * detail page once the booking has a supplier assigned. */
export default function BookingMessageThread({ bookingId }: { bookingId: number }) {
  const [thread, setThread] = useState<BookingConversationThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookingConversation(bookingId);
      setThread(data);
      setError("");
    } catch {
      setError("Could not load messages with the supplier for this booking.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  useMessagingSocket(
    useCallback(
      (event) => {
        if (event.type !== "new_booking_message" || event.conversation.booking_id !== bookingId) return;
        setThread((prev) => (prev && prev.id === event.conversation.id ? { ...event.conversation, messages: [...prev.messages, event.message] } : prev));
      },
      [bookingId]
    )
  );

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const message: BookingMessage = await sendBookingConversationMessage(bookingId, draft.trim());
      setDraft("");
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    } catch {
      setError("Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[480px] flex-col rounded-2xl border border-dash-border-soft bg-white">
      <div className="border-b border-dash-border-soft px-5 py-3">
        <p className="font-bold text-dash-text">Message the supplier{thread?.supplier_name ? ` — ${thread.supplier_name}` : ""}</p>
        <p className="mt-0.5 text-xs text-dash-subtle">Ask about this booking directly.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-dash-subtle" size={22} /></div>
        ) : thread?.messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-dash-muted">No messages yet. Send one below to get started.</p>
        ) : (
          thread?.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_role === "supplier" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender_role === "supplier" ? "bg-dash-bg text-dash-text" : "bg-dash-brand text-white"}`}>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className={`mt-1 text-[10px] ${msg.sender_role === "supplier" ? "text-dash-subtle" : "text-white/70"}`}>{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="mx-5 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</div>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-dash-border-soft px-4 py-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}
