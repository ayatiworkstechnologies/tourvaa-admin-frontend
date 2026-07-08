"use client";

import { useState } from "react";
import { LuCircleCheckBig as CheckCircle2, LuMail as Mail, LuMapPinned as MapPinned, LuMessageSquare as MessageSquare, LuPhone as Phone } from "react-icons/lu";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <section className="bg-zinc-950 py-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Contact</p>
          <h1 className="mt-4 text-5xl font-black drop-shadow-sm md:text-6xl">Get in touch</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
            Whether you have a tour enquiry, partnership question, or just need help planning your trip — our team will get back to you within 24 hours.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[400px_1fr]">
          {/* Contact info */}
          <aside className="space-y-6">
            {[
              [Mail, "Email us", "hello@tourvaa.com", "We reply within 24 hours on business days."],
              [Phone, "Call us", "+971 4 123 4567", "Available Sun–Thu, 9am–6pm GST."],
              [MapPinned, "Our office", "Dubai, UAE", "Registered in DWTC Free Zone."],
            ].map(([Icon, label, value, note]) => {
              const I = Icon as typeof Mail;
              return (
                <div key={String(label)} className="flex gap-5 rounded-3xl bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <I size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{String(label)}</p>
                    <p className="mt-1 text-lg font-bold text-zinc-950">{String(value)}</p>
                    <p className="mt-1 text-sm text-zinc-500">{String(note)}</p>
                  </div>
                </div>
              );
            })}

            <div className="rounded-3xl bg-indigo-600 p-8 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <MessageSquare size={24} className="text-indigo-200" />
                <p className="mt-4 text-xl font-black tracking-tight">Urgent travel support?</p>
                <p className="mt-2 text-sm leading-relaxed text-indigo-100">For in-trip emergencies, use the live chat widget in the bottom-right corner of this page.</p>
              </div>
            </div>
          </aside>

          {/* Contact form */}
          <div className="rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 lg:p-10">
            {sent ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mb-6">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-zinc-950 tracking-tight">Message sent!</p>
                <p className="mt-3 text-base text-zinc-500">We will get back to you within 24 hours on business days.</p>
                <button type="button" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-8 text-2xl font-black tracking-tight text-zinc-950">Send a message</h2>
                <form onSubmit={submit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Name</label>
                      <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Email</label>
                      <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Subject</label>
                    <input required value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Message</label>
                    <textarea required rows={6} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us more about your enquiry…" className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none">
                    {submitting ? "Sending…" : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
