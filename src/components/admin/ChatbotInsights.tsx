"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";

type Insights = {
  days: number;
  sessions: number;
  questions: number;
  unanswered_count: number;
  answer_rate: number | null;
  thumbs_up: number;
  thumbs_down: number;
  unanswered: { question: string; count: number }[];
  disliked: { question: string; answer: string; comment: string }[];
};

// How the bot is doing and what to teach it: questions it couldn't answer (add
// them as FAQs / Train entries) and answers visitors marked thumbs-down.
export default function ChatbotInsights() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    api
      .get("/chatbot/admin/analytics", { params: { days } })
      .then((res) => active && setData(res.data.data as Insights))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [days]);

  const stat = (label: string, value: string | number) => (
    <div className="rounded-xl border border-dash-border p-4">
      <p className="text-xs font-bold uppercase text-dash-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-dash-text">{value}</p>
    </div>
  );

  return (
    <section className="space-y-5 rounded-2xl border border-dash-border bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-dash-text">Chatbot insights</h3>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-dash-border px-3 py-1.5 text-sm font-bold">
          {[7, 30, 90].map((d) => (
            <option key={d} value={d}>Last {d} days</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">Could not load insights.</p>}
      {!data && !error && <p className="text-sm text-dash-muted">Loading...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {stat("Chats", data.sessions)}
            {stat("Questions", data.questions)}
            {stat("Answered", data.answer_rate == null ? "-" : `${data.answer_rate}%`)}
            {stat("Thumbs up", data.thumbs_up)}
            {stat("Thumbs down", data.thumbs_down)}
          </div>

          <div>
            <h4 className="text-sm font-bold text-dash-text">Questions it couldn&apos;t answer ({data.unanswered_count})</h4>
            <p className="text-xs text-dash-muted">Add these as FAQs or Train entries and the bot will answer them next time.</p>
            {data.unanswered.length === 0 ? (
              <p className="mt-2 text-sm text-dash-muted">None in this period.</p>
            ) : (
              <ul className="mt-2 divide-y divide-dash-border rounded-xl border border-dash-border">
                {data.unanswered.map((u) => (
                  <li key={u.question} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 break-words">{u.question}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{u.count}x</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-dash-text">Answers marked thumbs-down</h4>
            {data.disliked.length === 0 ? (
              <p className="mt-2 text-sm text-dash-muted">None in this period.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.disliked.map((d, i) => (
                  <li key={i} className="rounded-xl border border-dash-border p-3 text-sm">
                    <p className="font-bold">Q: {d.question}</p>
                    <p className="mt-1 text-dash-muted">A: {d.answer}</p>
                    {d.comment && <p className="mt-1 text-xs italic">&ldquo;{d.comment}&rdquo;</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
