"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuSend as Send, LuTrash2 as Trash2 } from "react-icons/lu";
import Loader from "@/components/ui/Loader";

import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { requestNotificationRefresh } from "@/lib/notifications/events";
import { ChatMessage, ConversationThread, ParticipantType, deleteOwnMessage, getOwnConversation, sendOwnMessage } from "@/lib/api/services/messagingService";

function timeAgo(value?: string | null, now = Date.now()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function PortalMessageThread({ portal }: { portal: ParticipantType }) {
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOwnConversation(portal);
      setThread(data);
      setError("");
    } catch {
      setError("Could not load your messages.");
    } finally {
      setLoading(false);
    }
  }, [portal]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  useMessagingSocket(
    useCallback((event) => {
      if (event.type === "new_message") {
        if (event.message.sender_role === "admin") requestNotificationRefresh();
        setThread((prev) => {
          if (!prev || prev.id !== event.conversation.id) return prev;
          const exists = prev.messages.some((message) => message.id === event.message.id);
          return {
            ...event.conversation,
            messages: exists ? prev.messages : [...prev.messages, event.message],
          };
        });
        return;
      }
      if (event.type === "message_deleted") {
        setThread((prev) => (prev ? { ...prev, messages: prev.messages.map((m) => (m.id === event.message.id ? event.message : m)) } : prev));
      }
    }, [])
  );

  async function removeMessage(messageId: number) {
    setDeletingId(messageId);
    try {
      const updated = await deleteOwnMessage(messageId);
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
      const message: ChatMessage = await sendOwnMessage(portal, draft.trim());
      setDraft("");
      setThread((prev) => {
        if (!prev || prev.messages.some((item) => item.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
    } catch {
      setError("Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-[#DDE7F3] bg-white shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)]">
      <div className="border-b border-[#E6EDF6] px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-black text-dash-text">Conversation with Tourvaa Admin</h2>
            <p className="mt-1 text-xs text-dash-subtle">Send a message to the Tourvaa team. Replies appear here in real time.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Admin support
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {loading ? (
          <Loader label="Loading messages..." compact />
        ) : thread?.messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-dash-muted">No messages yet. Start a conversation with the Tourvaa admin team below.</p>
        ) : (
          thread?.messages.map((msg) => (
            <div key={msg.id} className={`group flex items-end gap-1.5 ${msg.sender_role === "admin" ? "justify-start" : "justify-end"}`}>
              {!msg.is_deleted && msg.sender_role !== "admin" && (
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
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender_role === "admin" ? "bg-dash-bg text-dash-text" : "bg-dash-brand text-white"} ${msg.is_deleted ? "italic opacity-70" : ""}`}>
                <p className="whitespace-pre-wrap">{msg.is_deleted ? "This message was deleted." : msg.body}</p>
                <p className={`mt-1 text-[10px] ${msg.sender_role === "admin" ? "text-dash-subtle" : "text-white/70"}`}>{timeAgo(msg.created_at, now)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="mx-6 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</div>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-[#E6EDF6] px-4 py-3">
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
