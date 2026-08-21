"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuSend as Send, LuTrash2 as Trash2 } from "react-icons/lu";

import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { ChatMessage, ConversationThread, ParticipantType, deleteOwnMessage, getOwnConversation, sendOwnMessage } from "@/lib/api/services/messagingService";

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

export default function PortalMessageThread({ portal }: { portal: ParticipantType }) {
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length]);

  useMessagingSocket(
    useCallback((event) => {
      if (event.type === "new_message") {
        setThread((prev) => (prev && prev.id === event.conversation.id ? { ...event.conversation, messages: [...prev.messages, event.message] } : prev));
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
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    } catch {
      setError("Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-[#DDE7F3] bg-white shadow-[0_8px_30px_-25px_rgba(24,68,126,.6)]">
      <div className="border-b border-[#E6EDF6] px-6 py-4">
        <h2 className="font-black text-dash-text">Messages with Tourvaa support</h2>
        <p className="mt-1 text-xs text-dash-subtle">Replies from our team appear here in real time.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-dash-subtle" size={22} /></div>
        ) : thread?.messages.length === 0 ? (
          <p className="py-4 text-center text-sm text-dash-muted">No messages yet. Send one below to get started.</p>
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
                <p className={`mt-1 text-[10px] ${msg.sender_role === "admin" ? "text-dash-subtle" : "text-white/70"}`}>{timeAgo(msg.created_at)}</p>
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
