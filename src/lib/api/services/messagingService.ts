import api from "@/lib/api/client";

export type ParticipantType = "agent" | "supplier" | "customer" | "affiliate";
export type SenderRole = "admin" | ParticipantType;

export type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_role: SenderRole;
  sender_user_id: number | null;
  sender_name: string | null;
  body: string;
  created_at: string;
};

export type Conversation = {
  id: number;
  participant_type: ParticipantType;
  participant_user_id: number;
  participant_name: string | null;
  participant_email: string | null;
  agent_id?: number | null;
  supplier_id?: number | null;
  customer_id?: number | null;
  affiliate_id?: number | null;
  status: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  admin_unread_count: number;
  participant_unread_count: number;
  created_at: string;
};

export type ConversationThread = Conversation & { messages: ChatMessage[] };

export async function listConversations(type: ParticipantType, page = 1, limit = 30) {
  const response = await api.get("/admin/messages/conversations", { params: { type, page, limit } });
  return response.data as { items: Conversation[]; total: number; page: number; limit: number };
}

export async function getConversationThread(conversationId: number) {
  const response = await api.get(`/admin/messages/conversations/${conversationId}`);
  return response.data?.data as ConversationThread;
}

export async function replyToConversation(conversationId: number, body: string) {
  const response = await api.post(`/admin/messages/conversations/${conversationId}/messages`, { body });
  return response.data?.data as ChatMessage;
}

export async function getUnreadSummary() {
  const response = await api.get("/admin/messages/unread-summary");
  return response.data?.data as Record<ParticipantType, number>;
}

const OWN_MESSAGES_PATH: Record<ParticipantType, string> = {
  customer: "/customer/messages",
  supplier: "/supplier/messages",
  agent: "/agent/messages",
  affiliate: "/affiliate/messages",
};

export async function getOwnConversation(portal: ParticipantType) {
  const response = await api.get(OWN_MESSAGES_PATH[portal]);
  return response.data?.data as ConversationThread;
}

export async function sendOwnMessage(portal: ParticipantType, body: string) {
  const response = await api.post(OWN_MESSAGES_PATH[portal], { message: body });
  return response.data?.data as ChatMessage;
}

export async function issueWsTicket() {
  const response = await api.post("/messages/ws-ticket");
  return response.data?.data?.ticket as string;
}

// --- Booking-scoped direct messaging: customer/agent <-> supplier --------

export type BookingSenderRole = "customer" | "agent" | "supplier";

export type BookingMessage = {
  id: number;
  conversation_id: number;
  sender_role: BookingSenderRole;
  sender_user_id: number | null;
  sender_name: string | null;
  body: string;
  created_at: string;
};

export type BookingConversation = {
  id: number;
  booking_id: number;
  booking_code: string | null;
  tour_name: string | null;
  initiator_role: "customer" | "agent";
  initiator_user_id: number;
  initiator_name: string | null;
  supplier_user_id: number;
  supplier_name: string | null;
  status: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  initiator_unread_count: number;
  supplier_unread_count: number;
  created_at: string;
};

export type BookingConversationThread = BookingConversation & { messages: BookingMessage[] };

/** For the customer/agent side: fetches (and lazily creates) their thread
 * with the supplier on a given booking. */
export async function getBookingConversation(bookingId: number) {
  const response = await api.get(`/bookings/${bookingId}/conversation`);
  return response.data?.data as BookingConversationThread;
}

export async function sendBookingConversationMessage(bookingId: number, body: string) {
  const response = await api.post(`/bookings/${bookingId}/conversation/messages`, { body });
  return response.data?.data as BookingMessage;
}

/** For the supplier side: their unified inbox of booking threads opened by
 * customers/agents across all their bookings. */
export async function listSupplierBookingConversations(page = 1, limit = 30) {
  const response = await api.get("/supplier/booking-messages", { params: { page, limit } });
  return response.data as { items: BookingConversation[]; total: number; page: number; limit: number };
}

export async function getSupplierBookingConversationThread(conversationId: number) {
  const response = await api.get(`/supplier/booking-messages/${conversationId}`);
  return response.data?.data as BookingConversationThread;
}

export async function replySupplierBookingConversation(conversationId: number, body: string) {
  const response = await api.post(`/supplier/booking-messages/${conversationId}/messages`, { body });
  return response.data?.data as BookingMessage;
}

export async function getSupplierBookingUnreadCount() {
  const response = await api.get("/supplier/booking-messages/unread-count");
  return (response.data?.data?.unread as number) ?? 0;
}
