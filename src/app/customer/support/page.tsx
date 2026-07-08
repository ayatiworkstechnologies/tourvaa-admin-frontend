"use client";

import { useEffect, useState, useCallback } from "react";
import { LuCircleCheckBig as CheckCircle2, LuHeadphones as Headphones, LuLoaderCircle as Loader2, LuMail as Mail, LuMessageSquare as MessageSquare, LuPhone as Phone, LuSend as Send } from "react-icons/lu";
import api from "@/lib/api/client";

type SupportMessage = {
  id: number;
  subject: string;
  message: string;
  message_type: string;
  created_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerSupportPage() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<SupportMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/customer/messages");
      setHistory(res.data?.items ?? res.data?.data ?? []);
    } catch {
      // Non-fatal — the contact form still works even if history fails to load.
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    setError("");
    try {
      await api.post("/customer/messages", form);
      setSent(true);
      setForm({ subject: "", message: "" });
      loadHistory();
    } catch {
      setError("Failed to send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Hero header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 to-sky-700 p-7 text-white shadow-xl shadow-sky-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/20 sm:flex">
            <Headphones size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Support</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-sky-100">
              Get help with your bookings, payments, or any other queries.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column: contact form + message history */}
        <div className="space-y-6">
        {/* Contact form */}
        <div className="rounded-2xl border border-transparent bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-5 font-black text-dash-text">Send us a message</h2>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <p className="mt-4 text-lg font-black text-dash-text">Message sent!</p>
              <p className="mt-1 text-sm text-dash-muted">
                Our team will get back to you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 rounded-xl border border-dash-border px-4 py-2 text-sm font-bold text-dash-body hover:bg-[#F3F8FC] transition-all"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-body">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Booking query, Refund request, Tour information"
                  className="w-full rounded-xl border border-dash-border bg-white px-4 py-3 text-sm text-dash-body outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10 transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-body">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue or question in detail. Include your booking reference number if relevant."
                  className="w-full resize-none rounded-xl border border-dash-border bg-white px-4 py-3 text-sm text-dash-body outline-none focus:border-dash-brand focus:ring-4 focus:ring-dash-brand/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-dash-brand py-3 text-sm font-bold text-white hover:bg-[#2899f0] disabled:opacity-60 transition-all"
              >
                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Message history */}
        <div className="rounded-2xl border border-transparent bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-5 font-black text-dash-text">Your messages</h2>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-dash-subtle" size={24} />
            </div>
          ) : history.length === 0 ? (
            <p className="py-4 text-sm text-dash-muted">You haven&apos;t sent any messages yet.</p>
          ) : (
            <ul className="divide-y divide-[#F0F2F5]">
              {history.map((item) => (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-dash-text">{item.subject}</p>
                    <span className="shrink-0 text-xs text-dash-subtle">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-transparent bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 font-black text-dash-text">Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FF]">
                  <Mail size={18} className="text-dash-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Email</p>
                  <p className="mt-0.5 text-sm font-semibold text-dash-text">support@tourvaa.com</p>
                  <p className="mt-0.5 text-xs text-dash-subtle">Response within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FF]">
                  <Phone size={18} className="text-dash-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Phone</p>
                  <p className="mt-0.5 text-sm font-semibold text-dash-text">+971 4 XXX XXXX</p>
                  <p className="mt-0.5 text-xs text-dash-subtle">Mon–Fri, 9am–6pm GST</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FF]">
                  <MessageSquare size={18} className="text-dash-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dash-muted">Live Chat</p>
                  <p className="mt-0.5 text-sm font-semibold text-dash-text">Available on website</p>
                  <p className="mt-0.5 text-xs text-dash-subtle">During business hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-transparent bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-3 font-black text-dash-text">Common Issues</h3>
            <ul className="space-y-2 text-sm text-dash-muted">
              {[
                "How to modify or cancel a booking",
                "Refund status and timelines",
                "Travel insurance queries",
                "Special dietary requirements",
                "Visa and documentation help",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-dash-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
