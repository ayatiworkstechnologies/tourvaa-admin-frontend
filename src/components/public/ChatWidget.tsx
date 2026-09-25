"use client";

import {
  LuArrowRight as ArrowRight,
  LuBot as Bot,
  LuCalendar as Calendar,
  LuCircleCheckBig as CheckCircle2,
  LuClock as Clock,
  LuCompass as Compass,
  LuCreditCard as CreditCard,
  LuLoaderCircle as Loader2,
  LuMinus as Minus,
  LuPlus as Plus,
  LuSend as Send,
  LuShieldCheck as ShieldCheck,
  LuSparkles as Sparkles,
  LuTag as Tag,
  LuThumbsDown as ThumbsDown,
  LuThumbsUp as ThumbsUp,
  LuUser as User,
  LuUsers as Users,
  LuX as X,
} from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuthContext } from "@/providers/AuthProvider";
import api from "@/lib/api/client";
import {
  streamChat,
  submitChatFeedback,
  ChatbotRateLimitError,
  type ChatActionData,
} from "@/lib/api/services/chatbotService";
import { mediaUrl } from "@/lib/utils/mediaUrl";
import { useCurrency } from "@/hooks/useCurrency";
import SharedDatePicker from "@/components/ui/DatePicker";
import { todayLocalDateStr } from "@/lib/utils/date";

type TourCard = NonNullable<ChatActionData["tours"]>[number];
type ActionData = ChatActionData;

type Message = {
  role: "user" | "assistant";
  content: string;
  action_type?: string | null;
  action_data?: ActionData | null;
  message_id?: number | null;
  feedback?: 1 | -1 | null;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hello! I am Scout, your Tourvaa AI concierge. I can recommend top-rated tours, check live availability, explain cancellation rules, and help you book your adventure directly here.",
};

const QUICK_QUESTIONS = [
  {
    text: "Show me trending tours",
    icon: Compass,
    badgeBg: "bg-amber-50 text-amber-600 border-amber-200/80",
  },
  {
    text: "How do I book a tour?",
    icon: Calendar,
    badgeBg: "bg-sky-50 text-sky-600 border-sky-200/80",
  },
  {
    text: "Cancellation policy?",
    icon: ShieldCheck,
    badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
  },
  {
    text: "Available payment methods?",
    icon: CreditCard,
    badgeBg: "bg-violet-50 text-violet-600 border-violet-200/80",
  },
];

function TourCards({
  tours,
  onSelect,
}: {
  tours: TourCard[];
  onSelect: (t: TourCard) => void;
}) {
  const { formatCompact } = useCurrency();
  return (
    <div className="mt-2.5 grid gap-2">
      {tours.map((tour) => (
        <div
          key={tour.id}
          className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition hover:border-sky-300 hover:shadow-xs"
        >
          {tour.cover_image && (
            <div className="relative h-24 w-full overflow-hidden bg-slate-100">
              <Image
                src={mediaUrl(tour.cover_image)}
                alt={tour.title}
                width={384}
                height={96}
                unoptimized
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {tour.duration_days && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/65 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white border border-white/20">
                  <Clock size={10} className="text-sky-300 shrink-0" />
                  <span>{tour.duration_days} days</span>
                </span>
              )}
            </div>
          )}
          <div className="p-3">
            <p className="text-xs font-bold text-slate-900 line-clamp-1 font-heading">
              {tour.title}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold">
                  <Tag size={9} className="text-slate-400" />
                  <span>Starting from</span>
                </span>
                {tour.price ? (
                  <p className="text-xs font-black text-pub-secondary">
                    {formatCompact(tour.price, tour.currency || "USD")}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-slate-500">On request</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSelect(tour)}
                className="group/btn inline-flex items-center gap-1 rounded-xl bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-pub-secondary transition cursor-pointer"
              >
                <span>Book</span>
                <ArrowRight size={11} className="group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatDatePicker({ onSelect, availableDates }: { onSelect: (date: string) => void; availableDates: string[] }) {
  const [value, setValue] = useState("");
  const today = todayLocalDateStr();
  return (
    <div className="mt-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
      <p className="mb-2 text-xs font-bold text-slate-900 flex items-center gap-1.5">
        <Calendar size={13} className="text-pub-secondary shrink-0" />
        <span>Select an available departure date</span>
      </p>
      <div className="flex gap-2">
        <SharedDatePicker
          value={value}
          onChange={setValue}
          minDate={today}
          availableDates={availableDates}
          restrictToAvailableDates
          placeholder="Choose an available date"
          className="min-w-0 flex-1"
        />
        <button
          type="button"
          aria-label="Confirm date"
          disabled={!value}
          onClick={() => value && onSelect(value)}
          className="rounded-xl bg-[#0B1F3A] px-3.5 py-2 text-xs font-bold text-white hover:bg-pub-secondary disabled:opacity-40 transition cursor-pointer"
        >
          <Calendar size={14} />
        </button>
      </div>
    </div>
  );
}

function TravellerPicker({ onSelect }: { onSelect: (n: number) => void }) {
  const [count, setCount] = useState(1);
  return (
    <div className="mt-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
      <p className="mb-2 text-xs font-bold text-slate-900 flex items-center gap-1.5">
        <Users size={13} className="text-pub-secondary shrink-0" />
        <span>Number of travellers</span>
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease travellers"
          onClick={() => setCount((c) => Math.max(1, c - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
        >
          <Minus size={13} className="stroke-[2.5]" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-slate-900">
          {count}
        </span>
        <button
          type="button"
          aria-label="Increase travellers"
          onClick={() => setCount((c) => Math.min(20, c + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
        >
          <Plus size={13} className="stroke-[2.5]" />
        </button>
        <button
          type="button"
          aria-label="Confirm traveller count"
          onClick={() => onSelect(count)}
          className="ml-auto inline-flex items-center gap-1 rounded-xl bg-[#0B1F3A] px-3.5 py-2 text-xs font-bold text-white hover:bg-pub-secondary transition cursor-pointer"
        >
          <CheckCircle2 size={13} />
          <span>Confirm</span>
        </button>
      </div>
    </div>
  );
}

function BookingConfirm({
  onConfirm,
  onCancel,
  disabled,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-2xs transition cursor-pointer"
        >
          <CheckCircle2 size={14} /> Confirm Booking
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1 flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
        >
          <X size={13} />
          <span>Cancel</span>
        </button>
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
  const [resolvedBookingIndices, setResolvedBookingIndices] = useState<Set<number>>(
    new Set()
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [launcherVisible, setLauncherVisible] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(
      () => setCooldownSeconds((s) => Math.max(0, s - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    const handleOpenChat = () => setOpen(true);
    window.addEventListener("tourvaa:open-chat", handleOpenChat);
    return () => window.removeEventListener("tourvaa:open-chat", handleOpenChat);
  }, []);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open, messages]);

  useEffect(() => {
    if (open) return;
    let lastY = window.scrollY;
    let hideTimer: number | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY + 6;
      const goingUp = y < lastY - 6;
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
    if (!trimmed || loading || cooldownSeconds > 0) return;

    const isCommand = trimmed.startsWith("__");
    if (!isCommand) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: displayText ?? trimmed },
      ]);
    } else if (displayText) {
      setMessages((prev) => [...prev, { role: "user", content: displayText }]);
    }
    setInput("");
    setLoading(true);

    let assistantStarted = false;

    const appendDelta = (delta: string) => {
      if (!assistantStarted) {
        assistantStarted = true;
        setLoading(false);
        setMessages((prev) => [...prev, { role: "assistant", content: delta }]);
      } else {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + delta };
          return next;
        });
      }
    };

    try {
      await streamChat(
        trimmed,
        sessionKey,
        window.location.pathname,
        (event) => {
          if (event.type === "delta") {
            appendDelta(event.text);
          } else if (event.type === "done") {
            setSessionKey(event.session_key);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                action_type: event.action_type ?? null,
                action_data: event.action_data ?? null,
                message_id: event.message_id ?? null,
              };
              return next;
            });
          }
        }
      );

      if (!assistantStarted) throw new Error("Empty response");
    } catch (err) {
      if (err instanceof ChatbotRateLimitError) {
        setCooldownSeconds(err.retryAfterSeconds);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `You're sending messages quickly. Please wait ${err.retryAfterSeconds}s before trying again.`,
          },
        ]);
      } else if (!assistantStarted) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I could not connect right now. Please try again, or check the Tourvaa Contact desk.",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const send = (text: string) => sendRaw(text);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const handleSelectTour = (tour: TourCard) => {
    void sendRaw(`__select_tour__:${tour.id}`, `I'd like to book: ${tour.title}`);
  };

  const handleSelectDate = (tourId: number, date: string) => {
    void sendRaw(
      `__select_date__:tour_id=${tourId}|date=${date}`,
      `Travel date: ${date}`
    );
  };

  const handleSelectTravellers = (
    tourId: number,
    date: string,
    travellers: number
  ) => {
    void sendRaw(
      `__select_travellers__:tour_id=${tourId}|date=${date}|travellers=${travellers}`,
      `Travellers: ${travellers}`
    );
  };

  const handleConfirmBooking = async (data: ActionData, index: number) => {
    if (bookingLoading || resolvedBookingIndices.has(index)) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Please log in to your account to confirm your booking. Open /login and then return to complete your reservation.",
        },
      ]);
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
        customer_notes: "Booked via Scout AI assistant",
      });
      const bookingCode =
        res.data?.data?.booking_code ||
        res.data?.booking_code ||
        `#${res.data?.data?.id || res.data?.id || ""}`;
      setResolvedBookingIndices((prev) => new Set(prev).add(index));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Booking successfully created! Your confirmation reference is **${bookingCode}**. Check your customer dashboard for vouchers and trip details.`,
        },
      ]);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ??
        "Could not complete the booking right now. Please try again or visit the tour page to book directly.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: detail,
        },
      ]);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = (index: number) => {
    if (resolvedBookingIndices.has(index)) return;
    setResolvedBookingIndices((prev) => new Set(prev).add(index));
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Booking cancelled. Let me know if you'd like to explore other destinations or need help with anything else.",
      },
    ]);
  };

  const handleFeedback = (index: number, messageId: number, rating: 1 | -1) => {
    setMessages((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current.feedback === rating) return prev;
      next[index] = { ...current, feedback: rating };
      return next;
    });
    void submitChatFeedback(messageId, rating).catch(() => {
      setMessages((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], feedback: null };
        return next;
      });
    });
  };

  // Suppress floating chat widget in embedded iframes (e.g. CMS live preview)
  if (typeof window !== "undefined" && window.self !== window.top) {
    return null;
  }

  return (
    <>
      {/* ── Chat Dialog Modal Window ── */}
      {open && (
        <div className="fixed bottom-22 sm:bottom-24 right-3 sm:right-6 z-50 flex max-h-[min(680px,calc(100vh-6.5rem))] w-[calc(100vw-1.5rem)] max-w-[390px] flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_20px_60px_-15px_rgba(11,31,58,0.3)] animate-in fade-in slide-in-from-bottom-5 duration-200 md:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#0B1F3A] via-[#102A4E] to-[#0B1F3A] px-5 py-4 text-white shadow-xs">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#146EF5] via-[#1056c7] to-sky-400 text-white shadow-sm ring-2 ring-white/20">
              <Bot size={20} className="stroke-[2.2]" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0B1F3A] bg-emerald-400 ring-1 ring-emerald-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white font-heading">
                  Scout
                </span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-sky-200 backdrop-blur-xs">
                  AI Concierge
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online • Instant Booking Support</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
              aria-label="Close chat"
            >
              <X size={18} className="stroke-[2.2]" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0B1F3A] via-[#102A4E] to-sky-700 text-white shadow-2xs ring-1 ring-white/10">
                    <Bot size={13} className="text-sky-300 stroke-[2.2]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] ${msg.role === "user" ? "" : "w-full"}`}
                >
                  <div
                    className={`whitespace-pre-wrap px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#0B1F3A] to-pub-secondary text-white shadow-2xs font-medium"
                        : "rounded-2xl rounded-tl-xs border border-slate-200/80 bg-white text-slate-800 shadow-2xs"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.role === "assistant" &&
                    msg.action_type === "show_tours" &&
                    msg.action_data?.tours && (
                      <TourCards
                        tours={msg.action_data.tours}
                        onSelect={handleSelectTour}
                      />
                    )}
                  {msg.role === "assistant" &&
                    msg.action_type === "select_date" &&
                    msg.action_data?.tour_id && (
                      <ChatDatePicker
                        availableDates={(msg.action_data.available_dates ?? []).map((d) => d.date)}
                        onSelect={(date) =>
                          handleSelectDate(msg.action_data!.tour_id!, date)
                        }
                      />
                    )}
                  {msg.role === "assistant" &&
                    msg.action_type === "select_travellers" &&
                    msg.action_data?.tour_id &&
                    msg.action_data?.date && (
                      <TravellerPicker
                        onSelect={(n) =>
                          handleSelectTravellers(
                            msg.action_data!.tour_id!,
                            msg.action_data!.date!,
                            n
                          )
                        }
                      />
                    )}
                  {msg.role === "assistant" &&
                    msg.action_type === "confirm_booking" &&
                    msg.action_data && (
                      <BookingConfirm
                        onConfirm={() =>
                          handleConfirmBooking(msg.action_data!, i)
                        }
                        onCancel={() => handleCancelBooking(i)}
                        disabled={
                          bookingLoading || resolvedBookingIndices.has(i)
                        }
                      />
                    )}
                  {bookingLoading && msg.action_type === "confirm_booking" && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 size={13} className="animate-spin text-pub-secondary" />
                      <span>Confirming your reservation with operator…</span>
                    </div>
                  )}
                  {msg.role === "assistant" && msg.message_id != null && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Helpful"
                        onClick={() => handleFeedback(i, msg.message_id!, 1)}
                        className={`rounded-lg p-1.5 transition cursor-pointer ${
                          msg.feedback === 1
                            ? "bg-emerald-50 text-emerald-600"
                            : "text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Not helpful"
                        onClick={() => handleFeedback(i, msg.message_id!, -1)}
                        className={`rounded-lg p-1.5 transition cursor-pointer ${
                          msg.feedback === -1
                            ? "bg-red-50 text-red-600"
                            : "text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shadow-2xs">
                    <User size={13} className="stroke-[2.2]" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0B1F3A] to-sky-700 text-white">
                  <Bot size={13} className="text-sky-300 stroke-[2.2] animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
                  <span className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-pub-secondary" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-pub-secondary [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-pub-secondary [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts (Only on initial load) */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 bg-[#F8FAFC] px-4 pb-3 border-t border-slate-100/60 pt-2.5">
              {QUICK_QUESTIONS.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.text}
                    type="button"
                    onClick={() => void send(q.text)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-950 cursor-pointer"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${q.badgeBg} shrink-0 transition group-hover:scale-110`}
                    >
                      <Icon size={11} className="stroke-[2.2]" />
                    </span>
                    <span>{q.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-slate-200/80 bg-white p-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3 text-slate-400 pointer-events-none">
                  <Sparkles size={14} className="text-pub-secondary/70" />
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  disabled={loading || cooldownSeconds > 0}
                  placeholder={
                    cooldownSeconds > 0
                      ? `Please wait ${cooldownSeconds}s...`
                      : "Ask Scout anything about tours..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm outline-none transition focus:border-pub-secondary focus:bg-white focus:ring-2 focus:ring-pub-secondary/15 disabled:opacity-60"
                />
              </div>
              <button
                type="button"
                onClick={() => void send(input)}
                disabled={loading || cooldownSeconds > 0 || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0B1F3A] to-pub-secondary text-white shadow-xs transition hover:brightness-110 disabled:opacity-40 cursor-pointer"
                aria-label="Send message"
              >
                <Send size={15} className="stroke-[2.2] translate-x-[-0.5px]" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
              <span>Powered by Tourvaa Concierge AI • 24/7 Traveler Guidance</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Elevated Floating Launcher Button ── */}
      <div
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 transition-all duration-300 sm:bottom-6 sm:right-6 ${
          open || launcherVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-20 opacity-0"
        }`}
      >
        {/* Floating invitation pill (shows when closed) */}
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-sky-300 cursor-pointer group"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#146EF5] to-sky-400 text-white shadow-2xs">
              <Bot size={12} className="stroke-[2.5]" />
            </span>
            <span>Chat with Scout AI</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        )}

        {/* Circular Interactive Button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open AI chat assistant"}
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_30px_-4px_rgba(20,110,245,0.4)] transition-all duration-300 sm:h-15 sm:w-15 cursor-pointer hover:scale-105 hover:shadow-[0_12px_36px_-2px_rgba(20,110,245,0.55)] ${
            open
              ? "bg-[#0B1F3A] rotate-90"
              : "bg-gradient-to-tr from-[#0B1F3A] via-[#102A4E] to-[#146EF5]"
          }`}
        >
          {/* Ambient pulsing outer glow ring */}
          {!open && (
            <span className="absolute -inset-1 rounded-full bg-sky-400/25 animate-pulse -z-10" />
          )}

          {open ? (
            <X className="size-6 text-white stroke-[2.5]" />
          ) : (
            <>
              <Bot className="size-7 text-white transition-transform group-hover:scale-110 stroke-[2.2]" />
              {/* Sparkling AI Badge in top right */}
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-emerald-400 to-teal-500 text-white shadow-md">
                <Sparkles size={11} className="text-white animate-pulse" />
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
