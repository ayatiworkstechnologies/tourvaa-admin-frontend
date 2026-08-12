"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuLoaderCircle as Loader2, LuMessageSquare as MessageSquare, LuSend as Send } from "react-icons/lu";

import ModuleWrapper from "@/components/common/ModuleWrapper";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import {
  ChatMessage,
  Conversation,
  ConversationThread,
  ParticipantType,
  getConversationThread,
  getUnreadSummary,
  listConversations,
  replyToConversation,
} from "@/lib/api/services/messagingService";

const TABS: { key: ParticipantType; label: string }[] = [
  { key: "agent", label: "Agents" },
  { key: "supplier", label: "Suppliers" },
  { key: "customer", label: "Customers" },
];

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

export default function AdminMessagesPage() {
  const [tab, setTab] = useState<ParticipantType>("agent");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unreadSummary, setUnreadSummary] = useState<Record<ParticipantType, number>>({ agent: 0, supplier: 0, customer: 0 });
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadUnreadSummary = useCallback(async () => {
    try {
      const summary = await getUnreadSummary();
      setUnreadSummary((prev) => ({ ...prev, ...summary }));
    } catch {
      // Non-critical - the tab badges just won't update this cycle.
    }
  }, []);

  useEffect(() => {
    void loadUnreadSummary();
  }, [loadUnreadSummary]);

  const loadList = useCallback(async (participantType: ParticipantType) => {
    setLoadingList(true);
    try {
      const response = await listConversations(participantType);
      setConversations(response.items || []);
    } catch {
      setError("Could not load conversations.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    setSelectedId(null);
    setThread(null);
    void loadList(tab);
  }, [tab, loadList]);

  const openConversation = useCallback(async (conversationId: number) => {
    setSelectedId(conversationId);
    setLoadingThread(true);
    try {
      const data = await getConversationThread(conversationId);
      setThread(data);
      setConversations((prev) => {
        const target = prev.find((c) => c.id === conversationId);
        if (target?.admin_unread_count) {
          setUnreadSummary((summary) => ({ ...summary, [target.participant_type]: Math.max(0, (summary[target.participant_type] || 0) - target.admin_unread_count) }));
        }
        return prev.map((c) => (c.id === conversationId ? { ...c, admin_unread_count: 0 } : c));
      });
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
        if (event.type !== "new_message") return;
        const { conversation, message } = event;
        const isOpenThread = selectedId === conversation.id;
        const displayedConversation = isOpenThread ? { ...conversation, admin_unread_count: 0 } : conversation;

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conversation.id);
          const next = exists ? prev.map((c) => (c.id === conversation.id ? displayedConversation : c)) : conversation.participant_type === tab ? [displayedConversation, ...prev] : prev;
          return [...next].sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime());
        });

        if (message.sender_role !== "admin" && !isOpenThread) {
          setUnreadSummary((summary) => ({ ...summary, [conversation.participant_type]: (summary[conversation.participant_type] || 0) + 1 }));
        }

        setThread((prev) => {
          if (!prev || prev.id !== conversation.id) return prev;
          return { ...conversation, messages: [...prev.messages, message] };
        });
      },
      [tab, selectedId]
    )
  );

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const message: ChatMessage = await replyToConversation(selectedId, reply.trim());
      setReply("");
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
    } catch {
      setError("Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ModuleWrapper title="Messages" requiredPermission="messages.view">
      <div className="flex gap-2 border-b border-dash-border-soft pb-3">
        {TABS.map((item) => {
          const unread = unreadSummary[item.key] || 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === item.key ? "bg-dash-text text-white" : "bg-dash-bg text-dash-muted hover:bg-[#EEF2F8]"}`}
            >
              {item.label}
              {unread > 0 && <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}
            </button>
          );
        })}
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">{error}</div>}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-dash-border-soft bg-white">
          {loadingList ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-dash-subtle">
              <MessageSquare size={28} className="text-dash-subtle" />
              No conversations yet.
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
                      <span className="truncate text-sm font-bold text-dash-text">{conv.participant_name || conv.participant_email || `User #${conv.participant_user_id}`}</span>
                      {conv.admin_unread_count > 0 && <span className="shrink-0 rounded-full bg-dash-brand px-2 py-0.5 text-[10px] font-bold text-white">{conv.admin_unread_count}</span>}
                    </div>
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
                <p className="font-bold text-dash-text">{thread?.participant_name || thread?.participant_email}</p>
                <p className="text-xs text-dash-subtle">{thread?.participant_email}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {thread?.messages.length === 0 && <p className="text-center text-sm text-dash-subtle">No messages in this conversation yet.</p>}
                {thread?.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender_role === "admin" ? "bg-dash-text text-white" : "bg-dash-bg text-dash-text"}`}>
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className={`mt-1 text-[10px] ${msg.sender_role === "admin" ? "text-white/60" : "text-dash-subtle"}`}>{timeAgo(msg.created_at)}</p>
                    </div>
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
    </ModuleWrapper>
  );
}
