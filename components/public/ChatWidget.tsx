"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm the Tourvaa AI assistant. 👋 I can help you with tour details, pricing, destinations, booking policies, and more. What would you like to know?",
};

const QUICK_QUESTIONS = [
  "How do I book a tour?",
  "What's included?",
  "Cancellation policy?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, session_key: sessionKey }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setSessionKey(data.session_key);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="chat-panel fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="chat-header flex items-center gap-3 px-5 py-4 text-white flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">Tourvaa AI Assistant</div>
              <div className="chat-online-label text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Online · Replies instantly
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="chat-close-btn w-8 h-8 rounded-full flex items-center justify-center transition-colors text-white"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-3 bg-gray-50 chat-body">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <span className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (only shown before first user message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 bg-gray-50 flex gap-2 flex-wrap flex-shrink-0">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-white border border-blue-200 text-blue-600 rounded-full px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3 flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
              placeholder="Ask anything about your trip..."
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="chat-send-btn w-10 h-10 rounded-2xl flex items-center justify-center text-white transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Send"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open AI chat assistant"}
        className={`chat-fab fixed bottom-4 right-4 md:right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open ? "chat-fab-open" : "chat-fab-closed hover:scale-110"
        }`}
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="chat-fab-dot absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white animate-pulse" />
          </>
        )}
      </button>
    </>
  );
}
