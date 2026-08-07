"use client";

import { LuBot as Bot, LuCalendar as Calendar, LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuMessageCircle as MessageCircle, LuMinus as Minus, LuPlus as Plus, LuSend as Send, LuSparkles as Sparkles, LuX as X } from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuthContext } from "@/providers/AuthProvider";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";
import SharedDatePicker from "@/components/ui/DatePicker";

type TourCard = { id: number; title: string; duration_days?: number; price?: number | null; currency: string; cover_image?: string | null; slug: string };
type ActionData = {
  tours?: TourCard[];
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

type Message = {
  role: "user" | "assistant";
  content: string;
  action_type?: string | null;
  action_data?: ActionData | null;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi, I am the Tourvaa assistant. I can help with tours, booking steps, prices, cancellations, payments, and destinations. I can also help you book a tour directly here!",
};

const QUICK_QUESTIONS = ["Show me tour options", "How do I book a tour?", "Cancellation policy?", "How do payments work?"];

function TourCards({ tours, onSelect }: { tours: TourCard[]; onSelect: (t: TourCard) => void }) {
  const { formatCompact } = useCurrency();
  return (
    <div className="mt-2 grid gap-2">
      {tours.map(tour => (
        <div key={tour.id} className="overflow-hidden rounded-xl border border-dash-border bg-white shadow-sm">
          {tour.cover_image && (
            <Image src={mediaUrl(tour.cover_image)} alt={tour.title} width={384} height={96} unoptimized className="h-24 w-full object-cover" />
          )}
          <div className="p-3">
            <p className="text-xs font-bold text-dash-text line-clamp-1">{tour.title}</p>
            <div className="mt-1 flex items-center justify-between">
              <div>
                {tour.duration_days && <p className="text-xs text-dash-muted">{tour.duration_days} days</p>}
                {tour.price && <p className="text-xs font-bold text-[#0284C7]">{formatCompact(tour.price, tour.currency || "USD")}</p>}
              </div>
              <button type="button" onClick={() => onSelect(tour)}
                className="rounded-xl bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0369A1]">
                Book
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatDatePicker({ onSelect }: { onSelect: (date: string) => void }) {
  const [value, setValue] = useState("");
  const today = new Date().toISOString().split("T")[0];
  return (
    <div className="mt-2 rounded-xl border border-dash-border bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-bold text-dash-body">Select travel date</p>
      <div className="flex gap-2">
        <SharedDatePicker value={value} onChange={setValue} minDate={today} placeholder="Travel date" className="min-w-0 flex-1" />
        <button type="button" aria-label="Confirm date" disabled={!value} onClick={() => value && onSelect(value)}
          className="rounded-xl bg-[#0284C7] px-3 py-2 text-xs font-bold text-white hover:bg-[#0369A1] disabled:opacity-40">
          <Calendar size={14} />
        </button>
      </div>
    </div>
  );
}

function TravellerPicker({ onSelect }: { onSelect: (n: number) => void }) {
  const [count, setCount] = useState(1);
  return (
    <div className="mt-2 rounded-xl border border-dash-border bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-bold text-dash-body">Number of travellers</p>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Decrease travellers" onClick={() => setCount(c => Math.max(1, c - 1))} className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9DEE8] hover:bg-dash-bg-muted"><Minus size={14} /></button>
        <span className="w-8 text-center text-sm font-bold text-dash-text">{count}</span>
        <button type="button" aria-label="Increase travellers" onClick={() => setCount(c => Math.min(20, c + 1))} className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9DEE8] hover:bg-dash-bg-muted"><Plus size={14} /></button>
        <button type="button" aria-label="Confirm traveller count" onClick={() => onSelect(count)} className="ml-2 rounded-xl bg-[#0284C7] px-3 py-2 text-xs font-bold text-white hover:bg-[#0369A1]">Confirm</button>
      </div>
    </div>
  );
}

function BookingConfirm({ onConfirm, onCancel, disabled }: { onConfirm: () => void; onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="mt-2 rounded-xl border border-dash-border bg-white p-3 shadow-sm">
      <div className="flex gap-2">
        <button type="button" onClick={onConfirm} disabled={disabled} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
          <CheckCircle2 size={14} /> Confirm Booking
        </button>
        <button type="button" onClick={onCancel} disabled={disabled} className="flex-1 rounded-xl border border-[#D9DEE8] py-2 text-xs font-bold text-dash-muted hover:bg-dash-bg-muted disabled:opacity-50">Cancel</button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [resolvedBookingIndices, setResolvedBookingIndices] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [launcherVisible, setLauncherVisible] = useState(true);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open, messages]);

  // The launcher button is fixed to a screen corner, so on any content-heavy
  // page it inevitably drifts over whatever text/fields happen to scroll
  // underneath it. Hiding it while the user is actively scrolling (reappearing
  // once they stop, or if they scroll back up) keeps it out of the way of
  // reading/typing without making it hard to find.
  useEffect(() => {
    if (open) return;
    let lastY = window.scrollY;
    let hideTimer: number | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown) setLauncherVisible(false);
      else if (goingUp) setLauncherVisible(true);
      lastY = y;

      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setLauncherVisible(true), 600);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(hideTimer);
    };
  }, [open]);

  const sendRaw = async (text: string, displayText?: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const isCommand = trimmed.startsWith("__");
    if (!isCommand) {
      setMessages(prev => [...prev, { role: "user", content: displayText ?? trimmed }]);
    } else if (displayText) {
      setMessages(prev => [...prev, { role: "user", content: displayText }]);
    }
    setInput("");
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("tourvaa_token") : null;
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, session_key: sessionKey }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      setSessionKey(data.session_key);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        action_type: data.action_type ?? null,
        action_data: data.action_data ?? null,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I could not connect right now. Please try again, or contact Tourvaa support.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const send = (text: string) => sendRaw(text);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
  };

  const handleSelectTour = (tour: TourCard) => {
    void sendRaw(`__select_tour__:${tour.id}`, `I'd like to book: ${tour.title}`);
  };

  const handleSelectDate = (tourId: number, date: string) => {
    void sendRaw(`__select_date__:tour_id=${tourId}|date=${date}`, `Travel date: ${date}`);
  };

  const handleSelectTravellers = (tourId: number, date: string, travellers: number) => {
    void sendRaw(`__select_travellers__:tour_id=${tourId}|date=${date}|travellers=${travellers}`, `Travellers: ${travellers}`);
  };

  const handleConfirmBooking = async (data: ActionData, index: number) => {
    if (bookingLoading || resolvedBookingIndices.has(index)) return;

    if (!user) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Please log in to complete your booking. Open /login and then come back to book.",
      }]);
      return;
    }
    setBookingLoading(true);
    try {
      const res = await api.post("/customer/bookings", {
        tour_id: data.tour_id,
        tour_date: data.date,
        no_of_adults: data.travellers ?? 1,
        no_of_children: 0,
        booking_source: "customer",
        customer_notes: "Booked via AI chat assistant",
      });
      const bookingCode = res.data?.data?.booking_code || res.data?.booking_code || `#${res.data?.data?.id || res.data?.id || ""}`;
      setResolvedBookingIndices(prev => new Set(prev).add(index));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Booking confirmed! Your booking code is **${bookingCode}**. Check your customer dashboard for full details and payment instructions.`,
      }]);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? "Could not complete the booking right now. Please try again or visit the tour page to book directly.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: detail,
      }]);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = (index: number) => {
    if (resolvedBookingIndices.has(index)) return;
    setResolvedBookingIndices(prev => new Set(prev).add(index));
    setMessages(prev => [...prev, { role: "assistant", content: "Booking cancelled. Let me know if you'd like to explore other tours or need help with anything else." }]);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex max-h-[min(700px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[#D9DEE8] bg-white shadow-2xl md:right-6">
          <div className="flex items-center gap-3 bg-[#0F172A] px-5 py-4 text-white">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0284C7]"><Bot size={20} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black">Tourvaa AI Assistant</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Close chat"><X size={18} /></button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-dash-bg p-4">
            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[#0284C7]"><Bot size={15} /></div>}
                <div className={`max-w-[90%] ${msg.role === "user" ? "" : "w-full"}`}>
                  <div className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${msg.role === "user" ? "rounded-br-md bg-[#0284C7] text-white" : "rounded-bl-md border border-dash-border bg-white text-dash-text shadow-sm"}`}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.action_type === "show_tours" && msg.action_data?.tours && (
                    <TourCards tours={msg.action_data.tours} onSelect={handleSelectTour} />
                  )}
                  {msg.role === "assistant" && msg.action_type === "select_date" && msg.action_data?.tour_id && (
                    <ChatDatePicker onSelect={date => handleSelectDate(msg.action_data!.tour_id!, date)} />
                  )}
                  {msg.role === "assistant" && msg.action_type === "select_travellers" && msg.action_data?.tour_id && msg.action_data?.date && (
                    <TravellerPicker onSelect={n => handleSelectTravellers(msg.action_data!.tour_id!, msg.action_data!.date!, n)} />
                  )}
                  {msg.role === "assistant" && msg.action_type === "confirm_booking" && msg.action_data && (
                    <BookingConfirm
                      onConfirm={() => handleConfirmBooking(msg.action_data!, i)}
                      onCancel={() => handleCancelBooking(i)}
                      disabled={bookingLoading || resolvedBookingIndices.has(i)}
                    />
                  )}
                  {bookingLoading && msg.action_type === "confirm_booking" && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-dash-muted">
                      <Loader2 size={13} className="animate-spin" /> Processing booking…
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[#0284C7]"><Bot size={15} /></div>
                <div className="rounded-2xl rounded-bl-md border border-dash-border bg-white px-4 py-3 shadow-sm">
                  <span className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0284C7]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0284C7] [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#0284C7] [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 bg-dash-bg px-4 pb-3">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} type="button" onClick={() => void send(q)} className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0284C7] transition hover:bg-sky-50">
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-dash-border bg-white p-3">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} disabled={loading} placeholder="Ask about tours or bookings..." className="min-w-0 flex-1 rounded-xl border border-[#D9DEE8] bg-dash-bg px-4 py-2.5 text-sm outline-none transition focus:border-[#0284C7] focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:opacity-60" />
            <button type="button" onClick={() => void send(input)} disabled={loading || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0284C7] text-white transition hover:bg-[#0369A1] disabled:opacity-40" aria-label="Send message"><Send size={17} /></button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close chat" : "Open AI chat assistant"}
        className={`fixed bottom-3 right-3 z-50 flex h-13 w-13 items-center justify-center rounded-full shadow-2xl transition-all duration-300 sm:bottom-4 sm:right-4 sm:h-16 sm:w-16 md:right-6 ${open ? "bg-[#0F172A]" : "bg-[#0284C7] hover:scale-105 hover:bg-[#0369A1]"} ${
          open || launcherVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0"
        }`}
      >
        {open ? <X className="size-5 text-white sm:size-6" /> : <><MessageCircle className="size-[22px] text-white sm:size-[26px]" /><span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400"><Sparkles size={10} className="text-white" /></span></>}
      </button>
    </>
  );
}
