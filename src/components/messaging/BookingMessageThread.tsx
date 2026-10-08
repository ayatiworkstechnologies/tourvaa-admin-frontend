"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuSend as Send, LuTrash2 as Trash2 } from "react-icons/lu";
import Loader from "@/components/ui/Loader";

import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { BookingConversationThread, BookingMessage, deleteOwnBookingMessage, getBookingConversation, sendBookingConversationMessage } from "@/lib/api/services/messagingService";

function messageDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function messageTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Booking-specific conversation between the portal user and Tourvaa Admin.
 * Server-side recipient filtering keeps Admin-to-Supplier and
 * Admin-to-Agent/Customer replies in their own private portal threads. */
export default function BookingMessageThread({ bookingId, compact = false }: { bookingId: number; compact?: boolean }) {
  const [thread, setThread] = useState<BookingConversationThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookingConversation(bookingId);
      setThread(data);
      setError("");
    } catch {
      setError("Could not load messages for this booking.");
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
        if (event.type === "new_booking_message") {
          if (event.conversation.booking_id !== bookingId) return;
          setThread((prev) => (
            prev && prev.id === event.conversation.id
              ? { ...event.conversation, messages: prev.messages.some((message) => message.id === event.message.id) ? prev.messages : [...prev.messages, event.message] }
              : prev
          ));
          return;
        }
        if (event.type === "booking_message_deleted") {
          setThread((prev) => (prev && prev.id === event.conversation_id ? { ...prev, messages: prev.messages.map((m) => (m.id === event.message.id ? event.message : m)) } : prev));
        }
      },
      [bookingId]
    )
  );

  async function removeMessage(messageId: number) {
    setDeletingId(messageId);
    try {
      const updated = await deleteOwnBookingMessage(messageId);
      setThread((prev) => (prev ? { ...prev, messages: prev.messages.map((m) => (m.id === messageId ? updated : m)) } : prev));
    } catch {
      setError("Could not delete that message.");
    } finally {
      setDeletingId(null);
    }
  }

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

  const groupedMessages = (thread?.messages ?? [])
    .reduce<{ date: string; messages: BookingMessage[] }[]>((groups, message) => {
      const date = messageDate(message.created_at) || "Unknown date";
      const previous = groups[groups.length - 1];
      if (previous?.date === date) previous.messages.push(message);
      else groups.push({ date, messages: [message] });
      return groups;
    }, []);

  return (
    <div className={`flex flex-col rounded-xl border border-dash-border bg-white shadow-sm ${compact ? "min-h-64" : "h-[480px]"}`}>
      <div className="border-b border-dash-border-soft px-5 py-3">
        <p className="font-bold text-dash-text">Message Tourvaa Support</p>
        <p className="mt-0.5 text-xs text-dash-subtle">Ask about this booking directly.</p>
      </div>

      <div className={`flex-1 space-y-3 overflow-y-auto px-5 py-4 ${compact ? "max-h-80 min-h-32" : ""}`}>
        {loading ? (
          <Loader label="Loading booking messages..." compact />
        ) : thread?.messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-dash-muted">No messages yet. Send one below to get started.</p>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="sticky top-0 z-10 flex justify-center py-1">
                <span className="rounded-full border border-dash-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-dash-muted shadow-sm">{group.date}</span>
              </div>
              {group.messages.map((msg) => {
                const isAdminMessage = msg.sender_role === "admin";
                return (
                  <div key={msg.id} className={`group flex items-end gap-1.5 ${isAdminMessage ? "justify-start" : "justify-end"}`}>
                    {!msg.is_deleted && !isAdminMessage && (
                      <button
                        type="button"
                        onClick={() => removeMessage(msg.id)}
                        disabled={deletingId === msg.id}
                        aria-label="Delete message"
                        title="Delete message"
                        className="mb-1 hidden h-6 w-6 items-center justify-center rounded-lg text-white/60 hover:bg-black/10 hover:text-white group-hover:flex disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isAdminMessage ? "bg-dash-bg text-dash-text" : "bg-dash-brand text-white"} ${msg.is_deleted ? "italic opacity-70" : ""}`}>
                      <p className={`whitespace-pre-wrap ${isAdminMessage ? "text-xs" : "text-sm"}`}>{msg.is_deleted ? "This message was deleted." : msg.body}</p>
                      <p className={`mt-1 text-[10px] ${isAdminMessage ? "text-dash-subtle" : "text-white/70"}`}>{messageTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })}
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
