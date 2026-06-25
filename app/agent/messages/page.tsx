"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";

type Message = { id: number; subject: string; message: string; sender_name?: string; sender_role?: string; created_at?: string };

export default function AgentMessagesPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/agent/messages", { params: { limit: 30 } });
      setMessages(res.data?.items ?? res.data?.data ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      await api.post("/agent/messages", form);
      toast.success("Message sent to Tourvaa support.");
      setForm({ subject: "", message: "" });
      await load();
    } catch {
      toast.error("Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#121826]">Messages</h1>
        <p className="mt-1 text-sm text-[#667085]">Communicate with the Tourvaa operations team.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-[#E7EAF0] bg-white shadow-sm">
          <div className="border-b border-[#E7EAF0] px-5 py-4">
            <h2 className="font-bold text-[#121826]">Message History</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse h-16 rounded-xl bg-[#F5F7FA]" />)}</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageSquare size={36} className="text-[#D0D5DD]" />
              <p className="mt-3 font-bold text-[#121826]">No messages yet</p>
              <p className="mt-1 text-sm text-[#667085]">Use the form to contact the Tourvaa operations team.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F7FA]">
              {messages.map(msg => (
                <div key={msg.id} className="p-5 hover:bg-[#F9FAFB]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[#121826]">{msg.subject}</p>
                    {msg.created_at && <span className="text-xs text-[#98A2B3]">{new Date(msg.created_at).toLocaleString()}</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#667085]">{msg.message}</p>
                  {msg.sender_name && <p className="mt-1 text-xs text-[#98A2B3]">From: {msg.sender_name} ({msg.sender_role || "support"})</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#E7EAF0] bg-white p-5 shadow-sm self-start">
          <h2 className="mb-4 font-bold text-[#121826]">Send a Message</h2>
          <form onSubmit={send} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#344054]">Subject <span className="text-red-500">*</span></label>
              <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Commission query, Booking issue"
                className="w-full rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#344054]">Message <span className="text-red-500">*</span></label>
              <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5}
                placeholder="Describe your question or issue..."
                className="w-full resize-none rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
            </div>
            <button type="submit" disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
              {sending ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
