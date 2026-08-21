"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuMessageSquare as MessageSquare, LuSend as Send, LuTrash2 as Trash2 } from "react-icons/lu";

import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import {
  BookingConversation,
  BookingConversationThread,
  BookingMessage,
  deleteOwnBookingMessage,
  getSupplierBookingConversationThread,
  listSupplierBookingConversations,
  replySupplierBookingConversation,
} from "@/lib/api/services/messagingService";

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

/** Supplier's inbox of direct, per-booking threads opened by customers or
 * agents. Separate from the supplier's own admin-support thread. */
export default function SupplierBookingInbox() {
  const [conversations, setConversations] = useState<BookingConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thread, setThread] = useState<BookingConversationThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await listSupplierBookingConversations();
      setConversations(response.items || []);
    } catch {
      setError("Could not load booking messages.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openConversation = useCallback(async (conversationId: number) => {
    setSelectedId(conversationId);
    setLoadingThread(true);
    try {
      const data = await getSupplierBookingConversationThread(conversationId);
      setThread(data);
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, supplier_unread_count: 0 } : c)));
    } catch {
      setError("Could not load this conversation.");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  useMessagingSocket(
    useCallback(
      (event) => {
        if (event.type === "new_booking_message") {
          const { conversation, message } = event;
          const isOpenThread = selectedId === conversation.id;
          const displayed = isOpenThread ? { ...conversation, supplier_unread_count: 0 } : conversation;

          setConversations((prev) => {
            const exists = prev.some((c) => c.id === conversation.id);
            const next = exists ? prev.map((c) => (c.id === conversation.id ? displayed : c)) : [displayed, ...prev];
            return [...next].sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime());
          });

          setThread((prev) => (prev && prev.id === conversation.id ? { ...conversation, messages: [...prev.messages, message] } : prev));
          return;
        }
        if (event.type === "booking_message_deleted") {
          setThread((prev) => (prev && prev.id === event.conversation_id ? { ...prev, messages: prev.messages.map((m) => (m.id === event.message.id ? event.message : m)) } : prev));
        }
      },
      [selectedId]
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

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const message: BookingMessage = await replySupplierBookingConversation(selectedId, reply.trim());
      setReply("");
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    } catch {
      setError("Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      {error && <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">{error}</div>}

      <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-dash-border-soft bg-white">
        {loadingList ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-dash-subtle">
            <MessageSquare size={28} className="text-dash-subtle" />
            No messages from customers or agents yet.
          </div>
        ) : (
          <ul className="divide-y divide-[#EEF2F8]">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => openConversation(conv.id)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-[#F8FAFD] ${selectedId === conv.id ? "bg-[#F0F4FA]" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-dash-text">{conv.initiator_name || `${conv.initiator_role} #${conv.initiator_user_id}`}</span>
                    {conv.supplier_unread_count > 0 && <span className="shrink-0 rounded-full bg-dash-brand px-2 py-0.5 text-[10px] font-bold text-white">{conv.supplier_unread_count}</span>}
                  </div>
                  <span className="truncate text-xs text-dash-subtle">{conv.booking_code ? `Booking ${conv.booking_code}` : ""}{conv.tour_name ? ` — ${conv.tour_name}` : ""}</span>
                  <span className="truncate text-xs text-dash-subtle">{conv.last_message_preview || "No messages yet"}</span>
                  <span className="text-[11px] text-dash-subtle">{timeAgo(conv.last_message_at || conv.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex max-h-[70vh] flex-col rounded-2xl border border-dash-border-soft bg-white">
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-dash-subtle">
            <MessageSquare size={32} className="text-dash-subtle" />
            Select a conversation to view messages.
          </div>
        ) : loadingThread ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 size={22} className="animate-spin text-dash-subtle" /></div>
        ) : (
          <>
            <div className="border-b border-dash-border-soft px-5 py-3">
              <p className="font-bold text-dash-text">{thread?.initiator_name || `${thread?.initiator_role} #${thread?.initiator_user_id}`}</p>
              <p className="text-xs text-dash-subtle">{thread?.booking_code ? `Booking ${thread.booking_code}` : ""}{thread?.tour_name ? ` — ${thread.tour_name}` : ""}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {thread?.messages.length === 0 && <p className="text-center text-sm text-dash-subtle">No messages in this conversation yet.</p>}
              {thread?.messages.map((msg) => (
                <div key={msg.id} className={`group flex items-end gap-1.5 ${msg.sender_role === "supplier" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender_role === "supplier" ? "bg-dash-text text-white" : "bg-dash-bg text-dash-text"} ${msg.is_deleted ? "italic opacity-70" : ""}`}>
                    <p className="whitespace-pre-wrap">{msg.is_deleted ? "This message was deleted." : msg.body}</p>
                    <p className={`mt-1 text-[10px] ${msg.sender_role === "supplier" ? "text-white/60" : "text-dash-subtle"}`}>{timeAgo(msg.created_at)}</p>
                  </div>
                  {!msg.is_deleted && msg.sender_role === "supplier" && (
                    <button
                      type="button"
                      onClick={() => removeMessage(msg.id)}
                      disabled={deletingId === msg.id}
                      aria-label="Delete message"
                      title="Delete message"
                      className="mb-1 hidden h-6 w-6 items-center justify-center rounded-lg text-dash-subtle hover:bg-black/5 hover:text-red-600 group-hover:flex disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>
            <form onSubmit={sendReply} className="flex items-center gap-2 border-t border-dash-border-soft px-4 py-3">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Type a reply…"
                className="flex-1 rounded-xl border border-dash-border bg-dash-bg px-3.5 py-2.5 text-sm outline-none focus:border-dash-brand focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="flex items-center gap-2 rounded-xl bg-dash-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-dash-brand-hover disabled:opacity-60"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
