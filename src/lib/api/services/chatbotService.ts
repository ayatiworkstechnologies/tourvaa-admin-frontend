import api from "@/lib/api/client";

const CHAT_ENDPOINT = "/api/chatbot/chat";

export class ChatbotRateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Rate limit reached. Please wait before sending another message.");
    this.name = "ChatbotRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type ChatActionData = {
  tours?: { id: number; title: string; duration_days?: number; price?: number | null; currency: string; cover_image?: string | null; slug: string }[];
  tour_id?: number;
  tour_title?: string;
  date?: string;
  duration_days?: number;
  price?: number | null;
  price_per_person?: number | null;
  travellers?: number;
  total_price?: number | null;
  currency?: string;
};

export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; session_key: string; action_type?: string | null; action_data?: ChatActionData | null; message_id?: number | null };

/**
 * Streams a chatbot reply over SSE. Kept on native fetch (not axios) because
 * ReadableStream consumption in the browser needs it, but centralized here so
 * the endpoint path, credentials, and 429/error handling live in one place
 * instead of being inlined in the widget component.
 */
export async function streamChat(
  message: string,
  sessionKey: string | null,
  pageUrl: string | null,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_key: sessionKey, page_url: pageUrl }),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new ChatbotRateLimitError(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
  }
  if (!res.ok || !res.body) {
    throw new Error("Chat request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const line = frame.split("\n").find(l => l.startsWith("data: "));
      if (!line) continue;
      onEvent(JSON.parse(line.slice(6)) as ChatStreamEvent);
    }
  }
}

export async function submitChatFeedback(messageId: number, rating: 1 | -1, comment?: string) {
  await api.post("/chatbot/feedback", { message_id: messageId, rating, comment });
}
