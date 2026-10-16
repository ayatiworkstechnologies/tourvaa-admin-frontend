"use client";

import { useCallback, useEffect, useRef } from "react";
import { issueWsTicket, BookingConversation, BookingMessage, ChatMessage, Conversation } from "@/lib/api/services/messagingService";

export type MessagingSocketEvent =
  | { type: "new_message"; conversation: Conversation; message: ChatMessage }
  | { type: "new_booking_message"; conversation: BookingConversation; message: BookingMessage }
  | { type: "message_deleted"; conversation_id: number; message: ChatMessage }
  | { type: "booking_message_deleted"; conversation_id: number; message: BookingMessage }
  | { type: "typing"; scope: "support" | "booking"; conversation_id: number; sender_role: string; recipient_role?: string; is_typing: boolean }
  | { type: "participant_presence"; user_id: number; online: boolean }
  | { type: "admin_presence"; online: boolean }
  | { type: "new_notification"; notification_id: number };

const INITIAL_RETRY_MS = 2000;
const MAX_RETRY_MS = 30000;

/** Connects directly to the backend's public WS origin (NEXT_PUBLIC_WS_URL) -
 * Next's rewrites() proxy doesn't reliably support WebSocket upgrades, so
 * this deliberately bypasses the same-origin /api path the rest of the app
 * uses. Auth rides on a short-lived ticket (see messagingService.issueWsTicket)
 * rather than the session cookie, since a cross-origin request wouldn't carry it. */
export function useMessagingSocket(onMessage: (event: MessagingSocketEvent) => void) {
  const onMessageRef = useRef(onMessage);
  const socketRef = useRef<WebSocket | null>(null);

  const sendEvent = useCallback((event: Record<string, unknown>) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(event));
    return true;
  }, []);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const configuredBase = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
    // Next exposes NEXT_PUBLIC_* values at dev-server startup. Falling back
    // only in local development prevents an already-running `next dev`
    // process from making every presence badge look offline just because its
    // environment file was added or changed after it started.
    const base = configuredBase || (
      process.env.NODE_ENV !== "production" && typeof window !== "undefined"
        ? `ws://${window.location.hostname}:8000`
        : ""
    );
    if (!base) {
      console.warn("Messaging is unavailable: configure NEXT_PUBLIC_WS_URL with the public backend WebSocket origin.");
      return;
    }

    let socket: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let retryDelay = INITIAL_RETRY_MS;

    const scheduleReconnect = () => {
      if (cancelled || !navigator.onLine || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connect();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 1.5, MAX_RETRY_MS);
    };

    async function connect() {
      if (cancelled) return;
      if (!navigator.onLine) return;
      let ticket: string;
      try {
        ticket = await issueWsTicket();
      } catch {
        scheduleReconnect();
        return;
      }
      if (cancelled) return;

      socket = new WebSocket(`${base}/api/ws/messages?ticket=${encodeURIComponent(ticket)}`);
      socketRef.current = socket;

      socket.onopen = () => {
        retryDelay = INITIAL_RETRY_MS;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, 25_000);
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MessagingSocketEvent;
          if (
            data.type === "new_message" ||
            data.type === "new_booking_message" ||
            data.type === "message_deleted" ||
            data.type === "booking_message_deleted" ||
            data.type === "typing" ||
            data.type === "participant_presence" ||
            data.type === "admin_presence" ||
            data.type === "new_notification"
          ) {
            onMessageRef.current(data);
          }
        } catch {
          // Ignore malformed frames.
        }
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = null;
        if (cancelled) return;
        scheduleReconnect();
      };
      socket.onerror = () => {
        socket?.close();
      };
    }

    const handleOffline = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      socket?.close();
    };
    const handleOnline = () => {
      retryDelay = INITIAL_RETRY_MS;
      if (!socket || socket.readyState === WebSocket.CLOSED) void connect();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    void connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      socket?.close();
      socketRef.current = null;
    };
  }, []);

  return sendEvent;
}
