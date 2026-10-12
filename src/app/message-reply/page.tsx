"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuCircleCheck as CircleCheck, LuLoaderCircle as Loader2, LuSend as Send } from "react-icons/lu";

function ReplyForm() {
  const token = useSearchParams().get("token") || "";
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token || !body.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/messages/mail-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: body.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.detail || payload?.message || "Could not send your reply.");
      setSent(true);
      setBody("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send your reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Tourvaa messages</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Reply to this message</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">No login is required. This secure link is tied to your conversation and expires after 7 days.</p>

        {!token ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">This reply link is incomplete. Open the original button in your email.</p>
        ) : sent ? (
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <CircleCheck size={24} />
            <p className="font-bold">Your reply was sent successfully.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-bold text-slate-800" htmlFor="mail-reply">Your reply</label>
            <textarea id="mail-reply" value={body} onChange={(event) => setBody(event.target.value)} rows={7} maxLength={5000} autoFocus className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Type your reply…" />
            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
            <button type="submit" disabled={sending || !body.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {sending ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Send reply
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function MessageReplyPage() {
  return <Suspense fallback={<main className="min-h-screen bg-slate-50" />}><ReplyForm /></Suspense>;
}
