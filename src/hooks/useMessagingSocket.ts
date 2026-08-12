"use client";

import { useEffect, useRef } from "react";
import { issueWsTicket, BookingConversation, BookingMessage, ChatMessage, Conversation } from "@/lib/api/services/messagingService";

export type MessagingSocketEvent =
  | { type: "new_message"; conversation: Conversation; message: ChatMessage }
  | { type: "new_booking_message"; conversation: BookingConversation; message: BookingMessage };

const INITIAL_RETRY_MS = 2000;
const MAX_RETRY_MS = 30000;

/** Connects directly to the backend's public WS origin (NEXT_PUBLIC_WS_URL) -
 * Next's rewrites() proxy doesn't reliably support WebSocket upgrades, so
 * this deliberately bypasses the same-origin /api path the rest of the app
 * uses. Auth rides on a short-lived ticket (see messagingService.issueWsTicket)
 * rather than the session cookie, since a cross-origin request wouldn't carry it. */
export function useMessagingSocket(onMessage: (event: MessagingSocketEvent) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
    if (!base) return;

    let socket: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = INITIAL_RETRY_MS;

    async function connect() {
      if (cancelled) return;
      let ticket: string;
      try {
        ticket = await issueWsTicket();
      } catch {
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, MAX_RETRY_MS);
        return;
      }
      if (cancelled) return;

      socket = new WebSocket(`${base}/api/ws/messages?ticket=${encodeURIComponent(ticket)}`);

      socket.onopen = () => {
        retryDelay = INITIAL_RETRY_MS;
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MessagingSocketEvent;
          if (data.type === "new_message" || data.type === "new_booking_message") onMessageRef.current(data);
        } catch {
          // Ignore malformed frames.
        }
      };
      socket.onclose = () => {
        if (cancelled) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, MAX_RETRY_MS);
      };
      socket.onerror = () => {
        socket?.close();
      };
    }

    void connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);
}
