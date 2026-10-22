"use client";

import { useCallback, useEffect, useRef } from "react";
import { issueWsTicket, BookingConversation, BookingMessage, ChatMessage, Conversation } from "@/lib/api/services/messagingService";

type Envelope = { id?: string; schema_version?: "1"; occurred_at?: string };
export type MessagingSocketEvent = Envelope & (
  | { type: "new_message"; conversation: Conversation; message: ChatMessage }
  | { type: "new_booking_message"; conversation: BookingConversation; message: BookingMessage }
  | { type: "message_deleted"; conversation_id: number; message: ChatMessage }
  | { type: "booking_message_deleted"; conversation_id: number; message: BookingMessage }
  | { type: "typing"; scope: "support" | "booking"; conversation_id: number; sender_role: string; recipient_role?: string; is_typing: boolean }
  | { type: "participant_presence"; user_id: number; online: boolean }
  | { type: "admin_presence"; online: boolean }
  | { type: "new_notification"; notification_id: number }
);

const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;
const listeners = new Set<(event: MessagingSocketEvent) => void>();
let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let heartbeatTimer: number | null = null;
let retryDelay = INITIAL_RETRY_MS;
let stopped = false;

function wsBase() {
  const configured = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
  const fallback = process.env.NODE_ENV !== "production" && typeof window !== "undefined"
    ? `ws://${window.location.hostname}:8000`
    : "";
  return (configured || fallback).replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

function stopTimers() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  reconnectTimer = null;
  heartbeatTimer = null;
}

function scheduleReconnect() {
  if (stopped || reconnectTimer || !navigator.onLine || listeners.size === 0) return;
  const jitter = Math.floor(Math.random() * Math.min(500, retryDelay / 4));
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    void connect();
  }, retryDelay + jitter);
  retryDelay = Math.min(Math.round(retryDelay * 1.6), MAX_RETRY_MS);
}

async function connect() {
  if (stopped || !navigator.onLine || listeners.size === 0 || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
  const base = wsBase();
  if (!base) return;
  try {
    const ticket = await issueWsTicket();
    if (stopped || listeners.size === 0) return;
    const candidate = new WebSocket(`${base}/api/ws/messages?ticket=${encodeURIComponent(ticket)}`);
    socket = candidate;
    candidate.onopen = () => {
      retryDelay = INITIAL_RETRY_MS;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = window.setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
      }, 25_000);
    };
    candidate.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as MessagingSocketEvent;
        if (event.id && event.schema_version && event.occurred_at) listeners.forEach((listener) => listener(event));
      } catch { /* Ignore invalid frames. */ }
    };
    candidate.onclose = () => {
      if (socket === candidate) socket = null;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      scheduleReconnect();
    };
    candidate.onerror = () => candidate.close();
  } catch {
    scheduleReconnect();
  }
}

function start() {
  stopped = false;
  void connect();
}

function shutdown() {
  stopped = true;
  stopTimers();
  socket?.close();
  socket = null;
}

/** Shared authenticated connection: multiple components subscribe without
 * repeatedly minting tickets or opening duplicate WebSockets. */
export function useMessagingSocket(onMessage: (event: MessagingSocketEvent) => void) {
  const listenerRef = useRef(onMessage);
  useEffect(() => { listenerRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    const listener = (event: MessagingSocketEvent) => listenerRef.current(event);
    listeners.add(listener);
    start();
    const online = () => { retryDelay = INITIAL_RETRY_MS; void connect(); };
    const offline = () => socket?.close();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      if (listeners.size === 0) shutdown();
    };
  }, []);

  return useCallback((event: Record<string, unknown>) => {
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(event));
    return true;
  }, []);
}
