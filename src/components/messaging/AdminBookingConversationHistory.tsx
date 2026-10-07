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

  function renderPortalColumn(
    conversation: BookingConversationThread,
    recipientRole: "supplier" | "agent" | "customer",
  ) {
    const isSupplier = recipientRole === "supplier";
    const portalLabel = isSupplier ? "Supplier" : recipientRole === "agent" ? "Agent" : "Customer";
    const participantName = isSupplier ? conversation.supplier_name : conversation.initiator_name;
    const key = `${conversation.id}:${recipientRole}`;
    const messages = conversation.messages.filter(
      (message) =>
        message.sender_role === recipientRole ||
        (message.sender_role === "admin" && message.recipient_role === recipientRole),
    );

    return (
      <section
        key={key}
        aria-label={`${portalLabel} conversation`}
        className="flex min-h-72 flex-col rounded-xl border border-dash-border-soft bg-dash-bg p-4"
      >
        <div className="flex items-start gap-2 border-b border-dash-border-soft pb-3">
          <MessageSquare size={14} className="mt-0.5 shrink-0 text-dash-brand" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-dash-text">{portalLabel} portal</h3>
            {participantName && <p className="truncate text-[11px] text-dash-muted">{participantName}</p>}
          </div>
        </div>

        <div className="mt-3 min-h-24 flex-1 space-y-2">
          {messages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-dash-border bg-white px-3 py-5 text-center text-xs text-dash-muted">
              No {portalLabel.toLowerCase()} messages yet.
            </p>
          ) : (
            messages.map((message: BookingMessage) => (
              <div key={message.id} className="rounded-lg bg-white px-3 py-2.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
                <div className="flex justify-between gap-2 text-[11px]">
                  <span className="font-bold capitalize text-dash-text">
                    {message.sender_role === "admin" ? "Tourvaa Admin" : message.sender_name || message.sender_role}
                  </span>
                  <span className="shrink-0 text-dash-subtle">{displayTime(message.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-dash-body">
                  {message.is_deleted ? "This message was deleted." : message.body}
                </p>
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

  return (
    <div className="space-y-5">
      {conversations.map((conversation) => (
        <div key={conversation.id} className="grid gap-4 md:grid-cols-2">
          {renderPortalColumn(conversation, "supplier")}
          {renderPortalColumn(conversation, conversation.initiator_role)}
        </div>
      ))}
    </div>
  );
}
