"use client";

import { useCallback, useEffect, useState } from "react";
import { LuCircleAlert as AlertCircle, LuCircleCheckBig as CheckCircle2, LuLoaderCircle as Loader2, LuMail as Mail, LuMessageSquare as MessageSquare, LuPlus as Plus, LuSend as Send } from "react-icons/lu";
import api from "@/lib/api/client";

type SupplierMessage = {
  id: number;
  subject?: string;
  message: string;
  email_status?: string;
  created_at?: string;
};

function dateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function SupplierMessagesPage() {
  const [messages, setMessages] = useState<SupplierMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/supplier/messages", { params: { limit: 50 } });
      setMessages(response.data?.items ?? response.data?.data ?? []);
    } catch {
      setError("Failed to load your messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      await api.post("/supplier/messages", {
        subject: subject.trim() || "Supplier Support Request",
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      setShowCompose(false);
      setSent(true);
      await load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-xl shadow-emerald-200/60 md:p-9">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">Messages</h1>
            <p className="mt-2 max-w-md text-sm font-medium text-emerald-100">Contact the Tourvaa operations team and track your sent requests.</p>
          </div>
          <button type="button" onClick={() => { setShowCompose((value) => !value); setSent(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50">
            <Plus size={16} /> New Message
          </button>
        </div>
      </div>

      {sent && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> Message sent to the Tourvaa team.</div>}
      {error && <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"><span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span><button type="button" onClick={load} className="text-xs font-bold underline">Retry</button></div>}

      {showCompose && (
        <form onSubmit={sendMessage} className="mb-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <div><h2 className="font-black text-dash-text">New support message</h2><p className="mt-1 text-sm text-dash-muted">For a specific booking, include its booking code in the subject.</p></div>
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-muted">Subject</label><input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} placeholder="How can we help?" className="w-full rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></div>
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dash-muted">Message *</label><textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows={5} placeholder="Describe your question or issue..." className="w-full resize-none rounded-xl border border-dash-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></div>
          <div className="flex gap-3"><button type="submit" disabled={sending || !message.trim()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{sending ? "Sending..." : "Send Message"}</button><button type="button" onClick={() => setShowCompose(false)} className="rounded-xl border border-dash-border bg-white px-4 py-2.5 text-sm font-bold text-dash-body">Cancel</button></div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-dash-border bg-white" />)}</div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dash-border bg-white py-16 text-center"><MessageSquare size={34} className="text-emerald-300" /><h2 className="mt-4 font-bold text-dash-text">No messages yet</h2><p className="mt-1 text-sm text-dash-muted">Your messages to Tourvaa operations will appear here.</p></div>
      ) : (
        <div className="space-y-3">{messages.map((item) => <article key={item.id} className="rounded-2xl border border-dash-border bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Mail size={18} /></div><div><h2 className="font-bold text-dash-text">{item.subject || "Supplier Support Request"}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-dash-body">{item.message}</p></div></div><div className="shrink-0 text-right"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">{item.email_status || "submitted"}</span><p className="mt-2 text-xs text-dash-subtle">{dateTime(item.created_at)}</p></div></div></article>)}</div>
      )}
    </div>
  );
}
