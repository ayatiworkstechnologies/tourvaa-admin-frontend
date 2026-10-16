"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuCheckCheck as CheckCheck, LuLoaderCircle as Loader2, LuMail as Mail, LuSend as Send, LuTrash2 as Trash2, LuWifiOff as WifiOff } from "react-icons/lu";
import Loader from "@/components/ui/Loader";
import PresenceBadge from "@/components/messaging/PresenceBadge";

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

function emailDeliveryLabel(message: BookingMessage) {
  const delivery = message.email_delivery;
  if (!delivery?.recipient_count) return null;
  if (delivery.status === "failed") return "Email notification needs attention";
  if (delivery.status === "sending") return "Email notification sending";
  return "Email notification sent";
}

type QueuedBookingMessage = { id: string; body: string; queued_at: string; attempted?: boolean };

function draftStorageKey(bookingId: number) { return `tourvaa:booking-message-draft:${bookingId}`; }
function queueStorageKey(bookingId: number) { return `tourvaa:booking-message-queue:${bookingId}`; }

function readQueuedMessages(bookingId: number): QueuedBookingMessage[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(queueStorageKey(bookingId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is QueuedBookingMessage => typeof item?.id === "string" && typeof item?.body === "string") : [];
  } catch { return []; }
}

function saveQueuedMessages(bookingId: number, messages: QueuedBookingMessage[]) {
  try { window.localStorage.setItem(queueStorageKey(bookingId), JSON.stringify(messages)); } catch { /* best effort */ }
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
  const [isOnline, setIsOnline] = useState(true);
  const [queuedMessages, setQueuedMessages] = useState<QueuedBookingMessage[]>([]);
  const [adminTyping, setAdminTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const flushQueuedMessages = useCallback(async () => {
    if (!navigator.onLine) return;
    const queued = readQueuedMessages(bookingId);
    setQueuedMessages(queued);
    for (const item of queued) {
      // An uncertain network result is never retried automatically: that could duplicate a booking note.
      if (item.attempted) continue;
      try {
        const message = await sendBookingConversationMessage(bookingId, item.body);
        setThread((prev) => prev && !prev.messages.some((row) => row.id === message.id) ? { ...prev, messages: [...prev.messages, message] } : prev);
        const remaining = readQueuedMessages(bookingId).filter((row) => row.id !== item.id);
        saveQueuedMessages(bookingId, remaining);
        setQueuedMessages(remaining);
      } catch {
        const failed = readQueuedMessages(bookingId).map((row) => row.id === item.id ? { ...row, attempted: true } : row);
        saveQueuedMessages(bookingId, failed);
        setQueuedMessages(failed);
        setError("A queued message needs your confirmation before it can be retried.");
        break;
      }
    }
  }, [bookingId]);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftStorageKey(bookingId));
    if (savedDraft) setDraft(savedDraft);
    setIsOnline(navigator.onLine);
    setQueuedMessages(readQueuedMessages(bookingId));
    if (navigator.onLine) void flushQueuedMessages();
    const online = () => { setIsOnline(true); void load(); void flushQueuedMessages(); };
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, [bookingId, flushQueuedMessages, load]);

  useEffect(() => {
    try {
      if (draft) window.localStorage.setItem(draftStorageKey(bookingId), draft);
      else window.localStorage.removeItem(draftStorageKey(bookingId));
    } catch { /* draft recovery must never block messaging */ }
  }, [bookingId, draft]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  const sendSocketEvent = useMessagingSocket(
    useCallback(
      (event) => {
        if (event.type === "admin_presence") {
          setThread((prev) => (prev ? { ...prev, admin_online: event.online } : prev));
          return;
        }
        if (event.type === "new_booking_message") {
          if (event.conversation.booking_id !== bookingId) return;
          setThread((prev) => (
            prev && prev.id === event.conversation.id
              ? { ...event.conversation, messages: prev.messages.some((message) => message.id === event.message.id) ? prev.messages : [...prev.messages, event.message] }
              : prev
          ));
          return;
        }
        if (event.type === "typing" && event.scope === "booking" && event.conversation_id === thread?.id && event.sender_role === "admin") {
          setAdminTyping(event.is_typing);
          return;
        }
        if (event.type === "booking_message_deleted") {
          setThread((prev) => (prev && prev.id === event.conversation_id ? { ...prev, messages: prev.messages.map((m) => (m.id === event.message.id ? event.message : m)) } : prev));
        }
      },
      [bookingId, thread?.id]
    )
  );

  useEffect(() => () => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
  }, []);

  function updateDraft(value: string) {
    setDraft(value);
    if (!thread?.id) return;
    const baseEvent = { type: "typing", scope: "booking", conversation_id: thread.id };
    if (!value.trim()) {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      typingStopTimer.current = null;
      sendSocketEvent({ ...baseEvent, is_typing: false });
      return;
    }
    sendSocketEvent({ ...baseEvent, is_typing: true });
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      sendSocketEvent({ ...baseEvent, is_typing: false });
      typingStopTimer.current = null;
    }, 1200);
  }

  function stopTyping() {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = null;
    if (thread?.id) sendSocketEvent({ type: "typing", scope: "booking", conversation_id: thread.id, is_typing: false });
  }

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
    const body = draft.trim();
    if (!navigator.onLine) {
      const next = [...readQueuedMessages(bookingId), { id: crypto.randomUUID(), body, queued_at: new Date().toISOString() }];
      saveQueuedMessages(bookingId, next);
      setQueuedMessages(next);
      setDraft("");
      setError("");
      return;
    }
    setSending(true);
    setError("");
    stopTyping();
    try {
      const message: BookingMessage = await sendBookingConversationMessage(bookingId, body);
      setDraft("");
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    } catch {
      setError("Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  function retryQueuedMessages() {
    if (!navigator.onLine) {
      setError("Reconnect before retrying this queued message.");
      return;
    }
    const next = readQueuedMessages(bookingId).map((message) => ({ ...message, attempted: false }));
    saveQueuedMessages(bookingId, next);
    setQueuedMessages(next);
    setError("");
    void flushQueuedMessages();
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
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-dash-text">Message Tourvaa Support</p>
          <div className="flex items-center gap-2">
            {!isOnline && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800"><WifiOff size={13} />Device offline</span>}
            <PresenceBadge online={thread?.admin_online ?? false} subject="Tourvaa Admin" />
          </div>
        </div>
        <p className="mt-0.5 text-xs text-dash-subtle">Ask about this booking directly. Drafts are saved on this device.</p>
        {!isOnline && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">Messages written now are saved on this device and queued until you reconnect.</p>}
        {adminTyping && <p className="mt-1 text-xs font-medium text-dash-brand">Tourvaa Admin is typing…</p>}
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
                const isOwnMessage = !isAdminMessage;
                const deliveryLabel = emailDeliveryLabel(msg);
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
                      <div className={`mt-1 flex items-center gap-2 text-[10px] ${isAdminMessage ? "text-dash-subtle" : "text-white/70"}`}>
                        <span>{messageTime(msg.created_at)}</span>
                        {deliveryLabel && !msg.is_deleted && (
                          <span className="inline-flex items-center gap-1" title={deliveryLabel}>
                            <Mail size={11} /> {deliveryLabel}
                          </span>
                        )}
                        {isOwnMessage && !msg.is_deleted && (
                          <span className="inline-flex items-center gap-0.5" title={msg.read_at ? "Read by Tourvaa Admin" : "Sent to Tourvaa Admin"}>
                            <CheckCheck size={11} /> {msg.read_at ? "Read" : "Sent"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {queuedMessages.length > 0 && (
        <div className="mx-5 mb-2 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>{queuedMessages.some((message) => !message.attempted)
            ? `${queuedMessages.filter((message) => !message.attempted).length} message${queuedMessages.filter((message) => !message.attempted).length === 1 ? "" : "s"} will send when you are online.`
            : "A queued message could not be confirmed."}</span>
          {queuedMessages.some((message) => message.attempted) && (
            <button type="button" onClick={retryQueuedMessages} className="shrink-0 font-bold underline underline-offset-2">Retry</button>
          )}
        </div>
      )}

      {error && <div className="mx-5 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</div>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-dash-border-soft px-4 py-3">
        <input
          value={draft}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={stopTyping}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:translate-y-px disabled:opacity-60 ${isOnline ? "bg-dash-brand hover:bg-dash-brand-hover" : "bg-amber-600 hover:bg-amber-700"}`}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span className="sr-only">{isOnline ? "Send message" : "Queue message"}</span>
        </button>
      </form>
    </div>
  );
}
