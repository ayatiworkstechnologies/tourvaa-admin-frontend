"use client";

import { useCallback, useEffect, useState } from "react";
import { LuMessageSquare as MessageSquare, LuRefreshCw as RefreshCw, LuSend as Send } from "react-icons/lu";
import Loader from "@/components/ui/Loader";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { BookingConversationThread, BookingMessage, getAdminBookingConversations, replyToAdminBookingConversation } from "@/lib/api/services/messagingService";

function displayDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function displayTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Admin booking messages are split by portal role. A supplier never shares a
 * visual thread with an agent or customer, even when legacy records link them
 * to the same booking conversation row. */
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

  useMessagingSocket(
    useCallback((event) => {
      if (event.type !== "new_booking_message" || event.conversation.booking_id !== bookingId) return;
      setConversations((previous) => {
        const existing = previous.find((conversation) => conversation.id === event.conversation.id);
        if (!existing) return [{ ...event.conversation, messages: [event.message] }, ...previous];
        return previous.map((conversation) => (
          conversation.id === event.conversation.id
            ? { ...event.conversation, messages: conversation.messages.some((message) => message.id === event.message.id) ? conversation.messages : [...conversation.messages, event.message] }
            : conversation
        ));
      });
    }, [bookingId]),
  );

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

  function renderPortalColumn(
    conversation: BookingConversationThread,
    recipientRole: "supplier" | "agent" | "customer",
    threadMessages: BookingMessage[],
  ) {
    const isSupplier = recipientRole === "supplier";
    const portalLabel = isSupplier ? "Supplier" : recipientRole === "agent" ? "Agent" : "Customer";
    const participantName = isSupplier ? conversation.supplier_name : conversation.initiator_name;
    const key = `${conversation.id}:${recipientRole}`;
    const groupedMessages = [...threadMessages]
      .sort((first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime())
      .reduce<{ date: string; messages: BookingMessage[] }[]>((groups, message) => {
        const date = displayDate(message.created_at) || "Unknown date";
        const previous = groups[groups.length - 1];
        if (previous?.date === date) previous.messages.push(message);
        else groups.push({ date, messages: [message] });
        return groups;
      }, []);

    return (
      <section
        key={key}
        aria-label={`${portalLabel} conversation`}
        className="flex min-h-80 flex-col rounded-xl border border-dash-border-soft bg-dash-bg p-4"
      >
        <div className="flex items-start gap-2 border-b border-dash-border-soft pb-3">
          <MessageSquare size={14} className="mt-0.5 shrink-0 text-dash-brand" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-dash-text">{portalLabel} portal</h3>
            {participantName && <p className="truncate text-[11px] text-dash-muted">{participantName}</p>}
          </div>
        </div>

        <div className="mt-3 min-h-24 max-h-72 flex-1 space-y-3 overflow-y-auto pr-1">
          {threadMessages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-dash-border bg-white px-3 py-5 text-center text-xs text-dash-muted">
              No {portalLabel.toLowerCase()} messages yet.
            </p>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date} className="space-y-2">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="rounded-full border border-dash-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-dash-muted shadow-sm">
                    {group.date}
                  </span>
                </div>
                {group.messages.map((message) => {
                  const isAdminMessage = message.sender_role === "admin";
                  return (
                    <div key={message.id} className={`flex ${isAdminMessage ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[86%] rounded-lg px-3 py-2 shadow-[0_1px_2px_rgb(15_23_42/0.04)] ${isAdminMessage ? "bg-blue-50 text-dash-body" : "bg-white text-dash-body"}`}>
                        <div className="flex items-center justify-between gap-3 text-[10px]">
                          <span className="font-bold capitalize text-dash-text">
                            {isAdminMessage ? "Tourvaa Admin" : message.sender_name || message.sender_role}
                          </span>
                          <span className="shrink-0 text-dash-subtle">{displayTime(message.created_at)}</span>
                        </div>
                        <p className={`mt-1 whitespace-pre-wrap break-words ${isAdminMessage ? "text-xs" : "text-sm"}`}>
                          {message.is_deleted ? "This message was deleted." : message.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <form
          className="mt-3 flex items-end gap-2 border-t border-dash-border-soft pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            void reply(conversation, recipientRole);
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Reply to {portalLabel.toLowerCase()}</span>
            <textarea
              aria-label={`Message for ${portalLabel.toLowerCase()}`}
              rows={2}
              value={drafts[key] || ""}
              onChange={(event) => setDrafts((previous) => ({ ...previous, [key]: event.target.value }))}
              placeholder={`Reply to ${portalLabel.toLowerCase()}...`}
              className="block w-full resize-none rounded-lg border border-dash-border bg-white px-3 py-2 text-xs text-dash-text outline-none placeholder:text-dash-subtle focus:border-dash-brand focus:ring-2 focus:ring-dash-brand/10"
            />
          </label>
          <button
            type="submit"
            aria-label={`Reply to ${portalLabel.toLowerCase()}`}
            disabled={!drafts[key]?.trim() || sending === key}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-dash-brand px-3 py-2 text-xs font-bold text-white transition hover:bg-dash-brand-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={12} />
            {sending === key ? "Sending..." : "Reply"}
          </button>
        </form>
      </section>
    );
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

  const portalThreads = (["supplier", "agent", "customer"] as const)
    .map((role) => {
      const messages = conversations.flatMap((conversation) => conversation.messages.filter(
        (message) => message.sender_role === role || (message.sender_role === "admin" && message.recipient_role === role),
      ));
      const conversation = role === "supplier"
        ? conversations.find((item) => item.supplier_user_id != null)
        : conversations.find((item) => item.initiator_role === role);
      return conversation ? { conversation, role, messages } : null;
    })
    .filter((thread): thread is { conversation: BookingConversationThread; role: "supplier" | "agent" | "customer"; messages: BookingMessage[] } => Boolean(thread));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {portalThreads.map(({ conversation, role, messages }) => renderPortalColumn(conversation, role, messages))}
    </div>
  );
}
